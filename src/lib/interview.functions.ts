import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MasterInterviewTopic = {
  id: string;
  topic: string;
  description: string;
  position: number;
  enabled: boolean;
  defaultQuestions: string[];
};

export const DEFAULT_MASTER_TOPICS: MasterInterviewTopic[] = [
  {
    id: "childhood",
    topic: "Childhood",
    description: "Earliest memories, growing up, home life, and childhood hobbies.",
    position: 1,
    enabled: true,
    defaultQuestions: [
      "What are your earliest childhood memories and where did you grow up?",
      "Tell us about your childhood home, parents, and siblings.",
      "What were your favorite games, toys, or hobbies as a child?",
      "What was a memorable family holiday or tradition from your early years?",
    ],
  },
  {
    id: "school",
    topic: "School Life",
    description: "School days, favorite subjects, teachers, and teenage friendships.",
    position: 2,
    enabled: true,
    defaultQuestions: [
      "Where did you go to school and what subjects did you enjoy most?",
      "Who was your most influential teacher, mentor, or school friend?",
      "What is your fondest memory or milestone from your school days?",
      "What extracurricular activities or sports did you participate in?",
    ],
  },
  {
    id: "first_job",
    topic: "First Job",
    description: "First earnings, early work experiences, and lessons learned.",
    position: 3,
    enabled: true,
    defaultQuestions: [
      "What was your very first job and how much did you earn?",
      "What were your key responsibilities and who was your first boss?",
      "What valuable lesson did you learn from your first work experience?",
      "How did your early earnings help shape your financial independence?",
    ],
  },
  {
    id: "love",
    topic: "Love Story",
    description: "Meeting your spouse or partner, dating memories, and romance.",
    position: 4,
    enabled: true,
    defaultQuestions: [
      "How and where did you first meet your spouse or partner?",
      "What was your first impression of them when you met?",
      "What is a memorable story or date from when you were courting?",
      "How did the marriage proposal happen?",
    ],
  },
  {
    id: "marriage",
    topic: "Marriage",
    description: "Wedding day celebrations, building a home, and shared life.",
    position: 5,
    enabled: true,
    defaultQuestions: [
      "Tell us about your wedding day, venue, and celebration.",
      "What key advice has helped keep your marriage strong over the years?",
      "What favorite tradition or habit do you share together?",
      "How did you celebrate major anniversaries or joint milestones?",
    ],
  },
  {
    id: "children",
    topic: "Children",
    description: "Parenthood, raising a family, traditions, and memorable stories.",
    position: 6,
    enabled: true,
    defaultQuestions: [
      "What was it like becoming a parent for the first time?",
      "What core values did you try to instill in your children?",
      "What is one of your favorite memories of raising your kids?",
      "How has watching your children grow up impacted your life?",
    ],
  },
  {
    id: "career",
    topic: "Career",
    description: "Professional accomplishments, career pivots, and milestones.",
    position: 7,
    enabled: true,
    defaultQuestions: [
      "What career achievement or milestone are you most proud of?",
      "What was the biggest professional risk or pivot you ever took?",
      "How did you balance your professional work life with family responsibilities?",
      "What advice would you give someone starting out in your field today?",
    ],
  },
  {
    id: "challenges",
    topic: "Biggest Challenges",
    description: "Overcoming hardships, resilience, and personal strength.",
    position: 8,
    enabled: true,
    defaultQuestions: [
      "What was one of the toughest obstacles or hardships you faced in life?",
      "How did you find the strength and resilience to overcome it?",
      "What did that experience teach you about yourself and others?",
      "Who offered crucial support during your most challenging times?",
    ],
  },
  {
    id: "achievements",
    topic: "Greatest Achievements",
    description: "Personal fulfillments, passions, and proudest moments.",
    position: 9,
    enabled: true,
    defaultQuestions: [
      "What do you consider your single greatest fulfillment or achievement?",
      "What community contribution, passion project, or impact are you thankful for?",
      "What dream did you work hard for that finally came true?",
    ],
  },
  {
    id: "retirement",
    topic: "Retirement",
    description: "Transition into retirement, leisure, travels, and new hobbies.",
    position: 10,
    enabled: true,
    defaultQuestions: [
      "How did you celebrate your transition into retirement?",
      "How do you enjoy spending your days now?",
      "What new passions, travels, or hobbies have you embraced in retirement?",
    ],
  },
  {
    id: "advice",
    topic: "Advice for Future Generations",
    description: "Wisdom, life lessons, and legacy for children and grandchildren.",
    position: 11,
    enabled: true,
    defaultQuestions: [
      "What is the most important life lesson you want future generations to remember?",
      "What family value do you hope is passed down forever?",
      "What words of wisdom or blessing do you leave for your great-grandchildren?",
    ],
  },
];

