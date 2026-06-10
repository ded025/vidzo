import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, Mic, Image as ImageIcon, Video, Hash, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export type ContentPackData = {
  topic: string;
  niche?: string;
  format?: string;
  whyViral: string;
  script: {
    dialogue: string;
    voiceDirection: string;
    suggestedElevenLabsVoice?: { name?: string; voiceId?: string };
  };
  visuals: Array<{
    beat: string;
    onScreenText?: string;
    imagePrompt: string;
    videoPrompt: string;
  }>;
  thumbnailPrompts: string[];
  caption: string;
  hashtags: string[];
  sources: Array<{ claim: string; url: string; publisher?: string }>;
};

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setDone(true);
        toast.success(`${label} copied`);
        setTimeout(() => setDone(false), 1400);
      }}
      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-border bg-background hover:bg-secondary"
    >
      {done ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      Copy
    </button>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border first:border-t-0 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <div className="text-[11px] uppercase tracking-wider font-semibold text-foreground">
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

export function ContentPackCard({ data }: { data: ContentPackData }) {
  return (
    <div className="rounded-2xl border border-border bg-card text-card-foreground overflow-hidden shadow-sm">
      <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-transparent px-4 py-3 border-b border-border">
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-primary font-bold">
          <span>Vidzo content pack</span>
          {data.format && <span className="px-1.5 py-0.5 rounded-full bg-primary/10">{data.format}</span>}
          {data.niche && <span className="px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">{data.niche}</span>}
        </div>
        <h3 className="font-semibold mt-1 text-base">{data.topic}</h3>
        <p className="text-xs text-muted-foreground mt-1">{data.whyViral}</p>
      </div>

      {/* Voiceover */}
      <Section icon={Mic} title="Voiceover-ready dialogue">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground">
            {data.script.suggestedElevenLabsVoice?.name && (
              <>Suggested voice: <span className="text-foreground font-medium">{data.script.suggestedElevenLabsVoice.name}</span>{" "}
              {data.script.suggestedElevenLabsVoice.voiceId && (
                <span className="opacity-60">({data.script.suggestedElevenLabsVoice.voiceId})</span>
              )}</>
            )}
          </div>
          <CopyBtn text={data.script.dialogue} label="Dialogue" />
        </div>
        <p className="whitespace-pre-wrap leading-relaxed text-sm bg-secondary/40 rounded-lg p-3">
          {data.script.dialogue}
        </p>
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Direction:</span> {data.script.voiceDirection}
        </div>
      </Section>

      {/* Visuals */}
      <Section icon={ImageIcon} title="Visual plan — scene by scene">
        <div className="space-y-3">
          {data.visuals.map((v, i) => (
            <div key={i} className="rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-foreground">{v.beat}</div>
                {v.onScreenText && (
                  <div className="text-[11px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground truncate max-w-[60%]">
                    "{v.onScreenText}"
                  </div>
                )}
              </div>
              <Tabs defaultValue="image">
                <TabsList className="h-7">
                  <TabsTrigger value="image" className="text-[11px] gap-1">
                    <ImageIcon className="h-3 w-3" /> Still visual
                  </TabsTrigger>
                  <TabsTrigger value="video" className="text-[11px] gap-1">
                    <Video className="h-3 w-3" /> Motion visual
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="image" className="mt-2">
                  <div className="flex items-start gap-2">
                    <p className="text-xs text-muted-foreground flex-1 whitespace-pre-wrap">{v.imagePrompt}</p>
                    <CopyBtn text={v.imagePrompt} label="Still visual" />
                  </div>
                </TabsContent>
                <TabsContent value="video" className="mt-2">
                  <div className="flex items-start gap-2">
                    <p className="text-xs text-muted-foreground flex-1 whitespace-pre-wrap">{v.videoPrompt}</p>
                    <CopyBtn text={v.videoPrompt} label="Motion visual" />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ))}
        </div>
      </Section>

      {/* Thumbnails */}
      <Section icon={ImageIcon} title="Thumbnail & first-frame concepts">
        <div className="grid sm:grid-cols-3 gap-2">
          {data.thumbnailPrompts.map((t, i) => (
            <div key={i} className="rounded-lg border border-border bg-background/50 p-3 flex flex-col h-full">
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xs font-bold text-primary">Concept {i + 1}</div>
                <CopyBtn text={t} label={`Thumbnail ${i + 1}`} />
              </div>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap flex-1">{t}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Caption & hashtags */}
      <Section icon={FileText} title="Caption">
        <div className="flex items-start gap-2">
          <p className="text-sm flex-1">{data.caption}</p>
          <CopyBtn text={data.caption} label="Caption" />
        </div>
      </Section>
      <Section icon={Hash} title="Hashtags">
        <div className="flex items-start gap-2">
          <div className="flex flex-wrap gap-1.5 flex-1">
            {data.hashtags.map((h) => (
              <span key={h} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                {h}
              </span>
            ))}
          </div>
          <CopyBtn text={data.hashtags.join(" ")} label="Hashtags" />
        </div>
      </Section>

      {/* Sources */}
      {data.sources && data.sources.length > 0 && (
        <Section icon={ExternalLink} title={`Source-backed research (${data.sources.length})`}>
          <ul className="space-y-1.5">
            {data.sources.map((s, i) => (
              <li key={i} className="text-xs">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {s.publisher ?? new URL(s.url).hostname} <ExternalLink className="h-3 w-3" />
                </a>
                <span className="text-muted-foreground"> — {s.claim}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="border-t border-border bg-secondary/30 px-4 py-2 flex justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const all = `${data.topic}\n\n--- VOICEOVER ---\n${data.script.dialogue}\n\n--- CAPTION ---\n${data.caption}\n\n${data.hashtags.join(" ")}`;
            navigator.clipboard.writeText(all);
            toast.success("Full pack copied");
          }}
        >
          <Copy className="h-3.5 w-3.5" />
          Copy everything
        </Button>
      </div>
    </div>
  );
}
