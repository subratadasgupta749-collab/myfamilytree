import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Activity, Search, Shield, Filter, Clock, Loader2 } from "lucide-react";
import { listAdminActivityLogs } from "@/lib/system.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/table-controls";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/_admin/admin/activity-logs")({
  head: () => ({
    meta: [
      { title: "Activity & System Logs — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminActivityLogsPage,
});

function AdminActivityLogsPage() {
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-activity-logs"],
    queryFn: () => listAdminActivityLogs(),
  });

  const filtered = logs.filter((log: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.resource_type.toLowerCase().includes(q) ||
      JSON.stringify(log.details ?? {}).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <AdminPageHeader
        title="Admin Audit Logs & Activity History"
        subtitle="Complete audit trail tracking all administrative actions, setting changes, API key updates, and user modifications."
      />

      <Card className="p-4 space-y-4 rounded-2xl bg-white border-border/60 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter logs by action, resource, or details..."
              className="pl-9 h-10 text-xs"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-xs">No activity logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Resource</th>
                  <th className="p-3">Details</th>
                  <th className="p-3 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((l: any) => (
                  <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                    </td>
                    <td className="p-3 font-bold font-mono text-primary">{l.action}</td>
                    <td className="p-3 capitalize">{l.resource_type}</td>
                    <td className="p-3 font-mono text-[11px] max-w-md truncate">
                      {JSON.stringify(l.details ?? {})}
                    </td>
                    <td className="p-3 text-right font-mono text-muted-foreground">{l.ip_address ?? "127.0.0.1"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
