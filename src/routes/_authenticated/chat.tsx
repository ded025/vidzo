import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listThreads,
  createThread,
  deleteThread,
} from "@/lib/threads.functions";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, MessageSquare, FileText, LogOut, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatLayout,
});

function ChatLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const params = useParams({ strict: false }) as { threadId?: string };
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const del = useServerFn(deleteThread);

  const threadsQ = useQuery({
    queryKey: ["threads"],
    queryFn: () => list(),
  });

  const createMut = useMutation({
    mutationFn: async () => create({ data: { title: "New chat" } }),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: t!.id } });
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => del({ data: { id } }),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      if (params.threadId === id) navigate({ to: "/chat" });
    },
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <div className="h-screen flex bg-background text-foreground">
      <aside className="w-64 border-r border-border flex flex-col">
        <div className="h-14 px-4 flex items-center gap-2 border-b border-border">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight text-sm">Reel Engine</span>
        </div>
        <div className="p-3">
          <Button
            className="w-full justify-start gap-2"
            size="sm"
            onClick={() => createMut.mutate()}
            disabled={createMut.isPending}
          >
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          <div className="px-2 py-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            Chats
          </div>
          {threadsQ.data?.map((t) => {
            const active = params.threadId === t.id;
            return (
              <div
                key={t.id}
                className={`group flex items-center rounded-md ${
                  active ? "bg-secondary" : "hover:bg-secondary/60"
                }`}
              >
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: t.id }}
                  className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 text-sm"
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{t.title}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => delMut.mutate(t.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
          {threadsQ.data && threadsQ.data.length === 0 && (
            <div className="px-2 py-4 text-xs text-muted-foreground">
              No chats yet. Click <span className="text-foreground">New chat</span>.
            </div>
          )}
        </nav>
        <div className="border-t border-border p-2 space-y-0.5">
          <Link
            to="/scripts"
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-secondary"
          >
            <FileText className="h-4 w-4 text-muted-foreground" />
            Script library
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-secondary text-left"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
