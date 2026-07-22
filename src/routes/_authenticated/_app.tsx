import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Outlet } from "@tanstack/react-router";
import {
  BookHeart,
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  ShoppingBag,
  Download,
  Gift,
  Bell,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/_app")({
  component: AppShell,
});

function AppShell() {
  return (
    <DashboardChrome>
      <Outlet />
    </DashboardChrome>
  );
}

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/books", label: "My Books", icon: BookOpen },
  { to: "/books/new", label: "Create New Book", icon: PlusCircle, highlight: true },
  { to: "/orders", label: "Orders", icon: ShoppingBag },
  { to: "/downloads", label: "Downloads", icon: Download },
  { to: "/referrals", label: "Referrals", icon: Gift },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help Center", icon: HelpCircle },
] as const;

function DashboardChrome({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Member";
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
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen bg-[color:var(--cream)]/30 text-foreground font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border/50 bg-white/80 backdrop-blur-md md:flex md:flex-col">
        <div className="flex h-20 items-center justify-between border-b border-border/40 px-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--primary)] to-amber-800 text-white shadow-sm transition-transform group-hover:scale-105">
              <BookHeart className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-base font-semibold tracking-tight text-[color:var(--ink)] leading-none">Family Book</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Keeper of Stories</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {nav.map((n) => {
            const active = pathname === n.to;
            const isHighlight = (n as any).highlight;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isHighlight
                    ? "bg-[color:var(--primary)] text-white shadow-sm hover:bg-[color:var(--primary)]/90"
                    : active
                    ? "bg-[color:var(--gold)]/15 text-[color:var(--primary)] font-semibold shadow-2xs"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <n.icon className={`h-4 w-4 ${isHighlight ? "text-white" : active ? "text-[color:var(--primary)]" : "text-muted-foreground"}`} />
                  <span>{n.label}</span>
                </div>
                {active && !isHighlight && (
                  <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--primary)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/50 p-4 space-y-3 bg-gradient-to-b from-transparent to-[color:var(--cream)]/40">
          <div className="flex items-center gap-3 px-2 py-1">
            <Avatar className="h-9 w-9 border border-primary/20 shadow-2xs">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
              <AvatarFallback className="bg-[color:var(--primary)]/10 text-[color:var(--primary)] text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-[color:var(--ink)] truncate">{name}</span>
              <span className="text-[11px] text-muted-foreground truncate">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-white px-3 py-2 text-xs font-medium text-muted-foreground shadow-2xs transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Dashboard Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border/50 bg-white/90 backdrop-blur-md px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 text-muted-foreground transition hover:bg-accent md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[color:var(--primary)]">{greeting}, {name}</span>
                <span className="text-xs">👋</span>
              </div>
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
            </div>
            <Link to="/" className="sm:hidden font-serif font-semibold text-lg text-[color:var(--ink)] flex items-center gap-2">
              <BookHeart className="h-5 w-5 text-primary" /> Family Book
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition hover:bg-accent hover:text-foreground"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[color:var(--primary)] ring-2 ring-white" />
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-2.5 rounded-full border border-border/60 bg-background p-1 pr-3 shadow-2xs hover:bg-accent/50 transition"
            >
              <Avatar className="h-7 w-7 border border-primary/20">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                <AvatarFallback className="bg-[color:var(--primary)]/10 text-[color:var(--primary)] text-[10px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline-block text-xs font-medium text-[color:var(--ink)] truncate max-w-[120px]">{name}</span>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden" onClick={() => setMobileOpen(false)}>
            <div
              className="fixed inset-y-0 left-0 w-72 bg-white p-6 shadow-2xl flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-2">
                    <BookHeart className="h-6 w-6 text-primary" />
                    <span className="font-serif text-lg font-semibold">Family Book</span>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="text-muted-foreground p-1">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav className="mt-6 space-y-1.5">
                  {nav.map((n) => {
                    const active = pathname === n.to;
                    const isHighlight = (n as any).highlight;
                    return (
                      <Link
                        key={n.to}
                        to={n.to}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                          isHighlight
                            ? "bg-[color:var(--primary)] text-white shadow-sm"
                            : active
                            ? "bg-[color:var(--gold)]/15 text-[color:var(--primary)] font-semibold"
                            : "text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        <n.icon className="h-4 w-4" />
                        {n.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                    <AvatarFallback className="bg-[color:var(--primary)]/10 text-[color:var(--primary)] font-semibold text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-semibold text-foreground truncate">{name}</span>
                    <span className="text-[11px] text-muted-foreground truncate">{user?.email}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setMobileOpen(false); signOut(); }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
