import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cpu, Zap, Radio, DollarSign, ScrollText, Sparkles, Loader2, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminPageHeader } from "@/components/admin/table-controls";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  listProviders,
  updateProvider,
  setDefaultProvider,
  testProviderConnection,
  listPrompts,
  updatePrompt,
  getAiOverview,
  listAiLogs,
} from "@/lib/ai/providers.functions";

export const Route = createFileRoute("/_authenticated/_admin/admin/ai")({
  head: () => ({
    meta: [
      { title: "AI Center & Provider Routing — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAiCenterPage,
});

type ProviderItem = Awaited<ReturnType<typeof listProviders>>[number];
type PromptItem = Awaited<ReturnType<typeof listPrompts>>[number];
type OverviewItem = Awaited<ReturnType<typeof getAiOverview>>;
type LogItem = Awaited<ReturnType<typeof listAiLogs>>["rows"][number];

export function AdminAiCenterPage() {
  const [tab, setTab] = useState("providers");

  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [overview, setOverview] = useState<OverviewItem | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const listProvidersFn = useServerFn(listProviders);
  const listPromptsFn = useServerFn(listPrompts);
  const getAiOverviewFn = useServerFn(getAiOverview);
  const listAiLogsFn = useServerFn(listAiLogs);

  async function loadAll() {
    setLoading(true);
    try {
      const [pData, prData, ovData, lData] = await Promise.all([
        listProvidersFn(),
        listPromptsFn(),
        getAiOverviewFn(),
        listAiLogsFn({ data: { page: 1, pageSize: 20 } }),
      ]);
      setProviders(pData);
      setPrompts(prData);
      setOverview(ovData);
      setLogs(lData.rows);
    } catch (err) {
      console.error("Error loading AI Center data:", err);
      toast.error(err instanceof Error ? err.message : "Failed to load AI settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <AdminPageHeader
        title="AI Center & Multi-Model Engine"
        subtitle="Configure AI providers (Gemini, OpenAI, OpenRouter, DeepSeek), model routing, prompts, costs, and failover fallbacks."
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="inline-flex h-11 bg-white p-1 rounded-2xl border border-border/60 shadow-2xs overflow-x-auto max-w-full">
          <TabsTrigger value="providers" className="rounded-xl px-4 text-xs font-semibold">
            <Cpu className="mr-2 h-3.5 w-3.5" /> Providers
          </TabsTrigger>
          <TabsTrigger value="routing" className="rounded-xl px-4 text-xs font-semibold">
            <Radio className="mr-2 h-3.5 w-3.5" /> Routing & Fallback
          </TabsTrigger>
          <TabsTrigger value="prompts" className="rounded-xl px-4 text-xs font-semibold">
            <Sparkles className="mr-2 h-3.5 w-3.5" /> Prompts
          </TabsTrigger>
          <TabsTrigger value="costs" className="rounded-xl px-4 text-xs font-semibold">
            <DollarSign className="mr-2 h-3.5 w-3.5" /> Usage & Costs
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl px-4 text-xs font-semibold">
            <ScrollText className="mr-2 h-3.5 w-3.5" /> Invocations Log
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading AI Engine configuration...</span>
          </div>
        ) : (
          <>
            {/* TAB 1: PROVIDERS */}
            <TabsContent value="providers" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {providers.map((p) => (
                  <AiProviderCard key={p.id} provider={p} onReload={loadAll} />
                ))}
              </div>
            </TabsContent>

            {/* TAB 2: ROUTING & FALLBACK */}
            <TabsContent value="routing">
              <RoutingTabContent providers={providers} onReload={loadAll} />
            </TabsContent>

            {/* TAB 3: PROMPTS */}
            <TabsContent value="prompts">
              <PromptsTabContent prompts={prompts} onReload={loadAll} />
            </TabsContent>

            {/* TAB 4: COSTS */}
            <TabsContent value="costs">
              <Card className="p-6 space-y-4 rounded-2xl bg-white border-border/60 shadow-2xs">
                <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">AI Token Costs & Spending</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-4 rounded-xl bg-slate-50 border">
                    <div className="text-xs text-muted-foreground">Today's Invocations</div>
                    <div className="text-2xl font-bold font-serif text-[color:var(--ink)]">{overview?.today.total ?? 0} Requests</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border">
                    <div className="text-xs text-muted-foreground">This Month's Invocations</div>
                    <div className="text-2xl font-bold font-serif text-[color:var(--ink)]">{overview?.month.total ?? 0} Requests</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border">
                    <div className="text-xs text-muted-foreground">All-Time Total Invocations</div>
                    <div className="text-2xl font-bold font-serif text-[color:var(--ink)]">{overview?.allTime ?? 0} Requests</div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* TAB 5: LOGS */}
            <TabsContent value="logs">
              <Card className="p-6 space-y-4 rounded-2xl bg-white border-border/60 shadow-2xs">
                <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">Recent Invocations Log</h3>
                {logs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                    No AI invocations logged yet.
                  </div>
                ) : (
                  <div className="divide-y text-xs">
                    {logs.map((l) => (
                      <div key={l.id} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-semibold">{l.provider_slug}</span> ({l.model}) &mdash; {l.prompt_key || "custom"}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={l.status === "success" ? "outline" : "destructive"}>
                            {l.status}
                          </Badge>
                          <span className="text-muted-foreground">{l.response_time_ms}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

function AiProviderCard({ provider, onReload }: { provider: ProviderItem; onReload: () => void }) {
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(provider.enabled);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setEnabled(provider.enabled);
  }, [provider.enabled]);

  const updateFn = useServerFn(updateProvider);
  const testFn = useServerFn(testProviderConnection);

  async function handleToggleEnabled(newVal: boolean) {
    setEnabled(newVal);
    try {
      await updateFn({
        data: {
          id: provider.id,
          enabled: newVal,
        },
      });
      toast.success(`${provider.name} ${newVal ? "enabled" : "disabled"}`);
      onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle provider");
      setEnabled(!newVal);
    }
  }

  async function handleSaveKey() {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key.");
      return;
    }
    setSaving(true);
    try {
      await updateFn({
        data: {
          id: provider.id,
          api_key: apiKey.trim(),
        },
      });
      toast.success(`${provider.name} API key updated!`);
      setApiKey("");
      onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update key");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!provider.has_key) {
      toast.error("Save an API key first before testing connection.");
      return;
    }
    setTesting(true);
    try {
      const res = await testFn({ data: { id: provider.id } });
      if (res.ok) {
        toast.success(`${provider.name}: ${res.message}`);
      } else {
        toast.error(`${provider.name}: ${res.message}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card className="p-5 rounded-2xl bg-white border-border/60 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-serif text-lg font-semibold text-[color:var(--ink)]">{provider.name}</div>
          <div className="text-xs text-muted-foreground">{provider.default_model || provider.slug}</div>
        </div>
        <Badge
          variant="outline"
          className={
            provider.is_default
              ? "bg-primary/10 text-primary border-primary/20 text-[10px]"
              : provider.has_key
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
              : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
          }
        >
          {provider.is_default ? "Active (Primary)" : provider.has_key ? "Connected" : "No Key Set"}
        </Badge>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">API Key</Label>
        <div className="flex gap-2">
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={provider.has_key ? "•••••••••••• (Type new key to update)" : "Enter API key..."}
            className="text-xs font-mono flex-1"
            autoComplete="off"
          />
          <Button
            size="sm"
            onClick={handleSaveKey}
            disabled={saving || !apiKey.trim()}
            className="rounded-xl text-xs"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <Button
          size="sm"
          variant="outline"
          onClick={handleTest}
          disabled={testing || !provider.has_key}
          className="rounded-xl text-xs"
        >
          {testing ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Zap className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
          )}
          Test Connection
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{enabled ? "Enabled" : "Disabled"}</span>
          <Switch checked={enabled} onCheckedChange={handleToggleEnabled} />
        </div>
      </div>
    </Card>
  );
}

function RoutingTabContent({ providers, onReload }: { providers: ProviderItem[]; onReload: () => void }) {
  const defaultProv = providers.find((p) => p.is_default) || providers[0];
  const [selectedDefaultId, setSelectedDefaultId] = useState(defaultProv?.id || "");
  const [saving, setSaving] = useState(false);

  const setDefaultFn = useServerFn(setDefaultProvider);

  async function handleSaveRouting() {
    if (!selectedDefaultId) return;
    setSaving(true);
    try {
      await setDefaultFn({ data: { id: selectedDefaultId } });
      toast.success("Primary AI Engine updated successfully!");
      onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set default provider");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6 space-y-6 rounded-2xl bg-white border-border/60 shadow-2xs">
      <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">Failover Chain & Dynamic Routing</h3>

      <div className="space-y-4 text-xs">
        <div className="p-4 rounded-xl bg-muted/30 border space-y-2">
          <div className="font-semibold text-sm">Primary AI Engine</div>
          <p className="text-muted-foreground">The primary LLM used for family interview questions and manuscript generation.</p>
          <select
            value={selectedDefaultId}
            onChange={(e) => setSelectedDefaultId(e.target.value)}
            className="h-9 w-full max-w-sm rounded border bg-background px-3 font-medium text-xs"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.default_model || p.slug}) {p.has_key ? "✓ Key Set" : "⚠️ No Key"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSaveRouting} disabled={saving} className="rounded-xl bg-[color:var(--primary)] text-white text-xs">
          {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          Save Routing
        </Button>
      </div>
    </Card>
  );
}

function PromptsTabContent({ prompts, onReload }: { prompts: PromptItem[]; onReload: () => void }) {
  const [promptValues, setPromptValues] = useState<Record<string, { system: string; user: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const updatePromptFn = useServerFn(updatePrompt);

  useEffect(() => {
    const map: Record<string, { system: string; user: string }> = {};
    for (const p of prompts) {
      map[p.id] = {
        system: p.system_prompt || "",
        user: p.user_template || "",
      };
    }
    setPromptValues(map);
  }, [prompts]);

  async function handleSavePrompt(prompt: PromptItem) {
    const vals = promptValues[prompt.id];
    if (!vals) return;
    setSavingId(prompt.id);
    try {
      await updatePromptFn({
        data: {
          id: prompt.id,
          system_prompt: vals.system,
          user_template: vals.user,
        },
      });
      toast.success(`Prompt "${prompt.name}" saved successfully!`);
      onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save prompt");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Card className="p-6 space-y-6 rounded-2xl bg-white border-border/60 shadow-2xs">
      <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">System Prompt Templates</h3>

      <div className="space-y-6">
        {prompts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No prompts configured in database.</p>
        ) : (
          prompts.map((p) => {
            const cur = promptValues[p.id] || { system: p.system_prompt || "", user: p.user_template || "" };
            return (
              <div key={p.id} className="space-y-3 p-4 rounded-xl border bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{p.key}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSavePrompt(p)}
                    disabled={savingId === p.id}
                    className="rounded-xl text-xs"
                  >
                    {savingId === p.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
                    Save Prompt
                  </Button>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">System Prompt</Label>
                  <Textarea
                    rows={3}
                    value={cur.system}
                    onChange={(e) =>
                      setPromptValues({
                        ...promptValues,
                        [p.id]: { ...cur, system: e.target.value },
                      })
                    }
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">User Template</Label>
                  <Textarea
                    rows={4}
                    value={cur.user}
                    onChange={(e) =>
                      setPromptValues({
                        ...promptValues,
                        [p.id]: { ...cur, user: e.target.value },
                      })
                    }
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
