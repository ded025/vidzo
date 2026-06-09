import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, Image as ImageIcon, Video, ShieldCheck, Sparkles, Hash } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import gsap from "gsap";
import hero1 from "@/assets/landing-hero-1.jpg";
import hero2 from "@/assets/landing-hero-2.jpg";
import hero3 from "@/assets/landing-hero-3.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vidzo · End-to-end content engine for creators" },
      { name: "description", content: "Vidzo turns a single brief into a full content pack: ElevenLabs-ready voiceover, image + video prompts, thumbnails, captions, hashtags — all source-verified." },
      { property: "og:title", content: "Vidzo · End-to-end content engine" },
      { property: "og:description", content: "Brief in. Full production-ready pack out. Verified. AI-ready." },
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
    if (signedIn) return;
    const ctx = gsap.context(() => {
      gsap.from(".hero-word", {
        y: 60, opacity: 0, duration: 1.1, ease: "power4.out", stagger: 0.06,
      });
      gsap.from(".hero-sub", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out", delay: 0.5 });
      gsap.from(".hero-cta", { y: 16, opacity: 0, duration: 0.7, ease: "power3.out", delay: 0.7, stagger: 0.08 });
      gsap.from(".color-block", {
        scale: 0.6, opacity: 0, duration: 1.2, ease: "back.out(1.4)", stagger: 0.15, delay: 0.3,
      });
      gsap.from(".feature-tile", {
        y: 40, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.08,
        scrollTrigger: { trigger: ".features-grid", start: "top 80%" },
      });
      // Marquee
      gsap.to(".marquee-track", {
        xPercent: -50, duration: 28, ease: "none", repeat: -1,
      });
      // Giant footer wordmark variable axis scroll animation
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
  }, [signedIn]);

  // ScrollTrigger plugin registration (only client)
  useEffect(() => {
    let mounted = true;
    import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
      if (mounted) gsap.registerPlugin(ScrollTrigger);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div ref={rootRef} className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-black text-lg">V</span>
            </div>
            <span className="font-bold tracking-tight text-lg">Vidzo</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <a href="#what" className="hover:text-primary transition-colors">What we do</a>
            <a href="#how" className="hover:text-primary transition-colors">How it works</a>
            <a href="#proof" className="hover:text-primary transition-colors">Proof</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/auth"><Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">Get Vidzo</Button></Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24">
        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              An AI-ready content factory
            </div>
            <h1 className="text-[44px] leading-[0.95] sm:text-7xl lg:text-8xl font-black tracking-[-0.04em]">
              <span className="hero-word inline-block">Brief in.</span>{" "}
              <span className="hero-word inline-block">Full</span>{" "}
              <span className="hero-word inline-block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">pack out.</span>
            </h1>
            <p className="hero-sub mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl">
              Vidzo turns one chat brief into ElevenLabs-ready voiceover, beat-by-beat image AND video prompts, thumbnails, caption, hashtags — every fact source-verified.
            </p>
            <div className="hero-cta mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" className="text-base h-12 px-6 group">
                  Start creating free
                  <ArrowRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#how">
                <Button size="lg" variant="outline" className="text-base h-12 px-6">See how it works</Button>
              </a>
            </div>
          </div>

          {/* Hero collage */}
          <div className="relative h-[460px] sm:h-[520px]">
            <div className="color-block absolute top-0 right-0 w-[78%] h-[60%] rounded-2xl overflow-hidden shadow-2xl rotate-3">
              <img src={hero1} alt="" loading="eager" className="w-full h-full object-cover" />
            </div>
            <div className="color-block absolute bottom-0 left-0 w-[55%] h-[55%] rounded-2xl overflow-hidden shadow-xl -rotate-6">
              <img src={hero2} alt="" loading="eager" className="w-full h-full object-cover" />
            </div>
            <div className="color-block absolute bottom-10 right-10 w-[40%] h-[40%] rounded-2xl overflow-hidden shadow-xl rotate-2">
              <img src={hero3} alt="" loading="eager" className="w-full h-full object-cover" />
            </div>
            <div className="color-block absolute -top-4 left-8 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-bold shadow-lg rotate-[-8deg]">
              30s Reel · Hinglish
            </div>
            <div className="color-block absolute top-1/2 -left-2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg rotate-6">
              ✓ Source-verified
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-y border-border bg-foreground text-background overflow-hidden py-4">
        <div className="marquee-track flex gap-12 whitespace-nowrap text-2xl sm:text-4xl font-black tracking-tight">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-12 items-center shrink-0">
              <span>VOICEOVER</span><span className="text-accent">·</span>
              <span>IMAGE PROMPTS</span><span className="text-accent">·</span>
              <span>VIDEO PROMPTS</span><span className="text-accent">·</span>
              <span>THUMBNAILS</span><span className="text-accent">·</span>
              <span>CAPTIONS</span><span className="text-accent">·</span>
              <span>HASHTAGS</span><span className="text-accent">·</span>
              <span>SOURCES</span><span className="text-accent">·</span>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT WE DO */}
      <section id="what" className="max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-28">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-accent">What Vidzo gives you</div>
          <h2 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight">
            One brief. Every production brick — ready to ship.
          </h2>
        </div>
        <div className="features-grid mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Mic, title: "ElevenLabs voiceover", body: "Clean dialogue text, copy-paste into ElevenLabs. Voice + tone direction included separately." },
            { icon: ImageIcon, title: "Image prompts per beat", body: "Detailed Midjourney/DALL·E/Gemini-ready prompts — subject, lighting, camera, style." },
            { icon: Video, title: "Video prompts per beat", body: "Sora/Runway/Veo/Kling-ready prompts with motion and camera moves." },
            { icon: Sparkles, title: "3 thumbnail concepts", body: "Full image-gen prompts with composition and on-frame text. Pick what works." },
            { icon: Hash, title: "Caption + hashtags", body: "Platform-tuned captions and 8–15 hashtags. Ready to paste." },
            { icon: ShieldCheck, title: "Source-verified", body: "A validator silently drops any unverified claim. Real URLs attached. No hallucinations." },
          ].map((f) => (
            <div key={f.title} className="feature-tile group rounded-2xl border border-border bg-card p-6 hover:border-primary hover:shadow-xl transition-all">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="bg-secondary/40 border-y border-border py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-accent">How it works</div>
          <h2 className="mt-3 text-4xl sm:text-6xl font-black tracking-tight max-w-3xl">
            Chat → Validate → Ship.
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-4">
            {[
              { n: "01", t: "Lock your brief", b: "Drop one prompt. Vidzo locks the entire chat to that direction." },
              { n: "02", t: "AI searches + drafts", b: "Live search pulls real sources. The model drafts your full pack." },
              { n: "03", t: "Validator strips lies", b: "Unverified claims get silently removed before you ever see them." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl bg-background p-6 border border-border">
                <div className="text-5xl font-black text-primary/30">{s.n}</div>
                <h3 className="mt-2 font-bold text-xl">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF / CTA */}
      <section id="proof" className="max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-28">
        <div className="rounded-3xl bg-gradient-to-br from-primary via-accent to-primary p-10 sm:p-16 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 mix-blend-overlay">
            <img src={hero1} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="relative">
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight max-w-3xl">
              Built for the creator who ships every day.
            </h2>
            <p className="mt-4 text-lg max-w-2xl opacity-90">
              Stop staring at blank Notion docs. Brief Vidzo, get the production pack, hit record.
            </p>
            <div className="mt-8">
              <Link to="/auth">
                <Button size="lg" className="text-base h-12 px-7 bg-background text-foreground hover:bg-background/90">
                  Start with Vidzo free
                  <ArrowRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* GIANT FOOTER WORDMARK */}
      <section className="footer-vidzo pt-12 pb-6 overflow-hidden">
        <div className="max-w-7xl mx-auto px-2">
          <div
            className="giant-vidzo text-center leading-none tracking-[-0.06em] bg-gradient-to-br from-primary via-accent to-foreground bg-clip-text text-transparent"
            style={{
              fontFamily: '"Roboto Flex", sans-serif',
              fontVariationSettings: '"wght" 800, "wdth" 100',
              fontSize: "clamp(6rem, 26vw, 28rem)",
              willChange: "font-variation-settings",
            }}
          >
            VIDZO
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground px-4">
            <span>© {new Date().getFullYear()} Vidzo</span>
            <span>Made for creators.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
