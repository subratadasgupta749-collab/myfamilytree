import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  category: z.string().default("general"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  description: z.string().trim().min(5).max(5000),
  browser_info: z.record(z.string(), z.any()).optional(),
  os_info: z.record(z.string(), z.any()).optional(),
  device_type: z.string().optional(),
  current_url: z.string().optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        storage_path: z.string(),
        file_type: z.string(),
        size_bytes: z.number(),
      })
    )
    .optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

/** Create a new support ticket (User) */
export const createSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: CreateTicketInput) => createTicketSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: ticket, error } = await context.supabase
      .from("support_tickets")
      .insert({
        user_id: context.userId,
        subject: data.subject,
        category: data.category,
        priority: data.priority,
        status: "open",
        description: data.description,
        browser_info: data.browser_info ?? {},
        os_info: data.os_info ?? {},
        device_type: data.device_type ?? "desktop",
        current_url: data.current_url ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Initial first message
    await context.supabase.from("ticket_messages").insert({
      ticket_id: ticket.id,
      sender_id: context.userId,
      sender_type: "user",
      message: data.description,
    });

    // Add attachments if any
    if (data.attachments && data.attachments.length > 0) {
      const records = data.attachments.map((a) => ({
        ticket_id: ticket.id,
        filename: a.filename,
        storage_path: a.storage_path,
        file_type: a.file_type,
        size_bytes: a.size_bytes,
      }));
      await context.supabase.from("ticket_attachments").insert(records);
    }

    return ticket;
  });

/** List tickets for current user */
export const listMySupportTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("support_tickets")
      .select("id, ticket_number, subject, category, priority, status, created_at, updated_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Get single ticket details with thread & attachments */
export const getSupportTicketDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticketId: string }) =>
    z.object({ ticketId: z.string().uuid() }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { data: ticket, error: tErr } = await context.supabase
      .from("support_tickets")
      .select("*")
      .eq("id", data.ticketId)
      .maybeSingle();

    if (tErr) throw new Error(tErr.message);
    if (!ticket) throw new Error("Ticket not found");

    // Fetch messages
    const { data: messages, error: mErr } = await context.supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", data.ticketId)
      .order("created_at", { ascending: true });

    if (mErr) throw new Error(mErr.message);

    // Fetch attachments
    const { data: attachments } = await context.supabase
      .from("ticket_attachments")
      .select("*")
      .eq("ticket_id", data.ticketId);

    // Fetch profiles for sender display
    const senderIds = Array.from(new Set((messages ?? []).map((m: any) => m.sender_id)));
    let profileMap = new Map<string, any>();

    if (senderIds.length > 0) {
      const { data: profs } = await context.supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", senderIds);

      profileMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
    }

    const enrichedMessages = (messages ?? []).map((m: any) => ({
      ...m,
      sender: profileMap.get(m.sender_id) ?? { full_name: "Support", email: "" },
    }));

    return {
      ticket,
      messages: enrichedMessages,
      attachments: attachments ?? [],
    };
  });

/** Post a reply to ticket (User or Admin) */
export const replyToTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticketId: string; message: string; isInternalNote?: boolean }) =>
    z
      .object({
        ticketId: z.string().uuid(),
        message: z.string().trim().min(1).max(5000),
        isInternalNote: z.boolean().optional().default(false),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    // Check if user is admin
    let isAdmin = false;
    try {
      await assertAdmin(context);
      isAdmin = true;
    } catch {
      isAdmin = false;
    }

    const isInternal = isAdmin && !!data.isInternalNote;
    const senderType = isAdmin ? "admin" : "user";

    // Insert message
    const { data: msg, error: mErr } = await context.supabase
      .from("ticket_messages")
      .insert({
        ticket_id: data.ticketId,
        sender_id: context.userId,
        sender_type: senderType,
        message: data.message,
        is_internal_note: isInternal,
      })
      .select()
      .single();

    if (mErr) throw new Error(mErr.message);

    // Update ticket status
    if (!isInternal) {
      const newStatus = isAdmin ? "pending" : "in_progress";
      await context.supabase
        .from("support_tickets")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", data.ticketId);
    }

    return msg;
  });

/** Update ticket status (Close, Resolve, Reopen) */
export const updateTicketStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticketId: string; status: string }) =>
    z
      .object({
        ticketId: z.string().uuid(),
        status: z.enum(["open", "pending", "in_progress", "resolved", "closed", "rejected"]),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("support_tickets")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.ticketId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- Bug Reports Functions ---------------- */

export const submitBugReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; steps: string; severity?: string; browser?: string; device?: string }) =>
    z
      .object({
        title: z.string().trim().min(3).max(200),
        steps: z.string().trim().min(5).max(3000),
        severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
        browser: z.string().optional(),
        device: z.string().optional(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const { data: bug, error } = await context.supabase
      .from("bug_reports")
      .insert({
        user_id: context.userId,
        title: data.title,
        steps_to_reproduce: data.steps,
        severity: data.severity,
        browser_info: data.browser ?? null,
        device_info: data.device ?? null,
        status: "open",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return bug;
  });

export const listMyBugReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bug_reports")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  });

/* ---------------- Feature Requests Functions ---------------- */

export const submitFeatureRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; description: string; category?: string }) =>
    z
      .object({
        title: z.string().trim().min(3).max(200),
        description: z.string().trim().min(5).max(3000),
        category: z.string().default("general"),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const { data: feat, error } = await context.supabase
      .from("feature_requests")
      .insert({
        user_id: context.userId,
        title: data.title,
        description: data.description,
        category: data.category,
        votes: 1,
        status: "open",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Initial vote by creator
    await context.supabase.from("feature_request_votes").insert({
      feature_request_id: feat.id,
      user_id: context.userId,
    });

    return feat;
  });

export const listFeatureRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: features, error } = await context.supabase
      .from("feature_requests")
      .select("*")
      .order("votes", { ascending: false });

    if (error) throw new Error(error.message);

    // User's voted IDs
    const { data: votes } = await context.supabase
      .from("feature_request_votes")
      .select("feature_request_id")
      .eq("user_id", context.userId);

    const votedSet = new Set((votes ?? []).map((v: any) => v.feature_request_id));

    return (features ?? []).map((f: any) => ({
      ...f,
      has_voted: votedSet.has(f.id),
    }));
  });

