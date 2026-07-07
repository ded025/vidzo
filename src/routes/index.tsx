import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Mic,
  Image as ImageIcon,
  FileText,
  Hash,
  BookOpen,
  Sparkles,
  Lightbulb,
  Wand2,
  Rocket,
  CheckCircle2,
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
      const { data } = await supabase.auth.getSession();
      if (data.session) throw redirect({ to: "/chat/dashboard" });
    } catch (e: unknown) {
      if (e && typeof e === "object" && "isRedirect" in e) throw e;
    }
  },
  head: () => ({
    meta: [
      { title: "Vidzo · AI production room for creators" },
      {
        name: "description",
        content:
          "Vidzo turns any idea into a production-ready content pack: script, voiceover dialogue, scene-by-scene visuals, thumbnails, captions, hashtags, and source-backed research.",
      },
      { property: "og:title", content: "Vidzo · AI production room for creators" },
      { property: "og:description", content: "One idea in. Full video pack out." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigate({ to: "/chat/dashboard", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED")) {
        navigate({ to: "/chat/dashboard", replace: true });
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    let mounted = true;
    import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
      if (!mounted) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        gsap.from(".hero-word", {
          y: 60,
          opacity: 0,
          duration: 1.1,
          ease: "power4.out",
          stagger: 0.06,
        });
        gsap.from(".hero-sub", {
          y: 20,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          delay: 0.5,
        });
        gsap.from(".hero-cta", {
          y: 16,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          delay: 0.7,
          stagger: 0.08,
        });
        gsap.from(".hero-card", {
          y: 40,
          opacity: 0,
          scale: 0.85,
          duration: 0.9,
          ease: "back.out(1.5)",
          stagger: 0.1,
          delay: 0.3,
        });
        gsap.from(".feature-tile", {
          y: 40,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: ".features-grid", start: "top 80%" },
        });
        gsap.from(".step-card", {
          y: 40,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: ".steps-grid", start: "top 80%" },
        });
        gsap.from(".dashboard-preview", {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".dashboard-preview", start: "top 80%" },
        });
        gsap.to(".giant-vidzo", {
          fontVariationSettings: '"wght" 1000, "wdth" 151',
          ease: "none",
          scrollTrigger: {
            trigger: ".footer-vidzo",
            start: "top bottom",
            end: "bottom bottom",
            scrub: 0.6,
          },
        });
      }, rootRef);
      return () => ctx.revert();
    });
    return () => {
      mounted = false;
    };
  }, []);

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div
      ref={rootRef}
      className="min-h-screen bg-background text-foreground overflow-x-hidden"
      style={{ fontFamily: '"Roboto Flex", sans-serif' }}
    >
      {/* Playfair Display font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&display=swap"
        rel="stylesheet"
      />

      {/* FLOATING GLASS NAV */}
      <header className="fixed top-3 inset-x-3 sm:inset-x-6 z-50">
        <div className="max-w-6xl mx-auto glass-header rounded-2xl">
          <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <VidzoLogo className="h-7 sm:h-8 w-auto" />
            </Link>
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
              <a href="#what" className="hover:text-primary transition-colors">
                What we do
              </a>
              <a href="#how" className="hover:text-primary transition-colors">
                How it works
              </a>
              <a href="#product" className="hover:text-primary transition-colors">
                Product
              </a>
              <Link to="/pricing" className="hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link to="/about" className="hover:text-primary transition-colors">
                About
              </Link>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle className="hidden sm:inline-flex" />
              <Button variant="ghost" size="sm" onClick={() => openAuth("signin")}>
                Sign in
              </Button>
              <Button
                size="sm"
                className="bg-foreground text-background hover:bg-foreground/90"
                onClick={() => openAuth("signup")}
              >
                Get Vidzo
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-28 sm:pt-36 pb-16 sm:pb-24">
        <div className="grid lg:grid-cols-[1.15fr,1fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              AI production room for creators
            </div>

            {/* Hero heading — Playfair Display, two lines, pack out italic */}
            <h1
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: "clamp(2.6rem, 6.5vw, 5.5rem)",
                fontWeight: 900,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
              }}
            >
              <span className="hero-word block">One idea in.</span>
              <span className="hero-word block">
                Full video{" "}
                <span
                  className="bg-gradient-to-r from-[var(--vidzo-magenta)] via-[var(--vidzo-blue)] to-[var(--vidzo-yellow)] bg-clip-text text-transparent"
                  style={{ fontStyle: "italic" }}
                >
                  pack out.
                </span>
              </span>
            </h1>

            <p className="hero-sub mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl">
              Vidzo turns your rough content idea into a ready-to-record script, voiceover dialogue,
              scene-by-scene visuals, thumbnail direction, captions, hashtags, and source-backed
              research — all in one flow.
            </p>
            <div className="hero-cta mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="text-base h-12 px-6 group bg-foreground text-background hover:bg-foreground/90"
                onClick={() => openAuth("signup")}
              >
                Start creating free
                <ArrowRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <a href="#how">
                <Button size="lg" variant="outline" className="text-base h-12 px-6">
                  See how it works
                </Button>
              </a>
            </div>
            <p className="mt-5 text-xs text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
              No credit card required · Free to start
            </p>
          </div>

          {/* Hero: scattered floating product cards */}
          <div className="relative h-[520px] sm:h-[580px]">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--vidzo-magenta)]/15 via-[var(--vidzo-blue)]/15 to-[var(--vidzo-yellow)]/15 rounded-3xl blur-3xl" />
            {[
              {
                icon: FileText,
                label: "Script",
                grad: "from-pink-500 to-rose-500",
                pos: "top-0 left-0 sm:left-4 rotate-[-6deg]",
                w: "w-[64%]",
                body: '"Bhai ye chhoti si D2C brand ne 90 din mein 4 crore kaise kamaye? Sun…"',
              },
              {
                icon: Mic,
                label: "Voiceover dialogue",
                grad: "from-violet-500 to-indigo-600",
                pos: "top-20 right-0 rotate-[5deg]",
                w: "w-[60%]",
                body: "Tone: warm founder energy. Pace: medium. Pause after hook for 0.4s.",
              },
              {
                icon: ImageIcon,
                label: "Visual plan",
                grad: "from-blue-500 to-cyan-500",
                pos: "top-52 left-2 rotate-[2deg]",
                w: "w-[62%]",
                body: "Beat 1: founder POV, warm office, golden hour, handheld 24mm.",
              },
              {
                icon: Sparkles,
                label: "Thumbnail",
                grad: "from-amber-400 to-orange-500",
                pos: "top-72 right-4 rotate-[-4deg]",
                w: "w-[56%]",
                body: 'Big bold text: "₹4 CR IN 90 DAYS" + shocked founder face left.',
              },
              {
                icon: Hash,
                label: "Caption + hashtags",
                grad: "from-emerald-400 to-teal-500",
                pos: "bottom-16 left-0 rotate-[-2deg]",
                w: "w-[58%]",
                body: "Yeh brand chhoti thi, soch badi thi. #d2cindia #founderstory #reelitfeelit",
              },
              {
                icon: BookOpen,
                label: "Sources",
                grad: "from-fuchsia-500 to-purple-600",
                pos: "bottom-0 right-2 rotate-[6deg]",
                w: "w-[52%]",
                body: "5 cited links: YourStory · Inc42 · Moneycontrol · The Ken · ET",
              },
            ].map((c) => (
              <div
                key={c.label}
                className={`hero-card absolute ${c.pos} ${c.w} rounded-2xl bg-gradient-to-br ${c.grad} text-white p-4 backdrop-blur-sm`}
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-white/25 flex items-center justify-center">
                    <c.icon className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-sm tracking-tight">{c.label}</span>
                </div>
                <p className="mt-2.5 text-[12px] leading-snug text-white/95">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INFINITE MARQUEE */}
      <section className="border-y border-border bg-foreground text-background overflow-hidden py-4">
        <div className="vidzo-marquee-track flex gap-12 whitespace-nowrap text-2xl sm:text-4xl font-black tracking-tight w-max">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-12 items-center shrink-0">
              <span>SCRIPT</span>
              <span className="text-[var(--vidzo-magenta)]">·</span>
              <span>VOICEOVER</span>
              <span className="text-[var(--vidzo-yellow)]">·</span>
              <span>VISUAL PLAN</span>
              <span className="text-[var(--vidzo-blue)]">·</span>
              <span>THUMBNAIL</span>
              <span className="text-[var(--vidzo-magenta)]">·</span>
              <span>CAPTION</span>
              <span className="text-[var(--vidzo-yellow)]">·</span>
              <span>HASHTAGS</span>
              <span className="text-[var(--vidzo-blue)]">·</span>
              <span>RESEARCH</span>
              <span className="text-[var(--vidzo-magenta)]">·</span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: Features */}
      <section id="what" className="max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-28">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-[var(--vidzo-magenta)]">
            The content pack
          </div>
          <h2 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight">
            Everything you need before you hit record.
          </h2>
        </div>
        <div className="features-grid mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: FileText,
              title: "Creator-ready scripts",
              body: "Sharp hooks, strong pacing, clear story flow, and endings that land.",
              grad: "from-pink-500/15 to-rose-500/5",
              iconBg: "from-pink-500 to-rose-500",
            },
            {
              icon: Mic,
              title: "Voiceover-ready dialogue",
              body: "Cleanly formatted lines you can record yourself or use with voice tools.",
              grad: "from-violet-500/15 to-indigo-500/5",
              iconBg: "from-violet-500 to-indigo-600",
            },
            {
              icon: ImageIcon,
              title: "Scene-by-scene visuals",
              body: "Clear visual direction for every beat, whether you use stock, AI, or your own footage.",
              grad: "from-blue-500/15 to-cyan-500/5",
              iconBg: "from-blue-500 to-cyan-500",
            },
            {
              icon: Sparkles,
              title: "Thumbnail & first-frame ideas",
              body: "Scroll-stopping visual concepts designed to get attention fast.",
              grad: "from-amber-400/15 to-orange-500/5",
              iconBg: "from-amber-400 to-orange-500",
            },
            {
              icon: Hash,
              title: "Captions & hashtags",
              body: "Post-ready social text tailored to the topic and platform.",
              grad: "from-emerald-400/15 to-teal-500/5",
              iconBg: "from-emerald-400 to-teal-500",
            },
            {
              icon: BookOpen,
              title: "Source-backed research",
              body: "When facts are used, Vidzo includes sources so creators can review the context.",
              grad: "from-fuchsia-500/15 to-purple-600/5",
              iconBg: "from-fuchsia-500 to-purple-600",
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`feature-tile group rounded-2xl border border-border bg-gradient-to-br ${f.grad} p-6 h-full flex flex-col transition-colors hover:border-foreground/20`}
            >
              <div
                className={`h-11 w-11 rounded-xl bg-gradient-to-br ${f.iconBg} text-white flex items-center justify-center mb-4`}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2.5: Visual Story Engine spotlight */}
      <section className="relative overflow-hidden bg-foreground text-background py-20 sm:py-28">
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute -top-24 left-1/3 h-[420px] w-[420px] rounded-full bg-violet-500 blur-[140px]" />
          <div className="absolute bottom-0 right-1/4 h-[380px] w-[380px] rounded-full bg-fuchsia-500 blur-[140px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-[1.05fr,1fr] gap-12 items-center">
          <div className="vse-copy">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
              New · Visual Story Engine
            </div>
            <h2
              className="mt-5 font-black tracking-tight"
              style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
            >
              For creators who let the{" "}
              <span
                className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent"
                style={{ fontStyle: "italic", fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                visuals talk.
              </span>
            </h2>
            <p className="mt-5 text-base sm:text-lg text-background/70 max-w-xl">
              Cinematic reels, b-roll storytelling, product films, gym & travel edits. Vidzo returns a shot-by-shot
              9:16 blueprint — camera, lens, lighting, editing beats, diegetic audio, and hero-moment coverage.
              No script. No voiceover. Just craft.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 gap-3 max-w-xl">
              {[
                "7-beat story arc: Establish → Ritual → Details → Action → Hero → Aura → Resolution",
                "Wide, medium, close, extreme-close coverage on every hero moment",
                "Real DP language — 24mm, 50mm, gimbal, rack focus, whip pan",
                "Diegetic audio capture list + trending Reels/TikTok music",
              ].map((line) => (
                <div key={line} className="flex items-start gap-2 text-sm text-background/85">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-fuchsia-300 shrink-0" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => openAuth("signup")}
                className="text-base h-12 px-6 bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white hover:opacity-90"
              >
                Try Visual Story Engine
                <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mocked shot list card */}
          <div className="vse-mock relative">
            <div className="absolute -inset-6 bg-gradient-to-br from-fuchsia-500/20 via-violet-500/20 to-indigo-500/20 blur-3xl rounded-[40px]" />
            <div className="relative rounded-3xl bg-[#0b0d14] border border-white/10 p-5 shadow-2xl">
              <div className="flex items-center justify-between text-[11px] text-white/50 uppercase tracking-wider">
                <span>Blueprint · Gym PR</span>
                <span>9:16 · Cinematic</span>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  { beat: "Establish World", shot: "24mm wide, doorway, blue hour", tag: "WIDE" },
                  { beat: "Ritual", shot: "50mm macro, chalk on palms, side light", tag: "CLOSE" },
                  { beat: "Action", shot: "Handheld tracking, bar clean, backlit dust", tag: "MEDIUM" },
                  { beat: "Hero Moment", shot: "85mm push-in on face, PR lockout", tag: "EXT-CLOSE" },
                  { beat: "Aura", shot: "Overhead slow tilt, chalk cloud, silence", tag: "OVERHEAD" },
                  { beat: "Resolution", shot: "24mm exit, sunrise flare, gym door", tag: "WIDE" },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-start gap-3"
                  >
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-200 shrink-0">
                      {row.tag}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white">{row.beat}</div>
                      <div className="text-[12px] text-white/60 truncate">{row.shot}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-[10px] uppercase tracking-wider text-white/50 mb-1">Trending audio</div>
                <div className="text-xs text-white/80">
                  "Espresso" (sped up) · Sabrina Carpenter · Reels ↑ 240% this week
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2.6: Everything Vidzo covers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-28">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-[var(--vidzo-blue)]">
            One flow. Every format.
          </div>
          <h2 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight">
            Drop a brief. Get everything.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
            Paste text, upload a .pdf / .docx / .md, or start from a trend. Pick your platform, delivery
            style, tone, and language — Vidzo tailors the entire pack around it.
          </p>
        </div>

        <div className="mt-12 grid lg:grid-cols-4 gap-3 text-sm">
          {[
            {
              title: "Platforms",
              items: ["Instagram", "YouTube Shorts", "YouTube", "LinkedIn", "TikTok"],
              grad: "from-pink-500/15 to-rose-500/5",
            },
            {
              title: "Content type",
              items: ["Educational", "Storytelling", "Opinion", "Value", "Sales", "Entertainment", "News"],
              grad: "from-violet-500/15 to-indigo-500/5",
            },
            {
              title: "Delivery style",
              items: ["Talking Head", "Voice Over", "UGC", "Documentary", "Faceless"],
              grad: "from-blue-500/15 to-cyan-500/5",
            },
            {
              title: "Tone",
              items: ["Founder", "Educational", "Premium", "Funny", "Dramatic"],
              grad: "from-amber-400/15 to-orange-500/5",
            },
            {
              title: "Length",
              items: ["30s", "60s", "90s"],
              grad: "from-emerald-400/15 to-teal-500/5",
            },
            {
              title: "Language",
              items: ["Hinglish", "English", "Hindi", "Tamil", "Marathi", "Bengali", "Spanish"],
              grad: "from-fuchsia-500/15 to-purple-500/5",
            },
            {
              title: "Brief input",
              items: ["Paste text", ".txt / .md", ".pdf", ".docx", "Drag & drop"],
              grad: "from-cyan-500/15 to-blue-500/5",
            },
            {
              title: "Auto-included",
              items: ["Trending audio", "Web-cited sources", "Thumbnails", "Captions", "Hashtags"],
              grad: "from-rose-500/15 to-pink-500/5",
            },
          ].map((col) => (
            <div
              key={col.title}
              className={`rounded-2xl border border-border bg-gradient-to-br ${col.grad} p-5`}
            >
              <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                {col.title}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {col.items.map((it) => (
                  <span
                    key={it}
                    className="text-xs px-2 py-1 rounded-md border border-border bg-card font-medium"
                  >
                    {it}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* SECTION 3: How */}
      <section id="how" className="bg-secondary/40 border-y border-border py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-[var(--vidzo-blue)]">
            How it works
          </div>
          <h2 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight max-w-3xl">
            Brief → Build → Ship.
          </h2>
          <div className="steps-grid mt-12 grid md:grid-cols-3 gap-4">
            {[
              {
                n: "01",
                icon: Lightbulb,
                t: "Drop your idea",
                b: "Enter a topic, trend, niche, creator style, or rough thought.",
                grad: "from-[var(--vidzo-magenta)] to-pink-400",
              },
              {
                n: "02",
                icon: Wand2,
                t: "Vidzo builds the pack",
                b: "Get script, voiceover, scenes, thumbnail direction, captions, hashtags, and sources.",
                grad: "from-[var(--vidzo-blue)] to-cyan-400",
              },
              {
                n: "03",
                icon: Rocket,
                t: "Create without starting from zero",
                b: "Record, edit, paste into your tools, or hand it to your team.",
                grad: "from-[var(--vidzo-yellow)] to-amber-500",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="step-card relative rounded-2xl bg-background p-7 border border-border overflow-hidden"
              >
                <div
                  className={`absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-to-br ${s.grad} opacity-20 blur-2xl`}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="text-5xl font-black text-foreground/15">{s.n}</div>
                    <div
                      className={`h-11 w-11 rounded-xl bg-gradient-to-br ${s.grad} text-white flex items-center justify-center`}
                    >
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
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-[var(--vidzo-yellow)]">
            Use cases
          </div>
          <h2 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight">
            Built for every kind of creator.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Whether you create business stories, fitness reels, educational videos, product
            explainers, or personal brand content, Vidzo gives you the production structure before
            you start recording.
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
            <div
              key={p.label}
              className={`h-24 rounded-2xl bg-gradient-to-br ${p.grad} text-white flex items-end p-4 font-bold text-sm tracking-tight`}
            >
              {p.label}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: Dashboard preview */}
      <section
        id="product"
        className="bg-foreground text-background py-20 sm:py-28 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[var(--vidzo-magenta)] blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-[var(--vidzo-blue)] blur-[120px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-8">
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-[var(--vidzo-yellow)]">
              Inside Vidzo
            </div>
            <h2 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight">
              Your creator command center.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-background/70 max-w-2xl">
              One dashboard to type a brief, pick format, tone, length and language, browse trends,
              and see content-quality feedback before you record.
            </p>
          </div>

          <div className="dashboard-preview mt-12 rounded-3xl bg-background text-foreground border border-border overflow-hidden">
            <div className="grid min-h-[560px] lg:grid-cols-[220px_1fr]">
              <aside className="bg-[#0b0d14] text-white p-4 hidden lg:flex flex-col gap-2">
                <div className="px-1 pb-3">
                  <VidzoLogo className="h-7 w-auto" />
                </div>
                {[
                  { l: "Dashboard", active: true },
                  { l: "Trends" },
                  { l: "Library" },
                  { l: "Presets" },
                ].map((i) => (
                  <div
                    key={i.l}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${i.active ? "bg-gradient-to-r from-[var(--vidzo-magenta)] to-orange-400 text-white" : "text-white/60"}`}
                  >
                    {i.l}
                  </div>
                ))}
                <div className="mt-3 px-3 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-semibold text-center">
                  + New chat
                </div>
                <div className="mt-5 text-[10px] uppercase tracking-wider text-white/40 px-3">
                  Chats
                </div>
                {["D2C virality reel", "Founder Monday", "Fitness 30-day arc"].map((c) => (
                  <div key={c} className="px-3 py-1.5 text-xs text-white/70 truncate">
                    • {c}
                  </div>
                ))}
              </aside>

              <div className="space-y-5 bg-[#fafaf7] p-5 text-slate-950 dark:bg-[#090d16] dark:text-slate-100 sm:p-7">
                <div className="flex flex-wrap justify-between gap-3 items-start">
                  <div>
                    <div className="font-bold text-xl">Welcome back, Aman 👋</div>
                    <div className="text-xs text-muted-foreground">
                      Turn a trend or idea into a ready-to-produce content pack.
                    </div>
                  </div>
                  <div className="flex gap-2 text-[11px]">
                    {[
                      { n: 12, l: "Packs" },
                      { n: 4, l: "Ready" },
                      { n: 8, l: "Sources" },
                      { n: 2, l: "Drafts" },
                    ].map((s) => (
                      <div
                        key={s.l}
                        className="min-w-[64px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-slate-950 dark:border-white/10 dark:bg-[#111827] dark:text-slate-100"
                      >
                        <div className="font-bold text-sm">{s.n}</div>
                        <div className="text-muted-foreground">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid lg:grid-cols-[1fr,260px] gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-pink-100 via-violet-100 to-blue-100 p-5 text-slate-950 dark:border-white/10 dark:from-fuchsia-950/70 dark:via-violet-950/60 dark:to-blue-950/60 dark:text-slate-100">
                    <div className="font-bold flex items-center gap-2">
                      🎁 Create a New Content Pack
                    </div>
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500 dark:border-white/10 dark:bg-[#0d1422] dark:text-slate-300">
                      Create a 40-second reel on how a small D2C brand went viral.
                    </div>
                    <div className="mt-3 grid grid-cols-[64px,1fr] gap-y-2 items-center text-[11px]">
                      <span className="text-muted-foreground">Format</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["Reel", "YT Short", "LinkedIn", "Ad", "Explainer"].map((x, i) => (
                          <span
                            key={x}
                            className={`px-2 py-1 rounded-md border ${i === 0 ? "border-[var(--vidzo-magenta)] text-[var(--vidzo-magenta)]" : "border-border text-foreground"}`}
                          >
                            {x}
                          </span>
                        ))}
                      </div>
                      <span className="text-muted-foreground">Tone</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["Founder", "Dramatic", "Educational", "Funny", "Premium"].map((x, i) => (
                          <span
                            key={x}
                            className={`px-2 py-1 rounded-md border ${i === 0 ? "border-[var(--vidzo-magenta)] text-[var(--vidzo-magenta)]" : "border-border text-foreground"}`}
                          >
                            {x}
                          </span>
                        ))}
                      </div>
                      <span className="text-muted-foreground">Length</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["30s", "40s", "60s", "90s"].map((x, i) => (
                          <span
                            key={x}
                            className={`px-2 py-1 rounded-md border ${i === 1 ? "border-[var(--vidzo-magenta)] text-[var(--vidzo-magenta)]" : "border-border text-foreground"}`}
                          >
                            {x}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <div className="rounded-md px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500">
                        ✨ Generate
                      </div>
                      <div className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 dark:border-white/15 dark:bg-[#111827] dark:text-slate-100">
                        ↗ Use a trend
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 dark:border-white/10 dark:bg-[#111827] dark:text-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm">📈 Content Quality</div>
                      <span className="text-[10px] font-bold text-emerald-600">Looks Good</span>
                    </div>
                    <div className="mt-3 flex flex-col items-center">
                      <div
                        className="relative h-24 w-24 rounded-full flex items-center justify-center"
                        style={{ background: "conic-gradient(#10b981 91%, #e5e7eb 0)" }}
                      >
                        <div className="flex h-[78%] w-[78%] flex-col items-center justify-center rounded-full bg-white dark:bg-[#111827]">
                          <div className="text-2xl font-black">91</div>
                          <div className="text-[9px] text-muted-foreground">/100</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5 text-[11px]">
                      {[
                        { l: "Hook", v: 92 },
                        { l: "Clarity", v: 88 },
                        { l: "Pacing", v: 85 },
                        { l: "Sources", v: 81 },
                        { l: "Platform fit", v: 90 },
                      ].map((q) => (
                        <div key={q.l}>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{q.l}</span>
                            <span className="font-bold">{q.v}</span>
                          </div>
                          <div className="h-1 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[var(--vidzo-magenta)] via-[var(--vidzo-blue)] to-[var(--vidzo-yellow)]"
                              style={{ width: `${q.v}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 dark:border-white/10 dark:bg-[#111827] dark:text-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-bold text-sm">📈 Trends</div>
                    <div className="text-[10px] text-muted-foreground">
                      Pick a category — Vidzo searches live sources.
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { t: "Indian startup funding", c: "Business", v: 84, e: "🚀" },
                      { t: "Shark Tank India", c: "Entertainment", v: 82, e: "🏆" },
                      { t: "D2C going viral", c: "Marketing", v: 79, e: "🛍️" },
                      { t: "Gym controversies", c: "Fitness", v: 76, e: "💪" },
                    ].map((tr) => (
                      <div key={tr.t} className="rounded-lg border border-border p-2.5 text-[11px]">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>{tr.e}</span>
                          {tr.t}
                        </div>
                        <div className="text-muted-foreground mt-0.5">{tr.c}</div>
                        <div className="text-orange-500 mt-1 font-semibold">
                          🔥 {tr.v}% virality
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-r from-[var(--vidzo-magenta)] via-pink-400 to-violet-500 text-white p-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-bold">✨ Start from your own idea</div>
                    <div className="text-[12px] text-white/90">
                      Type your own topic and Vidzo will build a content pack.
                    </div>
                  </div>
                  <div className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-900">
                    Create custom pack →
                  </div>
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
              <Button
                size="lg"
                className="text-base h-12 px-7 bg-foreground text-background hover:bg-foreground/90"
                onClick={() => openAuth("signup")}
              >
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
            <p className="mt-2 text-sm text-muted-foreground">
              Vidzo — AI production room for creators.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <a href="mailto:support@vidzo.in" className="hover:text-foreground">
                support@vidzo.in
              </a>
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 sm:justify-end text-sm font-medium">
            <a href="#what" className="hover:text-primary">
              What we do
            </a>
            <a href="#how" className="hover:text-primary">
              How it works
            </a>
            <Link to="/pricing" className="hover:text-primary">
              Pricing
            </Link>
            <Link to="/about" className="hover:text-primary">
              About
            </Link>
            <Link to="/contact" className="hover:text-primary">
              Contact
            </Link>
            <Link to="/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-primary">
              Privacy
            </Link>
            <button onClick={() => openAuth("signin")} className="hover:text-primary">
              Sign in
            </button>
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
