import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  HelpCircle,
  Search,
  MessageSquare,
  Bug,
  Sparkles,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
  Ticket,
  Paperclip,
  Clock,
  ThumbsUp,
  X,
  FileText,
  Loader2,
  AlertCircle,
  Laptop,
  Globe,
  RotateCcw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  createSupportTicket,
  listMySupportTickets,
  getSupportTicketDetails,
  replyToTicket,
  updateTicketStatus,
  submitBugReport,
  listMyBugReports,
  submitFeatureRequest,
  listFeatureRequests,
  toggleVoteFeatureRequest,
} from "@/lib/support.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/_app/help")({
  head: () => ({
    meta: [
      { title: "Help Center & Support — My Family History Book" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HelpCenterPage,
});

function HelpCenterPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("tickets");
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Auto-detected Browser & Device Metadata
  const [clientMeta, setClientMeta] = useState<{
    browser: string;
    os: string;
    device: string;
    url: string;
  }>({
    browser: "Unknown",
    os: "Unknown",
    device: "Desktop",
    url: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent;
      let browser = "Chrome / Safari";
      if (ua.includes("Firefox")) browser = "Firefox";
      else if (ua.includes("Edg")) browser = "Edge";
      else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";

      let os = "Windows";
      if (ua.includes("Mac")) os = "macOS";
      else if (ua.includes("Linux")) os = "Linux";
      else if (ua.includes("Android")) os = "Android";
      else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

      const device = /Mobile|Android|iPhone|iPad/i.test(ua) ? "Mobile" : "Desktop";

      setClientMeta({
        browser,
        os,
        device,
        url: window.location.href,
      });
    }
  }, []);

  // Form states for Ticket Creation
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [description, setDescription] = useState("");

  // Queries
  const { data: tickets = [], isLoading: loadingTickets } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: () => listMySupportTickets(),
  });

  const { data: bugs = [] } = useQuery({
    queryKey: ["my-bugs"],
    queryFn: () => listMyBugReports(),
  });

  const { data: features = [] } = useQuery({
    queryKey: ["feature-requests"],
    queryFn: () => listFeatureRequests(),
  });

  // Ticket Detail Query
  const { data: ticketDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ["ticket-detail", selectedTicketId],
    queryFn: () => (selectedTicketId ? getSupportTicketDetails({ data: { ticketId: selectedTicketId } }) : null),
    enabled: !!selectedTicketId,
  });

  // Ticket creation mutation
  const createTicketMutation = useMutation({
    mutationFn: () =>
      createSupportTicket({
        data: {
          subject,
          category,
          priority,
          description,
          browser_info: { name: clientMeta.browser },
          os_info: { name: clientMeta.os },
          device_type: clientMeta.device,
          current_url: clientMeta.url,
        },
      }),
    onSuccess: (ticket) => {
      toast.success(`Ticket ${ticket.ticket_number} created successfully!`);
      setSubject("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      setTab("tickets");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Reply mutation
  const [replyText, setReplyText] = useState("");
  const replyMutation = useMutation({
    mutationFn: () =>
      replyToTicket({
        data: {
          ticketId: selectedTicketId!,
          message: replyText,
        },
      }),
    onSuccess: () => {
      toast.success("Reply sent");
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["ticket-detail", selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      updateTicketStatus({
        data: {
          ticketId: selectedTicketId!,
          status: newStatus,
        },
      }),
    onSuccess: (_, newStatus) => {
      toast.success(`Ticket status updated to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ["ticket-detail", selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Bug Report Form & Mutation
  const [bugTitle, setBugTitle] = useState("");
  const [bugSteps, setBugSteps] = useState("");
  const [bugSeverity, setBugSeverity] = useState("medium");
  const bugMutation = useMutation({
    mutationFn: () =>
      submitBugReport({
        data: {
          title: bugTitle,
          steps: bugSteps,
          severity: bugSeverity,
          browser: clientMeta.browser,
          device: clientMeta.device,
        },
      }),
    onSuccess: () => {
      toast.success("Bug report submitted to our dev team!");
      setBugTitle("");
      setBugSteps("");
      queryClient.invalidateQueries({ queryKey: ["my-bugs"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Feature Request Form & Mutation
  const [featTitle, setFeatTitle] = useState("");
  const [featDesc, setFeatDesc] = useState("");
  const featMutation = useMutation({
    mutationFn: () =>
      submitFeatureRequest({
        data: {
          title: featTitle,
          description: featDesc,
        },
      }),
    onSuccess: () => {
      toast.success("Feature suggestion submitted!");
      setFeatTitle("");
      setFeatDesc("");
      queryClient.invalidateQueries({ queryKey: ["feature-requests"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Vote Feature Request Mutation
  const voteMutation = useMutation({
    mutationFn: (featureId: string) => toggleVoteFeatureRequest({ data: { featureId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-requests"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const faqs = [
    {
      q: "How do I conduct an AI-guided family history interview?",
      a: "Our AI interviewer asks warm, structured questions about childhood, family lineage, careers, and life lessons. Simply click 'Resume Interview' on your book, speak or type your answers, and the system turns them into polished chapters.",
    },
    {
      q: "Can I add photos to my family history book?",
      a: "Yes! Navigate to your book's Photos section to upload up to 200 high-resolution photos. You can add captions, dates, and assign photos to specific chapters.",
    },
    {
      q: "What export formats are available for printing?",
      a: "You can download a print-ready PDF with professional margins and typesetting, a standard PDF for digital sharing, or a Word (.docx) file for custom editing.",
    },
    {
      q: "Can multiple family members contribute to one book?",
      a: "Yes. You can share your referral or account login with family members so they can answer interview questions or upload heirloom photos.",
    },
    {
      q: "Is my family's private data secure?",
      a: "We use enterprise-grade encryption. Your personal stories and photos are private to your account and are never shared or sold.",
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[color:var(--ink)] sm:text-4xl">
          Help Center & Support Portal
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Submit support tickets, track issues, report bugs, and vote on upcoming features.
        </p>
      </div>

      {/* Main Navigation Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="inline-flex h-11 bg-white p-1 rounded-2xl border border-border/60 shadow-2xs overflow-x-auto max-w-full">
          <TabsTrigger value="tickets" className="rounded-xl px-4 text-xs font-semibold">
            <Ticket className="mr-2 h-3.5 w-3.5" /> My Tickets ({tickets.length})
          </TabsTrigger>
          <TabsTrigger value="create" className="rounded-xl px-4 text-xs font-semibold">
            <Plus className="mr-2 h-3.5 w-3.5" /> Contact Support / Create Ticket
          </TabsTrigger>
          <TabsTrigger value="faqs" className="rounded-xl px-4 text-xs font-semibold">
            <HelpCircle className="mr-2 h-3.5 w-3.5" /> FAQs
          </TabsTrigger>
          <TabsTrigger value="bugs" className="rounded-xl px-4 text-xs font-semibold">
            <Bug className="mr-2 h-3.5 w-3.5" /> Report Bug ({bugs.length})
          </TabsTrigger>
          <TabsTrigger value="features" className="rounded-xl px-4 text-xs font-semibold">
            <Sparkles className="mr-2 h-3.5 w-3.5" /> Feature Requests
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: MY TICKETS LIST */}
        <TabsContent value="tickets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-[color:var(--ink)]">Support Tickets</h2>
            <Button size="sm" onClick={() => setTab("create")} className="rounded-xl bg-[color:var(--primary)] text-white">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New Ticket
            </Button>
          </div>

          {loadingTickets ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <Card className="p-12 text-center rounded-2xl border-dashed">
              <Ticket className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">No support tickets found</h3>
              <p className="mt-1 text-xs text-muted-foreground">Have a question or billing issue? Submit a ticket to our team.</p>
              <Button size="sm" onClick={() => setTab("create")} className="mt-4 rounded-xl">
                Submit Ticket
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <Card
                  key={t.id}
                  className="p-5 rounded-2xl border border-border/60 bg-white shadow-2xs hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedTicketId(t.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">{t.ticket_number}</span>
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
                        <Badge variant="outline" className="capitalize text-[10px]">
                          Priority: {t.priority}
                        </Badge>
                      </div>

                      <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">{t.subject}</h3>
                      <p className="text-xs text-muted-foreground">Category: {t.category.replace("_", " ")}</p>
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1 text-xs text-muted-foreground">
                      <span>Updated {formatDistanceToNow(new Date(t.updated_at), { addSuffix: true })}</span>
                      <span className="text-primary font-semibold hover:underline">View Conversation →</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: CREATE TICKET FORM */}
        <TabsContent value="create">
          <Card className="p-6 space-y-6 rounded-2xl bg-white border-border/60 shadow-2xs">
            <div>
              <h2 className="font-serif text-xl font-semibold text-[color:var(--ink)]">Submit Support Ticket</h2>
              <p className="text-xs text-muted-foreground">Directly contact our dedicated support team inside the app.</p>
            </div>

            {/* Auto Client Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/40 text-xs">
              <span className="font-semibold text-muted-foreground flex items-center gap-1">
                <Laptop className="h-3.5 w-3.5 text-primary" /> Auto Detected Environment:
              </span>
              <Badge variant="outline" className="bg-white text-[10px]">OS: {clientMeta.os}</Badge>
              <Badge variant="outline" className="bg-white text-[10px]">Browser: {clientMeta.browser}</Badge>
              <Badge variant="outline" className="bg-white text-[10px]">Device: {clientMeta.device}</Badge>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTicketMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Issue generating manuscript PDF..."
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="general">General Inquiry</option>
                    <option value="billing">Billing Issue</option>
                    <option value="technical">Technical Issue</option>
                    <option value="book_formatting">Book Formatting</option>
                    <option value="export">PDF / DOCX Download</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                  >
                    <option value="low">Low — General Question</option>
                    <option value="medium">Medium — Standard Support</option>
                    <option value="high">High — Important</option>
                    <option value="urgent">Urgent — Blocking Work</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide complete details so our team can assist you quickly..."
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={createTicketMutation.isPending || !subject.trim() || !description.trim()}
                  className="rounded-xl bg-[color:var(--primary)] text-white"
                >
                  {createTicketMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Submit Ticket
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        {/* TAB 3: FAQS */}
        <TabsContent value="faqs" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search FAQs..."
              className="pl-11 h-12 rounded-2xl border-border/60 bg-white text-sm"
            />
          </div>

          <div className="divide-y divide-border/50 rounded-2xl border border-border/60 bg-white overflow-hidden shadow-2xs">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-muted/30"
                  >
                    <span className="font-serif font-medium text-base text-[color:var(--ink)]">{faq.q}</span>
                    {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-primary" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-muted-foreground leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 4: BUG REPORTS */}
        <TabsContent value="bugs" className="space-y-6">
          <Card className="p-6 space-y-4 rounded-2xl bg-white border-border/60 shadow-2xs">
            <h2 className="font-serif text-xl font-semibold text-[color:var(--ink)]">Report a Software Bug</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                bugMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label>Bug Title</Label>
                <Input value={bugTitle} onChange={(e) => setBugTitle(e.target.value)} placeholder="e.g. Photo upload fails on iOS..." required />
              </div>

              <div className="space-y-1.5">
                <Label>Severity</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={bugSeverity} onChange={(e) => setBugSeverity(e.target.value)}>
                  <option value="low">Low — Minor glitch</option>
                  <option value="medium">Medium — Feature issue</option>
                  <option value="high">High — Important function broken</option>
                  <option value="critical">Critical — App crash</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Steps to Reproduce</Label>
                <Textarea rows={4} value={bugSteps} onChange={(e) => setBugSteps(e.target.value)} placeholder="1. Go to Photos page&#10;2. Click upload&#10;3. Observe error..." required />
              </div>

              <Button type="submit" disabled={bugMutation.isPending} className="rounded-xl bg-destructive text-white">
                {bugMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bug className="mr-2 h-4 w-4" />} Submit Bug Report
              </Button>
            </form>
          </Card>
        </TabsContent>

        {/* TAB 5: FEATURE REQUESTS */}
        <TabsContent value="features" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold text-[color:var(--ink)]">Feature Requests & Ideas</h2>
              <p className="text-xs text-muted-foreground">Upvote feature ideas or suggest your own.</p>
            </div>
          </div>

          <Card className="p-6 rounded-2xl bg-white border-border/60 space-y-4">
            <h3 className="font-serif text-base font-semibold">Suggest a New Feature</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                featMutation.mutate();
              }}
              className="space-y-3"
            >
              <Input value={featTitle} onChange={(e) => setFeatTitle(e.target.value)} placeholder="Feature Title (e.g. Audio Narration)..." required />
              <Textarea rows={3} value={featDesc} onChange={(e) => setFeatDesc(e.target.value)} placeholder="Describe how this feature would help you..." required />
              <Button type="submit" disabled={featMutation.isPending} className="rounded-xl bg-[color:var(--primary)] text-white">
                <Sparkles className="mr-1.5 h-4 w-4" /> Submit Suggestion
              </Button>
            </form>
          </Card>

          <div className="space-y-3">
            {features.map((feat: any) => (
              <Card key={feat.id} className="p-5 rounded-2xl bg-white border-border/60 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif text-base font-semibold text-[color:var(--ink)]">{feat.title}</h4>
                    <Badge variant="outline" className="capitalize text-[10px]">{feat.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>
                </div>

                <Button
                  variant={feat.has_voted ? "default" : "outline"}
                  size="sm"
                  onClick={() => voteMutation.mutate(feat.id)}
                  className={`rounded-xl shrink-0 ${feat.has_voted ? "bg-primary text-white" : ""}`}
                >
                  <ThumbsUp className="mr-1.5 h-3.5 w-3.5" /> {feat.votes}
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* TICKET CONVERSATION DETAIL MODAL */}
      <Dialog open={!!selectedTicketId} onOpenChange={(open) => !open && setSelectedTicketId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6 rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary">{ticketDetails?.ticket?.ticket_number}</span>
              <Badge variant="outline" className="capitalize text-[10px]">{ticketDetails?.ticket?.status}</Badge>
            </div>
            <DialogTitle className="font-serif text-2xl font-semibold mt-1">
              {ticketDetails?.ticket?.subject}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Category: {ticketDetails?.ticket?.category} · Priority: {ticketDetails?.ticket?.priority}
            </DialogDescription>
          </DialogHeader>

          {/* Conversation Messages Thread */}
          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2 my-2 border-y border-border/50">
            {loadingDetails ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              ticketDetails?.messages?.map((msg: any) => {
                const isMe = msg.sender_type === "user";
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                      <span className="font-medium text-foreground">{msg.sender?.full_name ?? (isMe ? "You" : "Support Agent")}</span>
                      <span>· {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                    </div>

                    <div
                      className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                        isMe
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

          {/* Reply Form */}
          {ticketDetails?.ticket?.status === "closed" ? (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">This ticket is closed.</span>
              <Button size="sm" onClick={() => statusMutation.mutate("open")} className="rounded-xl">
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reopen Ticket
              </Button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <Textarea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply to support..."
                className="text-xs"
              />
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => statusMutation.mutate("closed")}
                  className="rounded-xl text-xs"
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" /> Close Ticket
                </Button>

                <Button
                  size="sm"
                  onClick={() => replyMutation.mutate()}
                  disabled={replyMutation.isPending || !replyText.trim()}
                  className="rounded-xl bg-[color:var(--primary)] text-white"
                >
                  {replyMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
                  Send Reply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
