import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardStats, listScripts, listThreads } from "@/lib/threads.functions";
import {
  Sparkles,
  TrendingUp,
  Package,
  Wand2,
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
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { computeQuality } from "@/lib/quality";
import { normalizeContentPack } from "@/lib/content-pack";

export const Route = createFileRoute("/_authenticated/chat/dashboard")({
  component: Dashboard,
});

const FORMATS = ["Reel", "YouTube Short", "LinkedIn Video", "Ad Script", "UGC Product Ad", "Explainer"] as const;
const TONES = ["Founder-style", "Dramatic", "Educational", "Funny", "Premium"] as const;
const LENGTHS = ["30 sec", "40 sec", "60 sec", "90 sec"] as const;
const LANGUAGES = ["Hinglish", "English", "Hindi"] as const;

const TREND_CARDS = [
  {
    t: "Indian startup funding this week",
    c: "Business / Startup",
    icon: Rocket,
    grad: "from-pink-500 to-rose-500",
  },
  {
    t: "Shark Tank India latest viral pitch",
    c: "Entertainment",
    icon: Trophy,
    grad: "from-amber-400 to-orange-500",
  },
  {
    t: "D2C brand going viral 2026",
    c: "Business / Marketing",
    icon: ShoppingBag,
    grad: "from-fuchsia-500 to-purple-500",
  },
  {
    t: "Indian gym & fitness controversies",
    c: "Fitness",
    icon: Dumbbell,
    grad: "from-emerald-500 to-teal-500",
  },
  {
    t: "Recent Bollywood box office surprises",
    c: "Entertainment",
    icon: Film,
    grad: "from-rose-500 to-pink-500",
  },
  {
    t: "Crypto / fintech India this month",
    c: "Finance / Crypto",
    icon: Coins,
    grad: "from-amber-400 to-yellow-500",
  },
  {
    t: "Tech layoffs India recent",
    c: "Tech / Business",
    icon: Laptop,
    grad: "from-blue-500 to-cyan-500",
  },
  {
    t: "21-year-old founders India recent funding",
    c: "Startup / Business",
    icon: User,
    grad: "from-violet-500 to-indigo-500",
  },
];

function Dashboard() {
  const navigate = useNavigate();
  const statsFn = useServerFn(getDashboardStats);
  const scriptsFn = useServerFn(listScripts);
  const threadsFn = useServerFn(listThreads);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [userName, setUserName] = useState<string | null>(null);
  const [brief, setBrief] = useState("");
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("Reel");
  const [tone, setTone] = useState<(typeof TONES)[number]>("Founder-style");
  const [length, setLength] = useState<(typeof LENGTHS)[number]>("40 sec");
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]>("Hinglish");

  // Product ad brief
  const [product, setProduct] = useState({
    name: "",
    what: "",
    benefits: "",
    audience: "",
    cta: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
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

  const goToNewThread = (prompt: string) => {
    navigate({
      to: "/chat/new",
      search: { prompt, title: prompt.slice(0, 60) },
    });
  };

  const handleGenerate = () => {
    const idea = brief.trim();
    if (!idea) {
      inputRef.current?.focus();
      return;
    }
    const fullPrompt = `Create a ${length} ${format} in ${language} with a ${tone} tone based on this idea: ${idea}.`;
    goToNewThread(fullPrompt);
  };

  const handleTrend = (title: string) => {
    const fullPrompt = `Trend topic: "${title}". Search live sources and build a ${length} ${format} in ${language} with a ${tone} tone for this topic.`;
    goToNewThread(fullPrompt);
  };

  const handleProductAd = () => {
    const name = product.name.trim();
    const what = product.what.trim();
    if (!name || !what) {
      document.getElementById("product-name-input")?.focus();
      return;
    }
    const lines = [
      `[PRODUCT_AD_BRIEF]`,
      `Product / brand: ${name}`,
      `What it does: ${what}`,
      product.benefits.trim() && `Key features / benefits: ${product.benefits.trim()}`,
      product.audience.trim() && `Target audience: ${product.audience.trim()}`,
      product.cta.trim() && `Desired CTA: ${product.cta.trim()}`,
      ``,
      `Build a UGC-style ${length} ad in ${language} with a ${tone} tone. First-person creator POV, authentic handheld iPhone aesthetic, product visible in-hand and in-use across scenes, scene-by-scene visuals + voiceover + on-screen captions + thumbnail. Only use claims from this brief — do not invent stats, prices, or features.`,
    ]
      .filter(Boolean)
      .join("\n");
    goToNewThread(lines);
  };

  // Compute REAL average quality from the user's actual generated packs.
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        {/* Top: greeting + stats */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back{userName ? `, ${userName}` : ""}! 👋
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Turn a trend or idea into a ready-to-produce content pack.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              {
                n: stats.data?.scriptsTotal ?? 0,
                l: "Packs Created",
                icon: Package,
                c: "text-pink-500",
              },
              {
                n: stats.data?.scriptsWeek ?? 0,
                l: "Ready to Ship",
                icon: Rocket,
                c: "text-emerald-500",
              },
              {
                n: (stats.data as { sourcesUsed?: number } | undefined)?.sourcesUsed ?? 0,
                l: "Sources Used",
                icon: BookOpen,
                c: "text-blue-500",
              },
              {
                n: Math.max(0, (stats.data?.threadsTotal ?? 0) - (stats.data?.scriptsTotal ?? 0)),
                l: "Drafts Cooking",
                icon: FileText,
                c: "text-amber-500",
              },
            ].map((s) => (
              <div
                key={s.l}
                className="flex items-center gap-2 rounded-xl bg-card border border-border px-3 py-2 min-w-[120px]"
              >
                <div
                  className={`h-8 w-8 rounded-lg bg-secondary flex items-center justify-center ${s.c}`}
                >
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

        <div className="grid lg:grid-cols-[1fr,320px] gap-5">
          {/* Main column */}
          <div className="space-y-5">
            {/* Create new content pack */}
            <div className="rounded-3xl border border-border p-6 bg-gradient-to-br from-pink-100 via-violet-100 to-blue-100 relative overflow-hidden">
              <div className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-gradient-to-br from-[var(--vidzo-magenta)] to-[var(--vidzo-blue)] opacity-15 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  Create a New Content Pack
                </div>
                <textarea
                  ref={inputRef}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Create a 40-second reel on how a small D2C brand went viral."
                  rows={2}
                  className="mt-4 w-full resize-none rounded-xl bg-card border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <div className="mt-4 space-y-2 text-xs">
                  <ChipRow
                    label="Format"
                    options={FORMATS}
                    value={format}
                    onChange={(v) => setFormat(v as typeof format)}
                  />
                  <ChipRow
                    label="Tone"
                    options={TONES}
                    value={tone}
                    onChange={(v) => setTone(v as typeof tone)}
                  />
                  <ChipRow
                    label="Length"
                    options={LENGTHS}
                    value={length}
                    onChange={(v) => setLength(v as typeof length)}
                  />
                  <ChipRow
                    label="Language"
                    options={LANGUAGES}
                    value={language}
                    onChange={(v) => setLanguage(v as typeof language)}
                  />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    onClick={handleGenerate}
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white gap-2"
                  >
                    <Wand2 className="h-4 w-4" />
                    Generate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      document.getElementById("dash-trends")?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="bg-card gap-2"
                  >
                    <TrendingUp className="h-4 w-4" /> Use a trend
                  </Button>
                </div>
              </div>
            </div>

            {/* Trends */}
            <div id="dash-trends" className="rounded-3xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 font-bold text-lg">
                    <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--vidzo-magenta)] to-orange-400 text-white flex items-center justify-center">
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
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {TREND_CARDS.map((tr) => (
                  <button
                    key={tr.t}
                    onClick={() => handleTrend(tr.t)}
                    className="text-left rounded-xl border border-border bg-card p-3 hover:border-foreground/30 hover:shadow-sm active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`h-9 w-9 rounded-lg bg-gradient-to-br ${tr.grad} text-white flex items-center justify-center`}
                      >
                        <tr.icon className="h-4 w-4" />
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="mt-2 font-semibold text-sm leading-tight line-clamp-2">
                      {tr.t}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{tr.c}</div>
                    <div className="mt-2 text-[11px] text-primary">Tap to research + generate</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start from own idea */}
            <button
              onClick={() => inputRef.current?.focus()}
              className="w-full text-left rounded-3xl bg-gradient-to-r from-[var(--vidzo-magenta)] via-pink-400 to-violet-500 text-white p-6 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-card/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-lg">Start from your own idea</div>
                  <div className="text-sm text-white/90">
                    Don't see what you want? Type your own topic and Vidzo will build a content pack
                    for you.
                  </div>
                </div>
              </div>
              <div className="rounded-md bg-card text-foreground px-4 py-2 text-sm font-semibold flex items-center gap-1">
                Create custom pack <ArrowRight className="h-4 w-4" />
              </div>
            </button>
          </div>

          {/* Right column: recent packs with their own (real) quality */}
          <div className="space-y-5">
            <div className="rounded-3xl border border-border bg-card p-5">
              <div className="font-bold flex items-center gap-2 text-sm mb-3">
                <Package className="h-4 w-4 text-primary" /> Your recent packs
              </div>
              {hasScripts ? (
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
                        className="block rounded-xl border border-border p-3 hover:border-foreground/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="relative h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              background: `conic-gradient(${q.report.overall >= 85 ? "#10b981" : q.report.overall >= 70 ? "#f59e0b" : "#ef4444"} ${q.report.overall}%, hsl(var(--secondary)) 0)`,
                            }}
                          >
                            <div className="h-[78%] w-[78%] rounded-full bg-card flex items-center justify-center">
                              <span className={`text-[11px] font-bold ${c}`}>
                                {q.report.overall}
                              </span>
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

            <div className="rounded-3xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <div className="font-bold flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" /> Recent
                </div>
                <Link to="/chat/library" className="text-xs text-primary hover:underline">
                  All
                </Link>
              </div>
              <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                {(threads.data ?? []).slice(0, 6).map((t) => (
                  <Link
                    key={t.id}
                    to="/chat/$threadId"
                    params={{ threadId: t.id }}
                    className="block px-4 py-2.5 hover:bg-secondary/40 text-sm truncate"
                  >
                    {t.title}
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

function ChipRow<T extends readonly string[]>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T;
  value: T[number];
  onChange: (v: T[number]) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground w-[68px] shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${active ? "border-[var(--vidzo-magenta)] text-[var(--vidzo-magenta)] bg-card" : "border-border bg-card hover:border-foreground/30"}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
