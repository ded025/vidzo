import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

export type HiggsfieldHistoryItem = {
  id: string;
  product_name: string;
  platform: string;
  duration_seconds: number;
  status: string;
  model_route: Json;
  prompt_schema: Json;
  compiled_prompt: string;
  generation: Json;
  created_at: string;
};

export type HiggsfieldVariationHistoryItem = {
  id: string;
  variation_index: number;
  title: string;
  score: number;
  persona: Json;
  hook: Json;
  camera: Json;
  compiled_prompt: string;
  created_at: string;
};

export const listHiggsfieldRenderHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("render_history")
      .select(
        "id, product_name, platform, duration_seconds, status, model_route, prompt_schema, compiled_prompt, generation, created_at",
      )
      .eq("engine", "higgsfield_ugc")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw new Error(error.message);
    return (data ?? []) as HiggsfieldHistoryItem[];
  });

export const listHiggsfieldVariations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ renderHistoryId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("generated_variations")
      .select(
        "id, variation_index, title, score, persona, hook, camera, compiled_prompt, created_at",
      )
      .eq("render_history_id", data.renderHistoryId)
      .order("variation_index", { ascending: true });

    if (error) throw new Error(error.message);
    return (rows ?? []) as HiggsfieldVariationHistoryItem[];
  });
