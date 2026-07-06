import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { z } from "zod";
import { createThread } from "@/lib/threads.functions";
import { Loader2 } from "lucide-react";

const searchSchema = z.object({
  prompt: z.string().optional(),
  engine: z.string().optional(),
  title: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/chat/new")({
  validateSearch: searchSchema,
  component: NewThread,
});

function NewThread() {
  const { prompt, engine, title } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const create = useServerFn(createThread);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const displayMessage = (prompt ?? "").trim();
    // The engine prompt (full internal directives) is stored server-side as
    // the thread's context_brief so it's re-injected into every AI call
    // without ever appearing in the chat transcript the user sees.
    const engineBrief = (engine ?? prompt ?? "").trim();
    (async () => {
      try {
        const t = await create({
          data: {
            title: (title ?? displayMessage).slice(0, 60) || "New chat",
            contextBrief: engineBrief || undefined,
          },
        });
        qc.invalidateQueries({ queryKey: ["threads"] });
        if (displayMessage) {
          sessionStorage.setItem(`pending:${t!.id}`, displayMessage);
        }
        navigate({
          to: "/chat/$threadId",
          params: { threadId: t!.id },
          replace: true,
        });
      } catch {
        navigate({ to: "/chat/dashboard", replace: true });
      }
    })();
  }, [prompt, engine, title, create, navigate, qc]);


  // Optimistic skeleton — feels instant.
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-4">
          {prompt && (
            <div className="ml-auto max-w-[80%] rounded-2xl bg-primary text-primary-foreground px-4 py-3 text-sm">
              {prompt}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Spinning up your content pack…
          </div>
          <div className="space-y-2 max-w-[85%]">
            <div className="h-3 rounded bg-secondary animate-pulse w-3/4" />
            <div className="h-3 rounded bg-secondary animate-pulse w-2/3" />
            <div className="h-3 rounded bg-secondary animate-pulse w-1/2" />
          </div>
        </div>
      </div>
      <div className="border-t border-border p-4">
        <div className="max-w-3xl mx-auto h-12 rounded-md border border-border bg-secondary/40 animate-pulse" />
      </div>
    </div>
  );
}
