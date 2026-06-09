import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Mic, Image as ImageIcon, FileText, Hash, BookOpen, Sparkles,
  Lightbulb, Wand2, Rocket, Copy, RefreshCw, CheckCircle2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import gsap from "gsap";
import hero1 from "@/assets/landing-hero-1.jpg";
import hero2 from "@/assets/landing-hero-2.jpg";
import hero3 from "@/assets/landing-hero-3.jpg";

export const Route = createFileRoute("/")({
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
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setSignedIn(true);
        navigate({ to: "/chat/dashboard" });
      }
    });
  }, [navigate]);

  useEffect(() => {
    let mounted = true;
    import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
      if (mounted) gsap.registerPlugin(ScrollTrigger);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (signedIn) return;
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
      gsap.from(".usecase-pill", {
        scale: 0.7, opacity: 0, duration: 0.5, ease: "back.out(2)", stagger: 0.04,
        scrollTrigger: { trigger: ".usecase-grid", start: "top 85%" },
      });
      gsap.from(".dashboard-preview", {
        y: 60, opacity: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: ".dashboard-preview", start: "top 80%" },
      });
      gsap.to(".marquee-track", { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
      gsap.to(".giant-vidzo", {
        fontVariationSettings: '"wght" 1000, "wdth" 151',
        ease: "none",
        scrollTrigger: { trigger: ".footer-vidzo", start: "top bottom", end: "bottom bottom", scrub: 0.6 },
      });
    }, rootRef);
    return () => ctx.revert();
  }, [signedIn]);

  return (
    <div ref={rootRef} className="min-h-screen bg-background text-foreground overflow-x-hidden" style={{ fontFamily: '"Roboto Flex", sans-serif' }}>
      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--vidzo-magenta)] via-[var(--vidzo-blue)] to-[var(--vidzo-yellow)] flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-lg">V</span>
            </div>
            <span className="font-black tracking-tight text-lg">Vidzo</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <a href="#what" className="hover:text-primary transition-colors">What we do</a>
            <a href="#how" className="hover:text-primary transition-colors">How it works</a>
            <a href="#product" className="hover:text-primary transition-colors">Product</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/auth"><Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">Get Vidzo</Button></Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24">
        <div className="grid lg:grid-cols-[1.15fr,1fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              AI production room for creators
            </div>
            <h1 className="text-[42px] leading-[0.95] sm:text-7xl lg:text-[88px] font-black tracking-[-0.04em]">
              <span className="hero-word inline-block">One idea in.</span>{" "}
              <span className="hero-word inline-block">Full video</span>{" "}
              <span className="hero-word inline-block bg-gradient-to-r from-[var(--vidzo-magenta)] via-[var(--vidzo-blue)] to-[var(--vidzo-yellow)] bg-clip-text text-transparent">pack out.</span>
            </h1>
            <p className="hero-sub mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl">
              Vidzo turns your rough content idea into a ready-to-produce script, voiceover, visuals, thumbnail direction, captions, hashtags, and source-backed research — all in one flow.
            </p>
            <div className="hero-cta mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" className="text-base h-12 px-6 group bg-foreground text-background hover:bg-foreground/90">
                  Start creating free
                  <ArrowRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#how">
                <Button size="lg" variant="outline" className="text-base h-12 px-6">See how it works</Button>
              </a>
            </div>
          </div>

          {/* Hero: stacked product cards */}
          <div className="relative h-[480px] sm:h-[540px]">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--vidzo-magenta)]/15 via-[var(--vidzo-blue)]/15 to-[var(--vidzo-yellow)]/15 rounded-3xl blur-3xl" />
            {[
              { icon: FileText, label: "Script", grad: "from-pink-500 to-rose-500", pos: "top-0 left-0 sm:left-4 rotate-[-8deg]", w: "w-[62%]" },
              { icon: Mic, label: "Voiceover", grad: "from-violet-500 to-indigo-600", pos: "top-16 right-0 rotate-[6deg]", w: "w-[58%]" },
              { icon: ImageIcon, label: "Visual Plan", grad: "from-blue-500 to-cyan-500", pos: "top-44 left-4 rotate-[3deg]", w: "w-[60%]" },
              { icon: Sparkles, label: "Thumbnail", grad: "from-amber-400 to-orange-500", pos: "top-60 right-6 rotate-[-5deg]", w: "w-[54%]" },
              { icon: Hash, label: "Caption", grad: "from-emerald-400 to-teal-500", pos: "bottom-12 left-0 rotate-[-3deg]", w: "w-[50%]" },
              { icon: BookOpen, label: "Sources", grad: "from-fuchsia-500 to-purple-600", pos: "bottom-0 right-2 rotate-[7deg]", w: "w-[48%]" },
            ].map((c) => (
              <div key={c.label} className={`hero-card absolute ${c.pos} ${c.w} rounded-2xl bg-gradient-to-br ${c.grad} text-white shadow-2xl p-4 backdrop-blur-sm`}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-white/25 flex items-center justify-center">
                    <c.icon className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-sm tracking-tight">{c.label}</span>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="h-1.5 rounded-full bg-white/40 w-full" />
                  <div className="h-1.5 rounded-full bg-white/30 w-[80%]" />
                  <div className="h-1.5 rounded-full bg-white/20 w-[55%]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-y border-border bg-foreground text-background overflow-hidden py-4">
        <div className="marquee-track flex gap-12 whitespace-nowrap text-2xl sm:text-4xl font-black tracking-tight">
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
            <div key={f.title} className={`feature-tile group rounded-2xl border border-border bg-gradient-to-br ${f.grad} p-6 hover:border-foreground/20 hover:shadow-xl transition-all`}>
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${f.iconBg} text-white flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
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
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${s.grad} text-white flex items-center justify-center shadow-lg`}>
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
            Whether you are creating business stories, fitness reels, educational videos, product explainers, or personal brand content, Vidzo gives you the production structure before you start recording.
          </p>
        </div>
        <div className="usecase-grid mt-10 flex flex-wrap gap-3">
          {[
            { label: "YouTube Shorts", c: "bg-pink-500 text-white" },
            { label: "Instagram Reels", c: "bg-fuchsia-500 text-white" },
            { label: "Founder stories", c: "bg-indigo-600 text-white" },
            { label: "Startup explainers", c: "bg-blue-500 text-white" },
            { label: "Gym content", c: "bg-emerald-500 text-white" },
            { label: "Coaching videos", c: "bg-teal-500 text-white" },
            { label: "Product ads", c: "bg-amber-400 text-foreground" },
            { label: "Educational content", c: "bg-orange-500 text-white" },
            { label: "Agency content", c: "bg-violet-600 text-white" },
            { label: "Personal brand videos", c: "bg-rose-500 text-white" },
          ].map((p) => (
            <span key={p.label} className={`usecase-pill ${p.c} rounded-full px-5 py-2.5 text-sm font-bold shadow-md hover:scale-105 transition-transform cursor-default`}>
              {p.label}
            </span>
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
              A full content kit, neatly organized.
            </h2>
          </div>

          <div className="dashboard-preview mt-12 rounded-3xl bg-background text-foreground shadow-2xl border border-border overflow-hidden">
            {/* Top bar */}
            <div className="border-b border-border px-5 py-3 flex items-center gap-2 bg-card">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <div className="ml-3 text-xs text-muted-foreground">vidzo.app / dashboard</div>
            </div>

            <div className="grid lg:grid-cols-[260px,1fr] min-h-[520px]">
              {/* Sidebar */}
              <aside className="border-r border-border bg-secondary/30 p-4 hidden lg:block">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Workspace</div>
                {["Dashboard", "Projects", "Library", "Trends", "Brand presets"].map((i, k) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${k === 0 ? "bg-foreground text-background" : "text-muted-foreground"}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />{i}
                  </div>
                ))}
                <div className="mt-6 text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Recent projects</div>
                {["D2C virality reel", "Founder Monday story", "Fitness 30-day arc"].map((p) => (
                  <div key={p} className="px-3 py-1.5 text-xs text-muted-foreground truncate">• {p}</div>
                ))}
              </aside>

              {/* Main */}
              <div className="p-5 sm:p-7 space-y-5">
                {/* Input card */}
                <div className="rounded-2xl border border-border p-5 bg-gradient-to-br from-[var(--vidzo-magenta)]/10 via-[var(--vidzo-blue)]/10 to-transparent">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--vidzo-magenta)]">New project</div>
                  <div className="mt-1 font-bold text-lg">What are you creating today?</div>
                  <div className="mt-3 rounded-xl bg-background border border-border p-3 text-sm text-muted-foreground">
                    Create a 40-second reel on how a small D2C brand went viral.
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
                      <Sparkles className="h-4 w-4" /> Generate content pack
                    </Button>
                    <span className="text-[11px] text-muted-foreground">Hinglish · 40s · Reel</span>
                  </div>
                </div>

                {/* Output modules */}
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { icon: FileText, label: "Script", c: "from-pink-500 to-rose-500", status: "Ready" },
                    { icon: Mic, label: "Voiceover", c: "from-violet-500 to-indigo-600", status: "Ready" },
                    { icon: ImageIcon, label: "Visual Plan", c: "from-blue-500 to-cyan-500", status: "Ready" },
                    { icon: Sparkles, label: "Thumbnail", c: "from-amber-400 to-orange-500", status: "3 concepts" },
                    { icon: Hash, label: "Caption", c: "from-emerald-400 to-teal-500", status: "Ready" },
                    { icon: BookOpen, label: "Sources", c: "from-fuchsia-500 to-purple-600", status: "5 cited" },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl border border-border p-3 bg-card">
                      <div className="flex items-center justify-between">
                        <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${m.c} text-white flex items-center justify-center`}>
                          <m.icon className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">{m.status}</span>
                      </div>
                      <div className="mt-2 font-bold text-sm">{m.label}</div>
                      <div className="mt-2 flex gap-1.5">
                        <button className="text-[10px] px-2 py-1 rounded-md border border-border flex items-center gap-1 hover:bg-secondary">
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                        <button className="text-[10px] px-2 py-1 rounded-md border border-border flex items-center gap-1 hover:bg-secondary">
                          <RefreshCw className="h-3 w-3" /> Regenerate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quality check */}
                <div className="rounded-2xl border border-border p-5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Content quality check
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">Looks good</span>
                  </div>
                  <div className="mt-3 grid sm:grid-cols-5 gap-3">
                    {[
                      { l: "Hook strength", v: 92 },
                      { l: "Clarity", v: 88 },
                      { l: "Pacing", v: 81 },
                      { l: "Source coverage", v: 95 },
                      { l: "Platform fit", v: 90 },
                    ].map((q) => (
                      <div key={q.l}>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-muted-foreground">{q.l}</span>
                          <span className="font-bold">{q.v}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[var(--vidzo-magenta)] via-[var(--vidzo-blue)] to-[var(--vidzo-yellow)]" style={{ width: `${q.v}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: Why Vidzo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-[var(--vidzo-magenta)]">Why Vidzo</div>
            <h2 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight">
              Because creators do not need more blank pages.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Most creators lose time before production even begins — researching, structuring, writing, finding visuals, thinking of thumbnails, and preparing captions. Vidzo compresses that messy pre-production process into one clean workflow.
            </p>
            <ul className="mt-6 space-y-2.5">
              {[
                "Less blank-page time",
                "Better hooks and structure",
                "Faster production planning",
                "Cleaner handoff to voice, design, and editing tools",
                "Useful for solo creators and teams",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-[var(--vidzo-blue)] shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl overflow-hidden shadow-xl rotate-[-2deg]">
              <img src={hero1} alt="Vidzo creative studio" loading="lazy" className="w-full h-64 object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl mt-8 rotate-[3deg]">
              <img src={hero2} alt="Content pack cards" loading="lazy" className="w-full h-64 object-cover" />
            </div>
            <div className="col-span-2 rounded-2xl overflow-hidden shadow-xl rotate-[-1deg]">
              <img src={hero3} alt="Vidzo abstract" loading="lazy" className="w-full h-48 object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-20 sm:pb-28">
        <div className="rounded-3xl bg-gradient-to-br from-[var(--vidzo-magenta)] via-[var(--vidzo-blue)] to-[var(--vidzo-yellow)] p-10 sm:p-16 text-white relative overflow-hidden">
          <div className="relative">
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight max-w-3xl">
              Turn your next idea into a ready-to-produce video.
            </h2>
            <p className="mt-4 text-lg max-w-2xl opacity-95">
              Start with a topic. Leave with the full content pack.
            </p>
            <div className="mt-8">
              <Link to="/auth">
                <Button size="lg" className="text-base h-12 px-7 bg-foreground text-background hover:bg-foreground/90">
                  Start with Vidzo
                  <ArrowRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 grid sm:grid-cols-2 gap-6 items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--vidzo-magenta)] via-[var(--vidzo-blue)] to-[var(--vidzo-yellow)] flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-lg">V</span>
              </div>
              <span className="font-black tracking-tight text-lg">Vidzo</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Vidzo — AI production room for creators.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 sm:justify-end text-sm font-medium">
            <a href="#what" className="hover:text-primary">What we do</a>
            <a href="#how" className="hover:text-primary">How it works</a>
            <a href="#product" className="hover:text-primary">Product</a>
            <Link to="/auth" className="hover:text-primary">Sign in</Link>
            <Link to="/auth" className="hover:text-primary">Get Vidzo</Link>
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
              lineHeight: "1.05",
              paddingBottom: "0.15em",
              willChange: "font-variation-settings",
            }}
          >
            VIDZO
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground px-4">
            <span>© 2026 Vidzo. Built for creators.</span>
            <span>Made for creators.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
