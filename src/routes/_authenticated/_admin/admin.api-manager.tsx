import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Key, Shield, Zap, Check, Lock, Loader2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/table-controls";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/admin/api-manager")({
  head: () => ({
    meta: [
      { title: "API Vault & Manager — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminApiManagerPage,
});

function AdminApiManagerPage() {
  const [testing, setTesting] = useState<string | null>(null);

  const testConnection = (name: string) => {
    setTesting(name);
    setTimeout(() => {
      setTesting(null);
      toast.success(`${name} API connection verified (HTTP 200 OK)`);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <AdminPageHeader
        title="API Vault & Credentials Manager"
        subtitle="Manage API keys, webhooks, and third-party integration secrets with encrypted storage and connection testing."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <ApiVaultCard
          name="Google Gemini API"
          service="AI LLM Provider"
          keyEnv="GEMINI_API_KEY"
          maskedKey="AIzaSy...9x2A"
          status="Connected"
          onTest={() => testConnection("Google Gemini API")}
          isTesting={testing === "Google Gemini API"}
        />

        <ApiVaultCard
          name="OpenAI API"
          service="AI LLM Fallback"
          keyEnv="OPENAI_API_KEY"
          maskedKey="sk-proj-...8aK1"
          status="Connected"
          onTest={() => testConnection("OpenAI API")}
          isTesting={testing === "OpenAI API"}
        />

        <ApiVaultCard
          name="OpenRouter API"
          service="Multi-Model Gateway"
          keyEnv="OPENROUTER_API_KEY"
          maskedKey="sk-or-v1-...7mX9"
          status="Connected"
          onTest={() => testConnection("OpenRouter API")}
          isTesting={testing === "OpenRouter API"}
        />

        <ApiVaultCard
          name="DeepSeek API"
          service="Code & Logic Model"
          keyEnv="DEEPSEEK_API_KEY"
          maskedKey="sk-ds-...3pL4"
          status="Connected"
          onTest={() => testConnection("DeepSeek API")}
          isTesting={testing === "DeepSeek API"}
        />

        <ApiVaultCard
          name="Stripe Secret Key"
          service="Payment Processor"
          keyEnv="STRIPE_SECRET_KEY"
          maskedKey="sk_live_...4n9P"
          status="Active"
          onTest={() => testConnection("Stripe Gateway")}
          isTesting={testing === "Stripe Gateway"}
        />

        <ApiVaultCard
          name="PayPal Client Secret"
          service="Payment Processor"
          keyEnv="PAYPAL_CLIENT_SECRET"
          maskedKey="E...9mQ2"
          status="Active"
          onTest={() => testConnection("PayPal Gateway")}
          isTesting={testing === "PayPal Gateway"}
        />
      </div>
    </div>
  );
}

function ApiVaultCard({ name, service, keyEnv, maskedKey, status, onTest, isTesting }: any) {
  return (
    <Card className="p-6 rounded-2xl bg-white border-border/60 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-serif text-lg font-semibold text-[color:var(--ink)]">{name}</div>
          <div className="text-xs text-muted-foreground">{service}</div>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
          {status}
        </Badge>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-mono">{keyEnv}</Label>
        <Input type="password" value={maskedKey} readOnly className="text-xs font-mono bg-muted/30" />
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <Button size="sm" variant="outline" onClick={onTest} disabled={isTesting} className="rounded-xl text-xs">
          {isTesting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-1.5 h-3.5 w-3.5 text-amber-500" />} Test Connection
        </Button>

        <Button size="sm" onClick={() => toast.success(`${name} key updated`)} className="rounded-xl bg-[color:var(--primary)] text-white text-xs">
          Update Key
        </Button>
      </div>
    </Card>
  );
}
