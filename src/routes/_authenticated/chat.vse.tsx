import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Clapperboard,
  Film,
  Wand2,
  Loader2,
  Camera,
  Mic2,
  Eye,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat/vse")({
  ssr: false,
  component: VsePage,
});

const ACTIVITY_GROUPS: Record<string, string[]> = {
  Fitness: ["Gym Workout", "Running", "Cycling", "Yoga", "Sports Training"],
  Lifestyle: ["Morning Routine", "Night Routine", "Study Session", "Work Session", "Coffee Making"],
  Automotive: ["Bike Ride", "Car Drive", "Detailing", "Road Trip"],
  Creator: ["Editing Session", "Coding Session", "Designing", "Podcast Recording"],
  Commercial: ["Product Showcase", "Product Review", "Unboxing", "UGC Product Demo"],
  Travel: ["Airport Journey", "City Exploration", "Hotel Stay", "Adventure Trip"],
};

const EMOTIONS = [
  "Motivated", "Inspired", "Disciplined", "Calm", "Premium", "Luxury",
  "Aggressive", "Nostalgic", "Adventurous", "Cozy", "Energetic", "Raw", "Emotional",
];

const HEROES = ["Me", "The Product", "The Journey", "The Environment", "The Vehicle", "The Process", "The Transformation"];

const STYLES = ["Cinematic", "Documentary", "Aesthetic", "Commercial", "Raw", "UGC", "Vlog", "Action", "Luxury", "Minimal"];

type Shot = {
  label: string;
  action: string;
  framing: string;
  lens: string;
  lighting: string;
  imagePrompt: string;
  videoPrompt: string;
  onScreenText?: string | null;
};
type Beat = { beat: string; purpose: string; shots: Shot[] };
type Blueprint = {
  version: "1";
  title: string;
  brief: { activity: string; emotion: string; hero: string; style: string; heroMoment: string };
  story_pattern: string;
  story_arc: string[];
  beats: Beat[];
  audio_capture: string[];
  lens_plan: string[];
  shot_counts: { establishing: number; detail: number; action: number; hero: number; ending: number };
  caption_hint?: string | null;
};

