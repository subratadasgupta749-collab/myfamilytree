import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Download, FileText, FileType, Printer, Loader2, Trash2, Pencil, Check, Sparkles, Layout, BookOpen, Layers } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getManuscript, BOOK_THEMES, type BookThemeId, setTheme } from "@/lib/manuscript.functions";
import { getBook } from "@/lib/books.functions";
import { generateExport, listExports, deleteExport } from "@/lib/exports.functions";
import { listPhotos, type PhotoCategory } from "@/lib/photos.functions";
import {
  TEMPLATE_CONFIGS,
  DEFAULT_CUSTOMIZATION,
  type CustomizationSettings,
  ChapterDivider,
  DropCapText,
  QuoteBlock,
  PhotoLayoutGallery,
  TimelineVisualizer,
  SpecialPagesSuite,
  BookCoverSpread,
} from "@/components/books/book-template-system";
import { TemplateCustomizer } from "@/components/books/template-customizer";

const bookQ = (id: string) =>
  queryOptions({ queryKey: ["books", id], queryFn: () => getBook({ data: { id } }) });
const manuscriptQ = (id: string) =>
  queryOptions({ queryKey: ["manuscript", id], queryFn: () => getManuscript({ data: { bookId: id } }) });
const exportsQ = (id: string) =>
  queryOptions({ queryKey: ["exports", id], queryFn: () => listExports({ data: { bookId: id } }) });
const photosQ = (id: string) =>
  queryOptions({ queryKey: ["photos", id], queryFn: () => listPhotos({ data: { bookId: id } }) });

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

