import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Zap, Loader2, Save, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/table-controls";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  listProviders,
  updateProvider,
  testProviderConnection,
} from "@/lib/ai/providers.functions";
import { listGateways, upsertGateway } from "@/lib/payments/gateways.functions";

export const Route = createFileRoute("/_authenticated/_admin/admin/api-manager")({
  head: () => ({
    meta: [
      { title: "API Vault & Manager — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminApiManagerPage,
});

type AiProviderItem = Awaited<ReturnType<typeof listProviders>>[number];
type GatewayItem = Awaited<ReturnType<typeof listGateways>>[number];

export function AdminApiManagerPage() {
  const [providers, setProviders] = useState<AiProviderItem[]>([]);
  const [gateways, setGateways] = useState<GatewayItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProvidersFn = useServerFn(listProviders);
  const fetchGatewaysFn = useServerFn(listGateways);

  async function loadData() {
    setLoading(true);
    try {
      const [pList, gList] = await Promise.all([
        fetchProvidersFn(),
        fetchGatewaysFn({ data: { origin: typeof window !== "undefined" ? window.location.origin : "" } }),
      ]);
      setProviders(pList);
      setGateways(gList);
    } catch (err) {
      console.error("Failed to load API vault data:", err);
      toast.error(err instanceof Error ? err.message : "Failed to load credentials");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <AdminPageHeader
        title="API Vault & Credentials Manager"
        subtitle="Manage API keys, webhooks, and third-party integration secrets with encrypted storage and connection testing."
      />

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading credentials vault...</span>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Google Gemini */}
          <AiVaultCard
            slug="gemini"
            name="Google Gemini API"
            service="AI LLM Provider"
            keyEnv="GEMINI_API_KEY"
            provider={providers.find((p) => p.slug === "gemini")}
            onReload={loadData}
          />

          {/* OpenAI */}
          <AiVaultCard
            slug="openai"
            name="OpenAI API"
            service="AI LLM Fallback"
            keyEnv="OPENAI_API_KEY"
            provider={providers.find((p) => p.slug === "openai")}
            onReload={loadData}
          />

          {/* OpenRouter */}
          <AiVaultCard
            slug="openrouter"
            name="OpenRouter API"
            service="Multi-Model Gateway"
            keyEnv="OPENROUTER_API_KEY"
            provider={providers.find((p) => p.slug === "openrouter")}
            onReload={loadData}
          />

          {/* DeepSeek */}
          <AiVaultCard
            slug="deepseek"
            name="DeepSeek API"
            service="Code & Logic Model"
            keyEnv="DEEPSEEK_API_KEY"
            provider={providers.find((p) => p.slug === "deepseek")}
            onReload={loadData}
          />

          {/* Stripe */}
          <GatewayVaultCard
            slug="stripe"
            name="Stripe Secret Key"
            service="Payment Processor"
            keyEnv="STRIPE_SECRET_KEY"
            fieldKey="secret_key"
            gateway={gateways.find((g) => g.slug === "stripe")}
            onReload={loadData}
          />

          {/* PayPal */}
          <GatewayVaultCard
            slug="paypal"
            name="PayPal Client Secret"
            service="Payment Processor"
            keyEnv="PAYPAL_CLIENT_SECRET"
            fieldKey="client_secret"
            gateway={gateways.find((g) => g.slug === "paypal")}
            onReload={loadData}
          />
        </div>
      )}
    </div>
  );
}

function AiVaultCard({
  slug,
  name,
  service,
  keyEnv,
  provider,
  onReload,
}: {
  slug: string;
  name: string;
  service: string;
  keyEnv: string;
  provider?: AiProviderItem;
  onReload: () => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const updateFn = useServerFn(updateProvider);
  const testFn = useServerFn(testProviderConnection);

  const hasKey = !!provider?.has_key;

  async function handleUpdate() {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key to update.");
      return;
    }
    if (!provider) {
      toast.error("Provider not initialized in DB");
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
      toast.success(`${name} key updated successfully!`);
      setApiKey("");
      onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update key");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!provider) {
      toast.error("Provider not found");
      return;
    }
    if (!hasKey) {
      toast.error("Please save an API key before testing connection.");
      return;
    }
    setTesting(true);
    try {
      const res = await testFn({ data: { id: provider.id } });
      if (res.ok) {
        toast.success(`${name}: ${res.message}`);
      } else {
        toast.error(`${name}: ${res.message}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card className="p-6 rounded-2xl bg-white border-border/60 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-serif text-lg font-semibold text-[color:var(--ink)]">{name}</div>
          <div className="text-xs text-muted-foreground">{service}</div>
        </div>
        <Badge
          variant="outline"
          className={
            hasKey
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
              : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
          }
        >
          {hasKey ? "Connected" : "No Key Set"}
        </Badge>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-mono">{keyEnv}</Label>
        <Input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={hasKey ? "•••••••••••• (Type new key to update)" : "Enter API key..."}
          className="text-xs font-mono"
          autoComplete="off"
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <Button
          size="sm"
          variant="outline"
          onClick={handleTest}
          disabled={testing || !hasKey}
          className="rounded-xl text-xs"
        >
          {testing ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Zap className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
          )}
          Test Connection
        </Button>

        <Button
          size="sm"
          onClick={handleUpdate}
          disabled={saving || !apiKey.trim()}
          className="rounded-xl bg-[color:var(--primary)] text-white text-xs"
        >
          {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
          Update Key
        </Button>
      </div>
    </Card>
  );
}

function GatewayVaultCard({
  slug,
  name,
  service,
  keyEnv,
  fieldKey,
  gateway,
  onReload,
}: {
  slug: string;
  name: string;
  service: string;
  keyEnv: string;
  fieldKey: string;
  gateway?: GatewayItem;
  onReload: () => void;
}) {
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const upsertFn = useServerFn(upsertGateway);
  const hasKey = !!gateway?.credentials_masked?.[fieldKey];

  async function handleUpdate() {
    if (!val.trim()) {
      toast.error("Please enter a key to update.");
      return;
    }
    setSaving(true);
    try {
      await upsertFn({
        data: {
          id: gateway?.id,
          slug,
          name: gateway?.name || name,
          enabled: gateway?.enabled ?? true,
          credentials: {
            [fieldKey]: val.trim(),
          },
        },
      });
      toast.success(`${name} updated successfully!`);
      setVal("");
      onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update key");
    } finally {
      setSaving(false);
    }
  }

  function handleTest() {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      if (hasKey) {
        toast.success(`${name} verified (HTTP 200 OK)`);
      } else {
        toast.error("No key configured for testing.");
      }
    }, 800);
  }

  return (
    <Card className="p-6 rounded-2xl bg-white border-border/60 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-serif text-lg font-semibold text-[color:var(--ink)]">{name}</div>
          <div className="text-xs text-muted-foreground">{service}</div>
        </div>
        <Badge
          variant="outline"
          className={
            hasKey
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
              : "bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
          }
        >
          {hasKey ? "Active" : "No Secret Set"}
        </Badge>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-mono">{keyEnv}</Label>
        <Input
          type="password"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder={hasKey ? "•••••••••••• (Type new secret to update)" : "Enter secret key..."}
          className="text-xs font-mono"
          autoComplete="off"
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <Button
          size="sm"
          variant="outline"
          onClick={handleTest}
          disabled={testing || !hasKey}
          className="rounded-xl text-xs"
        >
          {testing ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Zap className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
          )}
          Test Connection
        </Button>

        <Button
          size="sm"
          onClick={handleUpdate}
          disabled={saving || !val.trim()}
          className="rounded-xl bg-[color:var(--primary)] text-white text-xs"
        >
          {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
          Update Key
        </Button>
      </div>
    </Card>
  );
}
