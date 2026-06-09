import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createThread } from "@/lib/threads.functions";
import { Button } from "@/components/ui/button";
import { Sparkles, Search, TrendingUp, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatIndex,
});

const PROMPTS = [
  { icon: TrendingUp, text: "Find 5 trending Indian startup stories from this week and pick the best one for a Short." },
  { icon: Search, text: "Search latest Shark Tank India pitches and write a script on the most viral one." },
  { icon: Lightbulb, text: "Topic: Zepto ka business model. Write a 35-second Hinglish script." },
  { icon: Sparkles, text: "Give me a script about a 21-year-old Indian founder who raised funding recently." },
];

function ChatIndex() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const create = useServerFn(createThread);

  const startWith = useMutation({
    mutationFn: async (firstMessage: string) => {
      const t = await create({ data: { title: firstMessage.slice(0, 60) } });
      return { thread: t, firstMessage };
    },
    onSuccess: ({ thread, firstMessage }) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      sessionStorage.setItem(`pending:${thread!.id}`, firstMessage);
      navigate({ to: "/chat/$threadId", params: { threadId: thread!.id } });
    },
  });

  return (
    <div className="h-full flex items-center justify-center p-8 overflow-y-auto">
      <div className="max-w-2xl w-full">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 rounded-xl bg-primary items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Kya story bana rahe ho aaj?
          </h1>
          <p className="mt-2 text-muted-foreground">
            Trending topics dhundo ya apna idea daalo — AI 30-sec Hinglish script ready kar dega.
          </p>
        </div>
        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          {PROMPTS.map((p) => (
            <button
              key={p.text}
              onClick={() => startWith.mutate(p.text)}
              disabled={startWith.isPending}
              className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-secondary/40 transition-colors"
            >
              <p.icon className="h-4 w-4 text-primary mb-2" />
              <p className="text-sm text-card-foreground">{p.text}</p>
            </button>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button
            size="lg"
            onClick={() =>
              startWith.mutate("Find today's most viral Indian startup story and write a Short script on it.")
            }
            disabled={startWith.isPending}
          >
            Start a blank chat
          </Button>
        </div>
      </div>
    </div>
  );
}
