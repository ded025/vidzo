import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight, CheckCircle2, Coins, Sparkles, Star, Zap,
  FileText, Mic, ImageIcon, Hash, BookOpen, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VidzoLogo } from "@/components/vidzo-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthDialog } from "@/components/auth-dialog";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing · Vidzo" },
      { name: "description", content: "Simple credit-based pricing. 5 free scripts. No subscription." },
    ],
  }),
});

const MAGENTA = "#e91e8c";
const BLUE = "#1565c0";
const YELLOW = "#f5a623";

const PLANS = [
  {
    id: "free",
    name: "Free — Early Access",
    credits: "∞",
    price: "₹0",
    sub: "while in beta",
    popular: true,
    iconColor: MAGENTA,
    accentFrom: MAGENTA,
    accentTo: BLUE,
    features: [
      "Unlimited content packs",
      "Unlimited tweaks per chat",
      "Live trend syncing across the web",
      "Brand & keyword research",
      "Full library + export",
      "Script, voiceover, visuals, captions, hashtags, sources",
    ],
    cta: "Start free",
  },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  free: Sparkles,
};


function PricingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode] = useState<"signin" | "signup">("signup");

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" style={{ fontFamily: '"Roboto Flex", sans-serif' }}>
      {/* Roboto Flex font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,300..900&display=swap" rel="stylesheet" />

      {/* NAV */}
      <header className="fixed top-3 inset-x-3 sm:inset-x-6 z-50">
        <div className="max-w-6xl mx-auto glass-header rounded-2xl">
          <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <VidzoLogo className="h-7 sm:h-8 w-auto" />
            </Link>
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              <Link to="/about" className="hover:text-primary transition-colors">About</Link>
              <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle className="hidden sm:inline-flex" />
              <Button variant="ghost" size="sm" onClick={() => setAuthOpen(true)}>Sign in</Button>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90" onClick={() => setAuthOpen(true)}>Get Vidzo</Button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section
        className="relative pt-32 pb-16 px-4 text-center overflow-hidden"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in oklab, ${MAGENTA} 18%, transparent), transparent 70%)`,
        }}
      >
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold mb-6">
            <Coins className="h-3.5 w-3.5" style={{ color: MAGENTA }} />
            Simple, creator-first pricing
          </div>
          <h1
            className="font-black tracking-[-0.03em] leading-[1.05] text-foreground"
            style={{ fontSize: "clamp(2.4rem, 6vw, 5rem)" }}
          >
            Pay for what you{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(90deg, ${MAGENTA}, ${BLUE})` }}
            >
              create.
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with 5 free scripts. No subscription ever. Top up credits when you need more.
          </p>
        </div>
      </section>

      {/* PRICING GRID */}
      <section className="max-w-xl mx-auto px-4 pb-20">
        <div className="grid gap-5">
          {PLANS.map((plan) => {
            const Icon = ICON_MAP[plan.id];
            return (
              <div
                key={plan.id}
                className="relative rounded-2xl bg-card flex flex-col p-8"
                style={{
                  border: `2px solid ${MAGENTA}99`,
                  boxShadow: `0 0 0 4px ${MAGENTA}12`,
                }}
              >
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <div
                    className="flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold text-white whitespace-nowrap"
                    style={{ background: `linear-gradient(90deg, ${MAGENTA}, ${BLUE})` }}
                  >
                    <Star className="h-3 w-3" />
                    100% free while in beta
                  </div>
                </div>

                <div
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-white mb-4"
                  style={{ background: `linear-gradient(135deg, ${plan.accentFrom}, ${plan.accentTo})` }}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <div className="mb-4">
                  <div className="text-xl font-black text-foreground">{plan.name}</div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-4xl font-black text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/ {plan.sub}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#10b981" }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full font-bold h-11 text-white border-0 hover:opacity-90"
                  style={{ background: `linear-gradient(90deg, ${plan.accentFrom}, ${plan.accentTo})` }}
                  onClick={() => setAuthOpen(true)}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            );
          })}
        </div>


        {/* What's in a pack */}
        <div
          className="mt-16 rounded-3xl p-10 sm:p-14 relative overflow-hidden"
          style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}
        >
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-[100px]" style={{ background: MAGENTA }} />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-[100px]" style={{ background: BLUE }} />
          </div>
          <div className="relative">
            <div className="text-xs uppercase tracking-[0.2em] font-bold mb-3" style={{ color: YELLOW }}>What 1 credit gets you</div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-8">One complete video production pack.</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: FileText, label: "Script + voiceover dialogue", body: "ElevenLabs-ready text, paced and formatted." },
                { icon: ImageIcon, label: "Beat-by-beat visual plan", body: "Detailed 9:16 image & video prompts for every scene." },
                { icon: Sparkles, label: "3 thumbnail concepts", body: "100-word+ prompts designed for maximum CTR." },
                { icon: Mic, label: "Voice direction", body: "Tone, pace, emotion, pauses — ready to record." },
                { icon: Hash, label: "Caption + hashtags", body: "Platform-optimised post-ready text." },
                { icon: BookOpen, label: "Source-backed research", body: "Every claim backed by a cited URL." },
              ].map((item) => (
                <div key={item.label} className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.12)" }}>
                    <item.icon className="h-4 w-4" style={{ color: "hsl(var(--background))" }} />
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: "hsl(var(--background))" }}>{item.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "hsl(var(--background) / 0.65)" }}>{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-black tracking-tight text-center mb-8">Common questions</h2>
          <div className="space-y-4">
            {[
              { q: "Do credits expire?", a: "Never. Credits sit in your wallet until you use them. There's no monthly reset or expiry." },
              { q: "What counts as a 'tweak'?", a: "After your first message in a chat, each follow-up message is a tweak. The first 3 tweaks per chat are free. After that, 1 credit per tweak." },
              { q: "Can I use credits across multiple chats?", a: "Yes. Your credit balance is shared across all your chats and scripts." },
              { q: "Is there a subscription?", a: "No. Vidzo is strictly credit-based. Buy when you need, stop when you don't." },
              { q: "What payment methods are accepted?", a: "UPI, debit/credit cards via Razorpay. Payment integration coming very soon." },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-border bg-card p-5">
                <div className="font-bold text-sm text-foreground mb-1">{q}</div>
                <div className="text-sm text-muted-foreground">{a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 text-center">
          <p className="text-muted-foreground text-sm mb-4">Ready to start creating?</p>
          <Button
            size="lg"
            className="text-base h-12 px-8 text-white font-bold border-0 hover:opacity-90"
            style={{ background: `linear-gradient(90deg, ${MAGENTA}, ${BLUE})` }}
            onClick={() => setAuthOpen(true)}
          >
            Get 5 free scripts
            <ArrowRight className="ml-1 h-5 w-5" />
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">No credit card required</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <VidzoLogo className="h-7 w-auto" />
          <div className="flex gap-5">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/about" className="hover:text-foreground">About</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultMode={authMode} />
    </div>
  );
}
