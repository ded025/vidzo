import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Coins, Sparkles, Star, Zap, Crown, CheckCircle2, ArrowRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VidzoLogo } from "@/components/vidzo-logo";

export const Route = createFileRoute("/_authenticated/chat/credits")({
  component: CreditsPage,
  head: () => ({
    meta: [{ title: "Credits · Vidzo" }],
  }),
});

type Transaction = {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
  thread_id: string | null;
};

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    credits: 10,
    price: "₹199",
    usd: "$2.4",
    grad: "from-pink-500/20 to-rose-500/10",
    accent: "from-pink-500 to-rose-500",
    features: ["10 script credits", "Unlimited tweaks per credit", "Full content packs", "No expiry"],
    popular: false,
  },
  {
    id: "creator",
    name: "Creator",
    credits: 30,
    price: "₹499",
    usd: "$6",
    grad: "from-[var(--vidzo-magenta)]/20 to-[var(--vidzo-blue)]/10",
    accent: "from-[var(--vidzo-magenta)] to-[var(--vidzo-blue)]",
    features: ["30 script credits", "Priority generation", "Full content packs", "No expiry"],
    popular: true,
  },
  {
    id: "studio",
    name: "Studio",
    credits: 100,
    price: "₹1,299",
    usd: "$15.6",
    grad: "from-amber-400/20 to-orange-500/10",
    accent: "from-amber-400 to-orange-500",
    features: ["100 script credits", "Priority generation", "Full content packs", "Team sharing soon"],
    popular: false,
  },
];

function CreditsPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: w } = await supabase
        .from("user_credits")
        .select("balance")
        .maybeSingle();
      setBalance(w?.balance ?? 0);

      const { data: tx } = await supabase
        .from("credit_transactions")
        .select("id, amount, reason, created_at, thread_id")
        .order("created_at", { ascending: false })
        .limit(20);
      setTransactions((tx as Transaction[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const reasonLabel: Record<string, string> = {
    script_generation: "Script generated",
    tweak: "Tweak (extra)",
    purchase: "Credits purchased",
    free_grant: "Free credits",
  };

  return (
    <div
      className="min-h-full overflow-y-auto"
      style={{ fontFamily: '"Roboto Flex", sans-serif' }}
    >
      {/* Hero */}
      <div
        className="relative px-6 py-14 text-center overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in oklab, var(--vidzo-magenta) 14%, transparent), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, color-mix(in oklab, var(--vidzo-blue) 10%, transparent), transparent 70%)",
        }}
      >
        <div className="relative max-w-xl mx-auto">
          <div className="mx-auto mb-5 h-20 w-20 rounded-2xl bg-gradient-to-br from-[var(--vidzo-magenta)] to-[var(--vidzo-blue)] flex items-center justify-center shadow-lg">
            <Coins className="h-9 w-9 text-white" />
          </div>
          <h1
            className="font-black tracking-[-0.03em] bg-gradient-to-r from-foreground to-foreground/80 dark:from-white dark:to-white/80 bg-clip-text text-transparent"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Your Credits
          </h1>
          <p className="mt-3 text-muted-foreground text-base max-w-sm mx-auto">
            Each credit generates one full content pack — script, visuals, captions and more.
          </p>

          {/* Balance pill */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-card border border-border px-6 py-4 shadow-md">
            {loading ? (
              <span className="text-muted-foreground text-sm">Loading…</span>
            ) : (
              <>
                <div className="text-4xl font-black text-foreground">{balance}</div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-foreground">credits remaining</div>
                  <div className="text-xs text-muted-foreground">
                    {(balance ?? 0) > 0 ? "Ready to create" : "Top up to keep creating"}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Free tier reminder */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              5 free scripts on signup
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              3 free tweaks per chat
            </span>
          </div>
        </div>
      </div>

      {/* Pricing plans */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.2em] font-bold text-[var(--vidzo-magenta)] mb-2">Top up</div>
          <h2 className="text-3xl font-black tracking-tight">Choose your pack</h2>
          <p className="mt-2 text-sm text-muted-foreground">One-time purchase. No subscription. Credits never expire.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border ${
                plan.popular
                  ? "border-[var(--vidzo-magenta)]/40 shadow-lg"
                  : "border-border"
              } bg-gradient-to-br ${plan.grad} p-6 flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[var(--vidzo-magenta)] to-[var(--vidzo-blue)] px-3 py-1 text-[11px] font-bold text-white">
                    <Star className="h-3 w-3" />
                    Most popular
                  </div>
                </div>
              )}
              <div className="mb-4">
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${plan.accent} text-white mb-3`}
                >
                  {plan.id === "starter" ? <Zap className="h-5 w-5" /> : plan.id === "creator" ? <Sparkles className="h-5 w-5" /> : <Crown className="h-5 w-5" />}
                </div>
                <div className="text-lg font-black tracking-tight">{plan.name}</div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-3xl font-black">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">{plan.usd}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{plan.credits} credits · one-time</div>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full font-bold bg-gradient-to-r ${plan.accent} text-white border-0 hover:opacity-90`}
                onClick={() => alert(`Payment integration coming soon! Plan: ${plan.name}`)}
              >
                Buy {plan.credits} credits
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ))}
        </div>

        {/* Credit logic explainer */}
        <div className="mt-12 rounded-2xl bg-secondary/40 border border-border p-6">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--vidzo-magenta)]" />
            How credits work
          </h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[var(--vidzo-magenta)] to-pink-400 text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
              <div><strong className="text-foreground">1 credit = 1 full pack</strong><br />Script, voiceover, visuals, thumbnail, captions, hashtags, and sources.</div>
            </div>
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[var(--vidzo-blue)] to-cyan-400 text-white flex items-center justify-center text-xs font-bold shrink-0">2</div>
              <div><strong className="text-foreground">3 tweaks free</strong><br />Each chat includes 3 free tweaks. Beyond that, 1 credit per tweak.</div>
            </div>
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[var(--vidzo-yellow)] to-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">3</div>
              <div><strong className="text-foreground">Never expire</strong><br />Credits sit in your wallet until you use them. No monthly reset.</div>
            </div>
          </div>
        </div>

        {/* Transaction history */}
        {transactions.length > 0 && (
          <div className="mt-10">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Recent activity
            </h3>
            <div className="rounded-xl border border-border overflow-hidden">
              {transactions.map((tx, i) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between px-4 py-3 text-sm ${
                    i !== transactions.length - 1 ? "border-b border-border" : ""
                  } ${
                    i % 2 === 0 ? "bg-background" : "bg-secondary/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        tx.amount > 0
                          ? "bg-emerald-500/20 text-emerald-600"
                          : "bg-rose-500/20 text-rose-600"
                      }`}
                    >
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </div>
                    <span className="text-foreground">{reasonLabel[tx.reason] ?? tx.reason}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {new Date(tx.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
