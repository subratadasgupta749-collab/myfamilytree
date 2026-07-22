import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  ShoppingBag,
  BookOpen,
  Users,
  HardDriveDownload,
  HelpCircle,
  Bug,
  Sparkles,
  Cpu,
  CreditCard,
  TrendingUp,
  Shield,
  Activity,
} from "lucide-react";
import { getOverview } from "@/lib/admin.functions";
import { generateAdminReportData, getAdminDashboardStreams } from "@/lib/system.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/_admin/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Command Center — My Family History Book" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboardIndex,
});

function AdminDashboardIndex() {
  const { data: stats } = useQuery({
    queryKey: ["admin-overview-stats"],
    queryFn: () => getOverview(),
  });

  const { data: reports } = useQuery({
    queryKey: ["admin-report-summary"],
    queryFn: () => generateAdminReportData(),
  });

  const { data: streams } = useQuery({
    queryKey: ["admin-dashboard-streams"],
    queryFn: () => getAdminDashboardStreams(),
  });

  const totalRevenue = reports?.revenueTotal ?? stats?.revenue?.total ?? 0;
  const currencySymbol = stats?.revenue?.currency === "INR" ? "₹" : "$";

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[color:var(--ink)] sm:text-4xl">
            Admin Command Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time platform status, revenue, user activity, and system health.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" className="rounded-xl bg-[color:var(--primary)] text-white">
            <Link to="/admin/support">
              <HelpCircle className="mr-1.5 h-3.5 w-3.5" /> Support Tickets
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-xl">
            <Link to="/admin/reports">
              <TrendingUp className="mr-1.5 h-3.5 w-3.5" /> Reports & Analytics
            </Link>
          </Button>
        </div>
      </div>

      {/* METRIC CARDS GRID (11 Key SaaS Metrics - All Dynamic) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={DollarSign}
          label="Total Revenue"
          value={`${currencySymbol}${totalRevenue.toLocaleString()}`}
          change="Real-time gross revenue"
          color="bg-emerald-100 text-emerald-800"
        />
        <MetricCard
          icon={ShoppingBag}
          label="Orders Processed"
          value={reports?.totalOrders ?? stats?.counts?.orders ?? 0}
          change="Total platform transactions"
          color="bg-blue-100 text-blue-800"
        />
        <MetricCard
          icon={BookOpen}
          label="Family Books"
          value={reports?.totalBooks ?? stats?.counts?.books ?? 0}
          change="Active manuscripts"
          color="bg-amber-100 text-amber-800"
        />
        <MetricCard
          icon={Users}
          label="Registered Users"
          value={reports?.totalUsers ?? stats?.counts?.users ?? 0}
          change="Total user accounts"
          color="bg-purple-100 text-purple-800"
        />

        <MetricCard
          icon={HardDriveDownload}
          label="Downloads"
          value={reports?.downloadsCount ?? 0}
          change="Exported manuscripts"
          color="bg-slate-100 text-slate-800"
        />
        <MetricCard
          icon={HelpCircle}
          label="Support Tickets"
          value={reports?.totalTickets ?? 0}
          change="Active customer tickets"
          color="bg-orange-100 text-orange-800"
        />
        <MetricCard
          icon={Bug}
          label="Bug Reports"
          value={reports?.bugReportsCount ?? 0}
          change="Reported system bugs"
          color="bg-red-100 text-red-800"
        />
        <MetricCard
          icon={Sparkles}
          label="Feature Requests"
          value={reports?.featureRequestsCount ?? 0}
          change="Community suggestions"
          color="bg-indigo-100 text-indigo-800"
        />
      </div>

      {/* SECONDARY SYSTEM STATUS BAR */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 rounded-2xl bg-white border-border/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">AI Usage & Cost</div>
                <div className="text-xs text-muted-foreground">Gemini + OpenAI Engine</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-sm text-[color:var(--ink)]">
                {reports?.aiRequests ?? 0} calls
              </div>
              <div className="text-[11px] text-muted-foreground">
                ${(reports?.aiTotalCost ?? 0).toFixed(2)} spent
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl bg-white border-border/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Payment Gateways</div>
                <div className="text-xs text-muted-foreground">Stripe & PayPal</div>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 text-[10px]">
              Active
            </Badge>
          </div>
        </Card>

        <Card className="p-5 rounded-2xl bg-white border-border/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-800">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">System Security</div>
                <div className="text-xs text-muted-foreground">Encryption & RLS</div>
              </div>
            </div>
            <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50 text-[10px]">
              Protected
            </Badge>
          </div>
        </Card>
      </div>

      {/* RECENT ACTIVITY & LOGINS STREAMS */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stream 1: Recent Activity Stream */}
        <Card className="p-6 rounded-2xl bg-white border-border/60 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">Latest Admin Activity</h3>
            <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
              <Link to="/admin/activity-logs">View Audit Logs →</Link>
            </Button>
          </div>

          <div className="space-y-3">
            {!streams?.activities || streams.activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                No recent admin activity logged yet.
              </div>
            ) : (
              streams.activities.map((act: any) => (
                <div key={act.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0 text-xs">
                  <div>
                    <div className="font-semibold text-foreground">{act.action}</div>
                    <div className="text-muted-foreground">{act.resource_type}</div>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Stream 2: Recent Transactions */}
        <Card className="p-6 rounded-2xl bg-white border-border/60 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">Recent Transactions</h3>
            <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
              <Link to="/admin/orders">View All Orders →</Link>
            </Button>
          </div>

          <div className="space-y-3">
            {!streams?.transactions || streams.transactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                No payment transactions recorded yet.
              </div>
            ) : (
              streams.transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0 text-xs">
                  <div>
                    <div className="font-semibold text-foreground">{tx.user?.full_name ?? tx.user?.email ?? "Customer"}</div>
                    <div className="text-muted-foreground">{tx.currency} {tx.amount}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, change, color }: any) {
  return (
    <Card className="p-5 rounded-2xl bg-white border-border/60 shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2 text-2xl font-bold font-serif text-[color:var(--ink)]">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{change}</div>
    </Card>
  );
}
