import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Cpu, Zap, Radio, Sliders, Shield, DollarSign, ScrollText, HeartPulse, Check, RefreshCw, Loader2, Sparkles } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/_admin/admin/ai")({
  head: () => ({
    meta: [
      { title: "AI Center & Provider Routing — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAiCenterPage,
});

function AdminAiCenterPage() {
  const [tab, setTab] = useState("providers");
  const [testing, setTesting] = useState<string | null>(null);

  const testProvider = (providerName: string) => {
    setTesting(providerName);
    setTimeout(() => {
      setTesting(null);
      toast.success(`${providerName} connection test successful (Latency: 240ms)`);
    }, 1200);
  };

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

        {/* TAB 1: PROVIDERS */}
        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ProviderCard
              name="Google Gemini"
              model="gemini-1.5-pro / flash"
              status="Active (Primary)"
              apiKey="AIzaSy...9x2A"
              onTest={() => testProvider("Google Gemini")}
              isTesting={testing === "Google Gemini"}
            />
            <ProviderCard
              name="OpenAI"
              model="gpt-4o / gpt-4o-mini"
              status="Active (Fallback 1)"
              apiKey="sk-proj-...8aK1"
              onTest={() => testProvider("OpenAI")}
              isTesting={testing === "OpenAI"}
            />
            <ProviderCard
              name="OpenRouter"
              model="Claude 3.5 Sonnet / Llama 3"
              status="Connected"
              apiKey="sk-or-v1-...7mX9"
              onTest={() => testProvider("OpenRouter")}
              isTesting={testing === "OpenRouter"}
            />
            <ProviderCard
              name="DeepSeek AI"
              model="deepseek-chat / coder"
              status="Connected"
              apiKey="sk-ds-...3pL4"
              onTest={() => testProvider("DeepSeek AI")}
              isTesting={testing === "DeepSeek AI"}
            />
          </div>
        </TabsContent>

        {/* TAB 2: ROUTING & FALLBACK */}
        <TabsContent value="routing">
          <Card className="p-6 space-y-6 rounded-2xl bg-white border-border/60 shadow-2xs">
            <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">Failover Chain & Dynamic Routing</h3>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-muted/30 border space-y-2">
                <div className="font-semibold text-sm">Primary AI Engine</div>
                <p className="text-muted-foreground">The primary LLM used for family interview questions and manuscript generation.</p>
                <select className="h-9 w-full max-w-sm rounded border bg-background px-3 font-medium">
                  <option>Google Gemini 1.5 Pro</option>
                  <option>OpenAI GPT-4o</option>
                  <option>Claude 3.5 Sonnet (via OpenRouter)</option>
                </select>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border space-y-2">
                <div className="font-semibold text-sm">Automatic Fallback Engine</div>
                <p className="text-muted-foreground">If primary provider returns 5xx error or rate limit, automatically route request to secondary.</p>
                <select className="h-9 w-full max-w-sm rounded border bg-background px-3 font-medium">
                  <option>OpenAI GPT-4o-mini (Recommended)</option>
                  <option>Google Gemini 1.5 Flash</option>
                  <option>DeepSeek Chat</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => toast.success("Routing strategy updated")} className="rounded-xl bg-[color:var(--primary)] text-white">
                Save Routing
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: PROMPTS */}
        <TabsContent value="prompts">
          <Card className="p-6 space-y-6 rounded-2xl bg-white border-border/60 shadow-2xs">
            <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">System Prompt Templates</h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Interview Assistant Prompt</Label>
                <Textarea
                  rows={4}
                  defaultValue="You are a compassionate, warm family historian. Ask thoughtful questions about childhood memories, career milestones, family lineage, and life lessons."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Manuscript Polisher Prompt</Label>
                <Textarea
                  rows={4}
                  defaultValue="Format raw interview transcripts into elegant, narrative-style book chapters with proper paragraph breaks and emotional resonance."
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => toast.success("Prompts saved")} className="rounded-xl bg-[color:var(--primary)] text-white">
                Save Prompts
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 4: COSTS */}
        <TabsContent value="costs">
          <Card className="p-6 space-y-4 rounded-2xl bg-white border-border/60 shadow-2xs">
            <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">AI Token Costs & Spending</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 rounded-xl bg-slate-50 border">
                <div className="text-xs text-muted-foreground">This Month's Spending</div>
                <div className="text-2xl font-bold font-serif text-[color:var(--ink)]">$38.50</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border">
                <div className="text-xs text-muted-foreground">Total Tokens Processed</div>
                <div className="text-2xl font-bold font-serif text-[color:var(--ink)]">1.42M</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border">
                <div className="text-xs text-muted-foreground">Cost per Generated Book</div>
                <div className="text-2xl font-bold font-serif text-[color:var(--ink)]">$0.34</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 5: LOGS */}
        <TabsContent value="logs">
          <Card className="p-6 space-y-4 rounded-2xl bg-white border-border/60 shadow-2xs">
            <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">Recent Invocations Log</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-3 rounded-lg bg-muted/30 border">
                <div>
                  <span className="font-mono font-bold text-primary">Gemini 1.5 Pro</span> — Interview question generation
                </div>
                <div className="text-muted-foreground">240ms · 410 tokens · $0.002</div>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-muted/30 border">
                <div>
                  <span className="font-mono font-bold text-primary">GPT-4o</span> — Chapter manuscript formatting
                </div>
                <div className="text-muted-foreground">580ms · 1,240 tokens · $0.012</div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProviderCard({ name, model, status, apiKey, onTest, isTesting }: any) {
  return (
    <Card className="p-5 rounded-2xl bg-white border-border/60 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-serif text-lg font-semibold text-[color:var(--ink)]">{name}</div>
          <div className="text-xs text-muted-foreground">{model}</div>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
          {status}
        </Badge>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">API Key</Label>
        <Input type="password" value={apiKey} readOnly className="text-xs font-mono bg-muted/30" />
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <Button size="sm" variant="outline" onClick={onTest} disabled={isTesting} className="rounded-xl text-xs">
          {isTesting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-1.5 h-3.5 w-3.5 text-amber-500" />} Test Connection
        </Button>

        <Switch defaultChecked />
      </div>
    </Card>
  );
}
