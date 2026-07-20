import { createFileRoute } from "@tanstack/react-router";
import { decryptJson } from "@/lib/payments/crypto.server";
import type { GatewayCredentials } from "@/lib/payments/gateways/types";

async function getPayPalAccessToken(clientId: string, clientSecret: string, mode: "sandbox" | "live") {
  const host = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${host}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.statusText}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export const Route = createFileRoute("/api/public/paypal-callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const txId = url.searchParams.get("txId");
        const token = url.searchParams.get("token"); // PayPal Order ID
        const payerId = url.searchParams.get("PayerID");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const origin = url.origin;
        const redirectUrl = `${origin}/checkout/success?txId=${txId}`;

        if (!txId || !token) {
          return new Response(null, {
            status: 302,
            headers: { Location: redirectUrl },
          });
        }

        try {
          // 1. Fetch transaction and gateway info from DB
          const { data: tx, error: txError } = await supabaseAdmin
            .from("payment_transactions")
            .select("*, gateway:payment_gateways(*)")
            .eq("id", txId)
            .maybeSingle();

          if (txError || !tx) {
            throw new Error("Transaction not found");
          }

          if (tx.status === "succeeded") {
            return new Response(null, {
              status: 302,
              headers: { Location: redirectUrl },
            });
          }

          const gateway = tx.gateway;
          if (!gateway) {
            throw new Error("Payment gateway details not found");
          }

          const creds = decryptJson<GatewayCredentials>(gateway.credentials_encrypted) as GatewayCredentials;
          if (!creds.client_id || !creds.client_secret) {
            throw new Error("PayPal client credentials not found");
          }

          // 2. Call PayPal Order Capture API
          const accessToken = await getPayPalAccessToken(creds.client_id, creds.client_secret, gateway.mode);
          const host = gateway.mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

          const captureRes = await fetch(`${host}/v2/checkout/orders/${token}/capture`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          });

          if (!captureRes.ok) {
            const errText = await captureRes.text();
            throw new Error(`PayPal capture failed: ${errText}`);
          }

          const captureData = (await captureRes.json()) as { status: string };

          if (captureData.status === "COMPLETED" || captureData.status === "APPROVED") {
            // 3. Mark transaction as succeeded in DB
            const { data: updated } = await supabaseAdmin
              .from("payment_transactions")
              .update({ status: "succeeded", external_id: token })
              .eq("id", txId)
              .select("id, user_id, amount, currency, description, coupon_code")
              .maybeSingle();

            // Log successful payment
            await supabaseAdmin.from("payment_logs").insert({
              transaction_id: txId,
              gateway_slug: "paypal",
              level: "info",
              message: "PayPal payment captured successfully",
              meta: captureData,
            });

            if (updated?.user_id) {
              // 4. Trigger coupon increment
              if (updated.coupon_code) {
                try {
                  const { data: c } = await supabaseAdmin
                    .from("coupons")
                    .select("id, used_count")
                    .eq("code", updated.coupon_code)
                    .maybeSingle();
                  if (c) {
                    await supabaseAdmin
                      .from("coupons")
                      .update({ used_count: (c.used_count ?? 0) + 1 })
                      .eq("id", c.id);
                  }
                } catch (e) {
                  console.error("[paypal-callback] coupon increment failed:", (e as Error).message);
                }
              }

              // 5. Mark referral as purchased
              try {
                await supabaseAdmin
                  .from("referrals")
                  .update({ status: "purchased" })
                  .eq("referred_user_id", updated.user_id)
                  .in("status", ["signed_up"]);
              } catch (e) {
                console.error("[paypal-callback] referral update failed:", (e as Error).message);
              }

              // 6. Send emails
              try {
                const { data: profile } = await supabaseAdmin
                  .from("profiles")
                  .select("email, full_name")
                  .eq("id", updated.user_id)
                  .maybeSingle();

                if (profile?.email) {
                  const { sendTemplatedEmail, notifyAdmin } = await import("@/lib/email.functions");
                  await sendTemplatedEmail({
                    templateKey: "order_confirmation",
                    to: profile.email,
                    variables: {
                      customer_name: profile.full_name ?? "there",
                      order_id: updated.id.slice(0, 8).toUpperCase(),
                      amount: Number(updated.amount).toFixed(2),
                      currency: updated.currency,
                      description: updated.description ?? "The Family History Book",
                    },
                  });
                  await notifyAdmin("admin_new_order", {
                    customer_name: profile.full_name ?? "Customer",
                    customer_email: profile.email,
                    order_id: updated.id.slice(0, 8).toUpperCase(),
                    amount: Number(updated.amount).toFixed(2),
                    currency: updated.currency,
                    description: updated.description ?? "The Family History Book",
                  });
                }
              } catch (e) {
                console.error("[paypal-callback] confirmation email failed:", (e as Error).message);
              }
            }
          } else {
            throw new Error(`PayPal order status is ${captureData.status}`);
          }
        } catch (e: any) {
          console.error("[paypal-callback] error:", e.message);
          try {
            await supabaseAdmin.from("payment_transactions").update({ status: "failed" }).eq("id", txId);
            await supabaseAdmin.from("payment_logs").insert({
              transaction_id: txId,
              gateway_slug: "paypal",
              level: "error",
              message: `PayPal capture callback failed: ${e.message}`,
            });
          } catch (dbErr) {
            console.error("[paypal-callback] failed to log failure in DB:", dbErr);
          }
        }

        return new Response(null, {
          status: 302,
          headers: { Location: redirectUrl },
        });
      },
    },
  },
});