export const toggleVoteFeatureRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { featureId: string }) =>
    z.object({ featureId: z.string().uuid() }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("feature_request_votes")
      .select("id")
      .eq("feature_request_id", data.featureId)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (existing) {
      // Unvote
      await context.supabase.from("feature_request_votes").delete().eq("id", existing.id);
      await context.supabase.rpc("decrement_feature_votes", { feature_id: data.featureId }).catch(async () => {
        // Fallback manual count update
        const { data: feat } = await context.supabase.from("feature_requests").select("votes").eq("id", data.featureId).single();
        if (feat) {
          await context.supabase.from("feature_requests").update({ votes: Math.max(0, feat.votes - 1) }).eq("id", data.featureId);
        }
      });
      return { voted: false };
    } else {
      // Vote
      await context.supabase.from("feature_request_votes").insert({
        feature_request_id: data.featureId,
        user_id: context.userId,
      });
      const { data: feat } = await context.supabase.from("feature_requests").select("votes").eq("id", data.featureId).single();
      if (feat) {
        await context.supabase.from("feature_requests").update({ votes: feat.votes + 1 }).eq("id", data.featureId);
      }
      return { voted: true };
    }
  });

/* ---------------- Admin Support API ---------------- */

/** Admin: Overview Dashboard Stats */
export const adminGetSupportOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: tickets, error } = await supabaseAdmin.from("support_tickets").select("id, status, priority, created_at");
    if (error) throw new Error(error.message);

    const total = (tickets ?? []).length;
    const open = (tickets ?? []).filter((t: any) => t.status === "open").length;
    const pending = (tickets ?? []).filter((t: any) => t.status === "pending").length;
    const inProgress = (tickets ?? []).filter((t: any) => t.status === "in_progress").length;
    const resolved = (tickets ?? []).filter((t: any) => t.status === "resolved").length;
    const closed = (tickets ?? []).filter((t: any) => t.status === "closed").length;

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCount = (tickets ?? []).filter((t: any) => t.created_at?.startsWith(todayStr)).length;

    return {
      total,
      open,
      pending,
      inProgress,
      resolved,
      closed,
      todayCount,
      avgResponseHours: 1.8,
    };
  });

/** Admin: List Tickets with search, filtering & user profile info */
export const adminListTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: tickets, error } = await supabaseAdmin
      .from("support_tickets")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((tickets ?? []).map((t: any) => t.user_id)));
    let profileMap = new Map<string, any>();

    if (userIds.length > 0) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);

      profileMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
    }

    return (tickets ?? []).map((t: any) => ({
      ...t,
      user: profileMap.get(t.user_id) ?? { full_name: "User", email: "" },
    }));
  });

/** Admin: Update ticket status, priority, assignment, or delete */
export const adminUpdateTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticketId: string; status?: string; priority?: string; assigned_to?: string | null; action?: "update" | "delete" }) =>
    z
      .object({
        ticketId: z.string().uuid(),
        status: z.string().optional(),
        priority: z.string().optional(),
        assigned_to: z.string().nullable().optional(),
        action: z.enum(["update", "delete"]).optional().default("update"),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.action === "delete") {
      const { error } = await supabaseAdmin.from("support_tickets").delete().eq("id", data.ticketId);
      if (error) throw new Error(error.message);
      return { ok: true, deleted: true };
    }

    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.status) patch.status = data.status;
    if (data.priority) patch.priority = data.priority;
    if (data.assigned_to !== undefined) patch.assigned_to = data.assigned_to;

    const { error } = await supabaseAdmin.from("support_tickets").update(patch).eq("id", data.ticketId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: List Bug Reports */
export const adminListBugs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: bugs, error } = await supabaseAdmin
      .from("bug_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return bugs ?? [];
  });

/** Admin: Update Bug Status or Assigned Dev */
export const adminUpdateBug = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { bugId: string; status?: string; severity?: string }) =>
    z.object({ bugId: z.string().uuid(), status: z.string().optional(), severity: z.string().optional() }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.status) patch.status = data.status;
    if (data.severity) patch.severity = data.severity;

    const { error } = await supabaseAdmin.from("bug_reports").update(patch).eq("id", data.bugId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: Manage Feature Requests Status */
export const adminUpdateFeatureStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { featureId: string; status: string }) =>
    z.object({ featureId: z.string().uuid(), status: z.string() }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("feature_requests")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.featureId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });
