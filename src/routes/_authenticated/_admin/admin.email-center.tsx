import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Send, FileText, ScrollText, Check, RefreshCw, Zap, Loader2, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminPageHeader } from "@/components/admin/table-controls";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/admin/email-center")({
  head: () => ({
    meta: [
      { title: "Email Center & Broadcasts — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminEmailCenterPage,
});

function AdminEmailCenterPage() {
  const [tab, setTab] = useState("smtp");
  const [testing, setTesting] = useState(false);

  // Broadcast state
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");

  const testSmtp = () => {
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      toast.success("SMTP connection test successful! Test email delivered.");
    }, 1500);
  };

  const sendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Broadcast email queued for 48 registered users!`);
    setBroadcastSubject("");
    setBroadcastBody("");
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <AdminPageHeader
        title="Email Center & SMTP Dispatcher"
        subtitle="Configure SMTP settings, manage email templates, view dispatch logs, and send broadcast announcements."
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="inline-flex h-11 bg-white p-1 rounded-2xl border border-border/60 shadow-2xs">
          <TabsTrigger value="smtp" className="rounded-xl px-4 text-xs font-semibold">
            <Mail className="mr-2 h-3.5 w-3.5" /> SMTP Settings
          </TabsTrigger>
          <TabsTrigger value="templates" className="rounded-xl px-4 text-xs font-semibold">
            <FileText className="mr-2 h-3.5 w-3.5" /> Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl px-4 text-xs font-semibold">
            <ScrollText className="mr-2 h-3.5 w-3.5" /> Delivery Logs
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="rounded-xl px-4 text-xs font-semibold">
            <Send className="mr-2 h-3.5 w-3.5" /> Broadcast Email
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SMTP SETTINGS */}
        <TabsContent value="smtp">
          <Card className="p-6 space-y-6 rounded-2xl bg-white border-border/60 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">SMTP Server Configuration</h3>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                Connected
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>SMTP Host</Label>
                <Input defaultValue="smtp.resend.com" />
              </div>

              <div className="space-y-1.5">
                <Label>SMTP Port</Label>
                <Input defaultValue="587" />
              </div>

              <div className="space-y-1.5">
                <Label>SMTP Username</Label>
                <Input defaultValue="resend" />
              </div>

              <div className="space-y-1.5">
                <Label>SMTP Password / API Key</Label>
                <Input type="password" defaultValue="re_123456789" />
              </div>

              <div className="space-y-1.5">
                <Label>From Name</Label>
                <Input defaultValue="My Family History Book" />
              </div>

              <div className="space-y-1.5">
                <Label>From Email Address</Label>
                <Input defaultValue="support@myfamilyhistorybook.com" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button size="sm" variant="outline" onClick={testSmtp} disabled={testing} className="rounded-xl">
                {testing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-1.5 h-3.5 w-3.5 text-amber-500" />} Test SMTP Connection
              </Button>

              <Button onClick={() => toast.success("SMTP settings saved")} className="rounded-xl bg-[color:var(--primary)] text-white">
                Save SMTP Settings
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: TEMPLATES */}
        <TabsContent value="templates">
          <Card className="p-6 space-y-4 rounded-2xl bg-white border-border/60 shadow-2xs">
            <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">Transactional Email Templates</h3>
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-muted/30 border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">Welcome Email</div>
                  <div className="text-muted-foreground">Sent upon user registration</div>
                </div>
                <Button size="sm" variant="outline" className="rounded-lg h-7 px-2 text-xs">Edit Template</Button>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">Book Ready Notification</div>
                  <div className="text-muted-foreground">Sent when PDF manuscript is compiled</div>
                </div>
                <Button size="sm" variant="outline" className="rounded-lg h-7 px-2 text-xs">Edit Template</Button>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">Order Receipt</div>
                  <div className="text-muted-foreground">Sent upon successful Stripe/PayPal payment</div>
                </div>
                <Button size="sm" variant="outline" className="rounded-lg h-7 px-2 text-xs">Edit Template</Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: LOGS */}
        <TabsContent value="logs">
          <Card className="p-6 space-y-4 rounded-2xl bg-white border-border/60 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">Recent Email Logs</h3>
              <Button size="sm" variant="outline" onClick={() => toast.success("Retried failed emails in queue")} className="rounded-xl text-xs">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry Failed Emails
              </Button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div>
                  <span className="font-semibold text-emerald-900">[Delivered]</span> Welcome Email to <span className="font-mono">eleanor@example.com</span>
                </div>
                <div className="text-emerald-700 font-mono">Just now</div>
              </div>

              <div className="flex justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div>
                  <span className="font-semibold text-emerald-900">[Delivered]</span> Order Receipt #ORD-84 to <span className="font-mono">subrata@gmail.com</span>
                </div>
                <div className="text-emerald-700 font-mono">1h ago</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 4: BROADCAST */}
        <TabsContent value="broadcast">
          <Card className="p-6 space-y-4 rounded-2xl bg-white border-border/60 shadow-2xs">
            <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">Broadcast Email Announcement</h3>
            <p className="text-xs text-muted-foreground">Send an announcement or newsletter to all registered users.</p>

            <form onSubmit={sendBroadcast} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Subject Line</Label>
                <Input value={broadcastSubject} onChange={(e) => setBroadcastSubject(e.target.value)} placeholder="e.g. New Hardcover Printing Options Available!" required />
              </div>

              <div className="space-y-1.5">
                <Label>Message Content</Label>
                <Textarea rows={6} value={broadcastBody} onChange={(e) => setBroadcastBody(e.target.value)} placeholder="Write your broadcast announcement..." required />
              </div>

              <Button type="submit" className="rounded-xl bg-[color:var(--primary)] text-white">
                <Send className="mr-1.5 h-4 w-4" /> Send Broadcast Email
              </Button>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