function VsePage() {
  const [activity, setActivity] = useState("Gym Workout");
  const [customActivity, setCustomActivity] = useState("");
  const [emotion, setEmotion] = useState("Disciplined");
  const [hero, setHero] = useState("The Transformation");
  const [style, setStyle] = useState("Cinematic");
  const [heroMoment, setHeroMoment] = useState("Hitting a deadlift PR");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);

  const effectiveActivity = customActivity.trim() || activity;

  const generate = async () => {
    if (!effectiveActivity) {
      toast.error("Pick or type what you're filming.");
      return;
    }
    if (!heroMoment.trim()) {
      toast.error("Describe the hero moment.");
      return;
    }
    setLoading(true);
    setBlueprint(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error("Sign in required.");

      const input = [
        "[VISUAL_STORY_BRIEF]",
        `Activity / what we're filming: ${effectiveActivity}`,
        `Audience feeling: ${emotion}`,
        `Hero of the story: ${hero}`,
        `Storytelling style: ${style}`,
        `Hero moment: ${heroMoment.trim()}`,
        notes.trim() ? `Extra notes: ${notes.trim()}` : "",
        "",
        `Build a full Visual Story Blueprint. Vertical 9:16. No voiceover script — visuals and diegetic audio only.`,
      ]
        .filter(Boolean)
        .join("\n");

      const res = await fetch("/api/vse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ input }),
      });
      const payload = (await res.json().catch(() => null)) as
        | { blueprint?: Blueprint; error?: string }
        | null;
      if (!res.ok || !payload?.blueprint) {
        throw new Error(payload?.error || `Engine returned HTTP ${res.status}`);
      }
      setBlueprint(payload.blueprint);
      toast.success("Visual Story Blueprint ready.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white flex items-center justify-center shrink-0">
            <Clapperboard className="h-5 w-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/60 dark:border-violet-700/60 bg-violet-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-violet-700 dark:text-violet-300">
              No dialogue · No voiceover · Cinematic only
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1.5">Visual Story Engine</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              An AI cinematographer for creators who don't talk to the camera. Vidzo returns a shot-by-shot 9:16 blueprint — camera placement, lens, lighting, editing beats, diegetic audio, and hero-moment coverage. It does <span className="font-semibold text-foreground">not</span> write scripts or voiceover.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[420px,1fr] gap-6">
          {/* Inputs */}
          <div className="rounded-3xl border border-border bg-card p-5 space-y-4 h-fit">
            <div>
              <Label>What are you filming?</Label>
              <div className="mt-2 space-y-2 max-h-56 overflow-y-auto pr-1">
                {Object.entries(ACTIVITY_GROUPS).map(([group, items]) => (
                  <div key={group}>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{group}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((a) => (
                        <Chip key={a} active={a === activity && !customActivity.trim()} onClick={() => { setActivity(a); setCustomActivity(""); }}>
                          {a}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <input
                value={customActivity}
                onChange={(e) => setCustomActivity(e.target.value)}
                placeholder="Or type your own activity…"
                className="mt-2 w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <Label>What should the audience feel?</Label>
              <ChipRow items={EMOTIONS} value={emotion} onChange={setEmotion} />
            </div>
            <div>
              <Label>Who is the hero?</Label>
              <ChipRow items={HEROES} value={hero} onChange={setHero} />
            </div>
            <div>
              <Label>Storytelling style</Label>
              <ChipRow items={STYLES} value={style} onChange={setStyle} />
            </div>
            <div>
              <Label>Hero moment</Label>
              <input
                value={heroMoment}
                onChange={(e) => setHeroMoment(e.target.value)}
                placeholder="e.g. Deadlift PR, mountain summit, engine ignition, product reveal"
                className="mt-2 w-full rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <Label>Extra notes (optional)</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Location, gear, time of day, references…"
                className="mt-2 w-full resize-none rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <Button
              onClick={generate}
              disabled={loading}
              className="w-full gap-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:opacity-90 text-white"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {loading ? "Directing your story…" : "Generate Visual Story"}
            </Button>
          </div>

          {/* Output */}
          <div className="min-h-[400px]">
            {loading && <BlueprintSkeleton />}
            {!loading && !blueprint && <EmptyState />}
            {blueprint && <BlueprintView data={blueprint} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold text-foreground">{children}</div>;
}

function Chip({
  children, active, onClick,
}: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
        active
          ? "border-violet-500 text-violet-600 dark:text-violet-300 bg-violet-500/10"
          : "border-border bg-card hover:border-foreground/30"
      }`}
    >
      {children}
    </button>
  );
}

function ChipRow({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((it) => (
        <Chip key={it} active={it === value} onClick={() => onChange(it)}>{it}</Chip>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full min-h-[400px] rounded-3xl border border-dashed border-border flex flex-col items-center justify-center text-center p-8">
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 flex items-center justify-center mb-3">
        <Film className="h-6 w-6 text-violet-500" />
      </div>
      <div className="font-semibold">Your shot list appears here</div>
      <p className="text-xs text-muted-foreground max-w-sm mt-1">
        Pick what you're filming, how it should feel, and the hero moment. Vidzo returns a full 9:16 shot-by-shot blueprint with audio, lens plan, and hero-moment coverage.
      </p>
    </div>
  );
}

function BlueprintSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4 animate-pulse">
          <div className="h-4 w-40 bg-secondary rounded" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full bg-secondary/70 rounded" />
            <div className="h-3 w-11/12 bg-secondary/70 rounded" />
            <div className="h-3 w-4/5 bg-secondary/70 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BlueprintView({ data }: { data: Blueprint }) {
  const totalShots = useMemo(() => data.beats.reduce((n, b) => n + b.shots.length, 0), [data]);
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-border bg-gradient-to-br from-indigo-50 via-violet-50 to-fuchsia-50 dark:from-indigo-950/30 dark:via-violet-950/20 dark:to-fuchsia-950/20 p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{data.story_pattern}</div>
        <h2 className="text-xl font-bold mt-1">{data.title}</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Meta icon={Eye}>{data.brief.emotion}</Meta>
          <Meta icon={Sparkles}>Hero: {data.brief.hero}</Meta>
          <Meta icon={Camera}>{data.brief.style}</Meta>
          <Meta icon={Film}>{totalShots} shots</Meta>
        </div>
        {data.caption_hint && (
          <div className="mt-3 text-xs text-muted-foreground">
            Optional caption: <span className="text-foreground">{data.caption_hint}</span>
          </div>
        )}
      </div>

      {data.beats.map((beat, i) => (
        <div key={`${beat.beat}-${i}`} className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/40 flex items-center gap-3">
            <span className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <div>
              <div className="font-semibold text-sm">{beat.beat}</div>
              <div className="text-[11px] text-muted-foreground">{beat.purpose}</div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {beat.shots.map((shot, j) => (
              <div key={j} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-300">
                    {shot.framing}
                  </span>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                    {shot.lens}
                  </span>
                  <span className="text-sm font-medium">{shot.label}</span>
                </div>
                <div className="text-sm mt-1">{shot.action}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Lighting: {shot.lighting}</div>
                {shot.onScreenText && (
                  <div className="text-[11px] mt-1"><span className="text-muted-foreground">Overlay:</span> {shot.onScreenText}</div>
                )}
                <details className="mt-2 group">
                  <summary className="text-[11px] cursor-pointer text-primary hover:underline">Shot prompts</summary>
                  <div className="mt-2 grid gap-2 text-[11px]">
                    <PromptBlock label="Image prompt" text={shot.imagePrompt} />
                    <PromptBlock label="Video prompt" text={shot.videoPrompt} />
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Mic2 className="h-4 w-4 text-violet-500" /> Audio capture list
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {data.audio_capture.map((a) => (
              <li key={a} className="flex gap-2"><span className="text-muted-foreground">•</span>{a}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Camera className="h-4 w-4 text-violet-500" /> Lens plan
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.lens_plan.map((l) => (
              <span key={l} className="text-[11px] uppercase px-2 py-0.5 rounded bg-secondary">{l}</span>
            ))}
          </div>
          <div className="mt-4 text-xs text-muted-foreground">Shot counts</div>
          <div className="mt-1 grid grid-cols-5 gap-2 text-center">
            {(["establishing", "detail", "action", "hero", "ending"] as const).map((k) => (
              <div key={k} className="rounded-lg border border-border py-2">
                <div className="text-base font-bold">{data.shot_counts[k]}</div>
                <div className="text-[9px] uppercase text-muted-foreground">{k}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-2 py-0.5">
      <Icon className="h-3 w-3 text-violet-500" />
      {children}
    </span>
  );
}

function PromptBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-lg bg-secondary/40 border border-border p-2">
      <div className="text-[10px] uppercase text-muted-foreground mb-1">{label}</div>
      <div className="whitespace-pre-wrap leading-relaxed">{text}</div>
    </div>
  );
}
