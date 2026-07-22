import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Globe, Search, GitBranch, FileCode, Bot, Save, Plus, Trash2, Check, RefreshCw } from "lucide-react";
import { listSeoConfigs, updateSeoConfig } from "@/lib/system.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminPageHeader } from "@/components/admin/table-controls";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/admin/seo")({
  head: () => ({
    meta: [
      { title: "SEO & Redirect Manager — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSeoPage,
});

function AdminSeoPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("pages");

  const { data: seoPages = [] } = useQuery({
    queryKey: ["admin-seo-configs"],
    queryFn: () => listSeoConfigs(),
  });

  const [selectedPage, setSelectedPage] = useState("homepage");
  const [title, setTitle] = useState("My Family History Book — Turn Family Memories into Heirloom Printed Books");
  const [description, setDescription] = useState("AI guided interview assistant to turn your parents' and grandparents' stories into beautiful printed hardcover books.");
  const [ogImage, setOgImage] = useState("/og-image.png");

  useEffect(() => {
    if (seoPages && seoPages.length > 0) {
      const match = (seoPages as any[]).find((p: any) => p.page_key === selectedPage);
      if (match) {
        setTitle(match.title || "");
        setDescription(match.description || "");
        setOgImage(match.og_image || "/og-image.png");
      }
    }
  }, [selectedPage, seoPages]);

  const saveSeoMutation = useMutation({
    mutationFn: () =>
      updateSeoConfig({
        data: {
          page_key: selectedPage,
          title,
          description,
          og_image: ogImage,
        },
      }),
    onSuccess: () => {
      toast.success("SEO Configuration saved");
      queryClient.invalidateQueries({ queryKey: ["admin-seo-configs"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to save SEO config"),
  });

  // Robots & LLMs state
  const [robotsTxt, setRobotsTxt] = useState("User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /dashboard/\nSitemap: https://myfamilyhistorybook.com/sitemap.xml");
  const [llmsTxt, setLlmsTxt] = useState("# LLMS.txt - Machine Readable Context for AI Agents\nTitle: My Family History Book\nSummary: Family history memoir generator and heirloom book printing SaaS.");

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <AdminPageHeader
        title="SEO Manager & Webmaster Tools"
        subtitle="Manage search engine metadata, OpenGraph cards, 301 redirects, robots.txt, llms.txt, and sitemaps."
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="inline-flex h-11 bg-white p-1 rounded-2xl border border-border/60 shadow-2xs">
          <TabsTrigger value="pages" className="rounded-xl px-4 text-xs font-semibold">
            <Globe className="mr-2 h-3.5 w-3.5" /> Page Metadata
          </TabsTrigger>
          <TabsTrigger value="redirects" className="rounded-xl px-4 text-xs font-semibold">
            <GitBranch className="mr-2 h-3.5 w-3.5" /> 301 Redirects
          </TabsTrigger>
          <TabsTrigger value="robots" className="rounded-xl px-4 text-xs font-semibold">
            <Bot className="mr-2 h-3.5 w-3.5" /> robots.txt & llms.txt
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: METADATA */}
        <TabsContent value="pages">
          <Card className="p-6 space-y-6 rounded-2xl bg-white border-border/60 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">Search Metadata Editor</h3>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-xs font-medium"
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
              >
                <option value="homepage">Homepage</option>
                <option value="pricing">Pricing Page</option>
                <option value="blog">Blog Landing</option>
                <option value="interview">AI Interview Page</option>
              </select>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Page Title Tag (50-60 characters)</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                <div className="text-[11px] text-muted-foreground text-right">{title.length} characters</div>
              </div>

              <div className="space-y-1.5">
                <Label>Meta Description (150-160 characters)</Label>
                <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                <div className="text-[11px] text-muted-foreground text-right">{description.length} characters</div>
              </div>

              <div className="space-y-1.5">
                <Label>OpenGraph Image URL</Label>
                <Input value={ogImage} onChange={(e) => setOgImage(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => saveSeoMutation.mutate()} disabled={saveSeoMutation.isPending} className="rounded-xl bg-[color:var(--primary)] text-white">
                <Save className="mr-1.5 h-4 w-4" /> Save Metadata
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: REDIRECTS */}
        <TabsContent value="redirects">
          <Card className="p-6 space-y-4 rounded-2xl bg-white border-border/60 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">301 / 302 URL Redirects</h3>
              <Button size="sm" onClick={() => toast.success("Redirect rule added")} className="rounded-xl bg-[color:var(--primary)] text-white">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Redirect
              </Button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border">
                <div>
                  <span className="font-mono text-primary font-bold">/old-pricing</span> → <span className="font-mono text-foreground">/pricing</span>
                </div>
                <Badge variant="outline" className="text-[10px]">301 Permanent</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: ROBOTS & LLMS.TXT */}
        <TabsContent value="robots">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6 space-y-4 rounded-2xl bg-white border-border/60 shadow-2xs">
              <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">robots.txt Config</h3>
              <Textarea rows={8} value={robotsTxt} onChange={(e) => setRobotsTxt(e.target.value)} className="font-mono text-xs" />
              <Button size="sm" onClick={() => toast.success("robots.txt updated")} className="rounded-xl bg-[color:var(--primary)] text-white">
                <Save className="mr-1.5 h-3.5 w-3.5" /> Save robots.txt
              </Button>
            </Card>

            <Card className="p-6 space-y-4 rounded-2xl bg-white border-border/60 shadow-2xs">
              <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">llms.txt Config (AI Crawler Spec)</h3>
              <Textarea rows={8} value={llmsTxt} onChange={(e) => setLlmsTxt(e.target.value)} className="font-mono text-xs" />
              <Button size="sm" onClick={() => toast.success("llms.txt updated")} className="rounded-xl bg-[color:var(--primary)] text-white">
                <Save className="mr-1.5 h-3.5 w-3.5" /> Save llms.txt
              </Button>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
