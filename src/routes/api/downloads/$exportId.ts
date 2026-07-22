import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/downloads/$exportId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const exportId = params.exportId;
        if (!exportId) return new Response("Not found", { status: 404 });

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          
          const { data: row, error: fErr } = await supabaseAdmin
            .from("book_exports")
            .select("storage_path, filename, kind")
            .eq("id", exportId)
            .maybeSingle();

          if (fErr || !row) {
            return new Response("Export file not found", { status: 404 });
          }

          const { data: blob, error: dlErr } = await supabaseAdmin.storage
            .from("book-exports")
            .download(row.storage_path);

          if (dlErr || !blob) {
            return new Response("Storage file unavailable", { status: 404 });
          }

          const buf = await blob.arrayBuffer();
          const contentType = row.kind === "docx"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/pdf";

          return new Response(buf, {
            headers: {
              "Content-Type": contentType,
              "Content-Disposition": `inline; filename="${encodeURIComponent(row.filename)}"`,
              "Cache-Control": "private, max-age=3600",
            },
          });
        } catch (err: any) {
          return new Response(err?.message || "Server Error", { status: 500 });
        }
      },
    },
  },
});