export const INTERVIEW_TOPICS = DEFAULT_MASTER_TOPICS.map((t) => t.topic);
export type InterviewTopic = string;

const MIN_Q = 3;
const MAX_Q = 5;

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: Admin access required");
}

async function ensureBookAccess(supabase: any, bookId: string) {
  const { data, error } = await supabase
    .from("books")
    .select("id, name, nickname, gender, date_of_birth, country, relationship")
    .eq("id", bookId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Book not found");
  return data;
}

/** Get Master Interview Topics (Admin or App) */
export async function fetchMasterTopics(supabase: any): Promise<MasterInterviewTopic[]> {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "interview_master_topics")
      .maybeSingle();

    if (!error && data?.value && Array.isArray(data.value)) {
      return data.value as MasterInterviewTopic[];
    }
  } catch (err) {
    console.error("[fetchMasterTopics] Error reading app_settings:", err);
  }
  return DEFAULT_MASTER_TOPICS;
}

/** Admin API: Get all topics (including disabled) */
export const getAdminInterviewTopics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return await fetchMasterTopics(supabaseAdmin);
  });

/** Admin API: Save updated dynamic topics & questions */
export const saveAdminInterviewTopics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { topics: MasterInterviewTopic[] }) =>
    z.object({ topics: z.array(z.any()) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert(
        { key: "interview_master_topics", value: data.topics, updated_by: context.userId },
        { onConflict: "key" },
      );

    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin API: Reset to factory default topics */
export const resetAdminInterviewTopics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert(
        { key: "interview_master_topics", value: DEFAULT_MASTER_TOPICS, updated_by: context.userId },
        { onConflict: "key" },
      );

    if (error) throw new Error(error.message);
    return { ok: true, topics: DEFAULT_MASTER_TOPICS };
  });

/** App API: Get interview state for user's book */
export const getInterviewState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bookId: string }) =>
    z.object({ bookId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const book = await ensureBookAccess(context.supabase, data.bookId);
    const masterTopics = await fetchMasterTopics(context.supabase);
    const activeMasterTopics = masterTopics.filter((t) => t.enabled !== false);

    const { data: topicsRows, error: tErr } = await context.supabase
      .from("interview_topics")
      .select("topic, status, completed_at")
      .eq("book_id", data.bookId);
    if (tErr) throw new Error(tErr.message);

    const { data: qaRows, error: qErr } = await context.supabase
      .from("interview_qa")
      .select("id, topic, position, question, answer, updated_at")
      .eq("book_id", data.bookId)
      .order("topic")
      .order("position");
    if (qErr) throw new Error(qErr.message);

    const topicMap = new Map<string, { status: string; completed_at: string | null }>();
    for (const t of topicsRows ?? []) {
      topicMap.set(t.topic, { status: t.status, completed_at: t.completed_at });
    }

    const qaByTopic: Record<string, typeof qaRows> = {};
    for (const row of qaRows ?? []) {
      (qaByTopic[row.topic] ??= []).push(row);
    }

    const topics = activeMasterTopics.map((master) => {
      const topicName = master.topic;
      const qas = qaByTopic[topicName] ?? [];
      const answered = qas.filter((q) => q.answer && q.answer.trim().length > 0).length;
      const state = topicMap.get(topicName);
      return {
        topic: topicName,
        description: master.description,
        status: state?.status ?? "not_started",
        completed_at: state?.completed_at ?? null,
        answered,
        total: qas.length,
        can_complete: answered >= MIN_Q,
        max_reached: qas.length >= MAX_Q,
        qa: qas,
      };
    });

    const totalAnswered = topics.reduce((s, t) => s + t.answered, 0);
    const completedTopics = topics.filter((t) => t.status === "completed").length;

    return {
      book,
      topics,
      totalAnswered,
      completedTopics,
      totalTopics: activeMasterTopics.length,
      minPerTopic: MIN_Q,
      maxPerTopic: MAX_Q,
    };
  });

export const saveAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { qaId: string; bookId: string; answer: string }) =>
    z
      .object({
        qaId: z.string().uuid(),
        bookId: z.string().uuid(),
        answer: z.string().max(10000),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await ensureBookAccess(context.supabase, data.bookId);

    const { data: qa, error } = await context.supabase
      .from("interview_qa")
      .update({ answer: data.answer })
      .eq("id", data.qaId)
      .eq("book_id", data.bookId)
      .select("topic")
      .single();
    if (error) throw new Error(error.message);

    await context.supabase
      .from("interview_topics")
      .upsert(
        { book_id: data.bookId, topic: qa.topic, status: "in_progress" },
        { onConflict: "book_id,topic", ignoreDuplicates: false },
      );

    return { ok: true };
  });

