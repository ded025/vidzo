import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardStats, listScripts, listThreads } from "@/lib/threads.functions";
import { FileText, MessageSquare, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/chat/dashboard")({
  component: Dashboard,
});

function Stat({ label, value, hint, accent }: { label: string; value: number | string; hint?: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className={`mt-2 text-4xl font-bold tracking-tight ${accent ?? ""}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Dashboard() {
  const statsFn = useServerFn(getDashboardStats);
  const scriptsFn = useServerFn(listScripts);
  const threadsFn = useServerFn(listThreads);

  const stats = useQuery({ queryKey: ["stats"], queryFn: () => statsFn() });
  const scripts = useQuery({ queryKey: ["scripts"], queryFn: () => scriptsFn() });
  const threads = useQuery({ queryKey: ["threads"], queryFn: () => threadsFn() });

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Your Vidzo command center.</p>
          </div>
          <Link to="/chat">
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" /> New content pack
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Total packs" value={stats.data?.scriptsTotal ?? 0} accent="text-primary" />
          <Stat label="This week" value={stats.data?.scriptsWeek ?? 0} accent="text-accent" />
          <Stat label="Chats" value={stats.data?.threadsTotal ?? 0} />
          <Stat label="Messages" value={stats.data?.messagesTotal ?? 0} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Recent packs</h2>
              </div>
              <Link to="/chat/library" className="text-xs text-primary hover:underline">
                See all
              </Link>
            </div>
            <div className="divide-y divide-border">
              {(scripts.data ?? []).slice(0, 6).map((s) => (
                <Link
                  key={s.id}
                  to="/chat/library"
                  className="flex items-center justify-between p-4 hover:bg-secondary/40"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{s.topic}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleString()}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
              {scripts.data && scripts.data.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Generate your first pack in chat.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Active chats</h2>
            </div>
            <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
              {(threads.data ?? []).slice(0, 8).map((t) => (
                <Link
                  key={t.id}
                  to="/chat/$threadId"
                  params={{ threadId: t.id }}
                  className="flex items-center gap-2 p-3 hover:bg-secondary/40"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{t.title}</span>
                </Link>
              ))}
              {threads.data && threads.data.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No chats yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Browse what's trending</h3>
              <p className="text-sm text-muted-foreground">
                Verified, fresh, sourced topics — generate from any of them in one click.
              </p>
            </div>
          </div>
          <Link to="/chat/trends">
            <Button variant="outline">Open trends feed</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
