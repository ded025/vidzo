import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listScripts } from "@/lib/threads.functions";
import { ContentPackCard, type ContentPackData } from "@/components/content-pack-card";
import { Input } from "@/components/ui/input";
import { ArrowUpRight, FileText, Loader2, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat/library")({
  component: LibraryPage,
  head: () => ({ meta: [
    { title: "Production Library · Vidzo" },
    { name: "description", content: "Review your saved Vidzo content packs and production outputs." },
    { property: "og:title", content: "Production Library · Vidzo" },
    { property: "og:description", content: "Your saved Vidzo productions." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

function LibraryPage() {
  const load = useServerFn(listScripts);
  const q = useQuery({ queryKey: ["scripts"], queryFn: () => load() });
  const [filter, setFilter] = useState("");

  const filtered = (q.data ?? []).filter((s) =>
    filter ? s.topic.toLowerCase().includes(filter.toLowerCase()) : true,
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase text-muted-foreground">Production archive</div>
            <h1 className="text-3xl font-semibold">Library</h1>
            <p className="text-muted-foreground text-sm">
              Every pack you've generated, saved automatically.
            </p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by topic…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>

        {q.isLoading && (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        {q.data && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            {q.data.length === 0
              ? "No packs yet. Generate one in chat — it'll save here automatically."
              : "No packs match that filter."}
          </div>
        )}
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((s) => (
            <div key={s.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary"><FileText className="size-4" /></div>
                <div className="min-w-0 flex-1"><div className="truncate font-semibold">{s.topic}</div><div className="mt-1 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</div></div>
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </div>
              <details className="mt-4 border-t border-border pt-3"><summary className="cursor-pointer text-xs font-semibold text-primary">Open pack</summary><div className="mt-3"><ContentPackCard data={s.data as unknown as ContentPackData} /></div></details>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
