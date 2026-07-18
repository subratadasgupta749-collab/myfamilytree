import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { BookOpen, Plus, Clock, CheckCircle2, PenLine } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { listBooks } from "@/lib/books.functions";

const booksQueryOptions = queryOptions({
  queryKey: ["books"],
  queryFn: () => listBooks(),
});

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
  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "there";

  const { data: books = [] } = useQuery(booksQueryOptions);
  const recent = books.slice(0, 3);
  const drafts = books.filter((b) => b.status === "draft").length;
  const inProgress = books.filter((b) => b.status === "in_progress").length;
  const completed = books.filter((b) => b.status === "completed").length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back, {name} 👋</h1>
          <p className="mt-2 text-muted-foreground">
            Continue preserving your family's story.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/books/new">
            <Plus className="mr-2 h-4 w-4" /> New Book
          </Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard icon={PenLine} label="Drafts" value={drafts} />
        <StatCard icon={Clock} label="In progress" value={inProgress} />
        <StatCard icon={CheckCircle2} label="Completed" value={completed} />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent books</h2>
          {books.length > 0 && (
            <Link to="/books" className="text-sm text-primary hover:underline">
              View all
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-background p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-semibold">No books yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first family history book to get started.
            </p>
            <Button asChild className="mt-5">
              <Link to="/books/new">
                <Plus className="mr-2 h-4 w-4" /> Create your first book
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {recent.map((book) => (
              <Link
                key={book.id}
                to="/books/$bookId"
                params={{ bookId: book.id }}
                className="rounded-2xl border border-border/60 bg-background p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="mt-3 truncate font-semibold">{book.name}</h3>
                {book.relationship && (
                  <p className="truncate text-xs text-muted-foreground">{book.relationship}</p>
                )}
                <Progress value={book.progress} className="mt-4 h-1.5" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {book.progress}% ·{" "}
                  {formatDistanceToNow(new Date(book.updated_at), { addSuffix: true })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}
