import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText, FileType, Printer, Loader2, Trash2, Pencil } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getManuscript, BOOK_THEMES, type BookThemeId } from "@/lib/manuscript.functions";
import { getBook } from "@/lib/books.functions";
import { generateExport, listExports, deleteExport } from "@/lib/exports.functions";
import { listPhotos, type PhotoCategory } from "@/lib/photos.functions";

const bookQ = (id: string) =>
  queryOptions({ queryKey: ["books", id], queryFn: () => getBook({ data: { id } }) });
const manuscriptQ = (id: string) =>
  queryOptions({ queryKey: ["manuscript", id], queryFn: () => getManuscript({ data: { bookId: id } }) });
const exportsQ = (id: string) =>
  queryOptions({ queryKey: ["exports", id], queryFn: () => listExports({ data: { bookId: id } }) });
const photosQ = (id: string) =>
  queryOptions({ queryKey: ["photos", id], queryFn: () => listPhotos({ data: { bookId: id } }) });

// Map interview chapter topics to photo categories
const TOPIC_TO_CATEGORY: Record<string, PhotoCategory> = {
  childhood: "baby",
  school: "school",
  love: "wedding",
  marriage: "wedding",
  children: "family",
  family: "family",
  job: "career",
  career: "career",
  achievements: "career",
  challenges: "family",
  retirement: "retirement",
  advice: "family",
};


