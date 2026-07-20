import type { GatewayAdapter, GatewayCredentials } from "./types";

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
    const text = await res.text();
    throw new Error(`PayPal auth failed: ${res.statusText} - ${text}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export const paypalAdapter: GatewayAdapter = {
  slug: "paypal",
  name: "PayPal",
  requiredFields: ["client_id", "client_secret"],

  async testConnection({ credentials, mode }) {
    if (!credentials.client_id || !credentials.client_secret) {
      return { ok: false, message: "Client ID and Client Secret are required" };
    }
    try {
      await getPayPalAccessToken(credentials.client_id, credentials.client_secret, mode);
      return { ok: true };
    } catch (e) {
      return { ok: false, message: (e as Error).message };
    }
  },

  async createCheckout({ credentials, mode, input }) {
    const clientId = credentials.client_id;
    const clientSecret = credentials.client_secret;
    if (!clientId || !clientSecret) {
      throw new Error("PayPal credentials missing");
    }
    const token = await getPayPalAccessToken(clientId, clientSecret, mode);
    const host = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

    const body = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: input.currency || "USD",
            value: input.amount.toFixed(2),
          },
          description: input.description || "Purchase",
          custom_id: input.metadata?.tx_id || undefined,
        },
      ],
      application_context: {
        return_url: input.successUrl,
        cancel_url: input.cancelUrl,
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
      },
    };

    const res = await fetch(`${host}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`PayPal order creation failed: ${errorText}`);
    }

    const json = (await res.json()) as {
      id: string;
      status: string;
      links: { href: string; rel: string; method: string }[];
    };

    const approveLink = json.links.find((l) => l.rel === "approve");
    if (!approveLink) {
      throw new Error("No PayPal approval link found in response");
    }

    return {
      redirectUrl: approveLink.href,
      externalId: json.id,
      raw: json,
    };
  },

  async verifyWebhook({ rawBody, headers, webhookSecret }) {
    if (!webhookSecret) {
      return { verified: false, reason: "PayPal webhook secret is not configured" };
    }

    const parts = webhookSecret.split(":");
    if (parts.length < 3) {
      return {
        verified: false,
        reason: "PayPal signature verification requires Client ID and Secret to be appended to Webhook ID (format: WEBHOOK_ID:CLIENT_ID:CLIENT_SECRET)",
      };
    }

    const [webhookId, clientId, clientSecret] = parts;

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return { verified: false, reason: "Invalid JSON payload" };
    }

    const transmissionId = headers["paypal-transmission-id"] || headers["Paypal-Transmission-Id"];
    const transmissionTime = headers["paypal-transmission-time"] || headers["Paypal-Transmission-Time"];
    const certUrl = headers["paypal-cert-url"] || headers["Paypal-Cert-Url"];
    const authAlgo = headers["paypal-auth-algo"] || headers["Paypal-Auth-Algo"];
    const transmissionSig = headers["paypal-transmission-sig"] || headers["Paypal-Transmission-Sig"];

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      return { verified: false, reason: "Missing PayPal transmission headers" };
    }

    const mode = certUrl.includes("sandbox") ? "sandbox" : "live";
    const host = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

    try {
      const token = await getPayPalAccessToken(clientId, clientSecret, mode);

      const verificationBody = {
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: payload,
      };

      const res = await fetch(`${host}/v1/notifications/verify-webhook-signature`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verificationBody),
      });

      if (!res.ok) {
        return { verified: false, reason: `PayPal signature service responded ${res.status}` };
      }

      const verificationResult = (await res.json()) as { verification_status: string };
      const verified = verificationResult.verification_status === "SUCCESS";

      let status: "succeeded" | "failed" | "refunded" | undefined;
      let externalId: string | undefined;
      const eventType = payload.event_type;

      if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
        const resource = payload.resource;
        const state = resource.status;
        if (state === "COMPLETED") status = "succeeded";
        else if (state === "FAILED") status = "failed";
        
        externalId = resource.supplementary_data?.related_ids?.order_id;
      } else if (eventType === "CHECKOUT.ORDER.APPROVED") {
        status = "succeeded";
        externalId = payload.resource.id;
      }

      return {
        verified,
        eventType,
        externalId,
        status,
        reason: verified ? undefined : "PayPal verification status: " + verificationResult.verification_status,
      };
    } catch (e) {
      return { verified: false, reason: (e as Error).message };
    }
  },

  async refund({ credentials, mode, externalId, amount, currency, reason }) {
    const clientId = credentials.client_id;
    const clientSecret = credentials.client_secret;
    if (!clientId || !clientSecret) {
      throw new Error("PayPal credentials missing");
    }
    const token = await getPayPalAccessToken(clientId, clientSecret, mode);
    const host = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

    // 1. Get Order details to find the Capture ID
    const orderRes = await fetch(`${host}/v2/checkout/orders/${externalId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!orderRes.ok) {
      throw new Error(`Failed to fetch PayPal order: ${orderRes.statusText}`);
    }

    const orderData = (await orderRes.json()) as {
      purchase_units?: {
        payments?: {
          captures?: { id: string; status: string }[];
        };
      }[];
    };

    const capture = orderData.purchase_units?.[0]?.payments?.captures?.[0];
    if (!capture) {
      throw new Error("No payment capture found for this PayPal order");
    }

    // 2. Call PayPal Refund API on the capture
    const refundBody = {
      amount: {
        value: amount.toFixed(2),
        currency_code: currency,
      },
      note_to_payer: reason || "Admin refund",
    };

    const refundRes = await fetch(`${host}/v2/payments/captures/${capture.id}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(refundBody),
    });

    if (!refundRes.ok) {
      const errorText = await refundRes.text();
      throw new Error(`PayPal refund failed: ${errorText}`);
    }

    const refundData = (await refundRes.json()) as { id: string; status: string };

    return {
      ok: refundData.status === "COMPLETED" || refundData.status === "PENDING",
      externalId: refundData.id,
      message: `PayPal Refund Status: ${refundData.status}`,
    };
  },
};
