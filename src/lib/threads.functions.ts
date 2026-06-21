import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("threads")
      .select("id, title, updated_at, context_brief")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ title: z.string().optional(), contextBrief: z.string().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("threads")
      .insert({
        user_id: context.userId,
        title: data.title ?? "New chat",
        context_brief: data.contextBrief ?? null,
      })
      .select("id, title, updated_at, context_brief")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const setThreadBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ id: z.string(), contextBrief: z.string() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("threads")
      .update({ context_brief: data.contextBrief })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const renameThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string(), title: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("threads")
      .update({ title: data.title })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("threads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getThreadMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ threadId: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("id, role, parts, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id as string,
      role: r.role as "user" | "assistant" | "system",
      parts: r.parts as unknown as { type: string; text?: string }[],
    }));
  });

export const listScripts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("scripts")
      .select("id, topic, data, created_at, thread_id, folder")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [
      { count: scriptsTotal },
      { count: scriptsWeek },
      { count: threadsTotal },
      { count: messagesTotal },
      scriptsRows,
    ] = await Promise.all([
      context.supabase.from("scripts").select("id", { count: "exact", head: true }),
      context.supabase
        .from("scripts")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo),
      context.supabase.from("threads").select("id", { count: "exact", head: true }),
      context.supabase.from("messages").select("id", { count: "exact", head: true }),
      context.supabase.from("scripts").select("data").limit(500),
    ]);
    let sourcesUsed = 0;
    const rows = (scriptsRows.data ?? []) as Array<{ data: unknown }>;
    for (const r of rows) {
      const d = r.data as { sources?: unknown[] } | null;
      if (d && Array.isArray(d.sources)) sourcesUsed += d.sources.length;
    }
    return {
      scriptsTotal: scriptsTotal ?? 0,
      scriptsWeek: scriptsWeek ?? 0,
      threadsTotal: threadsTotal ?? 0,
      messagesTotal: messagesTotal ?? 0,
      sourcesUsed,
    };
  });

/* =================== PRESETS =================== */

const PresetInput = z.object({
  name: z.string().min(1),
  niche: z.string().optional(),
  audience: z.string().optional(),
  tone: z.string().optional(),
  language: z.string().optional(),
  default_voice_id: z.string().optional(),
  default_voice_name: z.string().optional(),
});

export const listPresets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("presets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createPreset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => PresetInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("presets")
      .insert({ ...data, user_id: context.userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deletePreset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("presets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const activatePreset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("presets")
      .update({ is_active: false })
      .eq("user_id", context.userId);
    const { error } = await context.supabase
      .from("presets")
      .update({ is_active: true })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
