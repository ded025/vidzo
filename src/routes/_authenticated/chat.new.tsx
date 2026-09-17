import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { z } from "zod";
import { createThread } from "@/lib/threads.functions";
import { AlertCircle, Loader2 } from "lucide-react";

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
  const [failure, setFailure] = useState<string | null>(null);

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
      } catch (error) {
        started.current = false;
        setFailure(error instanceof Error ? error.message : "Could not start this production.");
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
          {failure ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm" role="alert">
              <div className="flex items-center gap-2 font-semibold text-destructive"><AlertCircle className="size-4" />Couldn’t start this production</div>
              <p className="mt-1 text-muted-foreground">{failure}</p>
              <button type="button" className="mt-3 text-sm font-semibold text-primary" onClick={() => { setFailure(null); started.current = false; navigate({ to: "/chat", replace: true }); }}>Return to your brief</button>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-md border border-border bg-card p-4 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <div><div className="font-semibold text-foreground">Production started</div><div className="text-muted-foreground">Saving the brief and preparing research…</div></div>
            </div>
          )}
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
