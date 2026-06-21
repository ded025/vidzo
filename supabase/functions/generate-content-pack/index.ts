import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { CONTENT_PACK_JSON_SCHEMA, MASTER_SYSTEM_PROMPT } from "../_shared/content-pack.ts";

type OpenAIResponse = {
  id?: string;
  model?: string;
  output?: Array<{
    type?: string;
    action?: {
      type?: string;
      url?: string;
      sources?: Array<{ url?: string }>;
    };
    content?: Array<{ type?: string; text?: string; refusal?: string }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    input_tokens_details?: { cached_tokens?: number };
  };
  error?: { message?: string };
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

function jsonError(message: string, status: number, code: string) {
  return Response.json({ error: message, code }, { status, headers: jsonHeaders });
}

function extractOutputText(response: OpenAIResponse) {
  for (const item of response.output ?? []) {
    if (item.type !== "message") continue;
    for (const content of item.content ?? []) {
      if (content.type === "refusal" && content.refusal) throw new Error(content.refusal);
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  throw new Error("OpenAI returned no structured content pack.");
}

async function safetyIdentifier(userId: string) {
  const bytes = new TextEncoder().encode(userId);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function collectAllowedSourceUrls(response: OpenAIResponse, input: string) {
  const urls = new Set<string>(
    Array.from(input.matchAll(/https?:\/\/[^\s<>"')\]]+/g), (match) => match[0]),
  );
  for (const item of response.output ?? []) {
    if (item.type !== "web_search_call") continue;
    if (item.action?.url) urls.add(item.action.url);
    for (const source of item.action?.sources ?? []) {
      if (source.url) urls.add(source.url);
    }
  }
  return urls;
}

function sourceMatches(url: string, allowedUrls: Set<string>) {
  if (allowedUrls.has(url)) return true;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return Array.from(allowedUrls).some(
      (allowed) => new URL(allowed).hostname.replace(/^www\./, "") === host,
    );
  } catch {
    return false;
  }
}

function sanitizePackSources(
  pack: unknown,
  response: OpenAIResponse,
  input: string,
  research: boolean,
) {
  if (!pack || typeof pack !== "object") return pack;
  const result = pack as {
    sources?: Array<{ claim?: string; url?: string; publisher?: string | null }>;
  };
  if (!research || !Array.isArray(result.sources)) {
    result.sources = [];
    return result;
  }
  const allowedUrls = collectAllowedSourceUrls(response, input);
  result.sources = result.sources
    .filter(
      (source): source is { claim?: string; url: string; publisher?: string | null } =>
        typeof source.url === "string" && sourceMatches(source.url, allowedUrls),
    )
    .map((source) => ({
      ...source,
      publisher: source.publisher || new URL(source.url).hostname.replace(/^www\./, ""),
    }));
  return result;
}

async function authenticate(req: Request) {
  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const user = await authenticate(req);
  if (!user) return jsonError("Unauthorized.", 401, "UNAUTHORIZED");

  const apiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
  const model = Deno.env.get("OPENAI_MODEL")?.trim() || "gpt-5.5";
  if (req.method === "GET") {
    return Response.json(
      {
        status: apiKey ? "ok" : "degraded",
        provider: "openai",
        runtime: "supabase-edge",
        configured: Boolean(apiKey),
        model,
      },
      { status: apiKey ? 200 : 503, headers: jsonHeaders },
    );
  }
  if (req.method !== "POST") return jsonError("Method not allowed.", 405, "METHOD_NOT_ALLOWED");
  if (!apiKey) {
    return jsonError(
      "OPENAI_API_KEY is not configured in Supabase Edge Function secrets.",
      503,
      "OPENAI_NOT_CONFIGURED",
    );
  }

  const body = (await req.json().catch(() => null)) as {
    input?: unknown;
    research?: unknown;
  } | null;
  if (!body || typeof body.input !== "string" || !body.input.trim()) {
    return jsonError("A prompt engine input is required.", 400, "BAD_REQUEST");
  }
  const research = body.research === true;
  const startedAt = Date.now();
  const requestBody = {
    model,
    instructions: MASTER_SYSTEM_PROMPT,
    input: body.input,
    max_output_tokens: 4200,
    reasoning: { effort: "low" },
    text: {
      verbosity: "low",
      format: {
        type: "json_schema",
        name: "vidzo_content_pack",
        strict: true,
        schema: CONTENT_PACK_JSON_SCHEMA,
      },
    },
    parallel_tool_calls: false,
    prompt_cache_key: "vidzo-content-pack-v2",
    prompt_cache_retention: "24h",
    safety_identifier: await safetyIdentifier(user.id),
    store: false,
    ...(research
      ? {
          tools: [
            {
              type: "web_search",
              search_context_size: "low",
              user_location: {
                type: "approximate",
                country: "IN",
                timezone: "Asia/Kolkata",
              },
            },
          ],
          tool_choice: "auto",
          max_tool_calls: 1,
          include: ["web_search_call.action.sources"],
        }
      : {}),
  };

  try {
    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: req.signal,
    });
    const result = (await openAIResponse.json()) as OpenAIResponse;
    if (!openAIResponse.ok) {
      return jsonError(
        result.error?.message || `OpenAI returned HTTP ${openAIResponse.status}.`,
        openAIResponse.status,
        "OPENAI_ERROR",
      );
    }

    const pack = sanitizePackSources(
      JSON.parse(extractOutputText(result)) as unknown,
      result,
      body.input,
      research,
    );
    const webSearchUsed = (result.output ?? []).some((item) => item.type === "web_search_call");
    return Response.json(
      {
        pack,
        generation: {
          model: result.model || model,
          requestCount: 1,
          latencyMs: Date.now() - startedAt,
          inputTokens: result.usage?.input_tokens ?? 0,
          outputTokens: result.usage?.output_tokens ?? 0,
          cachedInputTokens: result.usage?.input_tokens_details?.cached_tokens ?? 0,
          webSearchUsed,
        },
      },
      { headers: jsonHeaders },
    );
  } catch (error) {
    console.error("generate-content-pack failed", error);
    return jsonError(
      error instanceof Error ? error.message : "Content generation failed.",
      502,
      "GENERATION_FAILED",
    );
  }
});
