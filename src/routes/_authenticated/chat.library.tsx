import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listScripts } from "@/lib/threads.functions";
import { ContentPackCard, type ContentPackData } from "@/components/content-pack-card";
import { Input } from "@/components/ui/input";
import { FileText, Loader2, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat/library")({
  component: LibraryPage,
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Library</h1>
            <p className="text-muted-foreground text-sm">Every pack you've generated, saved automatically.</p>
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
        <div className="space-y-4">
          {filtered.map((s) => (
            <div key={s.id}>
              <div className="text-xs text-muted-foreground mb-2">
                {new Date(s.created_at).toLocaleString()}
              </div>
              <ContentPackCard data={s.data as unknown as ContentPackData} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
