import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardStats, listScripts, listThreads, createThread } from "@/lib/threads.functions";
import { Sparkles, TrendingUp, Package, Wand2, BookOpen, FileText, ArrowRight, Rocket, Trophy, ShoppingBag, Dumbbell, Film, Coins, Laptop, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/chat/dashboard")({
  component: Dashboard,
});

const FORMATS = ["Reel", "YouTube Short", "LinkedIn Video", "Ad Script", "Explainer"] as const;
const TONES = ["Founder-style", "Dramatic", "Educational", "Funny", "Premium"] as const;
const LENGTHS = ["30 sec", "40 sec", "60 sec", "90 sec"] as const;
const LANGUAGES = ["Hinglish", "English", "Hindi"] as const;

const TREND_CARDS = [
  { t: "Indian startup funding this week", c: "Business / Startup", v: 84, icon: Rocket, grad: "from-pink-500 to-rose-500" },
  { t: "Shark Tank India latest viral pitch", c: "Entertainment", v: 82, icon: Trophy, grad: "from-amber-400 to-orange-500" },
  { t: "D2C brand going viral 2026", c: "Business / Marketing", v: 79, icon: ShoppingBag, grad: "from-fuchsia-500 to-purple-500" },
  { t: "Indian gym & fitness controversies", c: "Fitness", v: 76, icon: Dumbbell, grad: "from-emerald-500 to-teal-500" },
  { t: "Recent Bollywood box office surprises", c: "Entertainment", v: 74, icon: Film, grad: "from-rose-500 to-pink-500" },
  { t: "Crypto / fintech India this month", c: "Finance / Crypto", v: 73, icon: Coins, grad: "from-amber-400 to-yellow-500" },
  { t: "Tech layoffs India recent", c: "Tech / Business", v: 71, icon: Laptop, grad: "from-blue-500 to-cyan-500" },
  { t: "21-year-old founders India recent funding", c: "Startup / Business", v: 70, icon: User, grad: "from-violet-500 to-indigo-500" },
];

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const statsFn = useServerFn(getDashboardStats);
  const scriptsFn = useServerFn(listScripts);
  const threadsFn = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [userName, setUserName] = useState<string | null>(null);
  const [brief, setBrief] = useState("");
  const [format, setFormat] = useState<typeof FORMATS[number]>("Reel");
  const [tone, setTone] = useState<typeof TONES[number]>("Founder-style");
  const [length, setLength] = useState<typeof LENGTHS[number]>("40 sec");
  const [language, setLanguage] = useState<typeof LANGUAGES[number]>("Hinglish");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      const name = (u?.user_metadata?.full_name as string) || (u?.user_metadata?.name as string) || (u?.email?.split("@")[0] ?? null);
      setUserName(name);
    });
  }, []);

  const stats = useQuery({ queryKey: ["stats"], queryFn: () => statsFn() });
  const scripts = useQuery({ queryKey: ["scripts"], queryFn: () => scriptsFn() });
  const threads = useQuery({ queryKey: ["threads"], queryFn: () => threadsFn() });

  const startMut = useMutation({
    mutationFn: async (firstMessage: string) => {
      const t = await create({ data: { title: firstMessage.slice(0, 60), contextBrief: firstMessage } });
      return { thread: t, firstMessage };
    },
    onSuccess: ({ thread, firstMessage }) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      sessionStorage.setItem(`pending:${thread!.id}`, firstMessage);
      navigate({ to: "/chat/$threadId", params: { threadId: thread!.id } });
    },
  });

  const handleGenerate = () => {
    const idea = brief.trim();
    if (!idea) {
      inputRef.current?.focus();
      return;
    }
    const fullPrompt = `Create a ${length} ${format} in ${language} with a ${tone} tone based on this idea: ${idea}.`;
    startMut.mutate(fullPrompt);
  };

  const handleTrend = (title: string) => {
    const fullPrompt = `Trend topic: "${title}". Search live sources and build a ${length} ${format} in ${language} with a ${tone} tone for this topic.`;
    startMut.mutate(fullPrompt);
  };

  // Compute quality stub — illustrative only when there are no scripts yet
  const hasScripts = (scripts.data?.length ?? 0) > 0;
  const qualityScores = [
    { l: "Hook Strength", v: hasScripts ? 92 : 0 },
    { l: "Clarity", v: hasScripts ? 88 : 0 },
    { l: "Pacing", v: hasScripts ? 85 : 0 },
    { l: "Source Coverage", v: hasScripts ? 81 : 0 },
    { l: "Platform Fit", v: hasScripts ? 90 : 0 },
  ];
  const overall = Math.round(qualityScores.reduce((a, b) => a + b.v, 0) / qualityScores.length);
  const status = overall >= 85 ? "Looks Good" : overall >= 70 ? "Can Improve" : hasScripts ? "Needs Work" : "No data yet";
  const statusColor = overall >= 85 ? "text-emerald-600" : overall >= 70 ? "text-amber-600" : "text-muted-foreground";

  return (
    <div className="h-full overflow-y-auto bg-[#fafaf7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        {/* Top: greeting + stats */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back{userName ? `, ${userName}` : ""}! 👋
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Turn a trend or idea into a ready-to-produce content pack.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { n: stats.data?.scriptsTotal ?? 0, l: "Packs Created", icon: Package, c: "text-pink-500" },
              { n: stats.data?.scriptsWeek ?? 0, l: "Ready to Ship", icon: Rocket, c: "text-emerald-500" },
              { n: 0, l: "Sources Used", icon: BookOpen, c: "text-blue-500" },
              { n: Math.max(0, (stats.data?.threadsTotal ?? 0) - (stats.data?.scriptsTotal ?? 0)), l: "Drafts Cooking", icon: FileText, c: "text-amber-500" },
            ].map((s) => (
              <div key={s.l} className="flex items-center gap-2 rounded-xl bg-white border border-border px-3 py-2 min-w-[120px]">
                <div className={`h-8 w-8 rounded-lg bg-secondary flex items-center justify-center ${s.c}`}>
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
                  <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center"><Sparkles className="h-4 w-4" /></span>
                  Create a New Content Pack
                </div>
                <textarea
                  ref={inputRef}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Create a 40-second reel on how a small D2C brand went viral."
                  rows={2}
                  className="mt-4 w-full resize-none rounded-xl bg-white border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <div className="mt-4 space-y-2 text-xs">
                  <ChipRow label="Format" options={FORMATS} value={format} onChange={(v) => setFormat(v as typeof format)} />
                  <ChipRow label="Tone" options={TONES} value={tone} onChange={(v) => setTone(v as typeof tone)} />
                  <ChipRow label="Length" options={LENGTHS} value={length} onChange={(v) => setLength(v as typeof length)} />
                  <ChipRow label="Language" options={LANGUAGES} value={language} onChange={(v) => setLanguage(v as typeof language)} />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button onClick={handleGenerate} disabled={startMut.isPending} className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white gap-2">
                    <Wand2 className="h-4 w-4" />
                    {startMut.isPending ? "Starting…" : "Generate"}
                  </Button>
                  <Button variant="outline" onClick={() => document.getElementById("dash-trends")?.scrollIntoView({ behavior: "smooth" })} className="bg-white gap-2">
                    <TrendingUp className="h-4 w-4" /> Use a trend
                  </Button>
                </div>
              </div>
            </div>

            {/* Trends */}
            <div id="dash-trends" className="rounded-3xl border border-border bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 font-bold text-lg">
                    <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--vidzo-magenta)] to-orange-400 text-white flex items-center justify-center"><TrendingUp className="h-4 w-4" /></span>
                    Trends
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Pick a category — Vidzo searches live sources and builds a verified pack.</p>
                </div>
                <Link to="/chat/trends" className="text-xs text-primary hover:underline">Open trends feed →</Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {TREND_CARDS.map((tr) => (
                  <button key={tr.t} onClick={() => handleTrend(tr.t)} disabled={startMut.isPending} className="text-left rounded-xl border border-border bg-white p-3 hover:border-foreground/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${tr.grad} text-white flex items-center justify-center`}>
                        <tr.icon className="h-4 w-4" />
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="mt-2 font-semibold text-sm leading-tight line-clamp-2">{tr.t}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{tr.c}</div>
                    <div className="text-[11px] text-orange-500 mt-1 font-semibold">🔥 {tr.v}% Virality</div>
                    <div className="mt-2 text-[11px] text-primary">Tap to search + generate</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start from own idea */}
            <button onClick={() => inputRef.current?.focus()} className="w-full text-left rounded-3xl bg-gradient-to-r from-[var(--vidzo-magenta)] via-pink-400 to-violet-500 text-white p-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center"><Sparkles className="h-5 w-5" /></div>
                <div>
                  <div className="font-bold text-lg">Start from your own idea</div>
                  <div className="text-sm text-white/90">Don't see what you want? Type your own topic and Vidzo will build a content pack for you.</div>
                </div>
              </div>
              <div className="rounded-md bg-white text-foreground px-4 py-2 text-sm font-semibold flex items-center gap-1">
                Create custom pack <ArrowRight className="h-4 w-4" />
              </div>
            </button>
          </div>

          {/* Right column: Content Quality + recent */}
          <div className="space-y-5">
            <div className="rounded-3xl border border-border bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Content Quality
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${statusColor}`}>{status}</span>
              </div>
              <div className="mt-4 flex flex-col items-center">
                <div className="relative h-32 w-32 rounded-full flex items-center justify-center"
                  style={{ background: `conic-gradient(${overall >= 85 ? "#10b981" : overall >= 70 ? "#f59e0b" : "#e5e7eb"} ${overall}%, #e5e7eb 0)` }}>
                  <div className="h-[78%] w-[78%] rounded-full bg-white flex flex-col items-center justify-center">
                    <div className="text-3xl font-black">{hasScripts ? overall : "—"}</div>
                    <div className="text-[10px] text-muted-foreground">/100</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                {qualityScores.map((q) => (
                  <div key={q.l}>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">{q.l}</span><span className="font-bold">{q.v}</span></div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-1">
                      <div className="h-full bg-gradient-to-r from-[var(--vidzo-magenta)] via-[var(--vidzo-blue)] to-[var(--vidzo-yellow)]" style={{ width: `${q.v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {hasScripts && (
                <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                  <div className="text-[11px] font-semibold text-emerald-700 mb-1.5">What to improve</div>
                  {["Add 1 stronger source", "Improve first 3 seconds hook", "Add more visual direction"].map((s) => (
                    <div key={s} className="flex items-center justify-between text-xs py-0.5">
                      <span>✓ {s}</span>
                    </div>
                  ))}
                </div>
              )}
              {!hasScripts && (
                <div className="mt-4 text-xs text-muted-foreground text-center">Generate a pack to see your quality scores.</div>
              )}
            </div>

            <div className="rounded-3xl border border-border bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <div className="font-bold flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-primary" /> Recent</div>
                <Link to="/chat/library" className="text-xs text-primary hover:underline">All</Link>
              </div>
              <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                {(threads.data ?? []).slice(0, 6).map((t) => (
                  <Link key={t.id} to="/chat/$threadId" params={{ threadId: t.id }} className="block px-4 py-2.5 hover:bg-secondary/40 text-sm truncate">
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
  label, options, value, onChange,
}: { label: string; options: T; value: T[number]; onChange: (v: T[number]) => void }) {
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
              className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${active ? "border-[var(--vidzo-magenta)] text-[var(--vidzo-magenta)] bg-white" : "border-border bg-white hover:border-foreground/30"}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
