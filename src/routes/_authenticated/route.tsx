import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // getSession reads from localStorage — instant, no network round-trip.
    // This prevents the auth guard from adding latency on every navigation.
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/" });
    return { user: data.session.user };
  },
  component: () => <Outlet />,
});
