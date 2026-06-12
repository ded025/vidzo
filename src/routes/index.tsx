import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Mic, Image as ImageIcon, FileText, Hash, BookOpen, Sparkles,
  Lightbulb, Wand2, Rocket, CheckCircle2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import gsap from "gsap";
import { VidzoLogo } from "@/components/vidzo-logo";
import { AuthDialog } from "@/components/auth-dialog";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) throw redirect({ to: "/chat/dashboard" });
    } catch (e: unknown) {
      if (e && typeof e === "object" && "isRedirect" in e) throw e;
    }
  },
  head: () => ({
    meta: [
      { title: "Vidzo · AI production room for creators" },
      { name: "description", content: "Vidzo turns any idea into a production-ready content pack: script, voiceover dialogue, scene-by-scene visuals, thumbnails, captions, hashtags, and source-backed research." },
      { property: "og:title", content: "Vidzo · AI production room for creators" },
      { property: "og:description", content: "One idea in. Full video pack out." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const _navigate = useNavigate();
  void _navigate;
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
      if (!mounted) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        gsap.from(".hero-word", { y: 60, opacity: 0, duration: 1.1, ease: "power4.out", stagger: 0.06 });
        gsap.from(".hero-sub", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out", delay: 0.5 });
        gsap.from(".hero-cta", { y: 16, opacity: 0, duration: 0.7, ease: "power3.out", delay: 0.7, stagger: 0.08 });
        gsap.from(".hero-card", { y: 40, opacity: 0, scale: 0.85, duration: 0.9, ease: "back.out(1.5)", stagger: 0.1, delay: 0.3 });
        gsap.from(".feature-tile", {
          y: 40, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.08,
          scrollTrigger: { trigger: ".features-grid", start: "top 80%" },
        });
        gsap.from(".step-card", {
          y: 40, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.1,
          scrollTrigger: { trigger: ".steps-grid", start: "top 80%" },
        });
        gsap.from(".dashboard-preview", {
          y: 60, opacity: 0, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: ".dashboard-preview", start: "top 80%" },
        });
        gsap.to(".giant-vidzo", {
          fontVariationSettings: '"wght" 1000, "wdth" 151',
          ease: "none",
          scrollTrigger: { trigger: ".footer-vidzo", start: "top bottom", end: "bottom bottom", scrub: 0.6 },
        });
      }, rootRef);
      return () => ctx.revert();
    });
    return () => { mounted = false; };
  }, []);

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div ref={rootRef} className="min-h-screen bg-background text-foreground overflow-x-hidden" style={{ fontFamily: '"Roboto Flex", sans-serif' }}>

      {/* FLOATING GLASS NAV */}
      <header className="fixed top-3 inset-x-3 sm:inset-x-6 z-50">
        <div className="max-w-6xl mx-auto glass-header rounded-2xl">
          <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <VidzoLogo className="h-7 sm:h-8 w-auto" />
            </Link>
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
              <a href="#what" className="hover:text-primary transition-colors">What we do</a>
              <a href="#how" className="hover:text-primary transition-colors">How it works</a>
              <a href="#product" className="hover:text-primary transition-colors">Product</a>
              <Link to="/about" className="hover:text-primary transition-colors">About</Link>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle className="hidden sm:inline-flex" />
              <Button variant="ghost" size="sm" onClick={() => openAuth("signin")}>Sign in</Button>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90" onClick={() => openAuth("signup")}>Get Vidzo</Button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO — fully centred, two-line headline, mobile-first */}
      <section className="relative px-4 sm:px-8 pt-28 sm:pt-36 pb-16 sm:pb-24">
        {/* Ambient background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(700px,90vw)] h-[min(700px,90vw)] rounded-full"
            style={{
              background: "radial-gradient(circle, color-mix(in oklab, var(--vidzo-magenta) 18%, transparent) 0%, color-mix(in oklab, var(--vidzo-blue) 12%, transparent) 50%, transparent 75%)",
              filter: "blur(60px)",
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            AI production room for creators
          </div>

          {/* Two-line headline — stays on one line each at all breakpoints */}
          <h1 className="font-display font-black tracking-[-0.03em] leading-[1.05]">
            {/* Line 1 */}
            <span
              className="hero-word block bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
              style={{ fontSize: "clamp(2.6rem, 7vw, 5.5rem)" }}
            >
              One idea in.
            </span>
            {/* Line 2 */}
            <span
              className="hero-word block bg-gradient-to-r from-[var(--vidzo-magenta)] via-[var(--vidzo-blue)] to-[var(--vidzo-yellow)] bg-clip-text text-transparent"
              style={{ fontSize: "clamp(2.6rem, 7vw, 5.5rem)" }}
            >
              Full video pack out.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="hero-sub mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Vidzo turns your rough content idea into a ready-to-record script, voiceover dialogue,
            scene-by-scene visuals, thumbnail direction, captions, hashtags, and source-backed research
            — all in one flow.
          </p>

          {/* CTAs — centred, no overflow on small screens */}
          <div className="hero-cta mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base h-12 px-7 group bg-foreground text-background hover:bg-foreground/90"
              onClick={() => openAuth("signup")}
            >
              Start creating free
              <ArrowRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <a href="#how" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full text-base h-12 px-7">
                See how it works
              </Button>
            </a>
          </div>

          {/* AI production room label */}
          <p className="mt-5 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
            No credit card required &middot; Free to start
          </p>
        </div>

        {/* Hero product cards — below headline on all screens */}
        <div className="relative mt-12 max-w-5xl mx-auto">
          <div className="absolute inset-0 hero-glow rounded-3xl" />
          {(() => {
            const cards = [
              { icon: FileText, label: "Script", grad: "from-pink-500 to-rose-500",
                body: '"Bhai ye chhoti si D2C brand ne 90 din mein 4 crore kaise kamaye? Sun…"' },
              { icon: Mic, label: "Voiceover dialogue", grad: "from-violet-500 to-indigo-600",
                body: "Tone: warm founder energy. Pace: medium. Pause after hook for 0.4s." },
              { icon: ImageIcon, label: "Visual plan", grad: "from-blue-500 to-cyan-500",
                body: "Beat 1: founder POV, warm office, golden hour, handheld 24mm." },
              { icon: Sparkles, label: "Thumbnail", grad: "from-amber-400 to-orange-500",
                body: 'Big bold text: "₹4 CR IN 90 DAYS" + shocked founder face left.' },
              { icon: Hash, label: "Caption + hashtags", grad: "from-emerald-400 to-teal-500",
                body: "Yeh brand chhoti thi, soch badi thi. #d2cindia #founderstory #reelitfeelit" },
              { icon: BookOpen, label: "Sources", grad: "from-fuchsia-500 to-purple-600",
                body: "5 cited links: YourStory · Inc42 · Moneycontrol · The Ken · ET" },
            ];
            return (
              <div className="relative grid grid-cols-2 sm:grid-cols-3 gap-3">
                {cards.map((c) => (
                  <div
                    key={c.label}
                    className={`hero-card rounded-2xl bg-gradient-to-br ${c.grad} text-white p-4 min-h-[110px]`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-white/25 flex items-center justify-center shrink-0">
                        <c.icon className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-sm tracking-tight truncate">{c.label}</span>
                    </div>
                    <p className="mt-2.5 text-[12px] leading-snug text-white/95 line-clamp-3">{c.body}</p>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      {/* INFINITE MARQUEE */}
      <section className="border-y border-border bg-foreground text-background overflow-hidden py-4">
        <div className="vidzo-marquee-track flex gap-12 whitespace-nowrap text-2xl sm:text-4xl font-black tracking-tight w-max">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-12 items-center shrink-0">
              <span>SCRIPT</span><span className="text-[var(--vidzo-magenta)]">·</span>
              <span>VOICEOVER</span><span className="text-[var(--vidzo-yellow)]">·</span>
              <span>VISUAL PLAN</span><span className="text-[var(--vidzo-blue)]">·</span>
              <span>THUMBNAIL</span><span className="text-[var(--vidzo-magenta)]">·</span>
              <span>CAPTION</span><span className="text-[var(--vidzo-yellow)]">·</span>
              <span>HASHTAGS</span><span className="text-[var(--vidzo-blue)]">·</span>
              <span>RESEARCH</span><span className="text-[var(--vidzo-magenta)]">·</span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: Features */}
      <section id="what" className="max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-28">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-[var(--vidzo-magenta)]">The content pack</div>
          <h2 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight">
            Everything you need before you hit record.
          </h2>
        </div>
        <div className="features-grid mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: FileText, title: "Creator-ready scripts", body: "Sharp hooks, strong pacing, clear story flow, and endings that land.", grad: "from-pink-500/15 to-rose-500/5", iconBg: "from-pink-500 to-rose-500" },
            { icon: Mic, title: "Voiceover-ready dialogue", body: "Cleanly formatted lines you can record yourself or use with voice tools.", grad: "from-violet-500/15 to-indigo-500/5", iconBg: "from-violet-500 to-indigo-600" },
            { icon: ImageIcon, title: "Scene-by-scene visuals", body: "Clear visual direction for every beat, whether you use stock, AI, or your own footage.", grad: "from-blue-500/15 to-cyan-500/5", iconBg: "from-blue-500 to-cyan-500" },
            { icon: Sparkles, title: "Thumbnail & first-frame ideas", body: "Scroll-stopping visual concepts designed to get attention fast.", grad: "from-amber-400/15 to-orange-500/5", iconBg: "from-amber-400 to-orange-500" },
            { icon: Hash, title: "Captions & hashtags", body: "Post-ready social text tailored to the topic and platform.", grad: "from-emerald-400/15 to-teal-500/5", iconBg: "from-emerald-400 to-teal-500" },
            { icon: BookOpen, title: "Source-backed research", body: "When facts are used, Vidzo includes sources so creators can review the context.", grad: "from-fuchsia-500/15 to-purple-600/5", iconBg: "from-fuchsia-500 to-purple-600" },
          ].map((f) => (
            <div key={f.title} className={`feature-tile group rounded-2xl border border-border bg-gradient-to-br ${f.grad} p-6 h-full flex flex-col transition-colors hover:border-foreground/20`}>
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${f.iconBg} text-white flex items-center justify-center mb-4`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: How */}
      <section id="how" className="bg-secondary/40 border-y border-border py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-[var(--vidzo-blue)]">How it works</div>
          <h2 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight max-w-3xl">
            Brief → Build → Ship.
          </h2>
          <div className="steps-grid mt-12 grid md:grid-cols-3 gap-4">
            {[
              { n: "01", icon: Lightbulb, t: "Drop your idea", b: "Enter a topic, trend, niche, creator style, or rough thought.", grad: "from-[var(--vidzo-magenta)] to-pink-400" },
              { n: "02", icon: Wand2, t: "Vidzo builds the pack", b: "Get script, voiceover, scenes, thumbnail direction, captions, hashtags, and sources.", grad: "from-[var(--vidzo-blue)] to-cyan-400" },
              { n: "03", icon: Rocket, t: "Create without starting from zero", b: "Record, edit, paste into your tools, or hand it to your team.", grad: "from-[var(--vidzo-yellow)] to-amber-500" },
            ].map((s) => (
              <div key={s.n} className="step-card relative rounded-2xl bg-background p-7 border border-border overflow-hidden">
                <div className={`absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-to-br ${s.grad} opacity-20 blur-2xl`} />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="text-5xl font-black text-foreground/15">{s.n}</div>
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${s.grad} text-white flex items-center justify-center`}>
                      <s.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="mt-3 font-bold text-xl tracking-tight">{s.t}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: Use cases */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-28">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-[var(--vidzo-yellow)]">Use cases</div>
          <h2 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight">
            Built for every kind of creator.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Whether you create business stories, fitness reels, educational videos, product explainers, or personal brand content, Vidzo gives you the production structure before you start recording.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "YouTube Shorts", grad: "from-pink-500 to-rose-500" },
            { label: "Instagram Reels", grad: "from-fuchsia-500 to-pink-500" },
            { label: "Founder stories", grad: "from-indigo-600 to-violet-500" },
            { label: "Startup explainers", grad: "from-blue-500 to-cyan-500" },
            { label: "Gym & fitness", grad: "from-emerald-500 to-teal-500" },
            { label: "Coaching videos", grad: "from-teal-500 to-cyan-500" },
            { label: "Product ads", grad: "from-amber-400 to-orange-500" },
            { label: "Educational content", grad: "from-orange-500 to-rose-500" },
            { label: "Agency content", grad: "from-violet-600 to-purple-500" },
            { label: "Personal brand", grad: "from-rose-500 to-pink-500" },
          ].map((p) => (
            <div key={p.label} className={`h-24 rounded-2xl bg-gradient-to-br ${p.grad} text-white flex items-end p-4 font-bold text-sm tracking-tight`}>
              {p.label}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: Dashboard preview */}
      <section id="product" className="bg-foreground text-background py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[var(--vidzo-magenta)] blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-[var(--vidzo-blue)] blur-[120px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8">
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-[var(--vidzo-yellow)]">Inside Vidzo</div>
            <h2 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight">
              Your creator command center.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-background/70 max-w-2xl">
              One dashboard to type a brief, pick format, tone, length and language, browse trends, and see content-quality feedback before you record.
            </p>
          </div>

          <div className="dashboard-preview mt-12 rounded-3xl bg-background text-foreground border border-border overflow-hidden">
            <div className="grid lg:grid-cols-[220px,1fr] min-h-[560px]">
              <aside className="bg-[#0b0d14] text-white p-4 hidden lg:flex flex-col gap-2">
                <div className="px-1 pb-3"><VidzoLogo className="h-7 w-auto" /></div>
                {[
                  { l: "Dashboard", active: true },
                  { l: "Trends" },
                  { l: "Library" },
                  { l: "Presets" },
                ].map((i) => (
                  <div key={i.l} className={`px-3 py-2 rounded-lg text-sm font-medium ${i.active ? "bg-gradient-to-r from-[var(--vidzo-magenta)] to-orange-400 text-white" : "text-white/60"}`}>
                    {i.l}
                  </div>
                ))}
                <div className="mt-3 px-3 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-semibold text-center">+ New chat</div>
                <div className="mt-5 text-[10px] uppercase tracking-wider text-white/40 px-3">Chats</div>
                {["D2C virality reel", "Founder Monday", "Fitness 30-day arc"].map((c) => (
                  <div key={c} className="px-3 py-1.5 text-xs text-white/70 truncate">• {c}</div>
                ))}
              </aside>

              <div className="p-5 sm:p-7 space-y-5 bg-[#fafaf7]">
                <div className="flex flex-wrap justify-between gap-3 items-start">
                  <div>
                    <div className="font-bold text-xl text-gray-900">Welcome back, Aman 👋</div>
                    <div className="text-xs text-gray-500">Turn a trend or idea into a ready-to-produce content pack.</div>
                  </div>
                  <div className="flex gap-2 text-[11px]">
                    {[{n:12,l:"Packs"},{n:4,l:"Ready"},{n:8,l:"Sources"},{n:2,l:"Drafts"}].map((s)=>(
                      <div key={s.l} className="rounded-lg bg-white border border-gray-200 px-3 py-2 min-w-[64px] text-center">
                        <div className="font-bold text-sm text-gray-900">{s.n}</div>
                        <div className="text-gray-500">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid lg:grid-cols-[1fr,260px] gap-4">
                  <div className="rounded-2xl border border-gray-200 p-5 bg-gradient-to-br from-pink-100 via-violet-100 to-blue-100">
                    <div className="font-bold flex items-center gap-2 text-gray-900">🎁 Create a New Content Pack</div>
                    <div className="mt-3 rounded-xl bg-white border border-gray-200 p-3 text-sm text-gray-400">
                      Create a 40-second reel on how a small D2C brand went viral.
                    </div>
                    <div className="mt-3 grid grid-cols-[64px,1fr] gap-y-2 items-center text-[11px]">
                      <span className="text-gray-400">Format</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["Reel","YT Short","LinkedIn","Ad","Explainer"].map((x,i)=>(
                          <span key={x} className={`px-2 py-1 rounded-md border text-gray-700 ${i===0 ? "border-pink-500 text-pink-600" : "border-gray-200"}`}>{x}</span>
                        ))}
                      </div>
                      <span className="text-gray-400">Tone</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["Founder","Dramatic","Educational","Funny","Premium"].map((x,i)=>(
                          <span key={x} className={`px-2 py-1 rounded-md border text-gray-700 ${i===0 ? "border-pink-500 text-pink-600" : "border-gray-200"}`}>{x}</span>
                        ))}
                      </div>
                      <span className="text-gray-400">Length</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["30s","40s","60s","90s"].map((x,i)=>(
                          <span key={x} className={`px-2 py-1 rounded-md border text-gray-700 ${i===1 ? "border-pink-500 text-pink-600" : "border-gray-200"}`}>{x}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <div className="rounded-md px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500">✨ Generate</div>
                      <div className="rounded-md px-3 py-1.5 text-xs font-semibold border border-gray-200 bg-white text-gray-700">↗ Use a trend</div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-gray-900">📈 Content Quality</div>
                      <span className="text-[10px] font-bold text-emerald-600">Looks Good</span>
                    </div>
                    <div className="mt-3 flex flex-col items-center">
                      <div className="relative h-24 w-24 rounded-full flex items-center justify-center"
                        style={{ background: "conic-gradient(#10b981 91%, #e5e7eb 0)" }}>
                        <div className="h-[78%] w-[78%] rounded-full bg-white flex flex-col items-center justify-center">
                          <div className="text-2xl font-black text-gray-900">91</div>
                          <div className="text-[9px] text-gray-400">/100</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5 text-[11px]">
                      {[{l:"Hook",v:92},{l:"Clarity",v:88},{l:"Pacing",v:85},{l:"Sources",v:81},{l:"Platform fit",v:90}].map((q)=>(
                        <div key={q.l}>
                          <div className="flex justify-between"><span className="text-gray-400">{q.l}</span><span className="font-bold text-gray-800">{q.v}</span></div>
                          <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500" style={{ width: `${q.v}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-bold text-sm text-gray-900">📈 Trends</div>
                    <div className="text-[10px] text-gray-400">Pick a category — Vidzo searches live sources.</div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      {t:"Indian startup funding",c:"Business",v:84,e:"🚀"},
                      {t:"Shark Tank India",c:"Entertainment",v:82,e:"🏆"},
                      {t:"D2C going viral",c:"Marketing",v:79,e:"🛍️"},
                      {t:"Gym controversies",c:"Fitness",v:76,e:"💪"},
                    ].map((tr)=>(
                      <div key={tr.t} className="rounded-lg border border-gray-200 p-2.5 text-[11px]">
                        <div className="flex items-center gap-1.5 font-bold text-gray-800"><span>{tr.e}</span>{tr.t}</div>
                        <div className="text-gray-400 mt-0.5">{tr.c}</div>
                        <div className="text-orange-500 mt-1 font-semibold">🔥 {tr.v}% virality</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-r from-pink-500 via-pink-400 to-violet-500 text-white p-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-bold">✨ Start from your own idea</div>
                    <div className="text-[12px] text-white/90">Type your own topic and Vidzo will build a content pack.</div>
                  </div>
                  <div className="rounded-md bg-white text-gray-900 px-3 py-1.5 text-xs font-semibold">Create custom pack →</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-28">
        <div className="rounded-3xl bg-gradient-to-br from-[var(--vidzo-magenta)] via-[var(--vidzo-blue)] to-[var(--vidzo-yellow)] p-10 sm:p-16 text-white relative overflow-hidden">
          <div className="relative">
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight max-w-3xl">
              Turn your next idea into a ready-to-produce video.
            </h2>
            <p className="mt-4 text-lg max-w-2xl opacity-95">
              Start with a topic. Leave with the full content pack.
            </p>
            <div className="mt-8">
              <Button size="lg" className="text-base h-12 px-7 bg-foreground text-background hover:bg-foreground/90" onClick={() => openAuth("signup")}>
                Start with Vidzo
                <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 grid sm:grid-cols-2 gap-6 items-center">
          <div>
            <VidzoLogo className="h-8 w-auto" />
            <p className="mt-2 text-sm text-muted-foreground">Vidzo — AI production room for creators.</p>
            <p className="mt-1 text-sm text-muted-foreground"><a href="mailto:support@vidzo.in" className="hover:text-foreground">support@vidzo.in</a></p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 sm:justify-end text-sm font-medium">
            <a href="#what" className="hover:text-primary">What we do</a>
            <a href="#how" className="hover:text-primary">How it works</a>
            <Link to="/about" className="hover:text-primary">About</Link>
            <Link to="/contact" className="hover:text-primary">Contact</Link>
            <Link to="/terms" className="hover:text-primary">Terms</Link>
            <Link to="/privacy" className="hover:text-primary">Privacy</Link>
            <button onClick={() => openAuth("signin")} className="hover:text-primary">Sign in</button>
          </nav>
        </div>
      </footer>

      {/* GIANT FOOTER WORDMARK */}
      <section className="footer-vidzo pt-6 pb-10 overflow-hidden">
        <div className="max-w-[100vw] mx-auto px-2">
          <div
            className="giant-vidzo text-center tracking-[-0.06em] bg-gradient-to-br from-[var(--vidzo-magenta)] via-[var(--vidzo-blue)] to-[var(--vidzo-yellow)] bg-clip-text text-transparent"
            style={{
              fontFamily: '"Roboto Flex", sans-serif',
              fontVariationSettings: '"wght" 800, "wdth" 100',
              fontSize: "clamp(5rem, 24vw, 26rem)",
              lineHeight: "1.15",
              paddingBottom: "0.18em",
              willChange: "font-variation-settings",
            }}
          >
            VIDZO
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground px-4">
            <span>© 2026 Vidzo. Built for creators.</span>
            <span>support@vidzo.in</span>
          </div>
        </div>
      </section>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultMode={authMode} />
    </div>
  );
}
