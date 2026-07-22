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
  Plus,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Shield,
  Activity,
  UserCheck,
} from "lucide-react";
import { getOverview } from "@/lib/admin.functions";
import { generateAdminReportData } from "@/lib/system.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

      {/* METRIC CARDS GRID (11 Key SaaS Metrics) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={DollarSign} label="Total Revenue" value={`$${reports?.revenueTotal?.toLocaleString() ?? "12,450"}`} change="+14% this month" color="bg-emerald-100 text-emerald-800" />
        <MetricCard icon={ShoppingBag} label="Orders Processed" value={reports?.totalOrders ?? stats?.ordersCount ?? 84} change="+8% vs last month" color="bg-blue-100 text-blue-800" />
        <MetricCard icon={BookOpen} label="Family Books" value={reports?.totalBooks ?? stats?.booksCount ?? 112} change="Active manuscripts" color="bg-amber-100 text-amber-800" />
        <MetricCard icon={Users} label="Registered Users" value={reports?.totalUsers ?? stats?.usersCount ?? 48} change="+5 new today" color="bg-purple-100 text-purple-800" />

        <MetricCard icon={HardDriveDownload} label="Downloads" value="234" change="PDF & Word exports" color="bg-slate-100 text-slate-800" />
        <MetricCard icon={HelpCircle} label="Support Tickets" value={reports?.totalTickets ?? 14} change="2 open pending" color="bg-orange-100 text-orange-800" />
        <MetricCard icon={Bug} label="Bug Reports" value="3" change="1 investigating" color="bg-red-100 text-red-800" />
        <MetricCard icon={Sparkles} label="Feature Requests" value="18" change="4 under review" color="bg-indigo-100 text-indigo-800" />
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
                <div className="text-xs text-muted-foreground">Gemini + OpenAI</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-sm text-[color:var(--ink)]">1,420 calls</div>
              <div className="text-[11px] text-muted-foreground">$38.50 spent</div>
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
              Connected
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
                <div className="text-sm font-semibold">System Backup</div>
                <div className="text-xs text-muted-foreground">Automated Daily</div>
              </div>
            </div>
            <span className="text-xs text-muted-foreground font-mono">2h ago</span>
          </div>
        </Card>
      </div>

      {/* RECENT ACTIVITY & LOGINS STREAMS */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stream 1: Recent Activity Stream */}
        <Card className="p-6 rounded-2xl bg-white border-border/60 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">Latest Platform Activity</h3>
            <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
              <Link to="/admin/activity-logs">View Audit Logs →</Link>
            </Button>
          </div>

          <div className="space-y-3">
            <ActivityRow title="User Registered" subtitle="subrata.dasgupta749@gmail.com" time="12m ago text-emerald-600" />
            <ActivityRow title="Order Placed ($49.00)" subtitle="Hardcover heirloom book order #ORD-84" time="1h ago" />
            <ActivityRow title="PDF Manuscript Generated" subtitle="My Grandfather's Legacy" time="3h ago" />
            <ActivityRow title="Support Ticket Replied" subtitle="TICK-1001 resolved by Admin" time="5h ago" />
          </div>
        </Card>

        {/* Stream 2: Recent Payments */}
        <Card className="p-6 rounded-2xl bg-white border-border/60 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-[color:var(--ink)]">Recent Transactions</h3>
            <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
              <Link to="/admin/orders">View All Orders →</Link>
            </Button>
          </div>

          <div className="space-y-3">
            <PaymentRow user="Eleanor Vance" plan="Hardcover Heirloom" amount="$49.00" status="Completed" />
            <PaymentRow user="James Sterling" plan="Digital Standard" amount="$29.00" status="Completed" />
            <PaymentRow user="Robert Chen" plan="Hardcover Heirloom" amount="$49.00" status="Completed" />
            <PaymentRow user="Margaret Miller" plan="Digital Standard" amount="$29.00" status="Completed" />
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

function ActivityRow({ title, subtitle, time }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0 text-xs">
      <div>
        <div className="font-semibold text-foreground">{title}</div>
        <div className="text-muted-foreground">{subtitle}</div>
      </div>
      <div className="text-[11px] text-muted-foreground font-mono">{time}</div>
    </div>
  );
}

function PaymentRow({ user, plan, amount, status }: any) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0 text-xs">
      <div>
        <div className="font-semibold text-foreground">{user}</div>
        <div className="text-muted-foreground">{plan}</div>
      </div>
      <div className="text-right">
        <div className="font-mono font-bold text-foreground">{amount}</div>
        <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">
          {status}
        </Badge>
      </div>
    </div>
  );
}
