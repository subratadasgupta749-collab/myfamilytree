import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, FileText, FileCode, Printer, HardDrive, ExternalLink, Loader2 } from "lucide-react";
import { listAllMyExports } from "@/lib/exports.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/_app/downloads")({
  head: () => ({
    meta: [
      { title: "My Downloads — My Family History Book" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DownloadsPage,
});

function DownloadsPage() {
  const [kindFilter, setKindFilter] = useState<string>("all");

  const { data: exportsData = [], isLoading } = useQuery({
    queryKey: ["my-exports-all"],
    queryFn: () => listAllMyExports(),
  });

  const pdfCount = exportsData.filter((e) => e.kind === "pdf").length;
  const docxCount = exportsData.filter((e) => e.kind === "docx").length;
  const printCount = exportsData.filter((e) => e.kind === "print_pdf").length;

  const filtered = exportsData.filter((e) => {
    if (kindFilter === "all") return true;
    return e.kind === kindFilter;
  });

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[color:var(--ink)] sm:text-4xl">
          My Downloads & Exports
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Access all your generated PDFs, Word manuscripts, and print-ready digital books.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={HardDrive} label="Total Files" value={exportsData.length} />
        <StatCard icon={FileText} label="PDF Exports" value={pdfCount} />
        <StatCard icon={FileCode} label="Word (DOCX)" value={docxCount} />
        <StatCard icon={Printer} label="Print Version" value={printCount} />
      </div>

      {/* Filters & Content */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            {["all", "pdf", "docx", "print_pdf"].map((k) => (
              <Button
                key={k}
                variant={kindFilter === k ? "default" : "outline"}
                size="sm"
                onClick={() => setKindFilter(k)}
                className={`rounded-full capitalize text-xs ${
                  kindFilter === k
                    ? "bg-[color:var(--primary)] text-white shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {k === "print_pdf" ? "Print PDF" : k}
              </Button>
            ))}
          </div>

          <span className="text-xs text-muted-foreground font-medium">
            Showing {filtered.length} of {exportsData.length} files
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-dashed">
            <Download className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">No downloads found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Generate an export from your book manuscript page to download here.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((exp) => (
              <Card
                key={exp.id}
                className="flex flex-col justify-between rounded-2xl border border-border/60 bg-white p-5 shadow-2xs hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs uppercase">
                      {exp.kind === "docx" ? "DOCX" : "PDF"}
                    </div>
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {exp.kind.replace("_", " ")}
                    </Badge>
                  </div>

                  <h3 className="mt-4 font-serif text-lg font-semibold text-[color:var(--ink)] truncate">
                    {exp.book_name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">{exp.filename}</p>

                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Size: {formatSize(exp.size_bytes)}</span>
                    <span>{new Date(exp.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-6 border-t border-border/40 pt-4">
                  {exp.url ? (
                    <Button asChild size="sm" className="w-full rounded-xl bg-[color:var(--primary)] text-white">
                      <a href={exp.url} download target="_blank" rel="noreferrer">
                        <Download className="mr-1.5 h-3.5 w-3.5" /> Download File
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" disabled className="w-full rounded-xl">
                      Link Expired
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof HardDrive;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-5 rounded-2xl border border-border/60 bg-white shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--gold)]/15 text-[color:var(--primary)]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xl font-bold font-serif text-[color:var(--ink)]">{value}</div>
          <div className="text-xs text-muted-foreground font-medium">{label}</div>
        </div>
      </div>
    </Card>
  );
}
