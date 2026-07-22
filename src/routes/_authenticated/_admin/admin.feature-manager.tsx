import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Sliders, Shield, AlertTriangle, Check, RefreshCw, Loader2, Sparkles } from "lucide-react";
import { listFeatureFlags, updateFeatureFlag } from "@/lib/system.functions";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/table-controls";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/admin/feature-manager")({
  head: () => ({
    meta: [
      { title: "Feature Flags & Module Manager — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminFeatureManagerPage,
});

function AdminFeatureManagerPage() {
  const queryClient = useQueryClient();

  const { data: flags = [], isLoading } = useQuery({
    queryKey: ["admin-feature-flags"],
    queryFn: () => listFeatureFlags(),
  });

  const toggleMutation = useMutation({
    mutationFn: (d: { flag_key: string; is_enabled: boolean }) => updateFeatureFlag({ data: d }),
    onSuccess: (_, variables) => {
      toast.success(`Feature flag "${variables.flag_key}" updated`);
      queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <AdminPageHeader
        title="Feature Flags & Module Control"
        subtitle="Dynamically enable or disable core application modules, payment gateways, AI features, or maintenance mode in real-time."
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {flags.map((flag: any) => (
            <Card
              key={flag.flag_key}
              className={`p-5 rounded-2xl border transition-all ${
                flag.is_enabled ? "bg-white border-border/60 shadow-2xs" : "bg-muted/20 border-dashed opacity-75"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">{flag.flag_name}</h3>
                    <Badge variant="outline" className="capitalize text-[10px] bg-slate-50">
                      {flag.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{flag.description}</p>
                  <div className="font-mono text-[10px] text-muted-foreground pt-1">{flag.flag_key}</div>
                </div>

                <Switch
                  checked={flag.is_enabled}
                  onCheckedChange={(checked) =>
                    toggleMutation.mutate({ flag_key: flag.flag_key, is_enabled: checked })
                  }
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