function PreviewPage() {
  const { bookId } = Route.useParams();
  const queryClient = useQueryClient();

  const bookQuery = useQuery(bookQ(bookId));
  const manuscriptQuery = useQuery(manuscriptQ(bookId));
  const exportsQuery = useQuery(exportsQ(bookId));
  const photosQuery = useQuery(photosQ(bookId));

  const generateFn = useServerFn(generateExport);
  const deleteFn = useServerFn(deleteExport);
  const setThemeFn = useServerFn(setTheme);

  const [customization, setCustomization] = useState<CustomizationSettings>(DEFAULT_CUSTOMIZATION);
  const [activeTab, setActiveTab] = useState<"full_book" | "cover_spread" | "special_pages">("full_book");

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

  const themeMutation = useMutation({
    mutationFn: (theme: BookThemeId) => setThemeFn({ data: { bookId, theme } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["manuscript", bookId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (bookQuery.isLoading || manuscriptQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading Book Preview Studio...</span>
      </div>
    );
  }

  const book = bookQuery.data ?? { name: "Family History Book" };
  const manuscriptData = manuscriptQuery.data ?? { manuscript: null, chapters: [] };
  const { manuscript, chapters } = manuscriptData;
  const themeId = (manuscript?.theme ?? "classic") as BookThemeId;
  const themeConfig = TEMPLATE_CONFIGS[themeId] ?? TEMPLATE_CONFIGS.classic;
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
    <div className="mx-auto max-w-6xl space-y-8">
      <Link
        to="/books/$bookId"
        params={{ bookId }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to book
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Book Design Studio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Preview, customize, and export your heirloom hardbound biography with publishing-house precision.
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
            to="/books/$bookId/photos"
            params={{ bookId }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit photos
          </Link>
          <Link
            to="/checkout"
            search={{ bookId }}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
          >
            Order Hardcover Copy
          </Link>
        </div>
      </div>

      {!hasContent ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-background p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-primary" />
          <h3 className="mt-3 font-semibold">No manuscript available</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate the biography first, then return to design and export the book.
          </p>
          <Link
            to="/books/$bookId/manuscript"
            params={{ bookId }}
            className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Open manuscript editor
          </Link>
        </div>
      ) : (
        <>
          {/* Template Selection Gallery */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">Select Book Template (12 Unique Designs)</h2>
                <p className="text-xs text-neutral-500">Each template features a distinct typographic layout, chapter header, and visual identity.</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
                Active: {themeConfig.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {BOOK_THEMES.map((t) => {
                const isActive = t.id === themeId;
                return (
                  <button
                    key={t.id}
                    onClick={() => themeMutation.mutate(t.id)}
                    className={`rounded-xl border p-3 text-left transition relative flex flex-col justify-between ${
                      isActive
                        ? "border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/40"
                        : "border-neutral-200 hover:border-neutral-400 bg-neutral-50/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-neutral-900">
                        <span className="truncate">{t.label}</span>
                        {isActive && <Check className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                      </div>
                      <p className="mt-1 text-[10px] text-neutral-500 line-clamp-2">{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Real-time Customizer Drawer */}
          <TemplateCustomizer settings={customization} onChange={setCustomization} />

          {/* Export & Download Bar */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-sm text-neutral-900">High-Resolution Export Center</div>
                <div className="text-xs text-neutral-500">
                  Export 300 DPI PDF, DOCX, or CMYK Print-Ready Files for Professional Printing
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
                  Digital PDF
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
                  Word DOCX
                </Button>
                <Button
                  className="bg-amber-700 hover:bg-amber-800 text-white"
                  onClick={() => genMutation.mutate("print_pdf")}
                  disabled={genMutation.isPending}
                >
                  {genMutation.isPending && genMutation.variables === "print_pdf" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="mr-2 h-4 w-4" />
                  )}
                  Print-Ready PDF (with Bleed)
                </Button>
              </div>
            </div>

            {/* List Previous Exports */}
            {(exportsQuery.data ?? []).length > 0 && (
              <div className="pt-3 border-t border-neutral-100 space-y-2">
                {(exportsQuery.data ?? []).map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-xs">
                    <div>
                      <span className="font-medium text-neutral-800">{e.filename}</span>
                      <span className="ml-2 text-neutral-400">
                        ({e.kind === "print_pdf" ? "Print PDF" : e.kind.toUpperCase()} ·{" "}
                        {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {e.url && (
                        <a
                          href={e.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-neutral-100 px-2.5 py-1 text-xs font-medium hover:bg-neutral-200"
                        >
                          <Download className="h-3 w-3" /> Download
                        </a>
                      )}
                      <button
                        onClick={() => delMutation.mutate(e.id)}
                        className="text-neutral-400 hover:text-red-600 p-1"
                        aria-label="Delete export"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Studio View Tabs */}
          <div className="flex justify-center border-b border-neutral-200">
            <div className="flex gap-2 p-1 bg-neutral-100 rounded-t-xl text-xs font-medium">
              <button
                onClick={() => setActiveTab("full_book")}
                className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === "full_book" ? "bg-white text-neutral-900 shadow-xs font-semibold" : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" /> Full Book Manuscript
              </button>
              <button
                onClick={() => setActiveTab("cover_spread")}
                className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === "cover_spread" ? "bg-white text-neutral-900 shadow-xs font-semibold" : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Layers className="h-3.5 w-3.5" /> Cover, Dust Jacket & Spine
              </button>
              <button
                onClick={() => setActiveTab("special_pages")}
                className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === "special_pages" ? "bg-white text-neutral-900 shadow-xs font-semibold" : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" /> Special Pages & Lineage
              </button>
            </div>
          </div>

          {/* Book Canvas Preview Container */}
          <div className={`overflow-hidden rounded-2xl border border-neutral-300 shadow-xl transition-all ${themeConfig.bgStyle} relative`}>
            {customization.showBleed && (
              <div className="absolute inset-0 border-4 border-dashed border-red-500/40 pointer-events-none z-50">
                <span className="absolute top-2 left-2 bg-red-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                  0.125" BLEED AREA ACTIVE
                </span>
              </div>
            )}

            <div className="p-8 md:p-16 max-w-4xl mx-auto space-y-16">
              {activeTab === "cover_spread" && (
                <BookCoverSpread book={book} theme={themeConfig} coverPhotoUrl={coverPhoto?.url} />
              )}

              {activeTab === "special_pages" && (
                <SpecialPagesSuite bookName={book.name || "Family Member"} theme={themeConfig} />
              )}

              {activeTab === "full_book" && (
                <>
                  {/* Front Matter: Title & Dedication */}
                  <div className="text-center py-12 border-b border-dashed border-neutral-300 space-y-4">
                    <div className={`text-xs uppercase tracking-widest ${themeConfig.mutedColor}`}>
                      Preserved Family History Memoir
                    </div>
                    <h1 className={`text-4xl md:text-5xl font-extrabold ${themeConfig.headingColor}`}>
                      {book.name}
                    </h1>
                    {book.nickname && (
                      <div className={`text-lg italic ${themeConfig.accentFontClass} ${themeConfig.mutedColor}`}>
                        “{book.nickname}”
                      </div>
                    )}
                    <ChapterDivider type={themeConfig.dividerType} colorClass={themeConfig.ruleColor} />
                    <p className={`text-xs italic ${themeConfig.mutedColor}`}>
                      Dedicated with love to future generations of our family.
                    </p>
                  </div>

                  {/* Introduction */}
                  {manuscript?.introduction && (
                    <section className="space-y-4">
                      <div className={`text-xs uppercase tracking-widest font-bold ${themeConfig.mutedColor}`}>
                        Introduction
                      </div>
                      <DropCapText
                        text={manuscript.introduction}
                        dropCapClass={themeConfig.dropCapClass}
                        bodyClass={themeConfig.textColor}
                      />
                    </section>
                  )}

                  {/* Chapters */}
                  {chapters?.map((ch: any, chIdx: number) => {
                    const cat = TOPIC_TO_CATEGORY[String(ch.topic).toLowerCase()];
                    const pics = cat ? (photosByCategory[cat] ?? []).filter((p) => p.url) : [];
                    const formattedPics = pics.map((p) => ({ id: p.id, url: p.url!, filename: p.filename }));

                    return (
                      <section key={ch.id} className="pt-12 border-t border-neutral-200/60 space-y-6">
                        {/* Chapter Opener Header */}
                        <div className="space-y-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${themeConfig.chipClass}`}>
                            Chapter {ch.position}
                          </span>
                          <h2 className={`text-3xl md:text-4xl font-bold ${themeConfig.headingColor}`}>
                            {ch.title || ch.topic}
                          </h2>
                          <ChapterDivider type={themeConfig.dividerType} colorClass={themeConfig.ruleColor} />
                        </div>

                        {/* Narrative Content with Illuminated Drop Cap */}
                        {ch.narrative && (
                          <DropCapText
                            text={ch.narrative}
                            dropCapClass={themeConfig.dropCapClass}
                            bodyClass={themeConfig.textColor}
                          />
                        )}

                        {/* Timeline */}
                        {Array.isArray(ch.timeline) && ch.timeline.length > 0 && (
                          <TimelineVisualizer
                            items={ch.timeline}
                            theme={themeConfig}
                            customMode={customization.timelineStyleMode}
                          />
                        )}

                        {/* Quotes */}
                        {Array.isArray(ch.quotes) && ch.quotes.filter(Boolean).length > 0 && (
                          <div className="space-y-4">
                            {ch.quotes.filter(Boolean).map((q: string, qIdx: number) => (
                              <QuoteBlock
                                key={qIdx}
                                quote={q}
                                theme={themeConfig}
                                customMode={customization.quoteStyleMode}
                              />
                            ))}
                          </div>
                        )}

                        {/* Photo Layout Gallery */}
                        {formattedPics.length > 0 && (
                          <PhotoLayoutGallery
                            photos={formattedPics}
                            theme={themeConfig}
                            layoutMode={customization.photoLayoutMode}
                          />
                        )}
                      </section>
                    );
                  })}

                  {/* Ending Letter */}
                  {manuscript?.ending && (
                    <section className="pt-16 border-t border-neutral-300 space-y-4 text-center">
                      <div className={`text-xs uppercase tracking-widest font-bold ${themeConfig.mutedColor}`}>
                        Ending Message to Future Generations
                      </div>
                      <ChapterDivider type={themeConfig.dividerType} colorClass={themeConfig.ruleColor} />
                      <div className="text-left">
                        <DropCapText
                          text={manuscript.ending}
                          dropCapClass={themeConfig.dropCapClass}
                          bodyClass={themeConfig.textColor}
                        />
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
