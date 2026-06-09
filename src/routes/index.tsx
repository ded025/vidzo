import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Search, FileText, Wand2, ArrowRight, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import gsap from "gsap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reel Engine · Hinglish Shorts Script Generator" },
      {
        name: "description",
        content:
          "Auto-fetch trending Indian startup stories and turn them into viral 30-second Hinglish YouTube Shorts scripts.",
      },
      { property: "og:title", content: "Reel Engine — Hinglish Shorts Script Engine" },
      {
        property: "og:description",
        content:
          "From trending topic to full Hinglish script, visuals, hooks and hashtags — in seconds.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);

  // Bounce signed-in users to /chat so OAuth callback doesn't strand them on the landing
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setSignedIn(true);
        navigate({ to: "/chat" });
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (signedIn) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-badge", { y: 12, opacity: 0, duration: 0.6, ease: "power3.out" });
      gsap.from(".hero-line", {
        y: 28,
        opacity: 0,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.08,
        delay: 0.1,
      });
      gsap.from(".hero-sub", { y: 16, opacity: 0, duration: 0.7, ease: "power3.out", delay: 0.45 });
      gsap.from(".hero-cta", {
        y: 12,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        delay: 0.6,
        stagger: 0.08,
      });
      gsap.from(".feature-card", {
        y: 24,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.1,
        delay: 0.7,
      });
      gsap.from(".nav-item", { y: -10, opacity: 0, duration: 0.5, ease: "power2.out", stagger: 0.06 });

      // Floating orb
      if (orbRef.current) {
        gsap.to(orbRef.current, {
          y: 20,
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      // Subtle pointer parallax for the hero glow
      const onMove = (e: PointerEvent) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20;
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        gsap.to(".hero-glow", { x, y, duration: 0.8, ease: "power2.out" });
      };
      window.addEventListener("pointermove", onMove);
      return () => window.removeEventListener("pointermove", onMove);
    }, rootRef);
    return () => ctx.revert();
  }, [signedIn]);

  return (
    <div ref={rootRef} className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <header className="border-b border-border/60 backdrop-blur-md bg-background/70 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="nav-item flex items-center gap-2">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight text-sm sm:text-base">Reel Engine</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link to="/auth" className="nav-item">
              <Button variant="ghost" size="sm" className="px-2 sm:px-3">Sign in</Button>
            </Link>
            <Link to="/auth" className="nav-item">
              <Button size="sm" className="px-3 sm:px-4">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-14 sm:pt-24 pb-12 sm:pb-16 text-center">
        {/* Background glow */}
        <div
          className="hero-glow pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
          aria-hidden
        >
          <div
            ref={orbRef}
            className="h-[420px] w-[420px] sm:h-[640px] sm:w-[640px] rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--primary) 45%, transparent), transparent 60%)",
            }}
          />
        </div>

        <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-border bg-card/70 backdrop-blur px-3 py-1 text-[11px] sm:text-xs text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          For Hinglish startup-story creators
        </div>

        <h1 className="mt-5 sm:mt-6 text-[40px] leading-[1.05] sm:text-6xl md:text-7xl font-semibold tracking-tight">
          <span className="hero-line block">Boring business stories,</span>
          <span className="hero-line block bg-gradient-to-r from-primary via-primary to-foreground bg-clip-text text-transparent">
            addictive 30-sec Shorts.
          </span>
        </h1>

        <p className="hero-sub mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
          Auto-fetch trending Indian startup, founder and D2C stories. Chat with the AI to tweak the hook,
          pace and ending. Get script + visuals + hashtags — ready to shoot.
        </p>

        <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/auth" className="hero-cta w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto group">
              Start writing scripts
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <a
            href="#features"
            className="hero-cta w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card/60 px-5 py-2.5 text-sm font-medium hover:bg-secondary/60 transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
            See how it works
          </a>
        </div>
      </section>

      <section
        id="features"
        className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4"
      >
        {[
          {
            icon: Search,
            title: "Trending topic radar",
            body: "AI searches live startup news, Shark Tank India, D2C brands, funding & viral founders.",
          },
          {
            icon: Wand2,
            title: "Hinglish script engine",
            body: "Hook, story, twist, closing line — in mostly Hindi with natural English startup words.",
          },
          {
            icon: FileText,
            title: "Full creative pack",
            body: "Shot-by-shot visuals, on-screen text, 3 thumbnail hooks, caption, 8-12 hashtags.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="feature-card group rounded-2xl border border-border bg-card/80 p-5 sm:p-6 hover:border-primary/50 hover:bg-card transition-colors"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
