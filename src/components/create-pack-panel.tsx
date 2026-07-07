import { useCallback, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { parseBriefFile } from "@/lib/parse-brief";
import {
  Sparkles,
  Wand2,
  Upload,
  Loader2,
  ShoppingCart,
  FileText,
  X,
} from "lucide-react";

export const PLATFORMS = [
  "Instagram",
  "YouTube Shorts",
  "YouTube",
  "LinkedIn",
  "TikTok",
] as const;
export const CONTENT_TYPES = [
  "Educational",
  "Storytelling",
  "Opinion",
  "Value",
  "Sales",
  "Entertainment",
  "News",
] as const;
export const DELIVERY_STYLES = [
  "Talking Head",
  "Voice Over",
  "UGC",
  "Documentary",
  "Faceless",
] as const;
export const TONES = [
  "Founder",
  "Educational",
  "Premium",
  "Funny",
  "Dramatic",
] as const;
export const LENGTHS = ["30s", "60s", "90s"] as const;
export const LANGUAGES = [
  "Hinglish",
  "English",
  "Hindi",
  "Tamil",
  "Marathi",
  "Bengali",
  "Spanish",
] as const;

type Platform = (typeof PLATFORMS)[number];
type ContentType = (typeof CONTENT_TYPES)[number];
type DeliveryStyle = (typeof DELIVERY_STYLES)[number];
type Tone = (typeof TONES)[number];
type Length = (typeof LENGTHS)[number];
type Language = (typeof LANGUAGES)[number];

type ProductFields = {
  name: string;
  what: string;
  benefits: string;
  audience: string;
  cta: string;
};

const ACCEPT = ".txt,.md,.markdown,.pdf,.docx,text/plain,application/pdf";

export function CreatePackPanel({
  compact = false,
  autoFocus = false,
}: {
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const navigate = useNavigate();
  const briefRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [brief, setBrief] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [contentType, setContentType] = useState<ContentType>("Educational");
  const [delivery, setDelivery] = useState<DeliveryStyle>("Talking Head");
  const [tone, setTone] = useState<Tone>("Founder");
  const [length, setLength] = useState<Length>("30s");
  const [language, setLanguage] = useState<Language>("Hinglish");

  const [product, setProduct] = useState<ProductFields>({
    name: "",
    what: "",
    benefits: "",
    audience: "",
    cta: "",
  });

  const showProductFields = delivery === "UGC" || contentType === "Sales";

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;
    setParsing(true);
    try {
      const parsed = await parseBriefFile(file);
      if (!parsed.text.trim()) throw new Error("Couldn't read any text from that file.");
      setBrief((current) => (current.trim() ? `${current.trim()}\n\n${parsed.text}` : parsed.text));
      setFileName(parsed.fileName);
      toast.success(`Loaded ${parsed.fileName}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read that file");
    } finally {
      setParsing(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const goGenerate = () => {
    const idea = brief.trim();
    if (!idea && !showProductFields) {
      briefRef.current?.focus();
      toast.error("Add a brief — paste text or drop a file.");
      return;
    }
    if (showProductFields && !product.name.trim()) {
      toast.error("Add the product / brand name.");
      document.getElementById("cp-product-name")?.focus();
      return;
    }

    const visualStorytelling = delivery === "Documentary" || delivery === "Faceless";

    // What the user SEES in chat — clean, no internal directives.
    const displayLines: string[] = [];
    if (showProductFields) {
      displayLines.push(`Product: ${product.name.trim()}`);
      if (product.what.trim()) displayLines.push(`What it does: ${product.what.trim()}`);
      if (product.benefits.trim()) displayLines.push(`Benefits: ${product.benefits.trim()}`);
      if (product.audience.trim()) displayLines.push(`Audience: ${product.audience.trim()}`);
      if (product.cta.trim()) displayLines.push(`CTA: ${product.cta.trim()}`);
    }
    if (idea) displayLines.push(idea);
    displayLines.push(
      `Style — ${platform} · ${length} · ${contentType} · ${delivery} · ${tone} · ${language}${
        visualStorytelling ? " · Visual Storytelling (no dialogue, music-driven)" : ""
      }`,
    );
    const displayPrompt = displayLines.join("\n");

    // What the engine sees behind the scenes — full directives (stored as context brief).
    const engineParts: string[] = [];
    if (visualStorytelling) engineParts.push("[VISUAL_STORYTELLING]");
    if (showProductFields) {
      engineParts.push("[PRODUCT_AD_BRIEF]");
      engineParts.push(`Product / brand: ${product.name.trim()}`);
      if (product.what.trim()) engineParts.push(`What it does: ${product.what.trim()}`);
      if (product.benefits.trim())
        engineParts.push(`Key features / benefits: ${product.benefits.trim()}`);
      if (product.audience.trim()) engineParts.push(`Target audience: ${product.audience.trim()}`);
      if (product.cta.trim()) engineParts.push(`Desired CTA: ${product.cta.trim()}`);
      engineParts.push("");
    }
    if (idea) {
      engineParts.push("[BRIEF]");
      engineParts.push(idea);
      engineParts.push("");
    }
    engineParts.push(
      `Build ONE production-ready ${length} content pack for ${platform}. ` +
        `Content type: ${contentType}. Delivery: ${delivery}. Tone: ${tone}. Language: ${language}. ` +
        `Vertical 9:16 with scene-by-scene visuals, ${
          visualStorytelling
            ? "sound/music direction (NOT dialogue), camera + editing notes, and a thumbnail. Also populate the top-level music[] array with trending Reels/TikTok/Shorts audio suggestions that match the mood."
            : "voiceover, on-screen captions, and a thumbnail."
        } ` +
        (showProductFields
          ? `First-person creator POV, authentic handheld iPhone aesthetic, product visible in-hand and in-use across scenes. Only use claims from the brief — do not invent stats, prices, or features.`
          : `Only use claims from the brief when factual. Never invent stats or names.`) +
        (visualStorytelling
          ? ` This is Visual Storytelling mode: NO spoken dialogue in any scene. Use 'voiceover' for sound design + music direction only. Cover the hero moment with wide + medium + close + extreme close shots. Use web research to suggest currently trending audio on ${platform} when possible.`
          : ""),
    );
    const enginePrompt = engineParts.filter(Boolean).join("\n");

    const titleSeed = (product.name || idea || `${contentType} · ${platform}`).slice(0, 60);
    navigate({
      to: "/chat/new",
      search: { prompt: displayPrompt, engine: enginePrompt, title: titleSeed },
    });
  };


  return (
    <div
      className={`rounded-3xl border border-border relative overflow-hidden bg-gradient-to-br from-pink-50 via-violet-50 to-blue-50 dark:from-fuchsia-950/30 dark:via-violet-950/20 dark:to-blue-950/20 ${
        compact ? "p-4" : "p-5 sm:p-6"
      }`}
    >
      <div className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-gradient-to-br from-[var(--vidzo-magenta)] to-[var(--vidzo-blue)] opacity-15 blur-2xl pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-2 font-bold text-lg">
          <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </span>
          Create a New Content Pack
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Paste your brief or drop a file (.txt, .md, .pdf, .docx) — pick your format, tone,
          language. Vidzo delivers the whole pack.
        </p>

        {/* Brief + dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`mt-4 rounded-2xl border-2 border-dashed transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-border bg-card"
          }`}
        >
          <textarea
            ref={briefRef}
            autoFocus={autoFocus}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Drop your brief here, or paste it. e.g. 'A 30-sec Reel for my Pune gym — Hinglish, myth-busting creatine, hook in 2 seconds.'"
            rows={compact ? 3 : 5}
            className="w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-sm focus:outline-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {parsing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Reading file…
                </>
              ) : fileName ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5">
                  <FileText className="h-3 w-3" />
                  {fileName}
                  <button
                    type="button"
                    onClick={() => setFileName(null)}
                    className="hover:text-foreground"
                    aria-label="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Drag &amp; drop or click to upload
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={parsing}
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              Upload file
            </Button>
          </div>
        </div>

        {/* Selectors */}
        <div className="mt-4 space-y-2 text-xs">
          <ChipRow label="Platform" options={PLATFORMS} value={platform} onChange={setPlatform} />
          <ChipRow
            label="Content"
            options={CONTENT_TYPES}
            value={contentType}
            onChange={setContentType}
          />
          <ChipRow
            label="Delivery"
            options={DELIVERY_STYLES}
            value={delivery}
            onChange={setDelivery}
          />
          <ChipRow label="Tone" options={TONES} value={tone} onChange={setTone} />
          <ChipRow label="Length" options={LENGTHS} value={length} onChange={setLength} />
          <ChipRow
            label="Language"
            options={LANGUAGES}
            value={language}
            onChange={setLanguage}
          />
        </div>

        {/* Visual storytelling callout — steer to dedicated engine */}
        {(delivery === "Documentary" || delivery === "Faceless") && (
          <div className="mt-4 rounded-2xl border border-violet-300/60 dark:border-violet-800/60 bg-gradient-to-br from-indigo-50 via-violet-50 to-fuchsia-50 dark:from-indigo-950/40 dark:via-violet-950/30 dark:to-fuchsia-950/30 p-4 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="text-xs">
              <div className="font-semibold text-sm">No voiceover? Try the Visual Story Engine.</div>
              <div className="text-muted-foreground mt-0.5 max-w-md">
                Get a pure shot-by-shot cinematic blueprint — camera, lens, lighting, audio capture, hero-moment coverage. No dialogue.
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/chat/vse" })}
              className="gap-2 border-violet-400 text-violet-700 dark:text-violet-300 hover:bg-violet-500/10"
            >
              Open Visual Story Engine →
            </Button>
          </div>
        )}

        {/* Conditional product fields */}
        {showProductFields && (
          <div className="mt-4 rounded-2xl border border-orange-200 dark:border-orange-900/40 bg-orange-50/60 dark:bg-orange-950/20 p-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingCart className="h-4 w-4 text-orange-500" />
              Product details
              <span className="ml-1 text-[10px] font-normal text-muted-foreground uppercase tracking-wide">
                {delivery === "UGC" ? "UGC ad" : "Sales content"}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <input
                id="cp-product-name"
                value={product.name}
                onChange={(e) => setProduct((p) => ({ ...p, name: e.target.value }))}
                placeholder="Product / brand name *"
                className="rounded-lg bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                value={product.audience}
                onChange={(e) => setProduct((p) => ({ ...p, audience: e.target.value }))}
                placeholder="Target audience"
                className="rounded-lg bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <textarea
                value={product.what}
                onChange={(e) => setProduct((p) => ({ ...p, what: e.target.value }))}
                placeholder="What does it do? Problem it solves"
                rows={2}
                className="sm:col-span-2 resize-none rounded-lg bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <textarea
                value={product.benefits}
                onChange={(e) => setProduct((p) => ({ ...p, benefits: e.target.value }))}
                placeholder="Key features / benefits (comma separated)"
                rows={2}
                className="sm:col-span-2 resize-none rounded-lg bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                value={product.cta}
                onChange={(e) => setProduct((p) => ({ ...p, cta: e.target.value }))}
                placeholder='CTA (e.g. "link in bio", "use code VIDZO10")'
                className="sm:col-span-2 rounded-lg bg-card border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            onClick={goGenerate}
            disabled={parsing}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white gap-2"
          >
            <Wand2 className="h-4 w-4" />
            {showProductFields ? "Generate UGC Pack" : "Generate Pack"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChipRow<T extends readonly string[]>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T;
  value: T[number];
  onChange: (v: T[number]) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground w-[70px] shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt as T[number])}
              className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
                active
                  ? "border-[var(--vidzo-magenta)] text-[var(--vidzo-magenta)] bg-card"
                  : "border-border bg-card hover:border-foreground/30"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
