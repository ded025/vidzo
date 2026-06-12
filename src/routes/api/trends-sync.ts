import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { CATEGORY_QUERIES, type TrendCategory } from "@/lib/trends.functions";

// ─────────────────────────────────────────────────────────────────────
// POST /api/trends-sync
// Fires a live Firecrawl search per category, upserts into global_trends.
// ─────────────────────────────────────────────────────────────────────

// Firecrawl v2 /search response shape:
// { success: true, data: { web: [ { title, url, description, publishedDate? } ] } }
// When `sources` is omitted it defaults to web, but returns flat array.
// We explicitly pass sources:[{type:"web"}] to always get data.web array.
type FirecrawlResult = {
  title: string;
  url: string;
  description?: string;
  publishedDate?: string;
};

type FirecrawlResponse = {
  success?: boolean;
  data?: {
    web?: FirecrawlResult[];
  };
  // v1 fallback: flat array at data
  error?: string;
};

function dedupeKey(title: string, category: string): string {
  return `${category}:${title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 80)}`;
}

function scoreFreshness(publishedDate: string | undefined): number {
  if (!publishedDate) return 50;
  const ageMs = Date.now() - new Date(publishedDate).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays < 0.25) return 100;
  if (ageDays < 1) return 90;
  if (ageDays < 2) return 78;
  if (ageDays < 4) return 65;
  if (ageDays < 7) return 52;
  return 35;
}

async function firecrawlSearch(
  query: string,
  apiKey: string,
): Promise<FirecrawlResult[]> {
  const res = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit: 8,
      tbs: "qdr:d", // past 24h
      sources: [{ type: "web" }, { type: "news" }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Firecrawl HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const fc = (await res.json()) as FirecrawlResponse;

  // v2 with sources returns { data: { web: [...], news: [...] } }
  const webItems: FirecrawlResult[] = fc?.data?.web ?? [];
  // also grab news items if present, merge them
  const newsItems = (fc?.data as Record<string, FirecrawlResult[]>)?.news ?? [];
  return [...webItems, ...newsItems];
}

export const Route = createFileRoute("/api/trends-sync")(
  {
    server: {
      handlers: {
        POST: async ({ request }) => {
          const auth = request.headers.get("authorization") ?? "";
          const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
          const cronSecret = process.env.TRENDS_CRON_SECRET ?? "";
          const isCron = cronSecret && token === cronSecret;

          const supaUrl = process.env.SUPABASE_URL!;
          const supaServiceKey =
            process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY!;
          const firecrawlKey = process.env.FIRECRAWL_API_KEY;

          if (!firecrawlKey) {
            return new Response(
              JSON.stringify({
                error: "FIRECRAWL_API_KEY not set. Connect Firecrawl to use live sync.",
              }),
              { status: 503, headers: { "Content-Type": "application/json" } },
            );
          }

          const supabase = createClient(supaUrl, supaServiceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });

          if (!isCron) {
            const userSupabase = createClient(
              supaUrl,
              process.env.SUPABASE_PUBLISHABLE_KEY!,
              {
                global: { headers: { Authorization: `Bearer ${token}` } },
                auth: { persistSession: false, autoRefreshToken: false },
              },
            );
            const { data: userRes } = await userSupabase.auth.getUser(token);
            if (!userRes?.user?.id) {
              return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
              });
            }
          }

          // Read body ONCE before any other awaits that might consume it
          const body = await request.json().catch(() => ({})) as {
            categories?: string[];
            keywords?: string[];
          };

          // Insert sync run record
          const { data: runRow } = await supabase
            .from("trend_sync_runs")
            .insert({ status: "running" })
            .select("id")
            .single();
          const runId = runRow?.id as string | undefined;

          const requestedCats = (body.categories ?? []) as TrendCategory[];
          const customKeywords = (body.keywords ?? []) as string[];

          // Build list of {category, query} pairs to run
          type SyncTask = { category: TrendCategory | "Custom"; query: string };
          const tasks: SyncTask[] = [];

          // Custom keyword tasks (brand/topic searches)
          for (const kw of customKeywords) {
            tasks.push({ category: "Custom" as TrendCategory, query: kw });
          }

          // Category tasks
          const categoriesToSync: TrendCategory[] =
            requestedCats.length > 0
              ? requestedCats
              : (Object.keys(CATEGORY_QUERIES) as TrendCategory[]);

          for (const category of categoriesToSync) {
            const queries = CATEGORY_QUERIES[category] ?? [];
            for (const q of queries.slice(0, 2)) {
              tasks.push({ category, query: q });
            }
          }

          let totalAdded = 0;
          const errors: string[] = [];

          for (const { category, query } of tasks) {
            try {
              const items = await firecrawlSearch(query, firecrawlKey);

              const rows = items
                .filter((it) => it.title && it.url)
                .map((it) => ({
                  title: it.title.slice(0, 200),
                  summary: (it.description ?? "").slice(0, 600),
                  category,
                  sub_tags: [] as string[],
                  platform_signals: ["web", "news"] as string[],
                  source_url: it.url,
                  source_name: (() => {
                    try {
                      return new URL(it.url).hostname.replace(/^www\./, "");
                    } catch {
                      return null;
                    }
                  })(),
                  published_at: it.publishedDate ?? null,
                  synced_at: new Date().toISOString(),
                  popularity: Math.min(100, 40 + Math.floor(Math.random() * 40)),
                  freshness: scoreFreshness(it.publishedDate),
                  content_ready: true,
                  dedup_key: dedupeKey(it.title, category),
                }));

              if (rows.length > 0) {
                const { error: upsertErr } = await supabase
                  .from("global_trends")
                  .upsert(rows, { onConflict: "dedup_key", ignoreDuplicates: false });
                if (upsertErr) {
                  errors.push(`${category} upsert: ${upsertErr.message}`);
                } else {
                  totalAdded += rows.length;
                }
              }
            } catch (e) {
              errors.push(`${category} ["${query}"]: ${e instanceof Error ? e.message : String(e)}`);
            }
          }

          // Clean up stale trends older than 7 days
          const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          await supabase.from("global_trends").delete().lt("synced_at", cutoff);

          // Finalize sync run
          if (runId) {
            await supabase
              .from("trend_sync_runs")
              .update({
                finished_at: new Date().toISOString(),
                status: errors.length === 0 ? "success" : "error",
                trends_added: totalAdded,
                error_msg: errors.length > 0 ? errors.join(" | ") : null,
              })
              .eq("id", runId);
          }

          return new Response(
            JSON.stringify({
              ok: true,
              added: totalAdded,
              categories: categoriesToSync.length,
              customKeywords: customKeywords.length,
              errors,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        },
      },
    },
  },
);
