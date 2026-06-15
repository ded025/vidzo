import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, useRef } from "react";
import { createThread } from "@/lib/threads.functions";
import {
  listGlobalTrends,
  getLastSyncRun,
  TREND_CATEGORIES,
  type TrendCategory,
  type GlobalTrend,
} from "@/lib/trends.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp, Sparkles, RefreshCw, Zap, Clock, Globe2, ChevronRight,
  Bot, DollarSign, Rocket, Megaphone, Users, ShoppingCart,
  Dumbbell, Film, Bitcoin, Laptop, BriefcaseBusiness, CircleDollarSign,
  Search, Tag, X, Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/chat/trends")({
  component: TrendsPage,
});

const CATEGORY_META: Record<
  TrendCategory | "All",
  { icon: React.ElementType; grad: string; emoji: string }
> = {
  All: { icon: Globe2, grad: "from-slate-500 to-slate-700", emoji: "🌍" },
  AI: { icon: Bot, grad: "from-violet-500 to-purple-700", emoji: "🤖" },
  Finance: { icon: CircleDollarSign, grad: "from-emerald-500 to-teal-600", emoji: "💰" },
  Startups: { icon: Rocket, grad: "from-pink-500 to-rose-600", emoji: "🚀" },
  Funding: { icon: DollarSign, grad: "from-amber-400 to-orange-500", emoji: "💸" },
  Marketing: { icon: Megaphone, grad: "from-fuchsia-500 to-pink-600", emoji: "📣" },
  "Creator Economy": { icon: Users, grad: "from-sky-500 to-blue-600", emoji: "🎥" },
  Tech: { icon: Laptop, grad: "from-blue-500 to-cyan-600", emoji: "💻" },
  Business: { icon: BriefcaseBusiness, grad: "from-indigo-500 to-violet-600", emoji: "📊" },
  Ecommerce: { icon: ShoppingCart, grad: "from-lime-500 to-green-600", emoji: "🛒" },
  Fitness: { icon: Dumbbell, grad: "from-orange-400 to-red-500", emoji: "💪" },
  Entertainment: { icon: Film, grad: "from-rose-500 to-pink-600", emoji: "🎬" },
  Crypto: { icon: Bitcoin, grad: "from-yellow-400 to-amber-500", emoji: "₿" },
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "hottest", label: "🔥 Hottest" },
  { value: "freshest", label: "⚡ Freshest" },
] as const;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function FreshnessChip({ score }: { score: number }) {
  if (score >= 85)
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full px-2 py-0.5">
        ⚡ Live
      </span>
    );
  if (score >= 65)
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-full px-2 py-0.5">
        🔥 Hot
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-muted text-muted-foreground rounded-full px-2 py-0.5">
      📅 Recent
    </span>
  );
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground w-6 text-right">{value}</span>
    </div>
  );
}

function TrendCard({ trend, onUse }: { trend: GlobalTrend; onUse: (t: GlobalTrend) => void }) {
  const meta =
    CATEGORY_META[trend.category as TrendCategory] ?? CATEGORY_META["All"];
  const Icon = meta.icon;
  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`h-8 w-8 rounded-lg bg-gradient-to-br ${meta.grad} text-white flex items-center justify-center shrink-0`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              {trend.category}
            </span>
            <FreshnessChip score={trend.freshness} />
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {timeAgo(trend.synced_at)}
        </span>
      </div>

      <p className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {trend.title}
      </p>

      {trend.summary && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {trend.summary}
        </p>
      )}

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Popularity</span>
          <span>Freshness</span>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <ScoreBar value={trend.popularity} color="bg-primary" />
          </div>
          <div className="flex-1">
            <ScoreBar value={trend.freshness} color="bg-amber-400" />
          </div>
        </div>
      </div>

      {trend.source_name && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Globe2 className="h-3 w-3" />
          <span className="truncate">{trend.source_name}</span>
          {trend.source_url && (
            <a
              href={trend.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-primary hover:underline shrink-0"
            >
              ↗
            </a>
          )}
        </div>
      )}

      <Button
        size="sm"
        className="w-full gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white mt-auto"
        onClick={() => onUse(trend)}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Generate content
        <ChevronRight className="h-3.5 w-3.5 ml-auto" />
      </Button>
    </div>
  );
}

