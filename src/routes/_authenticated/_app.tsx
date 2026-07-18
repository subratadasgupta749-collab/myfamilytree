import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Outlet } from "@tanstack/react-router";
import { BookHeart, LayoutDashboard, BookOpen, User as UserIcon, LogOut, Receipt, Gift } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

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
  { to: "/orders", label: "Orders", icon: Receipt },
  { to: "/referrals", label: "Referrals", icon: Gift },
  { to: "/profile", label: "Profile", icon: UserIcon },
] as const;

function DashboardChrome({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-background md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border/60 px-5 font-semibold">
          <BookHeart className="h-5 w-5 text-primary" />
          <span className="text-sm">Family Book</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/60 p-3">
          <div className="mb-2 px-3 text-xs text-muted-foreground truncate">{user?.email}</div>
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border/60 bg-background px-4 md:px-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to site
          </Link>
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={() => signOut()} className="text-sm text-muted-foreground">
              Sign out
            </button>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-8">{children}</div>

        <nav className="flex items-center justify-around border-t border-border/60 bg-background py-2 md:hidden">
          {nav.map((n) => {
            const active = pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-col items-center gap-1 px-3 py-1 text-xs ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
