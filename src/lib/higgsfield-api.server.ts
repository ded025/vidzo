import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  compileHiggsfieldPrompt,
  generateUGCVariations,
  HiggsfieldUserInputSchema,
  type HiggsfieldGenerationResult,
  type HiggsfieldUserInput,
  type UGCVariation,
} from "@/lib/higgsfield-prompt-engine";

const jsonHeaders = { "Content-Type": "application/json" };

export class HiggsfieldApiError extends Error {
  status: number;
  code: string;
  detail?: string;

  constructor(message: string, status = 500, code = "HIGGSFIELD_ERROR", detail?: string) {
    super(message);
    this.name = "HiggsfieldApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

export function jsonOk(data: unknown, status = 200) {
  return Response.json(data, { status, headers: jsonHeaders });
}

export function jsonError(message: string, status: number, code: string, detail?: string) {
  return Response.json({ error: message, code, detail }, { status, headers: jsonHeaders });
}

export function handleHiggsfieldApiError(error: unknown) {
  console.error("[higgsfield] API error:", error);
  if (error instanceof HiggsfieldApiError) {
    return jsonError(error.message, error.status, error.code, error.detail);
  }
  if (error instanceof z.ZodError) {
    return jsonError("Invalid Higgsfield request.", 400, "VALIDATION_ERROR", error.message);
  }
  if (error instanceof Error) {
    return jsonError(error.message, 500, "HIGGSFIELD_ERROR");
  }
  return jsonError("Higgsfield prompt engine failed.", 500, "HIGGSFIELD_ERROR");
}

export async function readHiggsfieldInput(request: Request): Promise<HiggsfieldUserInput> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HiggsfieldApiError("Invalid JSON body.", 400, "BAD_REQUEST");
  }

  const candidate =
    body && typeof body === "object" && "input" in body
      ? (body as { input?: unknown }).input
      : body;

  return HiggsfieldUserInputSchema.parse(candidate);
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new HiggsfieldApiError(
      "Supabase is not configured on this server.",
      503,
      "SUPABASE_NOT_CONFIGURED",
    );
  }
  return { supabaseUrl, supabaseKey };
}

export async function getAuthenticatedSupabase(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) {
    throw new HiggsfieldApiError("Sign in to use the Higgsfield engine.", 401, "UNAUTHORIZED");
  }

  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  const userId = data.user?.id;
  if (error || !userId) {
    throw new HiggsfieldApiError("Your session expired. Sign in again.", 401, "UNAUTHORIZED");
  }

  return { supabase, userId, token };
}

export function compileForEndpoint(input: HiggsfieldUserInput) {
  return compileHiggsfieldPrompt(input);
}

export function variationsForEndpoint(input: HiggsfieldUserInput, count?: number) {
  return generateUGCVariations(input, count ?? input.variationCount ?? 20);
}

export async function saveHiggsfieldRender(request: Request, result: HiggsfieldGenerationResult) {
  const { supabase, userId } = await getAuthenticatedSupabase(request);
  const { data: row, error } = await supabase
    .from("render_history")
    .insert({
      user_id: userId,
      engine: "higgsfield_ugc",
      status: "prompt_ready",
      product_name: result.intelligence.product_name,
      brief: result.input.brief,
      request: result.input,
      intelligence: result.intelligence,
      intent: result.intent,
      persona: result.persona,
      script: result.script,
      camera: result.camera,
      motion: result.motion,
      negative_prompt: result.negative_prompt,
      model_route: result.model_route,
      prompt_schema: result.prompt.schema,
      compiled_prompt: result.prompt.yaml,
      output_format: "9:16",
      duration_seconds: result.intelligence.duration,
      platform: result.intelligence.platform,
      generation: {
        engineVersion: result.engine_version,
        variationCount: result.variations.length,
        model: result.model_route.primary_model,
      },
    })
    .select("id, created_at")
    .single();

  if (error || !row) {
    throw new HiggsfieldApiError(
      error?.message ?? "Could not save Higgsfield render history.",
      500,
      "RENDER_HISTORY_SAVE_FAILED",
    );
  }

  const renderHistoryId = row.id as string;

  const hookRows = result.hooks.slice(0, 10).map((hook) => ({
    user_id: userId,
    render_history_id: renderHistoryId,
    category: hook.category,
    platform: hook.platform,
    hook: hook.hook,
    predicted_engagement_score: hook.predicted_engagement_score,
    reason: hook.reason,
    intelligence: result.intelligence,
  }));

  const variationRows = buildVariationRows(userId, renderHistoryId, result.variations);

  const scriptRow = {
    user_id: userId,
    render_history_id: renderHistoryId,
    framework: result.script.framework,
    style: result.script.style,
    hook: result.script.hook,
    problem: result.script.problem,
    solution: result.script.solution,
    proof: result.script.proof,
    cta: result.script.cta,
    full_script: result.script.full_script,
    duration_seconds: result.script.duration_seconds,
    metadata: {
      product: result.intelligence.product_name,
      platform: result.intelligence.platform,
      model: result.model_route.primary_model,
    },
  };

  const [hooksResult, variationsResult, scriptsResult] = await Promise.all([
    hookRows.length > 0
      ? supabase.from("hooks").insert(hookRows)
      : Promise.resolve({ error: null }),
    variationRows.length > 0
      ? supabase.from("generated_variations").insert(variationRows)
      : Promise.resolve({ error: null }),
    supabase.from("higgsfield_scripts").insert(scriptRow),
  ]);

  const persistenceErrors = [hooksResult.error, variationsResult.error, scriptsResult.error]
    .filter(Boolean)
    .map((item) => item?.message);

  return {
    id: renderHistoryId,
    created_at: row.created_at as string,
    persistence_errors: persistenceErrors,
  };
}

export async function saveHiggsfieldVariations(
  request: Request,
  input: HiggsfieldUserInput,
  variations: UGCVariation[],
) {
  const result = compileHiggsfieldPrompt({
    ...input,
    variationCount: variations.length,
  });
  const saved = await saveHiggsfieldRender(request, {
    ...result,
    variations,
  });
  return saved;
}

function buildVariationRows(userId: string, renderHistoryId: string, variations: UGCVariation[]) {
  return variations.slice(0, 20).map((variation, index) => ({
    user_id: userId,
    render_history_id: renderHistoryId,
    variation_index: index + 1,
    title: variation.title,
    score: variation.score,
    persona: variation.persona,
    hook: variation.hook,
    script: variation.script,
    camera: variation.camera,
    motion: variation.motion,
    cta: variation.cta,
    model_route: variation.model_route,
    prompt_schema: variation.prompt.schema,
    compiled_prompt: variation.prompt.yaml,
  }));
}
