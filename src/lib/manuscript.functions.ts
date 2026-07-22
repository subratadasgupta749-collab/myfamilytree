import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { INTERVIEW_TOPICS } from "./interview.functions";

export const BOOK_THEMES = [
  { id: "classic", label: "Classic", description: "Timeless serif elegance." },
  { id: "vintage", label: "Vintage", description: "Warm sepia, aged paper." },
  { id: "modern", label: "Modern", description: "Clean, minimal, airy." },
  { id: "leather_journal", label: "Leather Journal", description: "Rich leather, handwritten feel." },
  { id: "family_album", label: "Family Album", description: "Bright, photo-forward layout." },
  { id: "timeline_split", label: "Timeline Split", description: "Side-by-side photo and story arranged along a timeline." },
] as const;

export type BookThemeId = (typeof BOOK_THEMES)[number]["id"];

async function ensureBookAccess(supabase: any, bookId: string) {
  const { data, error } = await supabase
    .from("books")
    .select("id, user_id, name, nickname, gender, date_of_birth, country, relationship")
    .eq("id", bookId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export const getManuscript = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => {
    const raw = data?.data || data;
    const bookId = typeof raw === "string" ? raw : raw?.bookId;
    return { bookId: String(bookId || "") };
  })
  .handler(async ({ data, context }) => {
    try {
      if (!data?.bookId) return { manuscript: null, chapters: [] };
      await ensureBookAccess(context.supabase, data.bookId);

      const { data: manuscript, error: mErr } = await context.supabase
        .from("book_manuscripts")
        .select("*")
        .eq("book_id", data.bookId)
        .maybeSingle();

      if (mErr) console.error("[getManuscript] Error fetching manuscript:", mErr);

      const { data: chapters, error: cErr } = await context.supabase
        .from("book_chapters")
        .select("*")
        .eq("book_id", data.bookId)
        .order("position");

      if (cErr) console.error("[getManuscript] Error fetching chapters:", cErr);

      return { manuscript: manuscript ?? null, chapters: chapters ?? [] };
    } catch (err) {
      console.error("[getManuscript] Error:", err);
      return { manuscript: null, chapters: [] };
    }
  });

export const setTheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => {
    const payload = data?.data || data;
    return { bookId: String(payload?.bookId || ""), theme: payload?.theme ?? "classic" };
  })
  .handler(async ({ data, context }) => {
    try {
      await ensureBookAccess(context.supabase, data.bookId);
      await context.supabase
        .from("book_manuscripts")
        .upsert(
          { book_id: data.bookId, user_id: context.userId, theme: data.theme },
          { onConflict: "book_id" },
        );
      return { ok: true };
    } catch {
      return { ok: true };
    }
  });

export const updateChapter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => data?.data || data)
  .handler(async ({ data, context }) => {
    try {
      await ensureBookAccess(context.supabase, data.bookId);
      const patch: any = {};
      if (data.title !== undefined) patch.title = data.title;
      if (data.narrative !== undefined) patch.narrative = data.narrative;
      if (data.timeline !== undefined) patch.timeline = data.timeline;
      if (data.quotes !== undefined) patch.quotes = data.quotes;

      await context.supabase
        .from("book_chapters")
        .update(patch)
        .eq("id", data.chapterId)
        .eq("book_id", data.bookId);
      return { ok: true };
    } catch {
      return { ok: true };
    }
  });

export const updateManuscriptText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => data?.data || data)
  .handler(async ({ data, context }) => {
    try {
      await ensureBookAccess(context.supabase, data.bookId);
      const patch: any = { book_id: data.bookId, user_id: context.userId };
      if (data.introduction !== undefined) patch.introduction = data.introduction;
      if (data.ending !== undefined) patch.ending = data.ending;
      await context.supabase
        .from("book_manuscripts")
        .upsert(patch, { onConflict: "book_id" });
      return { ok: true };
    } catch {
      return { ok: true };
    }
  });

async function callAi(
  promptKey: string,
  vars: Record<string, string>,
  ctx?: { userId?: string; bookId?: string },
): Promise<string> {
  const { runAi, renderPrompt } = await import("@/lib/ai/dispatcher.server");
  const { system, user } = await renderPrompt(promptKey, vars);
  const res = await runAi({
    system: system ?? undefined,
    user,
    promptKey,
    userId: ctx?.userId,
    bookId: ctx?.bookId,
  });
  return res.text;
}

function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced ? fenced[1] : text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  const slice = start >= 0 && end > start ? raw.slice(start, end + 1) : raw;
  return JSON.parse(slice) as T;
}

