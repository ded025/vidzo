import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardStats, listScripts, listThreads } from "@/lib/threads.functions";
import {
  TrendingUp,
  Package,
  BookOpen,
  FileText,
  ArrowRight,
  Rocket,
  Trophy,
  ShoppingBag,
  Dumbbell,
  Film,
  Coins,
  Laptop,
  User,
  Clapperboard,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { computeQuality } from "@/lib/quality";
import { normalizeContentPack } from "@/lib/content-pack";
import { CreatePackPanel } from "@/components/create-pack-panel";

export const Route = createFileRoute("/_authenticated/chat/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [
    { title: "Production Dashboard · Vidzo" },
    { name: "description", content: "Start productions and review your latest Vidzo content packs, sources, and quality signals." },
    { property: "og:title", content: "Production Dashboard · Vidzo" },
    { property: "og:description", content: "Your Vidzo production overview." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

const TREND_CARDS = [
  { t: "Indian startup funding this week", c: "Business / Startup", icon: Rocket, grad: "from-pink-500 to-rose-500" },
  { t: "Shark Tank India latest viral pitch", c: "Entertainment", icon: Trophy, grad: "from-amber-400 to-orange-500" },
  { t: "D2C brand going viral 2026", c: "Business / Marketing", icon: ShoppingBag, grad: "from-fuchsia-500 to-purple-500" },
  { t: "Indian gym & fitness controversies", c: "Fitness", icon: Dumbbell, grad: "from-emerald-500 to-teal-500" },
  { t: "Recent Bollywood box office surprises", c: "Entertainment", icon: Film, grad: "from-rose-500 to-pink-500" },
  { t: "Crypto / fintech India this month", c: "Finance / Crypto", icon: Coins, grad: "from-amber-400 to-yellow-500" },
  { t: "Tech layoffs India recent", c: "Tech / Business", icon: Laptop, grad: "from-blue-500 to-cyan-500" },
  { t: "21-year-old founders India recent funding", c: "Startup / Business", icon: User, grad: "from-violet-500 to-indigo-500" },
];

function DashboardSkeleton() {
  return <div className="space-y-3" aria-label="Loading workspace"><div className="h-20 animate-pulse rounded-md bg-secondary" /><div className="h-20 animate-pulse rounded-md bg-secondary" /><div className="h-20 animate-pulse rounded-md bg-secondary" /></div>;
}

function Dashboard() {
  const navigate = useNavigate();
  const statsFn = useServerFn(getDashboardStats);
  const scriptsFn = useServerFn(listScripts);
  const threadsFn = useServerFn(listThreads);

  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      const fallbackName =
        (u?.user_metadata?.full_name as string) ||
        (u?.user_metadata?.name as string) ||
        (u?.email?.split("@")[0] ?? null);
      if (!u) {
        setUserName(null);
        return;
      }
      setUserName(fallbackName);
    });
  }, []);

  const stats = useQuery({ queryKey: ["stats"], queryFn: () => statsFn() });
  const scripts = useQuery({ queryKey: ["scripts"], queryFn: () => scriptsFn() });
  const threads = useQuery({ queryKey: ["threads"], queryFn: () => threadsFn() });

  const handleTrend = (title: string) => {
    const prompt = `Trend topic: "${title}". Search live sources and build a 30s Instagram Reel in Hinglish with a Founder tone for this topic.`;
    navigate({ to: "/chat/new", search: { prompt, title: title.slice(0, 60) } });
  };

  const scriptItems = (scripts.data ?? []) as Array<{ id: string; topic: string; data: unknown }>;
  const qualityReports = scriptItems
    .map((s) => {
      try {
        const pack = normalizeContentPack(s.data);
        return {
          id: s.id,
          topic: s.topic,
          report: computeQuality({
            script: { dialogue: pack.fullVoiceover },
            visuals: pack.scenes.map((scene) => ({
              beat: scene.time,
              onScreenText: scene.onScreenText,
              imagePrompt: scene.imagePrompt,
              videoPrompt: scene.videoPrompt,
            })),
            thumbnailPrompts: [
              pack.thumbnail.prompt,
              ...pack.thumbnail.alternates.map((alternate) => alternate.concept),
            ],
            caption: pack.caption,
            hashtags: pack.hashtags,
            sources: pack.sources,
          }),
        };
      } catch {
        return null;
      }
    })
    .filter(
      (x): x is { id: string; topic: string; report: ReturnType<typeof computeQuality> } => !!x,
    );
  const hasScripts = qualityReports.length > 0;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-8">
        {/* Top: greeting + stats */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase text-muted-foreground">Production overview</div>
            <h1 className="text-2xl sm:text-3xl font-semibold">
              Good to see you{userName ? `, ${userName}` : ""}.
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Drop a brief, pick your format — Vidzo builds the whole pack.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
            {[
              { n: stats.data?.scriptsTotal ?? 0, l: "Packs", icon: Package, c: "text-primary" },
              { n: stats.data?.scriptsWeek ?? 0, l: "This week", icon: CheckCircle2, c: "text-emerald-500" },
              { n: (stats.data as { sourcesUsed?: number } | undefined)?.sourcesUsed ?? 0, l: "Sources", icon: BookOpen, c: "text-primary" },
              { n: Math.max(0, (stats.data?.threadsTotal ?? 0) - (stats.data?.scriptsTotal ?? 0)), l: "In progress", icon: Clock3, c: "text-amber-500" },
            ].map((s) => (
              <div key={s.l} className="flex min-w-[112px] items-center gap-2 bg-card px-3 py-2.5">
                <div className={`h-8 w-8 rounded-md bg-secondary flex items-center justify-center ${s.c}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-base leading-none">{s.n}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{s.l}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid xl:grid-cols-[minmax(0,1fr),360px] gap-6">
          {/* Main column */}
          <div className="space-y-5">
            <CreatePackPanel />

            {/* Visual Story Engine banner */}
            <Link
              to="/chat/vse"
              className="group block rounded-lg border border-border p-5 bg-card hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-md bg-foreground text-background flex items-center justify-center shrink-0">
                  <Clapperboard className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-bold">Visual Story Engine</div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-600 dark:text-violet-300">New</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    For creators who don't talk to the camera. Cinematic reels, b-roll, faceless edits — Vidzo designs the shot-by-shot blueprint with lens plan and audio.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* Trends */}
            <div id="dash-trends" className="rounded-lg border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 font-bold text-lg">
                    <span className="h-9 w-9 rounded-md bg-secondary text-foreground flex items-center justify-center">
                      <TrendingUp className="h-4 w-4" />
                    </span>
                    Trends
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pick a category — Vidzo searches live sources and builds a verified pack.
                  </p>
                </div>
                <Link to="/chat/trends" className="text-xs text-primary hover:underline">
                  Open trends feed →
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-md border border-border bg-border">
                {TREND_CARDS.map((tr) => (
                  <button
                    key={tr.t}
                    onClick={() => handleTrend(tr.t)}
                    className="text-left bg-card p-3 hover:bg-secondary/50 active:opacity-70 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="h-9 w-9 rounded-md bg-secondary text-foreground flex items-center justify-center">
                        <tr.icon className="h-4 w-4" />
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="mt-2 font-semibold text-sm leading-tight line-clamp-2">{tr.t}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{tr.c}</div>
                    <div className="mt-2 text-[11px] text-primary">Tap to research + generate</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: recent packs + threads */}
          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="font-bold flex items-center gap-2 text-sm mb-3">
                <Package className="h-4 w-4 text-primary" /> Your recent packs
              </div>
              {scripts.isLoading ? <DashboardSkeleton /> : hasScripts ? (
                <div className="space-y-3">
                  {qualityReports.slice(0, 4).map((q) => {
                    const c =
                      q.report.overall >= 85
                        ? "text-emerald-600"
                        : q.report.overall >= 70
                          ? "text-amber-600"
                          : "text-rose-600";
                    return (
                      <Link
                        key={q.id}
                        to="/chat/library"
                         className="block rounded-md border border-border p-3 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="relative h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              background: `conic-gradient(${q.report.overall >= 85 ? "#10b981" : q.report.overall >= 70 ? "#f59e0b" : "#ef4444"} ${q.report.overall}%, hsl(var(--secondary)) 0)`,
                            }}
                          >
                            <div className="h-[78%] w-[78%] rounded-full bg-card flex items-center justify-center">
                              <span className={`text-[11px] font-bold ${c}`}>{q.report.overall}</span>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium line-clamp-1">{q.topic}</div>
                            <div className="text-[11px] text-muted-foreground">
                              Reach potential {q.report.reach}/100
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-6">
                  Your content quality and reach scores appear here once you generate a pack.
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <div className="font-bold flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" /> Recent
                </div>
                <Link to="/chat/library" className="text-xs text-primary hover:underline">All</Link>
              </div>
              <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                {threads.isLoading && <div className="p-4"><DashboardSkeleton /></div>}
                {(threads.data ?? []).slice(0, 6).map((t) => (
                  <Link
                    key={t.id}
                    to="/chat/$threadId"
                    params={{ threadId: t.id }}
                    className="group flex items-center gap-2 px-4 py-3 hover:bg-secondary/40 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">{t.title}</span><ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
                {threads.data && threads.data.length === 0 && (
                  <div className="p-5 text-center text-xs text-muted-foreground">No chats yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
