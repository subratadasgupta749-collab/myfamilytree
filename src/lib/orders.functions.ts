import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Lists the current user's payment transactions with associated book (if any). */
export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payment_transactions")
      .select(
        "id, amount, currency, status, description, gateway_slug, coupon_code, discount_amount, metadata, external_id, created_at",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Signed download URLs for exports of a book the user owns. */
export const getMyOrderDownloads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { bookId: string }) =>
    z.object({ bookId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: exports_, error } = await context.supabase
      .from("book_exports")
      .select("id, kind, filename, storage_path, created_at, size_bytes")
      .eq("book_id", data.bookId)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const paths = (exports_ ?? []).map((r: any) => r.storage_path);
    if (paths.length === 0) return [];

    let signedItems: any[] = [];
    try {
      const { data: signed, error: sErr } = await context.supabase.storage
        .from("book-exports")
        .createSignedUrls(paths, 60 * 60);
      if (!sErr && signed) signedItems = signed;
    } catch {}

    if (signedItems.length === 0 || signedItems.some((s: any) => s.error)) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.storage.createBucket("book-exports", { public: false }).catch(() => {});
        const { data: adminSigned } = await supabaseAdmin.storage
          .from("book-exports")
          .createSignedUrls(paths, 60 * 60);
        if (adminSigned) signedItems = adminSigned;
      } catch {}
    }

    const map = new Map(
      (signedItems ?? []).map((s: any) => [s.path as string, s.signedUrl as string]),
    );
    return (exports_ ?? []).map((r: any) => ({ ...r, url: map.get(r.storage_path) ?? null }));
  });
