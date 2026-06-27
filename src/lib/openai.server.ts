import {
  parseGeneratedContentPack,
  type GeneratedContentPack,
  type GenerationMetrics,
} from "@/lib/content-pack";

type EdgeGenerationResponse = {
  pack?: unknown;
  generation?: GenerationMetrics;
  error?: string;
  code?: string;
};

function getSupabaseEdgeConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) {
    throw new Error("Supabase Edge Functions are not configured.");
  }
  return {
    endpoint: `${url.replace(/\/$/, "")}/functions/v1/generate-content-pack`,
    publishableKey,
  };
}

async function edgeRequest({
  token,
  method,
  body,
  signal,
}: {
  token: string;
  method: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
}) {
  const { endpoint, publishableKey } = getSupabaseEdgeConfig();
  return fetch(endpoint, {
    method,
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
}

export async function checkContentEngine({
  token,
  signal,
}: {
  token: string;
  signal?: AbortSignal;
}) {
  const response = await edgeRequest({ token, method: "GET", signal });
  const payload = (await response.json().catch(() => null)) as {
    status?: string;
    provider?: string;
    runtime?: string;
    configured?: boolean;
    model?: string;
    error?: string;
  } | null;
  if (!response.ok || !payload?.configured) {
    throw new Error(
      payload?.error ||
        "The Supabase content engine is deployed but GEMINI_API_KEY is not configured.",
    );
  }
  return payload;
}

export async function generateContentPack({
  input,
  research,
  token,
  signal,
}: {
  input: string;
  research: boolean;
  token: string;
  signal?: AbortSignal;
}): Promise<{ pack: GeneratedContentPack; generation: GenerationMetrics }> {
  const response = await edgeRequest({
    token,
    method: "POST",
    body: { input, research },
    signal,
  });
  const payload = (await response.json().catch(() => null)) as EdgeGenerationResponse | null;
  if (!response.ok) {
    throw new Error(payload?.error || `Supabase content engine returned HTTP ${response.status}.`);
  }

  const pack = parseGeneratedContentPack(payload?.pack);
  if (!payload?.generation) {
    throw new Error("Supabase content engine returned no generation metrics.");
  }
  return { pack, generation: payload.generation };
}
