import { createFileRoute } from "@tanstack/react-router";

function getEdgeConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) throw new Error("Supabase Edge Functions are not configured.");
  return {
    endpoint: `${url.replace(/\/$/, "")}/functions/v1/sync-trends`,
    publishableKey,
  };
}

export const Route = createFileRoute("/api/trends-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authorization = request.headers.get("authorization") ?? "";
        if (!authorization.startsWith("Bearer ")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        try {
          const body = await request.text();
          const { endpoint, publishableKey } = getEdgeConfig();
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              apikey: publishableKey,
              Authorization: authorization,
              "Content-Type": "application/json",
            },
            body: body || "{}",
            signal: request.signal,
          });
          return new Response(response.body, {
            status: response.status,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Trend sync failed." },
            { status: 502 },
          );
        }
      },
    },
  },
});
