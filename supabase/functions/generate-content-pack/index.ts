import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { CONTENT_PACK_JSON_SCHEMA, MASTER_SYSTEM_PROMPT } from "../_shared/content-pack.ts";

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL")?.trim() || "gemini-flash-latest";
const GEMINI_ENDPOINT = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    cachedContentTokenCount?: number;
  };
  error?: { message?: string };
};

function jsonError(message: string, status: number, code: string) {
  return Response.json({ error: message, code }, { status, headers: jsonHeaders });
}

function extractJsonObject(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Gemini returned no JSON object.");
  return JSON.parse(trimmed.slice(start, end + 1));
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

  const apiKey = Deno.env.get("GEMINI_API_KEY")?.trim();
  if (req.method === "GET") {
    return Response.json(
      {
        status: apiKey ? "ok" : "degraded",
        provider: "gemini",
        runtime: "supabase-edge",
        configured: Boolean(apiKey),
        model: GEMINI_MODEL,
      },
      { status: apiKey ? 200 : 503, headers: jsonHeaders },
    );
  }
  if (req.method !== "POST") return jsonError("Method not allowed.", 405, "METHOD_NOT_ALLOWED");
  if (!apiKey) {
    return jsonError(
      "GEMINI_API_KEY is not configured in Supabase Edge Function secrets.",
      503,
      "GEMINI_NOT_CONFIGURED",
    );
  }

  const body = (await req.json().catch(() => null)) as {
    input?: unknown;
  } | null;
  if (!body || typeof body.input !== "string" || !body.input.trim()) {
    return jsonError("A prompt engine input is required.", 400, "BAD_REQUEST");
  }

  const startedAt = Date.now();
  const schemaInstruction = `Return ONLY a JSON object that strictly matches this JSON Schema:\n${JSON.stringify(
    CONTENT_PACK_JSON_SCHEMA,
  )}\nDo not wrap in markdown. Do not include commentary. Output JSON only.`;

  const requestBody = {
    systemInstruction: {
      role: "system",
      parts: [{ text: `${MASTER_SYSTEM_PROMPT}\n\n${schemaInstruction}` }],
    },
    contents: [{ role: "user", parts: [{ text: body.input }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  };

  try {
    const response = await fetch(GEMINI_ENDPOINT(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
      body: JSON.stringify(requestBody),
      signal: req.signal,
    });
    const result = (await response.json()) as GeminiResponse;
    if (!response.ok) {
      return jsonError(
        result.error?.message || `Gemini returned HTTP ${response.status}.`,
        response.status,
        "GEMINI_ERROR",
      );
    }
    const text = result.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text) throw new Error("Gemini returned no content.");
    const parsed = extractJsonObject(text);
    if (parsed && typeof parsed === "object" && !Array.isArray((parsed as { sources?: unknown }).sources)) {
      (parsed as { sources: unknown[] }).sources = [];
    }

    return Response.json(
      {
        pack: parsed,
        generation: {
          model: GEMINI_MODEL,
          requestCount: 1,
          latencyMs: Date.now() - startedAt,
          inputTokens: result.usageMetadata?.promptTokenCount ?? 0,
          outputTokens: result.usageMetadata?.candidatesTokenCount ?? 0,
          cachedInputTokens: result.usageMetadata?.cachedContentTokenCount ?? 0,
          webSearchUsed: false,
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
