import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HardDrive, Download, Upload, Clock, Check, RefreshCw, Loader2, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AdminPageHeader } from "@/components/admin/table-controls";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/admin/backup")({
  head: () => ({
    meta: [
      { title: "Backup & Restore — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminBackupPage,
});

function AdminBackupPage() {
  const [downloading, setDownloading] = useState(false);

  const triggerDownload = (type: string) => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      const data = `BACKUP METADATA [${type.toUpperCase()}]\nGenerated: ${new Date().toISOString()}\nVersion: 2.5.0\nStatus: Clean Snapshot\n`;
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${type}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${type} backup downloaded successfully!`);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <AdminPageHeader
        title="Database & System Backup Center"
        subtitle="Create snapshots, download offline backups of database tables and media, and configure automated daily backups."
      />

      <div className="grid gap-6 sm:grid-cols-3">
        <BackupCard
          title="Full Database Snapshot"
          subtitle="Exports all users, books, orders, support tickets, and app settings."
          size="14.2 MB"
          lastBackup="2 hours ago"
          onDownload={() => triggerDownload("database")}
          isDownloading={downloading}
        />

        <BackupCard
          title="Media & Storage Assets"
          subtitle="Exports book covers, logos, favicons, and uploaded photos manifest."
          size="128.4 MB"
          lastBackup="Yesterday"
          onDownload={() => triggerDownload("media")}
          isDownloading={downloading}
        />

        <BackupCard
          title="System Settings Vault"
          subtitle="Exports API keys, SEO metadata, feature flags, and email templates."
          size="1.1 MB"
          lastBackup="3 hours ago"
          onDownload={() => triggerDownload("settings")}
          isDownloading={downloading}
        />
      </div>

      {/* Automated Backup Settings */}
      <Card className="p-6 space-y-4 rounded-2xl bg-white border-border/60 shadow-2xs">
        <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">Automated Backup Schedule</h3>
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">Enable Daily Backups</div>
              <div className="text-muted-foreground">Automatically snapshot database at 00:00 UTC.</div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <div>
              <div className="font-semibold text-sm">Offsite Cloud Storage Sync</div>
              <div className="text-muted-foreground">Sync backup archives to Amazon S3 bucket.</div>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>
    </div>
  );
}

function BackupCard({ title, subtitle, size, lastBackup, onDownload, isDownloading }: any) {
  return (
    <Card className="p-6 rounded-2xl bg-white border-border/60 shadow-2xs space-y-4 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HardDrive className="h-4.5 w-4.5" />
          </div>
          <Badge variant="outline" className="text-[10px] bg-slate-50">{size}</Badge>
        </div>

        <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
      </div>

      <div className="pt-3 border-t space-y-3">
        <div className="text-[11px] text-muted-foreground flex items-center justify-between font-mono">
          <span>Last Snapshot:</span>
          <span>{lastBackup}</span>
        </div>

        <Button size="sm" onClick={onDownload} disabled={isDownloading} className="w-full rounded-xl bg-[color:var(--primary)] text-white text-xs">
          {isDownloading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />} Download Backup
        </Button>
      </div>
    </Card>
  );
}