export const generateBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => {
    const raw = data?.data || data;
    const bookId = typeof raw === "string" ? raw : raw?.bookId;
    return { bookId: String(bookId || "") };
  })
  .handler(async ({ data, context }) => {
    const book = await ensureBookAccess(context.supabase, data.bookId);
    if (!book) throw new Error("Book not found");

    const { data: qaRows, error: qErr } = await context.supabase
      .from("interview_qa")
      .select("topic, position, question, answer")
      .eq("book_id", data.bookId)
      .order("topic")
      .order("position");
    if (qErr) throw new Error(qErr.message);

    const answered = (qaRows ?? []).filter((q: any) => q.answer && q.answer.trim().length > 0);
    if (answered.length < 1) {
      throw new Error("Please answer at least one interview question before generating the book.");
    }

    const subject = [
      book.name,
      book.nickname ? `(nickname: ${book.nickname})` : "",
      book.gender ? `gender: ${book.gender}` : "",
      book.date_of_birth ? `born: ${book.date_of_birth}` : "",
      book.country ? `country: ${book.country}` : "",
      book.relationship ? `relationship: ${book.relationship}` : "",
    ]
      .filter(Boolean)
      .join(", ");

    const byTopic = new Map<string, Array<{ question: string; answer: string }>>();
    for (const row of answered) {
      const topicKey = row.topic || "General";
      const arr = byTopic.get(topicKey) ?? [];
      arr.push({ question: row.question, answer: row.answer });
      byTopic.set(topicKey, arr);
    }

    const topicOrderMap = new Map<string, number>(
      INTERVIEW_TOPICS.map((t, idx) => [t.toLowerCase(), idx])
    );

    const topicsWithAnswers = Array.from(byTopic.keys()).sort((a, b) => {
      const idxA = topicOrderMap.get(a.toLowerCase()) ?? 999;
      const idxB = topicOrderMap.get(b.toLowerCase()) ?? 999;
      return idxA - idxB;
    });

    // Ensure manuscript row exists
    await context.supabase
      .from("book_manuscripts")
      .upsert(
        { book_id: data.bookId, user_id: context.userId },
        { onConflict: "book_id", ignoreDuplicates: true },
      );

    // Generate each chapter
    for (let i = 0; i < topicsWithAnswers.length; i++) {
      const topic = topicsWithAnswers[i];
      const qa = byTopic.get(topic)!;
      const qaText = qa.map((q, idx) => `Q${idx + 1}: ${q.question}\nA${idx + 1}: ${q.answer}`).join("\n\n");

      let raw = "";
      try {
        raw = await callAi(
          "biography_chapter",
          {
            subject,
            index: String(i + 1),
            total: String(topicsWithAnswers.length),
            topic,
            qa_text: qaText,
          },
          { userId: context.userId, bookId: data.bookId },
        );
      } catch (e) {
        console.warn(`[generateBook] AI call failed for chapter "${topic}", using Q&A fallback:`, e);
      }

      let parsed: {
        title: string;
        narrative: string;
        timeline: Array<{ year: string; event: string }>;
        quotes: string[];
      };

      if (raw) {
        try {
          parsed = extractJson(raw);
        } catch {
          parsed = { title: topic, narrative: raw, timeline: [], quotes: [] };
        }
      } else {
        const narrativeText = qa.map((q) => `${q.question}\n${q.answer}`).join("\n\n");
        const extractedQuotes = qa
          .map((q) => q.answer.trim())
          .filter((a) => a.length > 15)
          .slice(0, 3);
        parsed = {
          title: topic,
          narrative: narrativeText,
          timeline: [],
          quotes: extractedQuotes,
        };
      }

      await context.supabase.from("book_chapters").upsert(
        {
          book_id: data.bookId,
          user_id: context.userId,
          topic,
          position: i + 1,
          title: parsed.title ?? topic,
          narrative: parsed.narrative ?? "",
          timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
          quotes: Array.isArray(parsed.quotes) ? parsed.quotes : [],
        },
        { onConflict: "book_id,topic" },
      );
    }

    // Introduction & ending
    const overview = topicsWithAnswers
      .map((t) => `${t}: ${byTopic.get(t)!.length} answers`)
      .join("; ");

    let introRaw = "";
    let endingRaw = "";
    try {
      introRaw = await callAi("biography_intro", { subject, overview }, { userId: context.userId, bookId: data.bookId });
    } catch (e) {
      console.warn("[generateBook] Intro AI failed, using fallback:", e);
    }
    try {
      endingRaw = await callAi("biography_ending", { subject }, { userId: context.userId, bookId: data.bookId });
    } catch (e) {
      console.warn("[generateBook] Ending AI failed, using fallback:", e);
    }

    let introduction = "";
    let ending = "";
    if (introRaw) {
      try { introduction = extractJson<{ text: string }>(introRaw).text ?? introRaw; } catch { introduction = introRaw; }
    } else {
      introduction = `Welcome to the life story and biography of ${book.name}. This collection of memories, milestones, and personal reflections preserves a rich legacy for generations to come.`;
    }

    if (endingRaw) {
      try { ending = extractJson<{ text: string }>(endingRaw).text ?? endingRaw; } catch { ending = endingRaw; }
    } else {
      ending = `Thank you for taking the time to share these cherished stories and memories. May this book serve as a meaningful keepsake for family and loved ones.`;
    }

    await context.supabase
      .from("book_manuscripts")
      .upsert(
        {
          book_id: data.bookId,
          user_id: context.userId,
          introduction,
          ending,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "book_id" },
      );

    await context.supabase
      .from("books")
      .update({ status: "in_progress", progress: 80 })
      .eq("id", data.bookId);

    return { ok: true, chapters: topicsWithAnswers.length };
  });
