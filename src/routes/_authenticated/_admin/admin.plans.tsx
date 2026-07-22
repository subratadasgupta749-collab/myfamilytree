import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAllSettings, saveSettings } from "@/lib/settings.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AdminPageHeader } from "@/components/admin/table-controls";
import { toast } from "sonner";
import { Save, Loader2, Plus, Trash2, Star, ArrowUp, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/admin/plans")({
  head: () => ({
    meta: [
      { title: "Manage Pricing Plans — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPlansPage,
});

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  badge?: string;
  description?: string;
  features: string[];
  popular?: boolean;
}

function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllSettings()
      .then((d: any) => {
        const pricing = d?.pricing ?? {};
        const list = pricing.plans ?? [];
        if (list.length === 0) {
          // Default fallbacks if empty
          setPlans([
            {
              id: "digital-memoir",
              name: "The Family History Book",
              price: 34,
              currency: "USD",
              badge: "One-time payment",
              description: "One-time. No subscription. Ever.",
              features: [
                "Unlimited AI-guided interviews",
                "Up to 200 photos, beautifully placed",
                "Professionally written chapters",
                "Elegant, print-ready PDF",
                "Preview before you pay",
                "Free lifetime updates to your book"
              ],
              popular: true
            }
          ]);
        } else {
          setPlans(list);
        }
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      // Validate
      for (const p of plans) {
        if (!p.id.trim()) throw new Error("Plan ID is required");
        if (!p.name.trim()) throw new Error("Plan Name is required");
        if (isNaN(p.price) || p.price < 0) throw new Error(`Invalid price for plan ${p.name}`);
      }

      // Find primary details for backward compatibility settings.pricing.book_price
      const popularPlan = plans.find((p) => p.popular) ?? plans[0];
      const book_price = popularPlan ? popularPlan.price : 34;
      const currency = popularPlan ? popularPlan.currency : "USD";

      await saveSettings({
        data: {
          key: "pricing",
          value: {
            book_price,
            currency,
            plans,
          },
        },
      });
      toast.success("Pricing plans saved successfully");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const addPlan = () => {
    const newId = `plan-${Date.now()}`;
    setPlans([
      ...plans,
      {
        id: newId,
        name: "New Plan",
        price: 30,
        currency: "USD",
        badge: "One-time payment",
        description: "Description of the new plan",
        features: ["Feature 1", "Feature 2"],
        popular: false,
      },
    ]);
  };

  const removePlan = (index: number) => {
    const list = [...plans];
    list.splice(index, 1);
    setPlans(list);
  };

  const updatePlan = (index: number, patch: Partial<Plan>) => {
    setPlans((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, ...patch } : p))
    );
  };

  const updateFeature = (planIdx: number, featIdx: number, val: string) => {
    setPlans((prev) =>
      prev.map((p, pIdx) => {
        if (pIdx !== planIdx) return p;
        const features = [...p.features];
        features[featIdx] = val;
        return { ...p, features };
      })
    );
  };

  const addFeature = (planIdx: number) => {
    setPlans((prev) =>
      prev.map((p, pIdx) => {
        if (pIdx !== planIdx) return p;
        return { ...p, features: [...p.features, ""] };
      })
    );
  };

  const removeFeature = (planIdx: number, featIdx: number) => {
    setPlans((prev) =>
      prev.map((p, pIdx) => {
        if (pIdx !== planIdx) return p;
        const features = [...p.features];
        features.splice(featIdx, 1);
        return { ...p, features };
      })
    );
  };

  const setPopular = (index: number) => {
    setPlans((prev) =>
      prev.map((p, idx) => ({ ...p, popular: idx === index }))
    );
  };

  const movePlan = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === plans.length - 1) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const list = [...plans];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    setPlans(list);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <AdminPageHeader
        title="Pricing Plans"
        subtitle="Manage the plans and packages available to your users. Changes will reflect dynamically on the homepage and during checkout."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={addPlan}>
              <Plus className="mr-2 h-4 w-4" /> Add Plan
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {plans.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-muted-foreground">No plans configured. Create one to get started.</p>
            <Button className="mt-4" onClick={addPlan}>
              <Plus className="mr-2 h-4 w-4" /> Add Plan
            </Button>
          </Card>
        ) : (
          plans.map((plan, planIdx) => (
            <Card key={plan.id} className={`p-6 space-y-5 border-l-4 relative ${plan.popular ? 'border-l-[color:var(--primary)] bg-amber-50/5' : 'border-l-border'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Plan #{planIdx + 1}</span>
                      {plan.popular && (
                        <span className="inline-flex items-center gap-1 rounded bg-[color:var(--primary)]/10 px-2 py-0.5 text-xs font-semibold text-[color:var(--primary)]">
                          <Star className="h-3 w-3 fill-current" /> Popular
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={planIdx === 0}
                    onClick={() => movePlan(planIdx, "up")}
                    title="Move Up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={planIdx === plans.length - 1}
                    onClick={() => movePlan(planIdx, "down")}
                    title="Move Down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => removePlan(planIdx)}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" /> Delete Plan
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Plan ID (Unique Slug)</Label>
                  <Input
                    value={plan.id}
                    onChange={(e) => updatePlan(planIdx, { id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="e.g. digital-memoir"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Plan Name</Label>
                  <Input
                    value={plan.name}
                    onChange={(e) => updatePlan(planIdx, { name: e.target.value })}
                    placeholder="e.g. The Family History Book"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      value={plan.price}
                      onChange={(e) => updatePlan(planIdx, { price: Number(e.target.value) })}
                      placeholder="34"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <Input
                      value={plan.currency}
                      onChange={(e) => updatePlan(planIdx, { currency: e.target.value.toUpperCase() })}
                      placeholder="USD"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Badge / Tagline (Optional)</Label>
                  <Input
                    value={plan.badge ?? ""}
                    onChange={(e) => updatePlan(planIdx, { badge: e.target.value })}
                    placeholder="e.g. One-time payment"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Short Description (Optional)</Label>
                  <Input
                    value={plan.description ?? ""}
                    onChange={(e) => updatePlan(planIdx, { description: e.target.value })}
                    placeholder="e.g. One-time. No subscription. Ever."
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Plan Features</Label>
                  <Button variant="outline" size="sm" onClick={() => addFeature(planIdx)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Feature
                  </Button>
                </div>
                <div className="space-y-2">
                  {plan.features.map((feat, featIdx) => (
                    <div key={featIdx} className="flex items-center gap-2">
                      <Input
                        value={feat}
                        onChange={(e) => updateFeature(planIdx, featIdx, e.target.value)}
                        placeholder={`Feature #${featIdx + 1}`}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFeature(planIdx, featIdx)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <Switch
                    checked={!!plan.popular}
                    onCheckedChange={() => setPopular(planIdx)}
                  />
                  Mark as Popular / Featured Plan
                </label>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={addPlan}>
          <Plus className="mr-2 h-4 w-4" /> Add Plan
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
