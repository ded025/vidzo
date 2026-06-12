import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { CATEGORY_QUERIES, type TrendCategory } from "@/lib/trends.functions";

// ─────────────────────────────────────────────────────────────────────
// POST /api/trends-sync
// Fires a live Firecrawl search per category, upserts into global_trends.
// Called by the "Sync Trends" button in the UI or a cron job.
// ─────────────────────────────────────────────────────────────────────

type FirecrawlResult = {
  title: string;
  url: string;
  description?: string;
  publishedDate?: string;
};

type FirecrawlResponse = {
  data?: { web?: FirecrawlResult[] };
  success?: boolean;
};

function dedupeKey(title: string, category: string): string {
  // simple stable key: lowercase alphanum only
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

export const Route = createFileRoute("/api/trends-sync")(
  {
    server: {
      handlers: {
        POST: async ({ request }) => {
          // Auth — accept either Bearer token from the user OR a cron secret
          const auth = request.headers.get("authorization") ?? "";
          const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
          const cronSecret = process.env.TRENDS_CRON_SECRET ?? "";
          const isCron = cronSecret && token === cronSecret;

          const supaUrl = process.env.SUPABASE_URL!;
          const supaServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY!;
          const firecrawlKey = process.env.FIRECRAWL_API_KEY;

          if (!firecrawlKey) {
            return new Response(
              JSON.stringify({ error: "FIRECRAWL_API_KEY not set. Connect Firecrawl to use live sync." }),
              { status: 503, headers: { "Content-Type": "application/json" } },
            );
          }

          // If not cron, verify the JWT belongs to a real user
          const supabase = createClient(supaUrl, supaServiceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });

          if (!isCron) {
            const userSupabase = createClient(supaUrl, process.env.SUPABASE_PUBLISHABLE_KEY!, {
              global: { headers: { Authorization: `Bearer ${token}` } },
              auth: { persistSession: false, autoRefreshToken: false },
            });
            const { data: userRes } = await userSupabase.auth.getUser(token);
            if (!userRes?.user?.id) {
              return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
              });
            }
          }

          // Insert sync run record
          const { data: runRow } = await supabase
            .from("trend_sync_runs")
            .insert({ status: "running" })
            .select("id")
            .single();
          const runId = runRow?.id as string | undefined;

          const body = await request.json().catch(() => ({})) as { categories?: string[] };
          const requestedCats = (body.categories ?? []) as TrendCategory[];
          const categoriesToSync: TrendCategory[] =
            requestedCats.length > 0
              ? requestedCats
              : (Object.keys(CATEGORY_QUERIES) as TrendCategory[]);

          let totalAdded = 0;
          const errors: string[] = [];

          for (const category of categoriesToSync) {
            const queries = CATEGORY_QUERIES[category] ?? [];
            for (const query of queries.slice(0, 2)) {
              // max 2 queries per category per sync to keep it fast
              try {
                const res = await fetch("https://api.firecrawl.dev/v2/search", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${firecrawlKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ query, limit: 6, tbs: "qdr:d" }), // qdr:d = past 24h
                });

                if (!res.ok) {
                  errors.push(`${category}: HTTP ${res.status}`);
                  continue;
                }

                const fc = (await res.json()) as FirecrawlResponse;
                const items: FirecrawlResult[] = fc?.data?.web ?? [];

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
                      try { return new URL(it.url).hostname.replace(/^www\./, ""); }
                      catch { return null; }
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
                errors.push(`${category}: ${e instanceof Error ? e.message : String(e)}`);
              }
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
            JSON.stringify({ ok: true, added: totalAdded, categories: categoriesToSync.length, errors }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        },
      },
    },
  },
);
