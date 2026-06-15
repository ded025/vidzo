import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { CATEGORY_QUERIES, type TrendCategory } from "@/lib/trends.functions";

// ─────────────────────────────────────────────────────────────────────
// POST /api/trends-sync
// Firecrawl v2 /search — correct field mapping per OpenAPI spec:
//   web results:  { title, url, description, publishedDate? }
//   news results: { title, url, snippet, date }
//   tbs goes inside the web source object, NOT at top level when using sources[]
// ─────────────────────────────────────────────────────────────────────

type FirecrawlWebResult = {
  title: string;
  url: string;
  description?: string;
  publishedDate?: string;
};

type FirecrawlNewsResult = {
  title: string;
  url: string;
  snippet?: string;   // news uses snippet, not description
  date?: string;      // news uses date, not publishedDate
};

type FirecrawlResponse = {
  success?: boolean;
  data?: {
    web?: FirecrawlWebResult[];
    news?: FirecrawlNewsResult[];
  };
  error?: string;
};

// Normalised shape we work with internally
type NormalisedResult = {
  title: string;
  url: string;
  summary: string;
  publishedDate?: string;
};

function dedupeKey(title: string, category: string): string {
  return `${category}:${title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 80)}`;
}

function scoreFreshness(publishedDate: string | undefined): number {
  if (!publishedDate) return 50;
  const ageMs = Date.now() - new Date(publishedDate).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays < 0.25) return 100;
  if (ageDays < 1)    return 90;
  if (ageDays < 2)    return 78;
  if (ageDays < 4)    return 65;
  if (ageDays < 7)    return 52;
  return 35;
}

async function firecrawlSearch(
  query: string,
  apiKey: string,
): Promise<NormalisedResult[]> {
  const res = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    // tbs goes INSIDE the web source object per Firecrawl v2 OpenAPI spec
    body: JSON.stringify({
      query,
      limit: 6,
      timeout: 25000,
      sources: [
        { type: "web", tbs: "qdr:w" },  // past week for web
        { type: "news" },                // news (already recent by default)
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Firecrawl HTTP ${res.status}: ${text.slice(0, 300)}`);
  }

  const fc = (await res.json()) as FirecrawlResponse;

  // Map web results
  const webNorm: NormalisedResult[] = (fc?.data?.web ?? []).map((it) => ({
    title: it.title,
    url: it.url,
    summary: (it.description ?? "").slice(0, 600),
    publishedDate: it.publishedDate,
  }));

  // Map news results — different field names: snippet + date
  const newsNorm: NormalisedResult[] = (fc?.data?.news ?? []).map((it) => ({
    title: it.title,
    url: it.url,
    summary: (it.snippet ?? "").slice(0, 600),
    publishedDate: it.date,
  }));

  return [...webNorm, ...newsNorm];
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
              JSON.stringify({ error: "FIRECRAWL_API_KEY not set." }),
              { status: 503, headers: { "Content-Type": "application/json" } },
            );
          }

          const supabase = createClient(supaUrl, supaServiceKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });

          if (!isCron) {
            if (!token) {
              return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401, headers: { "Content-Type": "application/json" },
              });
            }
            const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
            if (userErr || !userRes?.user?.id) {
              return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401, headers: { "Content-Type": "application/json" },
              });
            }
          }

          // Read body ONCE
          const body = (await request.json().catch(() => ({}))) as {
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

          type SyncTask = { category: TrendCategory | "Custom"; query: string; brandTag?: string };
          const tasks: SyncTask[] = [];

          // Custom keyword tasks — enrich the query so we pull the LATEST
          // features / launches / news for that brand or topic, and tag the
          // resulting rows with the original keyword so the UI brand filter
          // can group them.
          for (const kw of customKeywords) {
            const q = `${kw} latest features news launch update 2026`;
            tasks.push({ category: "Custom" as TrendCategory, query: q, brandTag: kw });
          }

          // Category tasks — limit to 1 query per category to avoid timeouts
          const categoriesToSync: TrendCategory[] =
            requestedCats.length > 0
              ? requestedCats
              : (Object.keys(CATEGORY_QUERIES) as TrendCategory[]);

          for (const category of categoriesToSync) {
            const queries = CATEGORY_QUERIES[category] ?? [];
            // 1 query per category for full sync, 2 for single-category sync
            const limit = requestedCats.length > 0 ? 2 : 1;
            for (const q of queries.slice(0, limit)) {
              tasks.push({ category, query: q });
            }
          }

          let totalAdded = 0;
          const errors: string[] = [];

          for (const { category, query, brandTag } of tasks) {
            try {
              const items = await firecrawlSearch(query, firecrawlKey);

              const rows = items
                .filter((it) => it.title && it.url)
                .map((it) => ({
                  title: it.title.slice(0, 200),
                  summary: it.summary,
                  category,
                  sub_tags: brandTag ? [brandTag] : ([] as string[]),
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
              errors.push(
                `${category} ["${query.slice(0, 40)}"]: ${e instanceof Error ? e.message : String(e)}`,
              );
            }
          }

          // Clean up stale trends older than 7 days
          const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          await supabase.from("global_trends").delete().lt("synced_at", cutoff);

          if (runId) {
            await supabase
              .from("trend_sync_runs")
              .update({
                finished_at: new Date().toISOString(),
                status: errors.length === 0 ? "success" : totalAdded > 0 ? "success" : "error",
                trends_added: totalAdded,
                error_msg: errors.length > 0 ? errors.slice(0, 5).join(" | ") : null,
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
