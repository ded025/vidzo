import { useMemo, useState } from "react";
import {
  Check,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Gauge,
  Hash,
  Image as ImageIcon,
  Mic,
  MonitorSmartphone,
  Search,
  Sparkles,
  Video,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  normalizeContentPack,
  type ContentPackData as NormalizedContentPackData,
} from "@/lib/content-pack";
import { computeQuality } from "@/lib/quality";

export type ContentPackData = NormalizedContentPackData;

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setDone(true);
        toast.success(`${label} copied`);
        setTimeout(() => setDone(false), 1400);
      }}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] hover:bg-secondary"
    >
      {done ? <Check className="size-3" /> : <Copy className="size-3" />}
      Copy
    </button>
  );
}

function CardHeading({
  icon: Icon,
  title,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail?: string;
}) {
  return (
    <div className="mb-3 flex items-start gap-2">
      <span className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
        <Icon className="size-3.5" />
      </span>
      <div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
      </div>
    </div>
  );
}

function ReferenceStrip({ data }: { data: ContentPackData }) {
  if (data.referenceAssets.length === 0) return null;
  return (
    <div className="border-b border-border bg-secondary/20 px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <ImageIcon className="size-3.5" />
        Saved visual references
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {data.referenceAssets.map((asset) => (
          <a
            key={asset.id}
            href={asset.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex min-w-44 items-center gap-2 rounded-lg border border-border bg-card p-2"
          >
            <img
              src={asset.imageUrl}
              alt={`${asset.label} reference`}
              className="size-10 rounded-md bg-secondary object-cover"
              loading="lazy"
            />
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium">{asset.label}</span>
              <span className="block text-[10px] capitalize text-muted-foreground">
                {asset.type} reference
              </span>
            </span>
            <ExternalLink className="ml-auto size-3 text-muted-foreground group-hover:text-primary" />
          </a>
        ))}
      </div>
    </div>
  );
}

export function ContentPackCard({ data: rawData }: { data: unknown }) {
  const data = useMemo(() => normalizeContentPack(rawData), [rawData]);
  const qualityInput = useMemo(
    () => ({
      script: { dialogue: data.fullVoiceover },
      visuals: data.scenes.map((scene) => ({
        beat: scene.time,
        onScreenText: scene.onScreenText,
        imagePrompt: scene.imagePrompt,
        videoPrompt: scene.videoPrompt,
      })),
      thumbnailPrompts: [
        data.thumbnail.prompt,
        ...data.thumbnail.alternates.map((alternate) => alternate.imagePrompt ?? alternate.concept),
      ],
      caption: data.caption,
      hashtags: data.hashtags,
      sources: data.sources,
    }),
    [data],
  );
  const quality = useMemo(() => computeQuality(qualityInput), [qualityInput]);
  const overallColor =
    quality.overall >= 85
      ? "text-emerald-500"
      : quality.overall >= 70
        ? "text-amber-500"
        : "text-rose-500";
  const thumbnailReference =
    data.referenceAssets.find((asset) => asset.type === "thumbnail") ?? data.referenceAssets[0];

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
      <header className="border-b border-border bg-gradient-to-br from-primary/12 via-accent/8 to-transparent px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              <span>Vidzo content pack</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5">
                {data.strategy.aspectRatio} · {data.strategy.platform}
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
                {data.strategy.durationSeconds}s
              </span>
            </div>
            <h3 className="mt-1 text-lg font-semibold">{data.topic}</h3>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              {data.strategy.angle}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-2">
            <Gauge className={`size-4 ${overallColor}`} />
            <span>
              <span className={`block text-sm font-black leading-none ${overallColor}`}>
                {quality.overall}
              </span>
              <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                quality
              </span>
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-1">
            <Zap className="size-3 text-amber-500" /> 1 AI request
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-1">
            <Clock3 className="size-3" /> {(data.generation.latencyMs / 1000).toFixed(1)}s
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-1">
            <Search className="size-3" />
            {data.generation.webSearchUsed ? "1 web research pass" : "No web tokens used"}
          </span>
          {data.generation.outputTokens > 0 ? (
            <span className="rounded-full border border-border bg-background/60 px-2 py-1">
              {data.generation.outputTokens.toLocaleString()} output tokens
            </span>
          ) : null}
        </div>
      </header>

      <ReferenceStrip data={data} />

      <Tabs defaultValue="script" className="w-full">
        <div className="overflow-x-auto border-b border-border px-4 pt-3">
          <TabsList className="h-9 min-w-max">
            <TabsTrigger value="script" className="gap-1.5 text-xs">
              <FileText className="size-3.5" /> Script & voice
            </TabsTrigger>
            <TabsTrigger value="scenes" className="gap-1.5 text-xs">
              <Video className="size-3.5" /> Scenes
            </TabsTrigger>
            <TabsTrigger value="thumbnail" className="gap-1.5 text-xs">
              <ImageIcon className="size-3.5" /> Thumbnail
            </TabsTrigger>
            <TabsTrigger value="publish" className="gap-1.5 text-xs">
              <Hash className="size-3.5" /> Publish
            </TabsTrigger>
            <TabsTrigger value="sources" className="gap-1.5 text-xs">
              <ExternalLink className="size-3.5" /> Sources
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="script" className="m-0 space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-secondary/25 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Audience
              </p>
              <p className="mt-1 text-sm">{data.strategy.audience}</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/25 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Goal
              </p>
              <p className="mt-1 text-sm">{data.strategy.goal}</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/25 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Why it works
              </p>
              <p className="mt-1 text-sm">{data.strategy.whyItWorks}</p>
            </div>
          </div>

          <section className="rounded-xl border border-border bg-background/50 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <CardHeading
                icon={FileText}
                title="Complete voiceover"
                detail={`${data.scenes.length} timed scenes · ${data.strategy.language}`}
              />
              <CopyBtn text={data.fullVoiceover} label="Voiceover" />
            </div>
            <p className="whitespace-pre-wrap text-sm leading-7">{data.fullVoiceover}</p>
          </section>

          <section className="rounded-xl border border-border bg-background/50 p-4">
            <CardHeading icon={Mic} title="ElevenLabs setup" detail={data.voice.provider} />
            <dl className="grid gap-3 text-sm sm:grid-cols-[180px_1fr]">
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Voice</dt>
                <dd className="font-medium">{data.voice.name}</dd>
                {data.voice.voiceId ? (
                  <dd className="mt-0.5 break-all text-[11px] text-muted-foreground">
                    ID: {data.voice.voiceId}
                  </dd>
                ) : (
                  <dd className="mt-0.5 text-[11px] text-muted-foreground">
                    Select the closest matching voice in ElevenLabs.
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Delivery direction
                </dt>
                <dd>{data.voice.delivery}</dd>
              </div>
            </dl>
          </section>
        </TabsContent>

        <TabsContent value="scenes" className="m-0 space-y-3 p-4">
          {data.scenes.map((scene, index) => (
            <section key={`${scene.time}-${index}`} className="rounded-xl border border-border">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border bg-secondary/20 px-3 py-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {scene.time}
                    </span>
                    <span className="text-xs font-semibold">{scene.purpose}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <MonitorSmartphone className="size-3" /> 9:16
                    </span>
                  </div>
                  {scene.onScreenText ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      On screen: “{scene.onScreenText}”
                    </p>
                  ) : null}
                </div>
                <CopyBtn text={scene.voiceover} label={`Scene ${index + 1} voiceover`} />
              </div>
              <div className="space-y-3 p-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Voiceover
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">{scene.voiceover}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Shot direction
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{scene.shot}</p>
                </div>
                <Tabs defaultValue="image">
                  <TabsList className="h-8">
                    <TabsTrigger value="image" className="gap-1 text-[11px]">
                      <ImageIcon className="size-3" /> Still prompt
                    </TabsTrigger>
                    <TabsTrigger value="video" className="gap-1 text-[11px]">
                      <Video className="size-3" /> Motion prompt
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="image" className="mt-2 rounded-lg bg-secondary/25 p-3">
                    <div className="flex items-start gap-2">
                      <p className="flex-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                        {scene.imagePrompt}
                      </p>
                      <CopyBtn text={scene.imagePrompt} label="Still prompt" />
                    </div>
                  </TabsContent>
                  <TabsContent value="video" className="mt-2 rounded-lg bg-secondary/25 p-3">
                    <div className="flex items-start gap-2">
                      <p className="flex-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                        {scene.videoPrompt}
                      </p>
                      <CopyBtn text={scene.videoPrompt} label="Motion prompt" />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </section>
          ))}
        </TabsContent>

        <TabsContent value="thumbnail" className="m-0 p-4">
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="relative mx-auto aspect-[9/16] w-full max-w-[220px] overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-fuchsia-600 via-violet-600 to-blue-600">
              {thumbnailReference ? (
                <img
                  src={thumbnailReference.imageUrl}
                  alt=""
                  className="absolute inset-0 size-full object-cover opacity-55"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/25" />
              <div className="absolute inset-x-4 bottom-5">
                <p className="text-2xl font-black uppercase leading-none text-white drop-shadow">
                  {data.thumbnail.headline}
                </p>
                {data.thumbnail.subheadline ? (
                  <p className="mt-2 text-xs font-semibold text-white/85">
                    {data.thumbnail.subheadline}
                  </p>
                ) : null}
              </div>
              <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold text-white">
                9:16 · 1080×1920
              </span>
            </div>

            <div className="space-y-4">
              <section className="rounded-xl border border-border bg-background/50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <CardHeading
                    icon={Sparkles}
                    title="Primary thumbnail"
                    detail={data.thumbnail.concept}
                  />
                  <CopyBtn text={data.thumbnail.prompt} label="Thumbnail prompt" />
                </div>
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                  {data.thumbnail.prompt}
                </p>
              </section>

              <div className="grid gap-2 sm:grid-cols-2">
                {data.thumbnail.alternates.map((alternate, index) => (
                  <section
                    key={`${alternate.headline}-${index}`}
                    className="rounded-xl border border-border bg-secondary/20 p-3"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
                      Alternate {index + 1}
                    </p>
                    <h5 className="mt-1 text-sm font-semibold">{alternate.headline}</h5>
                    <p className="mt-1 text-xs text-muted-foreground">{alternate.concept}</p>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="publish" className="m-0 space-y-4 p-4">
          <section className="rounded-xl border border-border bg-background/50 p-4">
            <div className="flex items-start justify-between gap-2">
              <CardHeading icon={FileText} title="Caption" detail="Ready to paste" />
              <CopyBtn text={data.caption} label="Caption" />
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{data.caption}</p>
          </section>
          <section className="rounded-xl border border-border bg-background/50 p-4">
            <div className="flex items-start justify-between gap-2">
              <CardHeading
                icon={Hash}
                title="Hashtags"
                detail={`${data.hashtags.length} focused tags`}
              />
              <CopyBtn text={data.hashtags.join(" ")} label="Hashtags" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.hashtags.map((hashtag) => (
                <span
                  key={hashtag}
                  className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground"
                >
                  {hashtag}
                </span>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="sources" className="m-0 p-4">
          {data.sources.length > 0 ? (
            <div className="space-y-2">
              {data.sources.map((source, index) => (
                <a
                  key={`${source.url}-${index}`}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 rounded-xl border border-border bg-background/50 p-3 hover:border-primary/40"
                >
                  <ExternalLink className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold">
                      {source.publisher || new URL(source.url).hostname}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {source.claim}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Search className="mx-auto size-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">No research was needed</p>
              <p className="mt-1 text-xs text-muted-foreground">
                This pack is evergreen or creative, so Vidzo avoided a web-search token pass.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <footer className="flex justify-end border-t border-border bg-secondary/25 px-4 py-2.5">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const all = `${data.topic}\n\n--- VOICEOVER ---\n${data.fullVoiceover}\n\n--- THUMBNAIL ---\n${data.thumbnail.prompt}\n\n--- CAPTION ---\n${data.caption}\n\n${data.hashtags.join(" ")}`;
            void navigator.clipboard.writeText(all);
            toast.success("Full pack copied");
          }}
        >
          <Copy className="size-3.5" />
          Copy complete pack
        </Button>
      </footer>
    </article>
  );
}