function EmptyState({ onSync, syncing }: { onSync: () => void; syncing: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white mb-4">
        <Globe2 className="h-8 w-8" />
      </div>
      <h3 className="font-bold text-lg mb-1">No trends synced yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        Hit <strong>Sync Trends</strong> to pull the latest global stories from across the web.
      </p>
      <Button
        onClick={onSync}
        disabled={syncing}
        className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
      >
        {syncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        {syncing ? "Syncing…" : "Sync Trends Now"}
      </Button>
    </div>
  );
}

// ── Keyword pill input ───────────────────────────────────────────────
function KeywordInput({
  keywords,
  onChange,
}: {
  keywords: string[];
  onChange: (kws: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const add = () => {
    const v = draft.trim();
    if (v && !keywords.includes(v)) onChange([...keywords, v]);
    setDraft("");
  };

  const remove = (kw: string) => onChange(keywords.filter((k) => k !== kw));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 flex-wrap border border-border rounded-xl bg-card px-3 py-2 min-h-[44px] cursor-text" onClick={() => inputRef.current?.focus()}>
        <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {keywords.map((kw) => (
          <span
            key={kw}
            className="inline-flex items-center gap-1 bg-violet-500/15 text-violet-700 dark:text-violet-300 text-xs font-medium rounded-full px-2.5 py-0.5"
          >
            {kw}
            <button onClick={() => remove(kw)} className="hover:opacity-70">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !draft && keywords.length) {
              onChange(keywords.slice(0, -1));
            }
          }}
          placeholder={keywords.length === 0 ? "Add brand / keyword and press Enter…" : ""}
          className="flex-1 min-w-[180px] outline-none text-sm bg-transparent placeholder:text-muted-foreground"
        />
        {draft && (
          <button
            onClick={add}
            className="shrink-0 text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-0.5"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        )}
      </div>
      {keywords.length > 0 && (
        <p className="text-[11px] text-muted-foreground pl-1">
          {keywords.length} keyword{keywords.length !== 1 ? "s" : ""} — will be synced alongside selected categories
        </p>
      )}
    </div>
  );
}

export function TrendsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const createThreadFn = useServerFn(createThread);
  const listTrendsFn = useServerFn(listGlobalTrends);
  const lastRunFn = useServerFn(getLastSyncRun);

  const [activeCategory, setActiveCategory] = useState<TrendCategory | "All">("All");
  const [sort, setSort] = useState<"newest" | "hottest" | "freshest">("newest");
  const [custom, setCustom] = useState("");
  // syncing is a ref so refetchInterval closure always sees the latest value
  const syncingRef = useRef(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // Custom brand/keyword inputs
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [showKeywordInput, setShowKeywordInput] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
    });
  }, []);

  const trendsQuery = useQuery({
    queryKey: ["global_trends", activeCategory, sort],
    queryFn: () =>
      listTrendsFn({
        data: {
          category: activeCategory === "All" ? undefined : activeCategory,
          sort,
          limit: 60,
        },
      }),
    staleTime: 2 * 60 * 1000,
  });

  // FIX: use syncingRef.current so the interval closure always reads fresh value
  const lastRunQuery = useQuery({
    queryKey: ["last_sync_run"],
    queryFn: () => lastRunFn(),
    // Poll every 3s while syncing; stop as soon as syncingRef is false
    refetchInterval: () => (syncingRef.current ? 3000 : false),
  });

  const startContent = useMutation({
    mutationFn: async (query: string) => {
      const brief = `Search live sources for: "${query}". Find the most viral angle, verify with sources, and generate a full detailed content pack.`;
      const t = await createThreadFn({ data: { title: query.slice(0, 60), contextBrief: brief } });
      return { t, brief };
    },
    onSuccess: ({ t, brief }) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      sessionStorage.setItem(`pending:${t!.id}`, brief);
      navigate({ to: "/chat/$threadId", params: { threadId: t!.id } });
    },
  });

  const doSync = async (opts: { categories?: string[]; keywords?: string[] } = {}) => {
    if (!token) { setSyncMsg("Not authenticated."); return; }
    syncingRef.current = true;
    setSyncing(true);
    setSyncMsg(null);
    // Kick off the refetch interval
    qc.invalidateQueries({ queryKey: ["last_sync_run"] });
    try {
      const res = await fetch("/api/trends-sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(opts),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        added?: number;
        errors?: string[];
        error?: string;
      };
      if (json.ok) {
        setSyncMsg(`✅ Synced! ${json.added ?? 0} new trends added.`);
        await qc.invalidateQueries({ queryKey: ["global_trends"] });
        await qc.invalidateQueries({ queryKey: ["last_sync_run"] });
      } else {
        setSyncMsg(`⚠️ ${json.error ?? "Sync failed"}`);
      }
    } catch (e) {
      setSyncMsg(`❌ ${e instanceof Error ? e.message : "Network error"}`);
    } finally {
      // FIX: clear ref THEN state so the interval stops on next tick
      syncingRef.current = false;
      setSyncing(false);
    }
  };

  const handleSync = () =>
    doSync({ keywords: customKeywords.length > 0 ? customKeywords : undefined });

  const handleSyncCategory = (cat: TrendCategory) =>
    doSync({
      categories: [cat],
      keywords: customKeywords.length > 0 ? customKeywords : undefined,
    });

  const handleKeywordSync = () =>
    doSync({ keywords: customKeywords });

  const lastRun = lastRunQuery.data;
  const allTrends = (trendsQuery.data ?? []) as GlobalTrend[];
  const allCategories: (TrendCategory | "All")[] = ["All", ...TREND_CATEGORIES];

  // Brand filter — derived from sub_tags of loaded trends
  const [brandFilter, setBrandFilter] = useState<string>("");
  const brandOptions = Array.from(
    new Set(
      allTrends
        .flatMap((t) => t.sub_tags ?? [])
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length < 40),
    ),
  ).sort();
  const trends = brandFilter
    ? allTrends.filter((t) => (t.sub_tags ?? []).some((s) => s.toLowerCase() === brandFilter.toLowerCase()))
    : allTrends;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Global Trends</h1>
              <p className="text-sm text-muted-foreground">
                Real-time intelligence from across the web — AI, Finance, Startups & more.
              </p>
            </div>
          </div>

          {/* Sync controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {lastRun && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border rounded-lg px-3 py-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Last synced {timeAgo(lastRun.finished_at ?? lastRun.started_at)}</span>
                <span
                  className={`ml-1 h-2 w-2 rounded-full ${
                    lastRun.status === "success"
                      ? "bg-emerald-500"
                      : lastRun.status === "error"
                      ? "bg-red-500"
                      : "bg-amber-400 animate-pulse"
                  }`}
                />
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setShowKeywordInput((v) => !v)}
            >
              <Tag className="h-3.5 w-3.5" />
              {showKeywordInput ? "Hide Keywords" : "Brand Keywords"}
              {customKeywords.length > 0 && (
                <span className="ml-1 bg-violet-500/15 text-violet-700 dark:text-violet-300 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                  {customKeywords.length}
                </span>
              )}
            </Button>
            <Button
              onClick={handleSync}
              disabled={syncing}
              className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white"
            >
              {syncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {syncing ? "Syncing…" : "Sync Trends"}
            </Button>
          </div>
        </div>

        {/* ── Brand / Keyword input panel ── */}
        {showKeywordInput && (
          <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Brand & Keyword Sync</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add brand names, product names, or any topic — Vidzo will search live news for them.
                </p>
              </div>
              {customKeywords.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleKeywordSync}
                  disabled={syncing}
                  className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs"
                >
                  {syncing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                  Sync Keywords
                </Button>
              )}
            </div>
            <KeywordInput keywords={customKeywords} onChange={setCustomKeywords} />
          </div>
        )}

        {/* Sync message */}
        {syncMsg && (
          <div className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm flex items-center justify-between gap-2">
            <span>{syncMsg}</span>
            <button onClick={() => setSyncMsg(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Custom search bar ── */}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (custom.trim()) startContent.mutate(custom.trim());
          }}
        >
          <Input
            placeholder="Search any topic — Vidzo finds live sources and builds a content pack…"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="bg-card"
          />
          <Button type="submit" disabled={!custom.trim() || startContent.isPending} className="shrink-0">
            <Sparkles className="h-4 w-4 mr-1.5" /> Generate
          </Button>
        </form>

        {/* ── Category pills ── */}
        <div className="flex gap-2 flex-wrap">
          {allCategories.map((cat) => {
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                  active
                    ? `bg-gradient-to-r ${meta.grad} text-white border-transparent shadow-sm`
                    : "bg-card border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat}
              </button>
            );
          })}

          {activeCategory !== "All" && (
            <button
              onClick={() => handleSyncCategory(activeCategory as TrendCategory)}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-dashed border-primary text-primary bg-card hover:bg-primary/5 transition-all disabled:opacity-50"
            >
              {syncing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Sync {activeCategory}
            </button>
          )}
        </div>

        {/* ── Sort + brand filter + stats bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setSort(o.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  sort === o.value
                    ? "bg-foreground text-background"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
            {brandOptions.length > 0 && (
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="ml-2 px-3 py-1 rounded-lg text-xs font-medium bg-card border border-border text-foreground hover:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">All brands / tags</option>
                {brandOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}
            {brandFilter && (
              <button
                onClick={() => setBrandFilter("")}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {trendsQuery.isLoading ? "Loading…" : `${trends.length} trends${brandFilter ? ` · ${brandFilter}` : ""}`}
          </span>
        </div>

        {/* ── Trend grid ── */}
        {trendsQuery.isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-4 animate-pulse space-y-3"
              >
                <div className="h-8 w-8 rounded-lg bg-border" />
                <div className="h-4 w-3/4 bg-border rounded" />
                <div className="h-3 w-full bg-border rounded" />
                <div className="h-3 w-5/6 bg-border rounded" />
                <div className="h-8 w-full bg-border rounded-lg mt-2" />
              </div>
            ))}
          </div>
        ) : trends.length === 0 ? (
          <EmptyState onSync={handleSync} syncing={syncing} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {trends.map((tr) => (
              <TrendCard
                key={tr.id}
                trend={tr}
                onUse={(t) =>
                  startContent.mutate(
                    `${t.category} trend: "${t.title}". ${
                      t.summary ? `Context: ${t.summary}` : ""
                    } Search live sources and generate a full detailed content pack.`,
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
