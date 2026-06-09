import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Search, FileText, Wand2 } from "lucide-react";

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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">Reel Engine</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-foreground))]" />
          For Hinglish startup-story creators
        </div>
        <h1 className="mt-6 text-5xl md:text-6xl font-semibold tracking-tight">
          Boring business stories,{" "}
          <span className="text-primary">addictive 30-sec Shorts.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Auto-fetch trending Indian startup, founder and D2C stories. Chat with the AI to tweak the hook,
          pace and ending. Get script + visuals + hashtags — ready to shoot.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/auth">
            <Button size="lg">Start writing scripts</Button>
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-4">
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
          <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
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
