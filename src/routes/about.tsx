import { createFileRoute, Link } from "@tanstack/react-router";
import { VidzoLogo } from "@/components/vidzo-logo";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · Vidzo" },
      { name: "description", content: "Vidzo is the AI production room built for creators — turning ideas into ready-to-record content packs." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PageShell title="About Vidzo">
      <p>
        Vidzo is the AI production room for creators. We help founders, marketers, agencies, and
        independent storytellers go from raw idea to ready-to-record content pack — script,
        voiceover-ready dialogue, scene-by-scene visual direction, thumbnails, captions, hashtags,
        and source-backed research — all in one flow.
      </p>
      <p>
        We believe creators waste most of their time before they ever hit record. Vidzo compresses
        the messy pre-production process into a single, calm workspace so you can spend more time
        making and less time staring at a blank page.
      </p>
      <h2>Built for creators of every kind</h2>
      <p>
        Whether you make reels about business, fitness reels, founder stories, product explainers,
        coaching videos, or personal brand content — Vidzo gives you the production structure
        before you start recording.
      </p>
      <h2>Get in touch</h2>
      <p>
        Questions, partnerships, feedback? Write to{" "}
        <a href="mailto:support@vidzo.in">support@vidzo.in</a>.
      </p>
    </PageShell>
  );
}

export function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: '"Roboto Flex", sans-serif' }}>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link to="/"><VidzoLogo className="h-8 w-auto" /></Link>
          <nav className="flex gap-4 text-sm font-medium text-muted-foreground">
            <Link to="/about" className="hover:text-foreground">About</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-14">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-8">{title}</h1>
        <div className="prose prose-neutral max-w-none space-y-5 text-foreground/90 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-3 [&_a]:text-primary [&_a]:underline">
          {children}
        </div>
      </main>
      <footer className="border-t border-border mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 flex flex-wrap justify-between gap-3 text-sm text-muted-foreground">
          <span>© 2026 Vidzo</span>
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-foreground">About</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
