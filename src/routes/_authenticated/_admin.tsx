import { createFileRoute, Outlet, redirect, Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield,
  LogOut,
  CreditCard,
  FileText,
  Users,
  BookOpen,
  ShoppingBag,
  Mail,
  Settings,
  BarChart3,
  Sparkles,
  MessageSquare,
  Activity,
  Send,
  Inbox,
  Tag,
  Gift,
  Trash2,
  Layers,
  GitBranch,
  HeartPulse,
  DollarSign,
  Gauge,
  ScrollText,
  Gem,
  HelpCircle,
  ImageIcon,
  Key,
  Globe,
  Radio,
  Sliders,
  HardDriveDownload,
  Search,
  Bell,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  PieChart,
  HardDrive,
  Cpu,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/_admin")({
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/auth" });
    const { data, error } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (error || !data) throw redirect({ to: "/dashboard" });
  },
  component: AdminShell,
});

interface NavGroup {
  group: string;
  items: { to: string; label: string; icon: any; badge?: string }[];
}

const navGroups: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", icon: Shield },
      { to: "/admin/analytics", label: "Analytics", icon: Gauge },
      { to: "/admin/reports", label: "Reports", icon: PieChart },
    ],
  },
  {
    group: "Operations",
    items: [
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/books", label: "Books", icon: BookOpen },
      { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { to: "/admin/downloads", label: "Downloads", icon: HardDriveDownload },
    ],
  },
  {
    group: "Support & Content",
    items: [
      { to: "/admin/support", label: "Support Center", icon: HelpCircle, badge: "Live" },
      { to: "/admin/blog", label: "Blog CMS", icon: FileText },
      { to: "/admin/media", label: "Media Library", icon: ImageIcon },
    ],
  },
  {
    group: "AI & Integrations",
    items: [
      { to: "/admin/ai", label: "AI Center", icon: Cpu, badge: "v2" },
      { to: "/admin/payment-gateways", label: "Payment Center", icon: CreditCard },
      { to: "/admin/api-manager", label: "API Manager", icon: Key },
      { to: "/admin/email-center", label: "Email Center", icon: Mail },
    ],
  },
  {
    group: "Marketing & Growth",
    items: [
      { to: "/admin/plans", label: "Pricing Plans", icon: Gem },
      { to: "/admin/coupons", label: "Coupons", icon: Tag },
      { to: "/admin/referrals", label: "Referrals", icon: Gift },
      { to: "/admin/seo", label: "SEO Manager", icon: Globe },
    ],
  },
  {
    group: "System & Governance",
    items: [
      { to: "/admin/feature-manager", label: "Feature Manager", icon: Sliders },
      { to: "/admin/system-logs", label: "System Logs", icon: ScrollText },
      { to: "/admin/activity-logs", label: "Activity Logs", icon: Activity },
      { to: "/admin/backup", label: "Backup & Restore", icon: HardDrive },
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

function AdminShell() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { user, signOut } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const allNavItems = navGroups.flatMap((g) => g.items);
  const filteredSearch = allNavItems.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.to.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[color:var(--cream)] text-[color:var(--ink)]">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-white/90 backdrop-blur-md lg:block">
        <div className="flex h-full flex-col justify-between p-4">
          <div className="space-y-6">
            {/* Brand Logo Header */}
            <div className="flex items-center gap-2.5 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--primary)] text-white shadow-2xs font-serif font-bold text-sm">
                MFH
              </div>
              <div>
                <span className="font-serif text-base font-bold tracking-tight text-[color:var(--ink)]">
                  Enterprise Console
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Systems Normal
                </div>
              </div>
            </div>

            {/* Categorized Nav Links */}
            <div className="space-y-5 overflow-y-auto max-h-[calc(100vh-160px)] pr-1">
              {navGroups.map((group) => (
                <div key={group.group} className="space-y-1">
                  <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    {group.group}
                  </div>
                  {group.items.map((item) => {
                    const active =
                      item.to === "/admin"
                        ? currentPath === "/admin"
                        : currentPath.startsWith(item.to);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.to}
                        to={item.to as any}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                          active
                            ? "bg-[color:var(--primary)] text-white shadow-2xs font-semibold"
                            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                              active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* User & Logout */}
          <div className="border-t border-border/60 pt-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-xs truncate">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
                  A
                </div>
                <div className="truncate">
                  <div className="font-semibold text-xs truncate">{user?.email?.split("@")[0]}</div>
                  <div className="text-[10px] text-muted-foreground">Administrator</div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* TOP HEADER BAR */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-white/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen((p) => !p)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Global Search Bar */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors w-48 sm:w-72"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Search admin...</span>
              <kbd className="hidden sm:inline-block ml-auto rounded bg-white px-1.5 py-0.5 text-[10px] border border-border font-mono">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Operational Status */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5" /> All Systems Online
            </div>

            {/* Notification Bell */}
            <Button variant="outline" size="icon" className="relative h-9 w-9 rounded-xl">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                3
              </span>
            </Button>
          </div>
        </header>

        {/* PAGE CONTENT ROUTER OUTLET */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* GLOBAL COMMAND SEARCH MODAL */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-xl p-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Admin Quick Navigation</DialogTitle>
          </DialogHeader>
          <div className="relative my-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search modules, users, or settings..."
              className="pl-9 h-11 text-xs"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredSearch.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to as any}
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/40 text-xs font-medium transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{item.label}</span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">{item.to}</span>
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
