import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listScripts } from "@/lib/threads.functions";
import { ScriptCard, type ScriptData } from "@/components/script-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/scripts")({
  component: ScriptsPage,
});

function ScriptsPage() {
  const load = useServerFn(listScripts);
  const q = useQuery({ queryKey: ["scripts"], queryFn: () => load() });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/chat">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to chat
            </Button>
          </Link>
          <h1 className="font-semibold tracking-tight">Script library</h1>
          <div className="w-24" />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {q.isLoading && (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        {q.data && q.data.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No scripts yet. Generate one in chat — it'll save here automatically.
          </div>
        )}
        {q.data?.map((s) => (
          <div key={s.id}>
            <div className="text-xs text-muted-foreground mb-2">
              {new Date(s.created_at).toLocaleString()}
            </div>
            <ScriptCard data={s.data as unknown as ScriptData} />
          </div>
        ))}
      </main>
    </div>
  );
}
