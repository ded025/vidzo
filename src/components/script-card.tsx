import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export type ScriptData = {
  topic: string;
  whyViral: string;
  script: string;
  visualDirection: string[];
  onScreenText: string[];
  voiceoverStyle: string;
  thumbnailOptions: string[];
  caption: string;
  hashtags: string[];
  sourcesToVerify?: string[];
};

export function ScriptCard({ data }: { data: ScriptData }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(null), 1500);
  };

  const Section = ({ title, children, copyText, copyLabel }: { title: string; children: React.ReactNode; copyText?: string; copyLabel?: string }) => (
    <div className="border-t border-border pt-3 mt-3 first:border-t-0 first:mt-0 first:pt-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          {title}
        </div>
        {copyText && (
          <button
            onClick={() => copy(copyLabel ?? title, copyText)}
            className="text-muted-foreground hover:text-foreground"
          >
            {copied === (copyLabel ?? title) ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );

  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground overflow-hidden">
      <div className="bg-primary/5 px-4 py-3 border-b border-border">
        <div className="text-xs text-primary font-medium">SHORT SCRIPT</div>
        <h3 className="font-semibold mt-0.5">{data.topic}</h3>
        <p className="text-xs text-muted-foreground mt-1">{data.whyViral}</p>
      </div>
      <div className="p-4">
        <Section title="Script" copyText={data.script} copyLabel="Script">
          <p className="whitespace-pre-wrap leading-relaxed">{data.script}</p>
        </Section>
        <Section title="Voiceover">
          <p className="text-muted-foreground">{data.voiceoverStyle}</p>
        </Section>
        <Section title="Visual direction">
          <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
            {data.visualDirection.map((v, i) => <li key={i}>{v}</li>)}
          </ol>
        </Section>
        <Section title="On-screen text">
          <ul className="space-y-1">
            {data.onScreenText.map((t, i) => (
              <li key={i} className="text-foreground">"{t}"</li>
            ))}
          </ul>
        </Section>
        <Section title="Thumbnail options">
          <ul className="space-y-1">
            {data.thumbnailOptions.map((t, i) => (
              <li key={i} className="text-foreground">{i + 1}. {t}</li>
            ))}
          </ul>
        </Section>
        <Section title="Caption" copyText={data.caption} copyLabel="Caption">
          <p>{data.caption}</p>
        </Section>
        <Section title="Hashtags" copyText={data.hashtags.join(" ")} copyLabel="Hashtags">
          <div className="flex flex-wrap gap-1.5">
            {data.hashtags.map((h) => (
              <span key={h} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                {h}
              </span>
            ))}
          </div>
        </Section>
        {data.sourcesToVerify && data.sourcesToVerify.length > 0 && (
          <Section title="Verify before posting">
            <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground text-xs">
              {data.sourcesToVerify.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </Section>
        )}
      </div>
      <div className="border-t border-border bg-secondary/30 px-4 py-2 flex justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            copy(
              "Full script pack",
              `${data.topic}\n\n${data.script}\n\nCaption: ${data.caption}\n\n${data.hashtags.join(" ")}`,
            )
          }
        >
          <Copy className="h-3.5 w-3.5" />
          Copy all
        </Button>
      </div>
    </div>
  );
}
