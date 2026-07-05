import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { VISUAL_STORY_JSON_SCHEMA, VSE_SYSTEM_PROMPT } from "../_shared/visual-story.ts";

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
const AI_MODEL = Deno.env.get("LOVABLE_AI_MODEL")?.trim() || "google/gemini-3-flash-preview";
const AI_ENDPOINT = "https://ai.gateway.lovable.dev/v1/chat/completions";

type GatewayResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string } | string;
};

function jsonError(message: string, status: number, code: string) {
  return Response.json({ error: message, code }, { status, headers: jsonHeaders });
}

function extractJsonObject(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const start = trimmed.indexOf("{");
  if (start === -1) throw new Error("AI returned no JSON object.");
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return JSON.parse(trimmed.slice(start, i + 1));
    }
  }
  throw new Error("AI returned an unbalanced JSON object.");
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

  const apiKey = Deno.env.get("LOVABLE_API_KEY")?.trim();
  if (!apiKey) return jsonError("LOVABLE_API_KEY is not configured.", 503, "AI_NOT_CONFIGURED");
  if (req.method !== "POST") return jsonError("Method not allowed.", 405, "METHOD_NOT_ALLOWED");

  const body = (await req.json().catch(() => null)) as { input?: unknown } | null;
  if (!body || typeof body.input !== "string" || !body.input.trim()) {
    return jsonError("A brief is required.", 400, "BAD_REQUEST");
  }

  const startedAt = Date.now();
  const schemaInstruction = `Return ONLY a JSON object that strictly matches this JSON Schema:\n${JSON.stringify(
    VISUAL_STORY_JSON_SCHEMA,
  )}\nDo not wrap in markdown. Do not include commentary. Output a single JSON object only.`;

  const requestBody = {
    model: AI_MODEL,
    messages: [
      { role: "system", content: `${VSE_SYSTEM_PROMPT}\n\n${schemaInstruction}` },
      { role: "user", content: body.input },
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
  };

  try {
    const response = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify(requestBody),
      signal: req.signal,
    });
    const raw = await response.text();
    let result: GatewayResponse = {};
    try { result = JSON.parse(raw) as GatewayResponse; } catch { /* keep raw */ }

    if (!response.ok) {
      const errMsg = (typeof result.error === "string" ? result.error : result.error?.message) ||
        raw.slice(0, 300) || `AI gateway returned HTTP ${response.status}.`;
      const code = response.status === 429 ? "RATE_LIMITED" :
        response.status === 402 ? "CREDITS_EXHAUSTED" : "AI_ERROR";
      return jsonError(errMsg, response.status, code);
    }
    const text = result.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("AI returned no content.");
    const blueprint = extractJsonObject(text);

    return Response.json(
      {
        blueprint,
        generation: {
          model: AI_MODEL,
          latencyMs: Date.now() - startedAt,
          inputTokens: result.usage?.prompt_tokens ?? 0,
          outputTokens: result.usage?.completion_tokens ?? 0,
        },
      },
      { headers: jsonHeaders },
    );
  } catch (error) {
    console.error("generate-visual-story failed", error);
    return jsonError(
      error instanceof Error ? error.message : "Visual story generation failed.",
      502,
      "GENERATION_FAILED",
    );
  }
});
