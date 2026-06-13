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

const PLANS = [
  {
    id: "free",
    name: "Free",
    credits: 5,
    price: "₹0",
    sub: "forever",
    cardBg: "bg-card",
    borderClass: "border-border",
    iconGrad: "from-gray-400 to-gray-500",
    ctaGrad: null,
    features: [
      "5 free script credits on signup",
      "3 free tweaks per chat",
      "Full content packs",
      "Script, visuals, captions, hashtags",
    ],
    cta: "Start free",
    popular: false,
  },
  {
    id: "starter",
    name: "Starter",
    credits: 10,
    price: "₹199",
    sub: "one-time",
    cardBg: "bg-card",
    borderClass: "border-border",
    iconGrad: "from-pink-500 to-rose-500",
    ctaGrad: "from-pink-500 to-rose-500",
    features: [
      "10 script credits",
      "3 free tweaks per chat",
      "Full content packs",
      "No expiry",
    ],
    cta: "Buy Starter",
    popular: false,
  },
  {
    id: "creator",
    name: "Creator",
    credits: 30,
    price: "₹499",
    sub: "one-time",
    cardBg: "bg-card",
    borderClass: "border-[var(--vidzo-magenta)]/60",
    iconGrad: "from-[var(--vidzo-magenta)] to-[var(--vidzo-blue)]",
    ctaGrad: "from-[var(--vidzo-magenta)] to-[var(--vidzo-blue)]",
    features: [
      "30 script credits",
      "3 free tweaks per chat",
      "Priority generation",
      "No expiry",
    ],
    cta: "Buy Creator",
    popular: true,
  },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  free: Shield,
  starter: Zap,
  creator: Sparkles,
};

function PricingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode] = useState<"signin" | "signup">("signup");

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" style={{ fontFamily: '"Roboto Flex", sans-serif' }}>
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
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in oklab, var(--vidzo-magenta) 15%, transparent), transparent 70%)",
        }}
      >
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold mb-6">
            <Coins className="h-3.5 w-3.5 text-[var(--vidzo-magenta)]" />
            Simple, creator-first pricing
          </div>
          <h1
            className="font-black tracking-[-0.03em] leading-[1.05] text-foreground"
            style={{ fontSize: "clamp(2.4rem, 6vw, 5rem)" }}
          >
            Pay for what you create.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with 5 free scripts. No subscription ever. Top up credits when you need more.
          </p>
        </div>
      </section>

      {/* PRICING GRID */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid sm:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const Icon = ICON_MAP[plan.id];
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border ${plan.borderClass} ${plan.cardBg} p-6 flex flex-col ${
                  plan.popular ? "shadow-lg" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[var(--vidzo-magenta)] to-[var(--vidzo-blue)] px-3 py-1 text-[11px] font-bold text-white whitespace-nowrap">
                      <Star className="h-3 w-3" />
                      Most popular
                    </div>
                  </div>
                )}

                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${plan.iconGrad} text-white mb-4`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="mb-4">
                  <div className="text-lg font-black text-foreground">{plan.name}</div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-black text-foreground">{plan.price}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{plan.sub}</div>
                </div>

                <div className="mb-4">
                  <div className="text-4xl font-black text-foreground">{plan.credits}</div>
                  <div className="text-xs text-muted-foreground">script credits</div>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.id === "free" ? (
                  <Button
                    variant="outline"
                    className="w-full font-bold h-11"
                    onClick={() => setAuthOpen(true)}
                  >
                    Start free
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    className={`w-full font-bold h-11 bg-gradient-to-r ${plan.ctaGrad} text-white border-0 hover:opacity-90`}
                    onClick={() => alert(`Payment integration coming soon! Plan: ${plan.name}`)}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* What's in a pack */}
        <div className="mt-16 rounded-3xl bg-foreground text-background p-10 sm:p-14 relative overflow-hidden">
          <div className="absolute inset-0 opacity-25">
            <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-[var(--vidzo-magenta)] blur-[100px]" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-[var(--vidzo-blue)] blur-[100px]" />
          </div>
          <div className="relative">
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-[var(--vidzo-yellow)] mb-3">What 1 credit gets you</div>
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
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">{item.label}</div>
                    <div className="text-xs text-background/70 mt-0.5">{item.body}</div>
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
