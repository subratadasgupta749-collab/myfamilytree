import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PieChart, Download, FileSpreadsheet, FileText, Calendar, TrendingUp, DollarSign, BookOpen, Users, HelpCircle, Cpu } from "lucide-react";
import { generateAdminReportData } from "@/lib/system.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/table-controls";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics Exports — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminReportsPage,
});

function AdminReportsPage() {
  const [range, setRange] = useState("30d");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-report-full", range],
    queryFn: () => generateAdminReportData(),
  });

  const exportCSV = (type: string) => {
    let content = `Report Type,${type.toUpperCase()}\n`;
    content += `Generated At,${new Date().toISOString()}\n`;
    content += `Total Revenue,$${reports?.revenueTotal ?? 0}\n`;
    content += `Total Books,${reports?.totalBooks ?? 0}\n`;
    content += `Total Orders,${reports?.totalOrders ?? 0}\n`;
    content += `Total Users,${reports?.totalUsers ?? 0}\n`;

    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${type} CSV report downloaded`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <AdminPageHeader
        title="Executive Reports & Data Exports"
        subtitle="Generate detailed analytical reports for Revenue, Books, Orders, Users, Support, and AI usage with CSV download exports."
      />

      {/* Date Range Selector & Quick Export */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-border/60 shadow-2xs">
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-muted-foreground">Report Period:</span>
          <select
            className="h-8 rounded-lg border border-input bg-background px-2 font-medium"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="year">This Year</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => exportCSV("revenue")} className="rounded-xl bg-[color:var(--primary)] text-white">
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Export Revenue CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportCSV("complete")} className="rounded-xl">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export Full System Summary
          </Button>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ReportCard
          icon={DollarSign}
          title="Revenue & Billing Report"
          subtitle="Detailed ledger of gross volume, gateway breakdowns, refunds, and platform net margin."
          metric={`$${(reports?.revenueTotal ?? 0).toLocaleString()}`}
          onExport={() => exportCSV("revenue")}
        />
        <ReportCard
          icon={BookOpen}
          title="Book Manuscript Report"
          subtitle="Compilation statistics, chapter completion rates, and average manuscript length."
          metric={`${reports?.totalBooks ?? 0} Books`}
          onExport={() => exportCSV("books")}
        />
        <ReportCard
          icon={Users}
          title="User Growth Report"
          subtitle="User signups, retention rates, referral shares, and active manuscript writers."
          metric={`${reports?.totalUsers ?? 0} Users`}
          onExport={() => exportCSV("users")}
        />
        <ReportCard
          icon={HelpCircle}
          title="Support Center Report"
          subtitle="Ticket resolution times, user satisfaction, bug report rates, and feature request upvotes."
          metric={`${reports?.totalTickets ?? 0} Tickets`}
          onExport={() => exportCSV("support")}
        />
        <ReportCard
          icon={Cpu}
          title="AI Engine Cost Report"
          subtitle="Token consumption by provider (Gemini vs OpenAI), model efficiency, and cost per book."
          metric={`$${(reports?.aiTotalCost ?? 0).toFixed(2)}`}
          onExport={() => exportCSV("ai-usage")}
        />
      </div>
    </div>
  );
}

function ReportCard({ icon: Icon, title, subtitle, metric, onExport }: any) {
  return (
    <Card className="p-6 rounded-2xl bg-white border-border/60 shadow-2xs flex flex-col justify-between space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-serif text-xl font-bold text-[color:var(--ink)]">{metric}</span>
        </div>

        <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
      </div>

      <div className="pt-3 border-t">
        <Button size="sm" variant="outline" onClick={onExport} className="w-full rounded-xl text-xs">
          <Download className="mr-1.5 h-3.5 w-3.5" /> Download Report CSV
        </Button>
      </div>
    </Card>
  );
}
