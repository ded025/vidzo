import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, CheckCircle2, ArrowRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/chat/credits")({
  component: CreditsPage,
  head: () => ({ meta: [{ title: "Credits · Vidzo" }] }),
});

function CreditsPage() {
  return (
    <div className="min-h-full overflow-y-auto bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br from-[var(--vidzo-magenta)] to-[var(--vidzo-blue)] flex items-center justify-center">
          <Gift className="h-9 w-9 text-white" />
        </div>
        <h1 className="font-black tracking-tight text-foreground" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>
          Vidzo is currently <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--vidzo-magenta)] to-[var(--vidzo-blue)]">free</span>.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Unlimited content packs, tweaks, and trends while we're in early access. Paid plans will arrive later — for now, just create.
        </p>

        <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-left space-y-3">
          {[
            "Unlimited content packs",
            "Unlimited tweaks per chat",
            "Full library access",
            "Live trend syncing",
            "Brand & keyword research",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2.5 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <Button asChild className="mt-8 h-11 px-6 font-bold text-white border-0 hover:opacity-90" style={{ background: "linear-gradient(90deg, var(--vidzo-magenta), var(--vidzo-blue))" }}>
          <Link to="/chat/dashboard">
            <Sparkles className="h-4 w-4 mr-1.5" />
            Start creating
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
