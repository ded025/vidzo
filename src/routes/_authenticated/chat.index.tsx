import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createThread } from "@/lib/threads.functions";
import { Button } from "@/components/ui/button";
import { TrendingUp, Lightbulb, Dumbbell, Briefcase, Film } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatIndex,
});

const PROMPTS = [
  {
    icon: TrendingUp,
    text: "Find this week's biggest Indian startup funding stories and pick the most viral one.",
  },
  { icon: Briefcase, text: "Topic: Zepto ka business model. Make a 30-sec Hinglish Reel pack." },
  {
    icon: Dumbbell,
    text: "Niche: gym & fitness for desi audience. 30-sec Reel on the truth about creatine.",
  },
  { icon: Film, text: "Latest Shark Tank India pitch that went viral — full content pack please." },
  {
    icon: Lightbulb,
    text: "Founder story angle: 21-year-old Indian who raised seed funding recently.",
  },
];

function ChatIndex() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const create = useServerFn(createThread);
  const [brief, setBrief] = useState("");

  const startWith = useMutation({
    mutationFn: async (firstMessage: string) => {
      const t = await create({
        data: {
          title: firstMessage.slice(0, 60),
          contextBrief: firstMessage,
        },
      });
      return { thread: t, firstMessage };
    },
    onSuccess: ({ thread, firstMessage }) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      sessionStorage.setItem(`pending:${thread!.id}`, firstMessage);
      navigate({ to: "/chat/$threadId", params: { threadId: thread!.id } });
    },
  });

  return (
    <div className="h-full flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-2xl w-full">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent items-center justify-center mb-4 shadow-lg">
            <span className="text-primary-foreground font-black text-lg">V</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            What are we making today?
          </h1>
          <p className="mt-2 text-muted-foreground">
            Drop your brief. This chat will lock onto it — every output stays on track.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <Textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g. I run a gym in Pune. Need 5 Hinglish reels weekly on busted fitness myths for 18-30 yr olds."
            rows={4}
            className="resize-none border-0 bg-transparent focus-visible:ring-0 px-0 shadow-none"
          />
          <div className="flex justify-end">
            <Button
              onClick={() => brief.trim() && startWith.mutate(brief.trim())}
              disabled={!brief.trim() || startWith.isPending}
            >
              Lock brief & start
            </Button>
          </div>
        </div>

        <div className="mt-6 text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Or pick a starter
        </div>
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          {PROMPTS.map((p) => (
            <button
              key={p.text}
              onClick={() => startWith.mutate(p.text)}
              disabled={startWith.isPending}
              className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md transition-all"
            >
              <p.icon className="h-4 w-4 text-primary mb-2" />
              <p className="text-sm text-card-foreground">{p.text}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
