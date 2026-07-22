import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Upload, Search, Trash2, Copy, FileText, Image as ImageIcon, Check, Folder, Loader2 } from "lucide-react";
import { listMediaFiles } from "@/lib/system.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/table-controls";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/admin/media")({
  head: () => ({
    meta: [
      { title: "Media Library — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminMediaPage,
});

function AdminMediaPage() {
  const [folder, setFolder] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: mediaFiles = [], isLoading } = useQuery({
    queryKey: ["admin-media-files"],
    queryFn: () => listMediaFiles(),
  });

  const filtered = mediaFiles.filter((f: any) => {
    if (folder !== "all" && f.folder !== folder) return false;
    if (search.trim()) {
      return f.filename.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Public URL copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <AdminPageHeader
        title="Media Library & Assets Manager"
        subtitle="Manage brand logos, favicons, book covers, blog images, icons, and PDF assets."
      />

      {/* Control Bar & Folders */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["all", "book_covers", "blog", "logos", "icons", "pdf"].map((f) => (
            <Button
              key={f}
              variant={folder === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFolder(f)}
              className={`rounded-full capitalize text-xs ${
                folder === f ? "bg-[color:var(--primary)] text-white" : ""
              }`}
            >
              <Folder className="mr-1.5 h-3.5 w-3.5" />
              {f.replace("_", " ")}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets..."
              className="pl-8 h-9 text-xs w-48 sm:w-64"
            />
          </div>

          <Button size="sm" onClick={() => toast.info("Drag & drop upload file target initialized")} className="rounded-xl bg-[color:var(--primary)] text-white">
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload Asset
          </Button>
        </div>
      </div>

      {/* Asset Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl border-dashed">
          <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">No media assets found</h3>
          <p className="mt-1 text-xs text-muted-foreground">Upload images or documents to manage them here.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item: any) => (
            <Card
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-border/60 bg-white p-4 shadow-2xs hover:shadow-md transition-all"
            >
              <div>
                {/* Preview Thumbnail */}
                <div className="flex h-36 w-full items-center justify-center rounded-xl bg-slate-100 overflow-hidden border border-border/40 mb-3">
                  {item.file_type.includes("image") ? (
                    <img src={item.public_url} alt={item.filename} className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-12 w-12 text-muted-foreground/60" />
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 mb-1">
                  <Badge variant="outline" className="capitalize text-[9px] bg-slate-50">
                    {item.folder.replace("_", " ")}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{formatBytes(item.size_bytes)}</span>
                </div>

                <h4 className="font-serif text-sm font-semibold text-[color:var(--ink)] truncate" title={item.filename}>
                  {item.filename}
                </h4>
              </div>

              <div className="flex items-center justify-between pt-3 border-t mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyUrl(item.public_url, item.id)}
                  className="rounded-lg h-7 px-2 text-[11px]"
                >
                  {copiedId === item.id ? <Check className="mr-1 h-3 w-3 text-emerald-600" /> : <Copy className="mr-1 h-3 w-3" />}
                  {copiedId === item.id ? "Copied" : "Copy Link"}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toast.error("Asset deletion requested")}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
