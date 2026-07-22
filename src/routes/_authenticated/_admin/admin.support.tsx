import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Ticket,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  User,
  Laptop,
  Globe,
  Trash2,
  Download,
  MessageSquare,
  Bug,
  Sparkles,
  Settings,
  ShieldAlert,
  Loader2,
  FileText,
  Lock,
  Eye,
  Check,
  X,
  XCircle,
} from "lucide-react";
import {
  adminGetSupportOverview,
  adminListTickets,
  getSupportTicketDetails,
  replyToTicket,
  adminUpdateTicket,
  adminListBugs,
  adminUpdateBug,
  listFeatureRequests,
  adminUpdateFeatureStatus,
} from "@/lib/support.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AdminPageHeader } from "@/components/admin/table-controls";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/_admin/admin/support")({
  head: () => ({
    meta: [
      { title: "Support Center — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSupportPage,
});

function AdminSupportPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("tickets");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Queries
  const { data: stats } = useQuery({
    queryKey: ["admin-support-overview"],
    queryFn: () => adminGetSupportOverview(),
  });

  const { data: tickets = [], isLoading: loadingTickets } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: () => adminListTickets(),
  });

  const { data: bugs = [], isLoading: loadingBugs } = useQuery({
    queryKey: ["admin-bugs"],
    queryFn: () => adminListBugs(),
  });

  const { data: features = [], isLoading: loadingFeatures } = useQuery({
    queryKey: ["admin-features"],
    queryFn: () => listFeatureRequests(),
  });

  // Single Ticket Detail Query
  const { data: ticketDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ["admin-ticket-detail", selectedTicketId],
    queryFn: () => (selectedTicketId ? getSupportTicketDetails({ data: { ticketId: selectedTicketId } }) : null),
    enabled: !!selectedTicketId,
  });

  // Reply Form & Mutation
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);

  const replyMutation = useMutation({
    mutationFn: () =>
      replyToTicket({
        data: {
          ticketId: selectedTicketId!,
          message: replyText,
          isInternalNote,
        },
      }),
    onSuccess: () => {
      toast.success(isInternalNote ? "Internal note added" : "Reply sent to user");
      setReplyText("");
      setIsInternalNote(false);
      queryClient.invalidateQueries({ queryKey: ["admin-ticket-detail", selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Ticket update mutation
  const updateTicketMutation = useMutation({
    mutationFn: (patch: { status?: string; priority?: string; action?: "update" | "delete" }) =>
      adminUpdateTicket({
        data: {
          ticketId: selectedTicketId!,
          ...patch,
        },
      }),
    onSuccess: (_, variables) => {
      if (variables.action === "delete") {
        toast.success("Ticket deleted");
        setSelectedTicketId(null);
      } else {
        toast.success("Ticket updated successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-support-overview"] });
      queryClient.invalidateQueries({ queryKey: ["admin-ticket-detail", selectedTicketId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Bug update mutation
  const updateBugMutation = useMutation({
    mutationFn: (d: { bugId: string; status?: string; severity?: string }) => adminUpdateBug({ data: d }),
    onSuccess: () => {
      toast.success("Bug report updated");
      queryClient.invalidateQueries({ queryKey: ["admin-bugs"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Feature status mutation
  const updateFeatureMutation = useMutation({
    mutationFn: (d: { featureId: string; status: string }) => adminUpdateFeatureStatus({ data: d }),
    onSuccess: () => {
      toast.success("Feature request status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-features"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Export ticket as TXT summary
  const exportTicketText = () => {
    if (!ticketDetails) return;
    const t = ticketDetails.ticket;
    let text = `SUPPORT TICKET SUMMARY\n`;
    text += `Ticket #: ${t.ticket_number}\n`;
    text += `Subject: ${t.subject}\n`;
    text += `Status: ${t.status}\n`;
    text += `Priority: ${t.priority}\n`;
    text += `Category: ${t.category}\n`;
    text += `Created: ${t.created_at}\n\n`;
    text += `CONVERSATION THREAD:\n`;
    text += `----------------------------------------\n`;
    for (const m of ticketDetails.messages ?? []) {
      text += `[${m.created_at}] ${m.sender_type.toUpperCase()} (${m.sender?.full_name ?? "User"}): ${m.is_internal_note ? "[INTERNAL NOTE] " : ""}${m.message}\n\n`;
    }

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t.ticket_number}-summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t: any) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchSub = t.subject.toLowerCase().includes(q);
      const matchNum = t.ticket_number.toLowerCase().includes(q);
      const matchName = (t.user?.full_name ?? "").toLowerCase().includes(q);
      const matchEmail = (t.user?.email ?? "").toLowerCase().includes(q);
      if (!matchSub && !matchNum && !matchName && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in pb-16">
      <AdminPageHeader
        title="Support Center & Ticket Management"
        subtitle="Centralized control room to manage user tickets, reply to inquiries, track bugs, and configure support settings."
      />

      {/* DASHBOARD STATS OVERVIEW */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard icon={Ticket} label="Total Tickets" value={stats?.total ?? 0} color="bg-slate-100 text-slate-800" />
        <StatCard icon={AlertTriangle} label="Open Tickets" value={stats?.open ?? 0} color="bg-blue-100 text-blue-800" />
        <StatCard icon={Clock} label="Pending Admin" value={stats?.pending ?? 0} color="bg-amber-100 text-amber-800" />
        <StatCard icon={CheckCircle} label="Resolved" value={stats?.resolved ?? 0} color="bg-emerald-100 text-emerald-800" />
        <StatCard icon={XCircle} label="Closed" value={stats?.closed ?? 0} color="bg-gray-100 text-gray-800" />
        <StatCard icon={Sparkles} label="Today's Tickets" value={stats?.todayCount ?? 0} color="bg-purple-100 text-purple-800" />
      </div>

      {/* TABS */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex flex-nowrap bg-white border border-border/60 p-1 rounded-2xl">
            <TabsTrigger value="tickets" className="rounded-xl px-4 text-xs font-semibold">
              <Ticket className="mr-2 h-3.5 w-3.5" /> Tickets ({filteredTickets.length})
            </TabsTrigger>
            <TabsTrigger value="bugs" className="rounded-xl px-4 text-xs font-semibold">
              <Bug className="mr-2 h-3.5 w-3.5" /> Bug Reports ({bugs.length})
            </TabsTrigger>
            <TabsTrigger value="features" className="rounded-xl px-4 text-xs font-semibold">
              <Sparkles className="mr-2 h-3.5 w-3.5" /> Feature Requests ({features.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl px-4 text-xs font-semibold">
              <Settings className="mr-2 h-3.5 w-3.5" /> Support Settings
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: TICKETS LISTING & FILTERS */}
        <TabsContent value="tickets" className="space-y-4">
          <Card className="p-4 space-y-4 rounded-2xl bg-white border-border/60 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by ticket #, subject, or user..."
                  className="pl-9 h-10 text-xs"
                />
              </div>

              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-xs"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-xs"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {loadingTickets ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs">
                No support tickets found matching criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider">
                      <th className="p-3">Ticket #</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Updated</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredTickets.map((t: any) => (
                      <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono font-bold text-primary">{t.ticket_number}</td>
                        <td className="p-3 font-medium">
                          <div>{t.user?.full_name ?? "User"}</div>
                          <div className="text-[10px] text-muted-foreground">{t.user?.email}</div>
                        </td>
                        <td className="p-3 font-medium max-w-[220px] truncate">{t.subject}</td>
                        <td className="p-3 capitalize">{t.category.replace("_", " ")}</td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={`capitalize text-[10px] ${
                              t.priority === "urgent"
                                ? "border-red-500 text-red-600 bg-red-50"
                                : t.priority === "high"
                                ? "border-orange-500 text-orange-600 bg-orange-50"
                                : "border-slate-300"
                            }`}
                          >
                            {t.priority}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="secondary"
                            className={`capitalize text-[10px] ${
                              t.status === "open"
                                ? "bg-blue-100 text-blue-800"
                                : t.status === "resolved"
                                ? "bg-emerald-100 text-emerald-800"
                                : t.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {t.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {formatDistanceToNow(new Date(t.updated_at), { addSuffix: true })}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTicketId(t.id)}
                            className="rounded-lg h-7 px-2 text-xs"
                          >
                            <Eye className="mr-1 h-3 w-3" /> View Thread
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 2: BUG REPORTS */}
        <TabsContent value="bugs">
          <Card className="p-6 space-y-4 rounded-2xl bg-white border-border/60 shadow-2xs">
            <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">Software Bug Reports</h3>

            {loadingBugs ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : bugs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs">No bug reports submitted yet.</div>
            ) : (
              <div className="space-y-4">
                {bugs.map((b: any) => (
                  <Card key={b.id} className="p-4 rounded-xl border border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bug className="h-4 w-4 text-red-500" />
                        <h4 className="font-semibold text-sm">{b.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize text-[10px]">Severity: {b.severity}</Badge>
                        <select
                          className="h-7 text-xs rounded border px-2 bg-background"
                          value={b.status}
                          onChange={(e) => updateBugMutation.mutate({ bugId: b.id, status: e.target.value })}
                        >
                          <option value="open">Open</option>
                          <option value="investigating">Investigating</option>
                          <option value="fixing">Fixing</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{b.steps_to_reproduce}</p>
                    <div className="text-[10px] text-muted-foreground flex gap-3 border-t pt-2">
                      <span>Browser: {b.browser_info ?? "N/A"}</span>
                      <span>Device: {b.device_info ?? "N/A"}</span>
                      <span>Date: {new Date(b.created_at).toLocaleDateString()}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 3: FEATURE REQUESTS */}
        <TabsContent value="features">
          <Card className="p-6 space-y-4 rounded-2xl bg-white border-border/60 shadow-2xs">
            <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">Feature Requests Management</h3>

            {loadingFeatures ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : features.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs">No feature requests submitted yet.</div>
            ) : (
              <div className="space-y-3">
                {features.map((f: any) => (
                  <Card key={f.id} className="p-4 rounded-xl border border-border/60 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{f.title}</h4>
                        <Badge variant="secondary" className="text-[10px] font-bold">👍 {f.votes} Votes</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{f.description}</p>
                    </div>

                    <select
                      className="h-8 text-xs rounded border px-2 bg-background font-medium shrink-0"
                      value={f.status}
                      onChange={(e) => updateFeatureMutation.mutate({ featureId: f.id, status: e.target.value })}
                    >
                      <option value="open">Open</option>
                      <option value="under_review">Under Review</option>
                      <option value="planned">Planned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 4: SUPPORT SETTINGS */}
        <TabsContent value="settings">
          <Card className="p-6 space-y-6 rounded-2xl bg-white border-border/60 shadow-2xs">
            <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">Support Portal Settings</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Enable Help Center</div>
                  <div className="text-xs text-muted-foreground">Allow users to access `/help` portal.</div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <div>
                  <div className="font-medium text-sm">Enable Bug Reports</div>
                  <div className="text-xs text-muted-foreground">Allow users to submit software bug reports.</div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <div>
                  <div className="font-medium text-sm">Enable Feature Requests</div>
                  <div className="text-xs text-muted-foreground">Allow users to suggest and upvote features.</div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="grid gap-4 md:grid-cols-2 border-t pt-4">
                <div className="space-y-1.5">
                  <Label>Max Attachment Size (MB)</Label>
                  <Input type="number" defaultValue={20} />
                </div>

                <div className="space-y-1.5">
                  <Label>Default Ticket Priority</Label>
                  <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" defaultValue="medium">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t pt-4">
              <Button onClick={() => toast.success("Support settings saved")} className="rounded-xl bg-[color:var(--primary)] text-white">
                Save Settings
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ADMIN TICKET CONVERSATION DRAWER */}
      <Dialog open={!!selectedTicketId} onOpenChange={(open) => !open && setSelectedTicketId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 rounded-2xl">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-primary">{ticketDetails?.ticket?.ticket_number}</span>
                <Badge variant="outline" className="capitalize text-[10px]">{ticketDetails?.ticket?.category}</Badge>
              </div>

              <Button variant="outline" size="sm" onClick={exportTicketText} className="h-7 text-xs">
                <Download className="mr-1 h-3.5 w-3.5" /> Export Text
              </Button>
            </div>

            <DialogTitle className="font-serif text-2xl font-semibold mt-1">
              {ticketDetails?.ticket?.subject}
            </DialogTitle>

            {/* Quick Admin Actions Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Status:</span>
                <select
                  className="h-7 rounded border px-2 text-xs bg-background font-semibold"
                  value={ticketDetails?.ticket?.status ?? "open"}
                  onChange={(e) => updateTicketMutation.mutate({ status: e.target.value })}
                >
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Priority:</span>
                <select
                  className="h-7 rounded border px-2 text-xs bg-background font-semibold"
                  value={ticketDetails?.ticket?.priority ?? "medium"}
                  onChange={(e) => updateTicketMutation.mutate({ priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <Button
                variant="destructive"
                size="sm"
                className="h-7 px-2 text-xs ml-auto"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this ticket?")) {
                    updateTicketMutation.mutate({ action: "delete" });
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
            </div>
          </DialogHeader>

          {/* Conversation & Metadata */}
          <div className="grid md:grid-cols-[1fr_240px] gap-6 flex-1 overflow-hidden py-3">
            {/* Messages Thread */}
            <div className="flex flex-col h-full overflow-y-auto space-y-4 pr-2 border-r">
              {loadingDetails ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                ticketDetails?.messages?.map((msg: any) => {
                  const isAdmin = msg.sender_type === "admin";
                  const isNote = msg.is_internal_note;

                  return (
                    <div key={msg.id} className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                        <span className="font-semibold text-foreground">
                          {msg.sender?.full_name ?? (isAdmin ? "Support Agent" : "User")}
                        </span>
                        {isNote && <Badge variant="destructive" className="text-[9px] py-0">Internal Note</Badge>}
                        <span>· {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                      </div>

                      <div
                        className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                          isNote
                            ? "bg-amber-100/80 text-amber-900 border border-amber-300 rounded-br-none"
                            : isAdmin
                            ? "bg-[color:var(--primary)] text-white rounded-br-none"
                            : "bg-muted/40 text-foreground border border-border/50 rounded-bl-none"
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* User & Environment Sidebar Metadata */}
            <div className="space-y-4 text-xs">
              <div>
                <div className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground mb-1">User Information</div>
                <div className="space-y-1 bg-muted/20 p-3 rounded-xl border">
                  <div className="font-medium text-foreground">{ticketDetails?.messages?.[0]?.sender?.full_name ?? "User"}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{ticketDetails?.messages?.[0]?.sender?.email}</div>
                </div>
              </div>

              <div>
                <div className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground mb-1">Environment Info</div>
                <div className="space-y-1.5 bg-muted/20 p-3 rounded-xl border text-[11px]">
                  <div><span className="text-muted-foreground">OS:</span> {ticketDetails?.ticket?.os_info?.name ?? "N/A"}</div>
                  <div><span className="text-muted-foreground">Browser:</span> {ticketDetails?.ticket?.browser_info?.name ?? "N/A"}</div>
                  <div><span className="text-muted-foreground">Device:</span> {ticketDetails?.ticket?.device_type ?? "Desktop"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Reply Box */}
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-amber-800">
                <Switch checked={isInternalNote} onCheckedChange={setIsInternalNote} />
                Post as Internal Note (Hidden from user)
              </label>
            </div>

            <Textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={isInternalNote ? "Write internal staff note..." : "Write official reply to user..."}
              className={`text-xs ${isInternalNote ? "bg-amber-50 border-amber-300" : ""}`}
            />

            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                onClick={() => replyMutation.mutate()}
                disabled={replyMutation.isPending || !replyText.trim()}
                className={`rounded-xl ${isInternalNote ? "bg-amber-700 text-white hover:bg-amber-800" : "bg-[color:var(--primary)] text-white"}`}
              >
                {replyMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                {isInternalNote ? "Post Note" : "Send Reply"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Ticket;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="p-4 rounded-2xl border border-border/60 bg-white shadow-2xs">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <div className="text-xl font-bold font-serif text-[color:var(--ink)]">{value}</div>
          <div className="text-[11px] text-muted-foreground font-medium">{label}</div>
        </div>
      </div>
    </Card>
  );
}
