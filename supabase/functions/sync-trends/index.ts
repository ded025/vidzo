import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

type TrendCategory =
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

type NewsArticle = {
  url: string;
  title: string;
  publishedAt: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
};

const CATEGORY_QUERIES: Record<TrendCategory, string> = {
  AI: '"artificial intelligence" OR OpenAI OR "AI tools"',
  Finance: 'finance OR "stock market" OR "personal finance"',
  Startups: "startup OR founder OR entrepreneurship",
  Funding: '"startup funding" OR "venture capital" OR unicorn',
  Marketing: "marketing OR advertising OR campaign",
  "Creator Economy": '"creator economy" OR influencer OR YouTube',
  Tech: "technology OR software OR gadget",
  Business: "business OR company OR revenue",
  Ecommerce: "ecommerce OR D2C OR retail",
  Fitness: "fitness OR gym OR workout",
  Entertainment: "film OR movie OR OTT OR Bollywood",
  Crypto: "crypto OR bitcoin OR ethereum",
};

const AUTO_SYNC_INTERVAL_MS = 30 * 60 * 1000;
const RUN_LOCK_MS = 10 * 60 * 1000;
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: jsonHeaders });
}

function dedupeKey(title: string, category: string) {
  return `${category}:${title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 80)}`;
}

function normalizeSeenDate(seenDate?: string | null) {
  if (!seenDate) return null;
  return seenDate.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, "$1-$2-$3T$4:$5:$6Z");
}

function scoreFreshness(seenDate?: string | null) {
  if (!seenDate) return 50;
  const normalized = normalizeSeenDate(seenDate);
  const ageHours = normalized ? (Date.now() - new Date(normalized).getTime()) / 3_600_000 : 100;
  if (ageHours < 3) return 100;
  if (ageHours < 8) return 92;
  if (ageHours < 24) return 82;
  if (ageHours < 48) return 68;
  if (ageHours < 96) return 54;
  return 40;
}

function classifyCategory(title: string, candidates: TrendCategory[]) {
  const value = title.toLowerCase();
  let best = candidates[0] ?? "Business";
  let score = -1;
  for (const category of candidates) {
    const terms = CATEGORY_QUERIES[category]
      .toLowerCase()
      .replace(/"/g, "")
      .split(/\s+or\s+|\s+/)
      .filter((term) => term.length > 2);
    const nextScore = terms.reduce((total, term) => total + Number(value.includes(term)), 0);
    if (nextScore > score) {
      best = category;
      score = nextScore;
    }
  }
  return best;
}

async function authenticate(req: Request) {
  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!token || !url || !anonKey) return false;
  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  return !error && Boolean(data.user);
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function tagValue(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1].trim()) : null;
}

async function googleNewsSearch(query: string) {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", `${query} when:2d`);
  url.searchParams.set("hl", "en-IN");
  url.searchParams.set("gl", "IN");
  url.searchParams.set("ceid", "IN:en");
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 Vidzo/1.0 (+https://vidzo.in)" },
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`Trend source returned HTTP ${response.status}.`);
  const text = await response.text();
  return Array.from(text.matchAll(/<item>([\s\S]*?)<\/item>/gi))
    .slice(0, 50)
    .map((match): NewsArticle | null => {
      const item = match[1];
      const title = tagValue(item, "title");
      const articleUrl = tagValue(item, "link");
      if (!title || !articleUrl) return null;
      const sourceMatch = item.match(/<source(?:\s+url="([^"]*)")?>([\s\S]*?)<\/source>/i);
      return {
        title,
        url: articleUrl,
        publishedAt: tagValue(item, "pubDate"),
        sourceUrl: sourceMatch?.[1] ? decodeXml(sourceMatch[1]) : null,
        sourceName: sourceMatch?.[2] ? decodeXml(sourceMatch[2].trim()) : null,
      };
    })
    .filter((article): article is NewsArticle => article !== null);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonError("Method not allowed.", 405);
  if (!(await authenticate(req))) return jsonError("Unauthorized.", 401);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) return jsonError("Supabase service access is unavailable.", 503);
  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const body = (await req.json().catch(() => ({}))) as {
    categories?: string[];
    keywords?: string[];
    auto?: boolean;
  };
  const now = Date.now();
  if (body.auto) {
    const { data: recentRun } = await admin
      .from("trend_sync_runs")
      .select("started_at, finished_at, status")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recentRun) {
      const startedAt = new Date(recentRun.started_at).getTime();
      const finishedAt = recentRun.finished_at
        ? new Date(recentRun.finished_at).getTime()
        : startedAt;
      if (
        (recentRun.status === "success" && now - finishedAt < AUTO_SYNC_INTERVAL_MS) ||
        (recentRun.status === "running" && now - startedAt < RUN_LOCK_MS)
      ) {
        return Response.json({ ok: true, skipped: true, added: 0 }, { headers: jsonHeaders });
      }
    }
  }

  const allCategories = Object.keys(CATEGORY_QUERIES) as TrendCategory[];
  const requestedCategories = (body.categories ?? []).filter(
    (category): category is TrendCategory => Object.hasOwn(CATEGORY_QUERIES, category),
  );
  const categories =
    requestedCategories.length > 0 ? requestedCategories.slice(0, 4) : allCategories;
  const keywords = (body.keywords ?? [])
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 6);
  const query =
    keywords.length > 0
      ? keywords.map((keyword) => `"${keyword.replace(/"/g, "")}"`).join(" OR ")
      : categories.map((category) => `(${CATEGORY_QUERIES[category]})`).join(" OR ");

  const { data: run } = await admin
    .from("trend_sync_runs")
    .insert({ status: "running" })
    .select("id")
    .single();

  try {
    const articles = await googleNewsSearch(query);
    const rows = articles.map((article) => {
      const category = keywords.length > 0 ? "Custom" : classifyCategory(article.title, categories);
      const freshness = scoreFreshness(article.publishedAt);
      const matchedKeywords = keywords.filter((keyword) =>
        article.title.toLowerCase().includes(keyword.toLowerCase()),
      );
      return {
        title: article.title.slice(0, 200),
        summary: "",
        category,
        sub_tags: matchedKeywords.length > 0 ? matchedKeywords : keywords.slice(0, 1),
        platform_signals: ["web", "news"],
        source_url: article.url,
        source_name:
          article.sourceName ??
          (article.sourceUrl
            ? new URL(article.sourceUrl).hostname.replace(/^www\./, "")
            : "Google News"),
        
        published_at: article.publishedAt ? new Date(article.publishedAt).toISOString() : null,
        synced_at: new Date().toISOString(),
        popularity: Math.min(100, Math.round(freshness * 0.8 + 18)),
        freshness,
        content_ready: true,
        dedup_key: dedupeKey(article.title, category),
      };
    });

    if (rows.length > 0) {
      const { error } = await admin
        .from("global_trends")
        .upsert(rows, { onConflict: "dedup_key", ignoreDuplicates: false });
      if (error) throw error;
    }
    if (run?.id) {
      await admin
        .from("trend_sync_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "success",
          trends_added: rows.length,
          error_msg: null,
        })
        .eq("id", run.id);
    }
    return Response.json(
      { ok: true, added: rows.length, sourceRequests: 1, aiRequests: 0 },
      { headers: jsonHeaders },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (run?.id) {
      await admin
        .from("trend_sync_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "error",
          trends_added: 0,
          error_msg: message.slice(0, 500),
        })
        .eq("id", run.id);
    }
    return jsonError(message, 502);
  }
});
