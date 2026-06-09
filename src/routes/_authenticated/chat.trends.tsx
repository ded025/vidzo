import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { createThread } from "@/lib/threads.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat/trends")({
  component: TrendsPage,
});

const STARTERS = [
  "Indian startup funding this week",
  "Shark Tank India latest viral pitch",
  "D2C brand going viral 2026",
  "Indian gym & fitness controversies",
  "Recent Bollywood box office surprises",
  "Crypto / fintech India this month",
  "Tech layoffs India recent",
  "21-year-old founders India recent funding",
];

function TrendsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const create = useServerFn(createThread);
  const [custom, setCustom] = useState("");

  const start = useMutation({
    mutationFn: async (query: string) => {
      const brief = `Search trending topics for: "${query}". Score top 3 and generate a full content pack for the most viral.`;
      const t = await create({ data: { title: query.slice(0, 60), contextBrief: brief } });
      return { t, brief };
    },
    onSuccess: ({ t, brief }) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      sessionStorage.setItem(`pending:${t!.id}`, brief);
      navigate({ to: "/chat/$threadId", params: { threadId: t!.id } });
    },
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trends</h1>
            <p className="text-muted-foreground text-sm">
              Pick a category — Vidzo searches live sources and builds a verified pack.
            </p>
          </div>
        </div>

        <form
          className="flex gap-2 mb-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (custom.trim()) start.mutate(custom.trim());
          }}
        >
          <Input
            placeholder="Or type your own trend search…"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <Button type="submit" disabled={!custom.trim() || start.isPending}>
            <Sparkles className="h-4 w-4 mr-1" /> Find & generate
          </Button>
        </form>

        <div className="grid sm:grid-cols-2 gap-3">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => start.mutate(s)}
              disabled={start.isPending}
              className="text-left p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md transition-all group"
            >
              <TrendingUp className="h-4 w-4 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-medium">{s}</div>
              <div className="mt-1 text-xs text-muted-foreground">Tap to search + generate →</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
