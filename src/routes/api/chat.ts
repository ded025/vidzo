import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { MASTER_SYSTEM_PROMPT } from "@/lib/prompts";
import { createFileRoute } from "@tanstack/react-router";
import {
  convertToModelMessages,
  generateText,
  streamText,
  stepCountIs,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

type ChatRequestBody = { messages?: unknown; threadId?: string };

const ContentPackSchema = z.object({
  topic: z.string(),
  niche: z.string().optional(),
  format: z.string().optional().describe("e.g. Reel/Short, Long-form YouTube, Tweet pack, Podcast"),
  whyViral: z.string(),
  script: z.object({
    dialogue: z
      .string()
      .describe(
        "Clean, copy-pasteable voiceover text. Paste-into-ElevenLabs ready. NO timestamps, NO stage directions inline.",
      ),
    voiceDirection: z.string().describe("Tone, pace, emotion, pauses — separately from the dialogue."),
    suggestedElevenLabsVoice: z
      .object({
        name: z.string().optional(),
        voiceId: z.string().optional(),
      })
      .optional(),
  }),
  visuals: z
    .array(
      z.object({
        beat: z.string().describe('e.g. "0-3s hook"'),
        onScreenText: z.string().optional(),
        imagePrompt: z
          .string()
          .min(300)
          .describe(
            "DETAILED 9:16 PORTRAIT image-gen prompt, MINIMUM 80 words. MUST start with: '9:16 vertical portrait format, 1080x1920px, shot for Instagram Reels / YouTube Shorts'. Then include ALL of: (1) SUBJECT with exact age/ethnicity/clothing/expression/body language/frame position, (2) SCENE with specific location/environment/time-of-day, (3) CAMERA with lens choice/angle/shot type/depth-of-field, (4) LIGHTING with direction/quality/color temperature/practical sources, (5) STYLE with cinematic reference/color grade, (6) MOOD in 1-2 words, (7) any TEXT OVERLAY with exact wording/font/placement/color, (8) end with '--ar 9:16 --style raw --v 6.1'. Absolute minimum 80 words. No one-liners.",
          ),
        videoPrompt: z
          .string()
          .min(200)
          .describe(
            "DETAILED 9:16 PORTRAIT video-gen prompt, MINIMUM 60 words. MUST start with: '9:16 vertical portrait video, 1080x1920, for short-form'. Then include ALL of: (1) DURATION in seconds, (2) OPENING FRAME exact description, (3) MOTION/ACTION specifying camera movement (dolly/pan/push/handheld) AND subject motion AND environment motion, (4) ENDING FRAME description, (5) CAMERA STYLE (handheld/cinematic/drone), (6) STYLE REFERENCE, (7) LIGHTING & COLOR GRADE. Minimum 60 words. No one-liners.",
          ),
      }),
    )
    .min(3)
    .max(8),
  thumbnailPrompts: z
    .array(
      z
        .string()
        .min(500)
        .describe(
          "FULL DETAILED thumbnail prompt, MINIMUM 100 words. MUST start with: '9:16 vertical portrait thumbnail, 1080x1920px, high-impact, for YouTube Shorts / Instagram Reels'. Then include ALL of: (1) LAYOUT CONCEPT naming the composition (split/full-bleed/three-part-stack), (2) SUBJECT with extreme close-up face, exact expression, eye detail, clothing, (3) BACKGROUND color/gradient/pattern, (4) TEXT OVERLAYS: MAIN HEADLINE with exact 2-5 word text + font style + color + size + stroke/shadow, SUBTEXT placement, any emojis, (5) COLOR PALETTE 3 specific hex colors, (6) LIGHTING on subject with rim light/dramatic shadows/catchlights, (7) STYLE reference, (8) end with '--ar 9:16 --style raw --v 6.1 --q 2'. Minimum 100 words. Be brutally specific — this determines click-through rate.",
        ),
    )
    .length(3)
    .describe(
      "EXACTLY 3 thumbnail prompts. Each is a FULL 100-180 word detailed image-gen prompt for a 9:16 portrait YouTube Shorts / Reels thumbnail. Each must have radically different composition and layout from the others. Thumbnails are the most important CTR asset — treat each one as a complete creative brief.",
    ),
  caption: z.string(),
  hashtags: z.array(z.string()).min(8).max(15),
  sources: z
    .array(
      z.object({
        claim: z.string(),
        url: z.string(),
        publisher: z.string().optional(),
      }),
    )
    .describe("Every factual claim must be backed by a real URL returned from search. Empty array is OK for pure how-to/hypothetical content."),
});

type ContentPack = z.infer<typeof ContentPackSchema>;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        const threadId = body.threadId;
        if (!Array.isArray(messages)) {
          return new Response("Messages required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const auth = request.headers.get("authorization") ?? "";
        const supaUrl = process.env.SUPABASE_URL!;
        const supaKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        const supabase = createClient(supaUrl, supaKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: userRes } = await supabase.auth.getUser(token);
        const userId = userRes?.user?.id;
        if (!userId) return new Response("Unauthorized", { status: 401 });

        // Load thread context_brief + active preset
        let contextBrief: string | null = null;
        if (threadId) {
          const { data: t } = await supabase
            .from("threads")
            .select("context_brief")
            .eq("id", threadId)
            .maybeSingle();
          contextBrief = (t?.context_brief as string | null) ?? null;
        }
        const { data: activePreset } = await supabase
          .from("presets")
          .select("name, niche, audience, tone, language, default_voice_id, default_voice_name")
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle();

        let system = MASTER_SYSTEM_PROMPT;
        if (contextBrief) {
          system += `\n\nLOCKED BRIEF for this chat (every output must serve this): "${contextBrief}". Do not drift.`;
        }
        if (activePreset) {
          system += `\n\nACTIVE PRESET "${activePreset.name}":`;
          if (activePreset.niche) system += `\n- Niche: ${activePreset.niche}`;
          if (activePreset.audience) system += `\n- Audience: ${activePreset.audience}`;
          if (activePreset.tone) system += `\n- Tone: ${activePreset.tone}`;
          if (activePreset.language) system += `\n- Language: ${activePreset.language}`;
          if (activePreset.default_voice_name) {
            system += `\n- Default ElevenLabs voice: ${activePreset.default_voice_name}${activePreset.default_voice_id ? ` (${activePreset.default_voice_id})` : ""}`;
          }
        }

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const firecrawlKey = process.env.FIRECRAWL_API_KEY;

        // Collect sources gathered by tool calls across this turn (for the validator)
        const collectedSources: Array<{ title: string; url: string; snippet: string }> = [];

        const tools = {
          search_trending_topics: tool({
            description:
              "Search the web for fresh, sourceable facts and trending stories. ALWAYS call before generating a content pack with any real-world claims. Returns 5-10 results with titles, URLs, snippets.",
            inputSchema: z.object({
              query: z.string().describe("Focused search query"),
            }),
            execute: async ({ query }) => {
              if (!firecrawlKey) {
                return { error: "Firecrawl not connected. Ask user to connect Firecrawl." };
              }
              try {
                const res = await fetch("https://api.firecrawl.dev/v2/search", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${firecrawlKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ query, limit: 8, tbs: "qdr:m" }),
                });
                if (!res.ok) {
                  const t = await res.text();
                  return { error: `Search failed: ${res.status} ${t.slice(0, 200)}` };
                }
                const data = (await res.json()) as {
                  data?: { web?: Array<{ url: string; title: string; description?: string }> };
                };
                const items = data?.data?.web ?? [];
                const results = items.slice(0, 10).map((r) => ({
                  title: r.title,
                  url: r.url,
                  snippet: r.description ?? "",
                }));
                results.forEach((r) => collectedSources.push(r));
                return { results };
              } catch (e) {
                return { error: e instanceof Error ? e.message : "Search failed" };
              }
            },
          }),
          generate_content_pack: tool({
            description:
              "Generate a structured, AI-ready content pack: ElevenLabs voiceover, beat-by-beat 9:16 portrait image AND video prompts (each 80+ words), 3 detailed 9:16 thumbnail prompts (each 100+ words), caption, hashtags, and verified sources. Use for EVERY final output. All visual prompts MUST be portrait/vertical/9:16 for Shorts & Reels.",
            inputSchema: ContentPackSchema,
            execute: async (rawInput) => {
              const input = rawInput as ContentPack;

              // ===== VALIDATION LAYER =====
              let sanitized: ContentPack = input;
              try {
                const validatorSchema = ContentPackSchema;
                const sourcePool = collectedSources
                  .map((s, i) => `[${i + 1}] ${s.title} — ${s.url}\n${s.snippet}`)
                  .join("\n\n");
                const { text: validatedJson } = await generateText({
                  model,
                  system: `You are a strict fact validator for a content pack. Given a draft content pack and a pool of source URLs+snippets, you must:
1. For every factual claim (numbers, dates, names of real companies/founders, funding amounts, rankings, quotes), check if the source pool supports it.
2. If a claim is NOT supported, rewrite the sentence to be generic / opinion / hypothetical, OR remove it. Never invent a source.
3. Only keep entries in "sources" that exactly match a URL from the pool.
4. Preserve voice, tone, length. Never add new factual claims.
5. IMPORTANT: Do NOT shorten or modify imagePrompt, videoPrompt, or thumbnailPrompts fields — preserve them exactly as-is.
6. Output ONLY valid JSON matching the same schema as the input. No markdown, no commentary.`,
                  prompt: `SOURCE POOL:\n${sourcePool || "(no sources collected)"}\n\nDRAFT PACK:\n${JSON.stringify(input)}\n\nReturn the sanitized pack as JSON.`,
                });
                const jsonStr = validatedJson
                  .trim()
                  .replace(/^```json\s*/i, "")
                  .replace(/^```\s*/i, "")
                  .replace(/```$/i, "")
                  .trim();
                const parsed = validatorSchema.safeParse(JSON.parse(jsonStr));
                if (parsed.success) {
                  sanitized = parsed.data as ContentPack;
                  // Final hard filter: sources must be from pool
                  const allowedUrls = new Set(collectedSources.map((s) => s.url));
                  if (allowedUrls.size > 0) {
                    sanitized.sources = sanitized.sources.filter((s) => allowedUrls.has(s.url));
                  }
                }
              } catch (e) {
                console.error("validator failed, using raw draft", e);
              }

              const { error } = await supabase.from("scripts").insert({
                user_id: userId,
                thread_id: threadId ?? null,
                topic: sanitized.topic,
                data: sanitized,
              });
              if (error) console.error("pack save failed", error);
              return { saved: !error, ...sanitized };
            },
          }),
        };

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(messages as UIMessage[]),
          tools,
          stopWhen: stepCountIs(50),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
          onFinish: async ({ messages: finalMessages }) => {
            if (!threadId) return;
            try {
              const lastUser = [...finalMessages].reverse().find((m) => m.role === "user");
              const lastAssistant = finalMessages[finalMessages.length - 1];
              const toInsert: Array<{
                thread_id: string;
                user_id: string;
                role: string;
                parts: unknown;
              }> = [];
              if (lastUser) {
                toInsert.push({
                  thread_id: threadId,
                  user_id: userId,
                  role: "user",
                  parts: lastUser.parts,
                });
              }
              if (lastAssistant && lastAssistant.role === "assistant") {
                toInsert.push({
                  thread_id: threadId,
                  user_id: userId,
                  role: "assistant",
                  parts: lastAssistant.parts,
                });
              }
              if (toInsert.length) {
                await supabase.from("messages").insert(toInsert);
                await supabase
                  .from("threads")
                  .update({ updated_at: new Date().toISOString() })
                  .eq("id", threadId);
              }
            } catch (e) {
              console.error("persist failed", e);
            }
          },
        });
      },
    },
  },
});
