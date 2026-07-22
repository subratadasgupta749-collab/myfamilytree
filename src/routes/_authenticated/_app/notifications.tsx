import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, Check, BookOpen, ShoppingBag, Sparkles, AlertCircle, Trash2 } from "lucide-react";
import { listBooks } from "@/lib/books.functions";
import { listMyOrders } from "@/lib/orders.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — My Family History Book" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
});

interface NotificationItem {
  id: string;
  type: "book_ready" | "payment_success" | "interview_reminder" | "announcement";
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

function NotificationsPage() {
  const { data: books = [] } = useQuery({ queryKey: ["books"], queryFn: () => listBooks() });
  const { data: orders = [] } = useQuery({ queryKey: ["my-orders"], queryFn: () => listMyOrders() });

  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Generate notifications from system events
  const systemNotifications: NotificationItem[] = [
    {
      id: "announcement-welcome",
      type: "announcement",
      title: "Welcome to My Family History Book!",
      message: "Start interviewing your family members or uploading photos to create a printable legacy book.",
      time: new Date().toISOString(),
      read: false,
      link: "/books/new",
    },
    ...books
      .filter((b) => b.progress >= 80)
      .map((b) => ({
        id: `notif-book-${b.id}`,
        type: "book_ready" as const,
        title: `Book "${b.name}" is ready for preview!`,
        message: `Your manuscript is ${b.progress}% compiled. You can now preview the chapters and layout.`,
        time: b.updated_at,
        read: false,
        link: `/books/${b.id}/preview`,
      })),
    ...orders.map((o) => ({
      id: `notif-order-${o.id}`,
      type: "payment_success" as const,
      title: `Payment Successful (${o.currency} ${o.amount})`,
      message: `Your order "${o.description}" has been processed successfully.`,
      time: o.created_at,
      read: false,
      link: "/orders",
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const items = systemNotifications.map((item) => ({
    ...item,
    read: item.read || readIds.has(item.id),
  }));

  const markAllRead = () => {
    setReadIds(new Set(items.map((i) => i.id)));
    toast.success("All notifications marked as read");
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "book_ready":
        return <BookOpen className="h-4 w-4 text-emerald-600" />;
      case "payment_success":
        return <ShoppingBag className="h-4 w-4 text-blue-600" />;
      case "interview_reminder":
        return <Sparkles className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-amber-600" />;
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[color:var(--ink)] sm:text-4xl">
            Notifications Center
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Stay updated with book progress, payment receipts, and announcements.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={markAllRead} className="rounded-xl">
          <Check className="mr-1.5 h-3.5 w-3.5" /> Mark All as Read
        </Button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl border-dashed">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-serif text-lg font-semibold text-[color:var(--ink)]">No notifications</h3>
            <p className="mt-1 text-xs text-muted-foreground">You are all caught up!</p>
          </Card>
        ) : (
          items.map((item) => (
            <Card
              key={item.id}
              className={`p-5 rounded-2xl border transition-all ${
                item.read ? "bg-white border-border/60 opacity-80" : "bg-amber-50/20 border-primary/30 shadow-2xs"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-border/60 shadow-2xs">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-sm text-[color:var(--ink)]">{item.title}</h3>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(item.time).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.message}</p>

                  {item.link && (
                    <div className="pt-2">
                      <Button asChild size="sm" variant="link" className="h-auto p-0 text-xs text-primary font-semibold">
                        <Link to={item.link as any}>View details →</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
