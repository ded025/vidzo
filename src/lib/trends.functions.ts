import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ─── Types ────────────────────────────────────────────────────────────
export type TrendCategory =
  | "AI"
  | "Finance"
  | "Startups"
  | "Funding"
  | "Marketing"
  | "Creator Economy"
  | "Tech"
  | "Business"
  | "Ecommerce"
  | "Fitness"
  | "Entertainment"
  | "Crypto";

export const TREND_CATEGORIES: TrendCategory[] = [
  "AI",
  "Finance",
  "Startups",
  "Funding",
  "Marketing",
  "Creator Economy",
  "Tech",
  "Business",
  "Ecommerce",
  "Fitness",
  "Entertainment",
  "Crypto",
];

// Firecrawl search queries per category
export const CATEGORY_QUERIES: Record<TrendCategory, string[]> = {
  AI: [
    "AI tools viral latest 2026",
    "artificial intelligence breakthrough latest news",
    "AI startup funding latest",
  ],
  Finance: [
    "finance market trends latest news",
    "stock market crash or rally latest",
    "personal finance viral tips latest",
  ],
  Startups: [
    "startup viral story latest",
    "founder journey trending latest",
    "Indian startup latest news",
  ],
  Funding: [
    "startup funding round latest",
    "VC investment latest funding news",
    "unicorn funding latest",
  ],
  Marketing: [
    "marketing campaign going viral latest",
    "brand marketing trend latest",
    "social media marketing trend latest",
  ],
  "Creator Economy": [
    "creator economy latest news",
    "influencer monetization latest",
    "YouTube creator latest trend",
  ],
  Tech: ["tech product launch latest", "big tech news latest", "gadget viral latest"],
  Business: [
    "business strategy viral latest",
    "entrepreneur business latest news",
    "company growth story latest",
  ],
  Ecommerce: ["ecommerce trend latest", "D2C brand viral latest", "online shopping trend latest"],
  Fitness: [
    "fitness trend viral latest",
    "gym workout trend latest",
    "health wellness viral latest",
  ],
  Entertainment: [
    "entertainment viral latest",
    "movies box office latest",
    "OTT show trending latest",
  ],
  Crypto: ["crypto market latest news", "bitcoin ethereum latest", "crypto startup latest"],
};

export interface GlobalTrend {
  id: string;
  title: string;
  summary: string;
  category: TrendCategory;
  sub_tags: string[];
  platform_signals: string[];
  source_url: string | null;
  source_name: string | null;
  image_url: string | null;
  published_at: string | null;
  synced_at: string;
  popularity: number;
  freshness: number;
  content_ready: boolean;
}

export interface SyncRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "success" | "error";
  trends_added: number;
  error_msg: string | null;
}

// ─── List trends ──────────────────────────────────────────────────────
export const listGlobalTrends = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        category: z.string().optional(),
        sort: z.enum(["newest", "hottest", "freshest"]).optional(),
        limit: z.number().optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("global_trends").select("*");

    if (data.category && data.category !== "All") {
      q = q.eq("category", data.category);
    }

    const sort = data.sort ?? "newest";
    if (sort === "hottest") {
      q = q.order("popularity", { ascending: false });
    } else if (sort === "freshest") {
      q = q.order("freshness", { ascending: false });
    } else {
      q = q.order("synced_at", { ascending: false });
    }

    q = q.limit(data.limit ?? 60);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as GlobalTrend[];
  });

// ─── Last sync run ────────────────────────────────────────────────────
export const getLastSyncRun = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("trend_sync_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as SyncRun | null;
  });