export const generateNextQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bookId: string; topic: string }) =>
    z
      .object({
        bookId: z.string().uuid(),
        topic: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const book = await ensureBookAccess(context.supabase, data.bookId);
    const masterTopics = await fetchMasterTopics(context.supabase);
    const master = masterTopics.find((t) => t.topic === data.topic);

    const { data: existing, error: eErr } = await context.supabase
      .from("interview_qa")
      .select("id, position, question, answer")
      .eq("book_id", data.bookId)
      .eq("topic", data.topic)
      .order("position");
    if (eErr) throw new Error(eErr.message);

    if (existing.length >= MAX_Q) {
      throw new Error(`Maximum ${MAX_Q} questions reached for this topic.`);
    }

    let nextQuestionText = "";

    // Check if there is an unasked default question configured by Admin for this topic
    const existingQTexts = new Set(existing.map((q) => q.question.trim().toLowerCase()));
    const defaultQs = master?.defaultQuestions ?? [];
    const unaskedDefault = defaultQs.find((dq) => !existingQTexts.has(dq.trim().toLowerCase()));

    if (unaskedDefault) {
      nextQuestionText = unaskedDefault.trim();
    } else {
      // Fallback to AI Question Generator if pre-defined questions are completed
      const { data: allQ, error: aErr } = await context.supabase
        .from("interview_qa")
        .select("topic, question")
        .eq("book_id", data.bookId);
      if (aErr) throw new Error(aErr.message);

      const priorQuestions = (allQ ?? []).map((q) => `- (${q.topic}) ${q.question}`).join("\n");
      const topicQA = existing
        .map((q, i) => `Q${i + 1}: ${q.question}\nA${i + 1}: ${q.answer?.trim() || "(no answer yet)"}`)
        .join("\n\n");

      const subject = [
        book.name,
        book.nickname ? `(nickname: ${book.nickname})` : "",
        book.gender ? `gender: ${book.gender}` : "",
        book.date_of_birth ? `born: ${book.date_of_birth}` : "",
        book.country ? `country: ${book.country}` : "",
        book.relationship ? `relationship to the interviewer: ${book.relationship}` : "",
      ]
        .filter(Boolean)
        .join(", ");

      const { runAi, renderPrompt } = await import("@/lib/ai/dispatcher.server");
      const { system, user } = await renderPrompt("interview_question", {
        subject,
        topic: data.topic,
        topic_qa: topicQA || "(none yet — this is the first question)",
        prior_questions: priorQuestions || "(none)",
      });

      const ai = await runAi({
        system: system ?? undefined,
        user,
        promptKey: "interview_question",
        userId: context.userId,
        bookId: data.bookId,
      });
      nextQuestionText = ai.text.trim();
    }

    if (!nextQuestionText) {
      throw new Error("Could not generate question. Please try again.");
    }

    const position = existing.length + 1;

    const { data: qa, error: insErr } = await context.supabase
      .from("interview_qa")
      .insert({
        book_id: data.bookId,
        topic: data.topic,
        position,
        question: nextQuestionText,
        answer: "",
      })
      .select("id, topic, position, question, answer")
      .single();
    if (insErr) throw new Error(insErr.message);

    await context.supabase
      .from("interview_topics")
      .upsert(
        { book_id: data.bookId, topic: data.topic, status: "in_progress" },
        { onConflict: "book_id,topic", ignoreDuplicates: false },
      );

    return qa;
  });

export const setTopicStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { bookId: string; topic: string; status: "in_progress" | "completed" }) =>
      z
        .object({
          bookId: z.string().uuid(),
          topic: z.string().min(1),
          status: z.enum(["in_progress", "completed"]),
        })
        .parse(data),
  )
  .handler(async ({ data, context }) => {
    await ensureBookAccess(context.supabase, data.bookId);

    const patch: Record<string, unknown> = { status: data.status };
    if (data.status === "completed") patch.completed_at = new Date().toISOString();
    else patch.completed_at = null;

    const { error } = await context.supabase
      .from("interview_topics")
      .upsert(
        { book_id: data.bookId, topic: data.topic, ...patch },
        { onConflict: "book_id,topic", ignoreDuplicates: false },
      );
    if (error) throw new Error(error.message);

    return { ok: true };
  });
