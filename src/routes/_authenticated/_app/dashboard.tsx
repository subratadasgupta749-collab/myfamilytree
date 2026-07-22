import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Clock,
  CheckCircle2,
  PenLine,
  Download,
  Sparkles,
  Play,
  ArrowRight,
  Copy,
  Check,
  Trash2,
  CopyPlus,
  Eye,
  ShoppingBag,
  Share2,
  History,
  ShieldCheck,
  Mic,
  FileText,
  CreditCard,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { listBooks, duplicateBook, deleteBook } from "@/lib/books.functions";
import { listMyOrders } from "@/lib/orders.functions";
import { listAllMyExports } from "@/lib/exports.functions";
import { getMyReferralCode, listMyReferrals } from "@/lib/referrals.functions";

export const Route = createFileRoute("/_authenticated/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — My Family History Book" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "there";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  // Time-based greeting
  const [greeting, setGreeting] = useState("Welcome back");
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Queries
  const { data: books = [], isLoading: loadingBooks } = useQuery({
    queryKey: ["books"],
    queryFn: () => listBooks(),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => listMyOrders(),
  });

  const { data: exportsData = [] } = useQuery({
    queryKey: ["my-exports-all"],
    queryFn: () => listAllMyExports(),
  });

  const { data: refCodeData } = useQuery({
    queryKey: ["my-referral-code"],
    queryFn: () => getMyReferralCode(),
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ["my-referrals"],
    queryFn: () => listMyReferrals(),
  });

  // Derived statistics
  const totalBooks = books.length;
  const drafts = books.filter((b) => b.status === "draft").length;
  const inProgress = books.filter((b) => b.status === "in_progress").length;
  const completed = books.filter((b) => b.status === "completed").length;
  const totalDownloads = exportsData.length;

  // Active book for "Continue Your Story" hero section
  const incompleteBook = books.find((b) => b.status !== "completed") ?? books[0];
  const latestCompletedBook = books.find((b) => b.status === "completed");

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => duplicateBook({ data: { id } }),
    onSuccess: (copy) => {
      toast.success(`Duplicated "${copy.name}"`);
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBook({ data: { id } }),
    onSuccess: () => {
      toast.success("Book deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleCopyLink = () => {
    if (!refCodeData?.code) return;
    const url = `${window.location.origin}/auth?mode=register&ref=${refCodeData.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopied(false), 3000);
  };

  // Generate dynamic activities
  const activities = [
    ...books.slice(0, 3).map((b) => ({
      id: `book-${b.id}`,
      type: "book",
      title: `Book "${b.name}" updated`,
      time: b.updated_at,
      icon: BookOpen,
    })),
    ...orders.slice(0, 2).map((o) => ({
      id: `order-${o.id}`,
      type: "order",
      title: `Order completed (${o.currency} ${o.amount})`,
      time: o.created_at,
      icon: CreditCard,
    })),
    ...exportsData.slice(0, 2).map((e) => ({
      id: `export-${e.id}`,
      type: "export",
      title: `PDF exported for ${e.book_name}`,
      time: e.created_at,
      icon: Download,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Dashboard Top Header & Quick Actions */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-border/50 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--gold)]/15 px-3 py-1 text-xs font-semibold text-[color:var(--primary)] mb-2">
            <Sparkles className="h-3.5 w-3.5" /> Dashboard Command Center
          </div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[color:var(--ink)] sm:text-4xl">
            {greeting}, {name} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formattedDate} · Preserve your family's precious legacy, one chapter at a time.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button asChild size="default" className="rounded-xl bg-[color:var(--primary)] text-white shadow-sm hover:bg-[color:var(--primary)]/90">
            <Link to="/books/new">
              <Plus className="mr-1.5 h-4 w-4" /> Create New Book
            </Link>
          </Button>

          {incompleteBook && (
            <Button asChild variant="outline" size="default" className="rounded-xl border-primary/30 text-primary hover:bg-primary/5">
              <Link to="/books/$bookId/interview" params={{ bookId: incompleteBook.id }}>
                <Mic className="mr-1.5 h-4 w-4" /> Continue Interview
              </Link>
            </Button>
          )}

          <Button asChild variant="ghost" size="default" className="rounded-xl text-muted-foreground hover:text-foreground">
            <Link to="/books">
              <BookOpen className="mr-1.5 h-4 w-4" /> View All Books
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={BookOpen} label="Total Books" value={totalBooks} color="bg-amber-500/10 text-amber-700" />
        <StatCard icon={PenLine} label="Draft Books" value={drafts} color="bg-blue-500/10 text-blue-700" />
        <StatCard icon={Clock} label="In Progress" value={inProgress} color="bg-purple-500/10 text-purple-700" />
        <StatCard icon={CheckCircle2} label="Completed Books" value={completed} color="bg-emerald-500/10 text-emerald-700" />
        <StatCard icon={Download} label="Downloaded Books" value={totalDownloads} color="bg-indigo-500/10 text-indigo-700" />
      </div>

      {/* Empty State or Main Grid */}
      {totalBooks === 0 && !loadingBooks ? (
        <Card className="rounded-[2.5rem] border border-dashed border-border/80 bg-white p-12 text-center shadow-[var(--shadow-soft)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--gold)]/15 text-[color:var(--primary)] mb-6 shadow-inner">
            <BookOpen className="h-10 w-10" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-[color:var(--ink)]">
            You haven't created your first Family History Book yet.
          </h2>
          <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground leading-relaxed">
            Turn childhood memories, family stories, and photos into a professionally typeset keepsake book that your family will treasure forever.
          </p>
          <Button asChild size="lg" className="mt-8 rounded-full bg-[color:var(--primary)] px-8 text-white shadow-[var(--shadow-soft)] hover:scale-105 transition-transform">
            <Link to="/books/new">
              <Plus className="mr-2 h-5 w-5" /> Create Your First Book
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Column (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* FEATURED CTA: CONTINUE YOUR STORY */}
            {incompleteBook && (
              <div className="relative overflow-hidden rounded-[2.5rem] border border-[color:var(--border)] bg-gradient-to-br from-[color:var(--cream)] via-white to-amber-50/40 p-8 shadow-[var(--shadow-luxury)]">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-gradient-to-br from-[color:var(--primary)]/10 to-amber-500/5 blur-3xl pointer-events-none" />

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--primary)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--primary)]">
                    <Sparkles className="h-3.5 w-3.5" /> Continue Your Story
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Last edited {formatDistanceToNow(new Date(incompleteBook.updated_at), { addSuffix: true })}
                  </span>
                </div>

                <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="space-y-2 max-w-lg">
                    <h3 className="font-serif text-3xl font-semibold text-[color:var(--ink)]">
                      {incompleteBook.name}
                    </h3>
                    {incompleteBook.relationship && (
                      <p className="text-sm text-muted-foreground">
                        For: <span className="font-medium text-foreground">{incompleteBook.relationship}</span>
                      </p>
                    )}

                    <div className="pt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Book Progress</span>
                        <span className="text-[color:var(--primary)] font-bold">{incompleteBook.progress}% Complete</span>
                      </div>
                      <Progress value={incompleteBook.progress} className="h-2.5 rounded-full bg-amber-100/60" />
                    </div>

                    <p className="text-xs text-muted-foreground pt-1">
                      ⏱ Estimated time to complete next chapter: ~10-15 mins
                    </p>
                  </div>

                  <div className="shrink-0">
                    <Button
                      asChild
                      size="lg"
                      className="h-14 rounded-2xl bg-[color:var(--primary)] px-8 text-base font-semibold text-white shadow-md transition-all hover:scale-105 hover:bg-[color:var(--primary)]/90"
                    >
                      <Link to="/books/$bookId/interview" params={{ bookId: incompleteBook.id }}>
                        Resume Interview <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* RECENT BOOKS GRID */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-semibold text-[color:var(--ink)]">Recent Books</h2>
                <Link to="/books" className="text-sm font-medium text-[color:var(--primary)] hover:underline flex items-center gap-1">
                  View all books ({books.length}) →
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {books.slice(0, 4).map((b) => (
                  <Card
                    key={b.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-white p-5 shadow-2xs transition-all duration-300 hover:shadow-md hover:border-primary/30"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color:var(--gold)]/15 text-[color:var(--primary)]">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <Badge
                          variant="secondary"
                          className={`capitalize text-[10px] font-semibold ${
                            b.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : b.status === "in_progress"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {b.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <h3 className="mt-4 truncate font-serif text-xl font-semibold text-[color:var(--ink)] group-hover:text-[color:var(--primary)] transition-colors">
                        {b.name}
                      </h3>
                      {b.relationship && (
                        <p className="mt-0.5 text-xs text-muted-foreground">Relationship: {b.relationship}</p>
                      )}

                      <div className="mt-4 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                          <span>Progress</span>
                          <span>{b.progress}%</span>
                        </div>
                        <Progress value={b.progress} className="h-1.5" />
                      </div>
                    </div>

                    <div className="mt-6 border-t border-border/40 pt-4 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(b.updated_at), { addSuffix: true })}
                      </span>

                      <div className="flex items-center gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="Resume/Edit"
                        >
                          <Link to="/books/$bookId/interview" params={{ bookId: b.id }}>
                            <Play className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="Preview"
                        >
                          <Link to="/books/$bookId/preview" params={{ bookId: b.id }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="Duplicate"
                          onClick={() => duplicateMutation.mutate(b.id)}
                          disabled={duplicateMutation.isPending}
                        >
                          <CopyPlus className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Delete"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${b.name}"?`)) {
                              deleteMutation.mutate(b.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* RECENT ACTIVITY TIMELINE */}
            <Card className="p-6 rounded-2xl space-y-4 bg-white border-border/60">
              <div className="flex items-center gap-2 border-b pb-3">
                <History className="h-4 w-4 text-[color:var(--primary)]" />
                <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">Recent Activity Timeline</h3>
              </div>

              {activities.length === 0 ? (
                <p className="text-xs text-muted-foreground">No recent activity logged yet.</p>
              ) : (
                <div className="relative pl-6 space-y-4 border-l-2 border-primary/20">
                  {activities.map((act) => (
                    <div key={act.id} className="relative group">
                      <div className="absolute -left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-primary/30 text-primary shadow-2xs">
                        <act.icon className="h-3 w-3" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[color:var(--ink)]">{act.title}</span>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(act.time), { addSuffix: true })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar Widgets */}
          <div className="space-y-6">
            {/* ORDERS SUMMARY WIDGET */}
            <Card className="p-6 rounded-2xl space-y-4 bg-white border-border/60">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-[color:var(--primary)]" />
                  <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">Recent Orders</h3>
                </div>
                <Link to="/orders" className="text-xs text-primary hover:underline">View all</Link>
              </div>

              {orders.length === 0 ? (
                <p className="text-xs text-muted-foreground">No completed orders yet.</p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 3).map((ord) => (
                    <div key={ord.id} className="flex items-center justify-between text-xs border-b border-border/30 pb-2.5 last:border-0 last:pb-0">
                      <div>
                        <div className="font-medium text-foreground truncate max-w-[140px]">{ord.description}</div>
                        <div className="text-[10px] text-muted-foreground">{new Date(ord.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[color:var(--ink)]">{ord.currency} {ord.amount.toFixed(2)}</div>
                        <Badge variant="outline" className="text-[9px] capitalize py-0">{ord.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* DOWNLOADS SUMMARY WIDGET */}
            <Card className="p-6 rounded-2xl space-y-4 bg-white border-border/60">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-[color:var(--primary)]" />
                  <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">Downloads</h3>
                </div>
                <Link to="/downloads" className="text-xs text-primary hover:underline">View all</Link>
              </div>

              {exportsData.length === 0 ? (
                <p className="text-xs text-muted-foreground">No export files generated yet. Complete your book to export PDF.</p>
              ) : (
                <div className="space-y-2.5">
                  {exportsData.slice(0, 3).map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between text-xs border-b border-border/30 pb-2 last:border-0">
                      <div className="flex items-center gap-2 truncate max-w-[160px]">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate font-medium">{exp.filename}</span>
                      </div>
                      {exp.url ? (
                        <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary">
                          <a href={exp.url} download target="_blank" rel="noreferrer">Download</a>
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Expired</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* REFERRAL SUMMARY WIDGET */}
            <Card className="p-6 rounded-2xl space-y-4 bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-amber-200/60">
              <div className="flex items-center gap-2 text-[color:var(--primary)]">
                <Share2 className="h-4 w-4" />
                <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">Invite Family & Friends</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Share your referral link with loved ones to preserve their stories too.
              </p>

              <div className="flex items-center justify-between text-xs border-y border-amber-200/50 py-2">
                <span className="text-muted-foreground">Friends Joined:</span>
                <span className="font-bold text-[color:var(--primary)] text-sm">{referrals.length}</span>
              </div>

              <Button onClick={handleCopyLink} size="sm" className="w-full rounded-xl bg-[color:var(--primary)] text-white">
                {copied ? <><Check className="mr-1.5 h-3.5 w-3.5" /> Copied!</> : <><Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Referral Link</>}
              </Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="p-5 rounded-2xl border border-border/60 bg-white shadow-2xs transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
      <div className="flex items-center gap-3.5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5.5 w-5.5" />
        </div>
        <div>
          <div className="text-2xl font-bold font-serif text-[color:var(--ink)]">{value}</div>
          <div className="text-xs text-muted-foreground font-medium">{label}</div>
        </div>
      </div>
    </Card>
  );
}