export const Route = createFileRoute("/_authenticated/_app/books/$bookId/preview")({
  head: () => ({
    meta: [
      { title: "Preview — My Family History Book" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PreviewPage,
});

type Theme = {
  page: string;
  title: string;
  heading: string;
  body: string;
  accent: string;
  muted: string;
  rule: string;
  chip: string;
};

const themeStyles: Record<BookThemeId, Theme> = {
  classic: {
    page: "bg-[#FFF8F2] text-[#222]",
    title: "font-serif text-[#8B5E3C]",
    heading: "font-serif text-[#8B5E3C]",
    body: "font-serif text-[#333]",
    accent: "text-[#D4AF37]",
    muted: "text-[#6b5b48]",
    rule: "bg-[#D4AF37]/40",
    chip: "bg-[#8B5E3C]/10 text-[#8B5E3C]",
  },
  vintage: {
    page: "bg-[#FAEDD8] text-[#3d2513]",
    title: "font-serif text-[#7a3d1a]",
    heading: "font-serif text-[#7a3d1a]",
    body: "font-serif text-[#3d2513]",
    accent: "text-[#a05a20]",
    muted: "text-[#7a5a3e]",
    rule: "bg-[#a05a20]/50",
    chip: "bg-[#7a3d1a]/10 text-[#7a3d1a]",
  },
  modern: {
    page: "bg-white text-neutral-900",
    title: "font-sans text-neutral-900 tracking-tight",
    heading: "font-sans text-neutral-900 tracking-tight",
    body: "font-sans text-neutral-800",
    accent: "text-neutral-600",
    muted: "text-neutral-500",
    rule: "bg-neutral-300",
    chip: "bg-neutral-100 text-neutral-700",
  },
  leather_journal: {
    page: "bg-[#F5E6CC] text-[#331e0f]",
    title: "font-serif text-[#5b3319]",
    heading: "font-serif text-[#5b3319]",
    body: "font-serif text-[#3f2412]",
    accent: "text-[#7a4322]",
    muted: "text-[#6b4b2f]",
    rule: "bg-[#5b3319]/40",
    chip: "bg-[#5b3319]/10 text-[#5b3319]",
  },
  family_album: {
    page: "bg-[#FFFCF6] text-[#212530]",
    title: "font-serif text-[#212530]",
    heading: "font-serif text-[#212530]",
    body: "font-sans text-[#2b2f3a]",
    accent: "text-[#D4AF37]",
    muted: "text-[#666a75]",
    rule: "bg-[#D4AF37]/60",
    chip: "bg-[#D4AF37]/15 text-[#8a6b12]",
  },
  timeline_split: {
    page: "bg-[#FAF6F2] text-[#222]",
    title: "font-serif text-[#8B5E3C]",
    heading: "font-serif text-[#8B5E3C]",
    body: "font-serif text-[#333]",
    accent: "text-[#D4AF37]",
    muted: "text-[#7a6a58]",
    rule: "bg-[#8B5E3C]/40",
    chip: "bg-[#8B5E3C]/10 text-[#8B5E3C]",
  },
};

function PreviewPage() {
  const { bookId } = Route.useParams();
  const queryClient = useQueryClient();

  const bookQuery = useQuery(bookQ(bookId));
  const manuscriptQuery = useQuery(manuscriptQ(bookId));
  const exportsQuery = useQuery(exportsQ(bookId));
  const photosQuery = useQuery(photosQ(bookId));

  const generateFn = useServerFn(generateExport);
  const deleteFn = useServerFn(deleteExport);

  const genMutation = useMutation({
    mutationFn: (kind: "pdf" | "docx" | "print_pdf") =>
      generateFn({ data: { bookId, kind } }),
    onSuccess: () => {
      toast.success("Export ready");
      queryClient.invalidateQueries({ queryKey: ["exports", bookId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      queryClient.invalidateQueries({ queryKey: ["exports", bookId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (bookQuery.isLoading || manuscriptQuery.isLoading || !bookQuery.data || !manuscriptQuery.data) {
    return <div className="mx-auto max-w-4xl text-center text-muted-foreground">Loading…</div>;
  }

  const book = bookQuery.data;
  const { manuscript, chapters } = manuscriptQuery.data;
  const themeId = (manuscript?.theme ?? "classic") as BookThemeId;
  const theme = themeStyles[themeId] ?? themeStyles.classic;
  const themeMeta = BOOK_THEMES.find((t) => t.id === themeId);
  const hasContent = (chapters?.length ?? 0) > 0;

  const allPhotos = (photosQuery.data ?? []) as Array<{
    id: string;
    category: PhotoCategory;
    url: string | null;
    filename: string;
  }>;
  const photosByCategory = allPhotos.reduce((acc, p) => {
    (acc[p.category] ||= []).push(p);
    return acc;
  }, {} as Record<PhotoCategory, typeof allPhotos>);
  const coverPhoto = allPhotos.find((p) => p.url) ?? null;


  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/books/$bookId"
        params={{ bookId }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to book
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Preview & Export</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Beautiful themed preview of the finished book. Edit anything inline, then export.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/books/$bookId/manuscript"
            params={{ bookId }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit text
          </Link>
          <Link
            to="/books/$bookId"
            params={{ bookId }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit details
          </Link>
          <Link
            to="/books/$bookId/photos"
            params={{ bookId }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit photos
          </Link>
          <Link
            to="/checkout"
            search={{ bookId }}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Buy this book
          </Link>
        </div>
      </div>

      {!hasContent ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border/60 bg-background p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-primary" />
          <h3 className="mt-3 font-semibold">No manuscript yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate the biography first, then come back to preview and export it.
          </p>
          <Link
            to="/books/$bookId/manuscript"
            params={{ bookId }}
            className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Open manuscript
          </Link>
        </div>
      ) : (
        <>
          {/* Export bar */}
          <div className="mt-6 rounded-2xl border border-border/60 bg-background p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <div className="font-semibold">Export</div>
                <div className="text-muted-foreground">
                  Theme: <span className="font-medium text-foreground">{themeMeta?.label ?? themeId}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => genMutation.mutate("pdf")}
                  disabled={genMutation.isPending}
                >
                  {genMutation.isPending && genMutation.variables === "pdf" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => genMutation.mutate("docx")}
                  disabled={genMutation.isPending}
                >
                  {genMutation.isPending && genMutation.variables === "docx" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileType className="mr-2 h-4 w-4" />
                  )}
                  DOCX
                </Button>
                <Button
                  onClick={() => genMutation.mutate("print_pdf")}
                  disabled={genMutation.isPending}
                >
                  {genMutation.isPending && genMutation.variables === "print_pdf" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="mr-2 h-4 w-4" />
                  )}
                  Print-ready PDF
                </Button>
              </div>
            </div>

            {/* Downloads */}
            <div className="mt-4 space-y-2">
              {(exportsQuery.data ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No exports yet.</p>
              ) : (
                (exportsQuery.data ?? []).map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{e.filename}</div>
                      <div className="text-xs text-muted-foreground">
                        {e.kind === "print_pdf" ? "Print-ready PDF" : e.kind.toUpperCase()} ·{" "}
                        {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {e.url && (
                        <a
                          href={e.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium hover:bg-muted"
                        >
                          <Download className="h-3 w-3" /> Download
                        </a>
                      )}
                      <button
                        onClick={() => delMutation.mutate(e.id)}
                        className="inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Delete export"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Beautiful preview */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 shadow-xl">
            <div className={`${theme.page} px-8 py-16 md:px-16 md:py-24`}>
              {/* Cover */}
              <div className="mx-auto max-w-2xl text-center">
                <div className={`text-xs uppercase tracking-[0.3em] ${theme.muted}`}>A Family History</div>
                <h2 className={`mt-6 text-5xl md:text-6xl font-bold leading-tight ${theme.title}`}>
                  {book.name}
                </h2>
                {book.nickname && (
                  <div className={`mt-3 text-lg italic ${theme.muted}`}>“{book.nickname}”</div>
                )}
                {coverPhoto?.url && (
                  <div className="mx-auto mt-8 max-w-md overflow-hidden rounded-lg shadow-lg">
                    <img
                      src={coverPhoto.url}
                      alt={coverPhoto.filename}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                )}
                <div className={`mx-auto mt-8 h-px w-24 ${theme.rule}`} />
                <div className={`mt-6 text-sm ${theme.muted}`}>
                  {[book.date_of_birth, book.country, book.relationship].filter(Boolean).join(" · ")}
                </div>
              </div>


              {/* Introduction */}
              {manuscript?.introduction && (
                <section className="mx-auto mt-24 max-w-2xl">
                  <div className={`text-xs uppercase tracking-[0.3em] ${theme.muted}`}>Introduction</div>
                  <div className={`mt-2 h-px w-16 ${theme.rule}`} />
                  <div className={`mt-6 space-y-4 text-base leading-relaxed ${theme.body}`}>
                    {manuscript.introduction.split(/\n\n+/).map((p: string, i: number) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </section>
              )}

              {/* Chapters */}
              {chapters?.map((ch: any, chIdx: number) => {
                const cat = TOPIC_TO_CATEGORY[String(ch.topic).toLowerCase()];
                const pics = cat ? (photosByCategory[cat] ?? []).filter((p) => p.url) : [];

                if (themeId === "timeline_split") {
                  const heroPic = pics[0];
                  const imageLeft = chIdx % 2 === 0;
                  const firstYear =
                    Array.isArray(ch.timeline) && ch.timeline.length > 0
                      ? ch.timeline[0]?.year
                      : null;

                  return (
                    <section key={ch.id} className="mx-auto mt-24 max-w-5xl">
                      <div className="grid gap-10 md:grid-cols-2 md:items-center">
                        <div className={imageLeft ? "md:order-1" : "md:order-2"}>
                          {heroPic ? (
                            <figure className="overflow-hidden rounded-lg shadow-md">
                              <img
                                src={heroPic.url!}
                                alt={heroPic.filename}
                                loading="lazy"
                                className="h-full w-full object-cover aspect-[4/5]"
                              />
                              {firstYear && (
                                <figcaption className={`mt-3 text-xs uppercase tracking-[0.25em] ${theme.muted}`}>
                                  {firstYear}
                                </figcaption>
                              )}
                            </figure>
                          ) : (
                            <div className={`flex aspect-[4/5] items-center justify-center rounded-lg border border-dashed ${theme.muted}`}>
                              <span className="text-xs uppercase tracking-[0.25em]">Add a photo</span>
                            </div>
                          )}
                        </div>

                        <div className={imageLeft ? "md:order-2" : "md:order-1"}>
                          <div className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${theme.chip}`}>
                            {firstYear ? `Chapter ${ch.position} · ${firstYear}` : `Chapter ${ch.position}`}
                          </div>
                          <h3 className={`mt-4 text-3xl md:text-4xl font-bold leading-tight ${theme.heading}`}>
                            {ch.title || ch.topic}
                          </h3>
                          <div className={`mt-4 h-px w-16 ${theme.rule}`} />

                          {ch.narrative && (
                            <div className={`mt-6 space-y-4 text-base leading-relaxed ${theme.body}`}>
                              {ch.narrative.split(/\n\n+/).map((p: string, i: number) => (
                                <p key={i}>{p}</p>
                              ))}
                            </div>
                          )}

                          {Array.isArray(ch.timeline) && ch.timeline.length > 0 && (
                            <div className="mt-8">
                              <div className={`text-xs uppercase tracking-[0.25em] ${theme.muted}`}>Timeline</div>
                              <ol className={`mt-3 space-y-3 border-l-2 pl-4 ${theme.body}`} style={{ borderColor: "currentColor" }}>
                                {ch.timeline.map((t: any, i: number) => (
                                  <li key={i} className="relative">
                                    <span className={`absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-current ${theme.accent}`} />
                                    <div className={`text-sm font-semibold ${theme.accent}`}>{t.year}</div>
                                    <div className="text-sm">{t.event}</div>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {Array.isArray(ch.quotes) && ch.quotes.filter((q: string) => q?.trim()).length > 0 && (
                            <div className="mt-8 space-y-4">
                              {ch.quotes.filter((q: string) => q?.trim()).map((q: string, i: number) => (
                                <blockquote
                                  key={i}
                                  className={`border-l-2 pl-5 italic text-lg leading-relaxed ${theme.accent}`}
                                  style={{ borderColor: "currentColor" }}
                                >
                                  “{q}”
                                </blockquote>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {pics.length > 1 && (
                        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {pics.slice(1, 5).map((p) => (
                            <figure key={p.id} className="overflow-hidden rounded-md shadow-sm">
                              <img
                                src={p.url!}
                                alt={p.filename}
                                loading="lazy"
                                className="h-32 w-full object-cover"
                              />
                            </figure>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                }

                return (
                <section key={ch.id} className="mx-auto mt-24 max-w-2xl">
                  <div className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${theme.chip}`}>
                    Chapter {ch.position}
                  </div>
                  <h3 className={`mt-4 text-3xl md:text-4xl font-bold leading-tight ${theme.heading}`}>
                    {ch.title || ch.topic}
                  </h3>
                  <div className={`mt-4 h-px w-16 ${theme.rule}`} />

                  {ch.narrative && (
                    <div className={`mt-6 space-y-4 text-base leading-relaxed ${theme.body}`}>
                      {ch.narrative.split(/\n\n+/).map((p: string, i: number) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  )}

                  {Array.isArray(ch.timeline) && ch.timeline.length > 0 && (
                    <div className="mt-8">
                      <div className={`text-xs uppercase tracking-[0.25em] ${theme.muted}`}>Timeline</div>
                      <ul className="mt-3 space-y-2">
                        {ch.timeline.map((t: any, i: number) => (
                          <li key={i} className={`flex gap-3 text-sm ${theme.body}`}>
                            <span className={`w-20 shrink-0 font-semibold ${theme.accent}`}>{t.year}</span>
                            <span>{t.event}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(ch.quotes) && ch.quotes.filter((q: string) => q?.trim()).length > 0 && (
                    <div className="mt-8 space-y-4">
                      {ch.quotes.filter((q: string) => q?.trim()).map((q: string, i: number) => (
                        <blockquote
                          key={i}
                          className={`border-l-2 pl-5 italic text-lg leading-relaxed ${theme.accent}`}
                          style={{ borderColor: "currentColor" }}
                        >
                          “{q}”
                        </blockquote>
                      ))}
                    </div>
                  )}

                  {(() => {
                    if (pics.length === 0) return null;
                    return (
                      <div className="mt-8">
                        <div className={`text-xs uppercase tracking-[0.25em] ${theme.muted}`}>Photos</div>
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {pics.slice(0, 6).map((p) => (
                            <figure key={p.id} className="overflow-hidden rounded-md shadow-sm">
                              <img
                                src={p.url!}
                                alt={p.filename}
                                loading="lazy"
                                className="h-40 w-full object-cover"
                              />
                            </figure>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </section>
                );
              })}


              {/* Ending */}
              {manuscript?.ending && (
                <section className="mx-auto mt-24 max-w-2xl text-center">
                  <div className={`text-xs uppercase tracking-[0.3em] ${theme.muted}`}>Ending Message</div>
                  <div className={`mx-auto mt-2 h-px w-16 ${theme.rule}`} />
                  <div className={`mt-6 space-y-4 text-base leading-relaxed text-left ${theme.body}`}>
                    {manuscript.ending.split(/\n\n+/).map((p: string, i: number) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
