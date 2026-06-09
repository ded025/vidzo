import { createFileRoute, Link, Outlet, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  listThreads,
  createThread,
  deleteThread,
} from "@/lib/threads.functions";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, Trash2, MessageSquare, FileText, LogOut, Menu, X,
  LayoutDashboard, Sliders, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatLayout,
});

function ChatLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const params = useParams({ strict: false }) as { threadId?: string };
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const del = useServerFn(deleteThread);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

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
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  const NavItem = ({
    to, icon: Icon, label,
  }: { to: string; icon: React.ComponentType<{className?: string}>; label: string }) => {
    const active = pathname === to || (to !== "/chat" && pathname.startsWith(to));
    return (
      <Link
        to={to}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
          active ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  };

  const sidebar = (
    <>
      <div className="h-14 px-4 flex items-center justify-between gap-2 border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-black text-sm">V</span>
          </div>
          <span className="font-bold tracking-tight text-base truncate">Vidzo</span>
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1.5 rounded-md hover:bg-secondary"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3 space-y-1">
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/trends" icon={TrendingUp} label="Trends" />
        <NavItem to="/scripts" icon={FileText} label="Library" />
        <NavItem to="/presets" icon={Sliders} label="Presets" />
      </div>
      <div className="px-3 pt-2 pb-1">
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
                className="md:opacity-0 md:group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        {threadsQ.data && threadsQ.data.length === 0 && (
          <div className="px-2 py-4 text-xs text-muted-foreground">
            No chats yet. Tap <span className="text-foreground">New chat</span>.
          </div>
        )}
      </nav>
      <div className="border-t border-border p-2">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-secondary text-left"
        >
          <LogOut className="h-4 w-4 text-muted-foreground" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="h-[100dvh] flex bg-background text-foreground">
      <aside className="hidden md:flex w-64 border-r border-border flex-col shrink-0">
        {sidebar}
      </aside>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-background border-r border-border flex flex-col animate-in slide-in-from-left duration-200">
            {sidebar}
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="md:hidden h-12 shrink-0 border-b border-border flex items-center px-2 gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-secondary"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-black text-xs">V</span>
            </div>
            <span className="font-bold tracking-tight text-sm truncate">Vidzo</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => createMut.mutate()}
            disabled={createMut.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
