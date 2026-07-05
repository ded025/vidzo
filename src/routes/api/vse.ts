import { createFileRoute } from "@tanstack/react-router";

const jsonHeaders = { "Content-Type": "application/json" };

function err(message: string, status: number, code: string) {
  return Response.json({ error: message, code }, { status, headers: jsonHeaders });
}

export const Route = createFileRoute("/api/vse")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authorization = request.headers.get("authorization") ?? "";
        const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
        if (!token) return err("Sign in to use the Visual Story Engine.", 401, "UNAUTHORIZED");

        let body: { input?: unknown };
        try {
          body = (await request.json()) as { input?: unknown };
        } catch {
          return err("Invalid JSON body.", 400, "BAD_REQUEST");
        }
        if (typeof body.input !== "string" || !body.input.trim()) {
          return err("A brief is required.", 400, "BAD_REQUEST");
        }

        const url = process.env.SUPABASE_URL?.trim();
        const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
        if (!url || !publishableKey) {
          return err("Supabase is not configured.", 503, "SUPABASE_NOT_CONFIGURED");
        }

        const endpoint = `${url.replace(/\/$/, "")}/functions/v1/generate-visual-story`;
        const upstream = await fetch(endpoint, {
          method: "POST",
          headers: {
            apikey: publishableKey,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ input: body.input }),
          signal: request.signal,
        });
        const raw = await upstream.text();
        return new Response(raw, {
          status: upstream.status,
          headers: jsonHeaders,
        });
      },
    },
  },
});
