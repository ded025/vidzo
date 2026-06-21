import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import {
  convertToModelMessages,
  generateText,
  Output,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { checkAndConsume } from "@/lib/credits.server";
import { checkOpenAIConnection, searchWebWithOpenAI } from "@/lib/openai.server";
import { MASTER_SYSTEM_PROMPT } from "@/lib/prompts";

type ChatRequestBody = { messages?: unknown; threadId?: string };

const jsonHeaders = { "Content-Type": "application/json" };

function jsonError(message: string, status: number, code: string, detail?: string) {
  return Response.json({ error: message, code, detail }, { status, headers: jsonHeaders });
}

function chatStreamErrorMessage(error: unknown) {
  console.error("[chat] stream failed:", error);
  const message = error instanceof Error ? error.message : String(error ?? "Unknown chat error");
  if (/api key|authentication|unauthorized|401|invalid_api_key/i.test(message)) {
    return "OpenAI rejected the request. Check the server-side OpenAI key.";
  }
  if (/model|not found|does not exist|404/i.test(message)) {
    return "The selected OpenAI model is unavailable. Check OPENAI_MODEL.";
  }
  if (/rate|quota|billing|429|insufficient/i.test(message)) {
    return "OpenAI is rate-limited or out of quota. Check billing and retry.";
  }
  return "Chat failed while generating the reply. Please retry in a moment.";
}

const ContentPackSchema = z.object({
  topic: z.string(),
  niche: z.string().nullable(),
  format: z.string().nullable(),
  whyViral: z.string(),
  script: z.object({
    dialogue: z
      .string()
      .describe("Clean voiceover text with no inline timestamps or stage directions."),
    voiceDirection: z.string().describe("Tone, pace, emotion, and pauses."),
    suggestedElevenLabsVoice: z
      .object({
        name: z.string().nullable(),
        voiceId: z.string().nullable(),
      })
      .nullable(),
  }),
  visuals: z
    .array(
      z.object({
        beat: z.string(),
        onScreenText: z.string().nullable(),
        imagePrompt: z.string().min(300),
        videoPrompt: z.string().min(200),
      }),
    )
    .min(3)
    .max(8),
  thumbnailPrompts: z.array(z.string().min(500)).length(3),
  caption: z.string(),
  hashtags: z.array(z.string()).min(8).max(15),
  sources: z.array(
    z.object({
      claim: z.string(),
      url: z.string(),
      publisher: z.string().nullable(),
    }),
  ),
});

type ContentPack = z.infer<typeof ContentPackSchema>;

function sanitiseMessages(raw: unknown[]): UIMessage[] {
  const validRoles = new Set(["user", "assistant", "system", "tool"]);

  return raw
    .filter((message): message is Record<string, unknown> => {
      return Boolean(message) && typeof message === "object" && !Array.isArray(message);
    })
    .filter((message) => validRoles.has(message.role as string))
    .map(
      (message) =>
        ({
          ...message,
          role: message.role as UIMessage["role"],
          parts: Array.isArray(message.parts) ? message.parts : [],
        }) as UIMessage,
    )
    .filter((message) => {
      if (message.role !== "assistant") return true;
      const parts = message.parts as Array<{ type: string }>;
      if (parts.length === 0) return false;
      return parts.some((part) => part.type !== "tool-invocation");
    });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      GET: async () => {
        const apiKey = process.env.OPENAI_API_KEY?.trim();
        if (!apiKey) {
          return jsonError(
            "OpenAI is not configured on this server.",
            503,
            "OPENAI_NOT_CONFIGURED",
          );
        }

        try {
          const connection = await checkOpenAIConnection();
          return Response.json(
            { status: "ok", provider: "openai", model: connection.model },
            { headers: jsonHeaders },
          );
        } catch (error) {
          console.error("[chat-health] OpenAI probe failed:", error);
          return jsonError(
            "OpenAI health check failed. Verify the hosted secret and model access.",
            502,
            "OPENAI_HEALTH_FAILED",
          );
        }
      },

      POST: async ({ request }) => {
        let body: ChatRequestBody;
        try {
          body = (await request.json()) as ChatRequestBody;
        } catch {
          return jsonError("Invalid JSON body.", 400, "BAD_REQUEST");
        }

        const rawMessages = body.messages;
        const threadId = body.threadId;
        if (!Array.isArray(rawMessages)) {
          return jsonError("messages must be an array.", 400, "BAD_REQUEST");
        }

        const messages = sanitiseMessages(rawMessages);
        if (messages.length === 0 && rawMessages.length > 0) {
          return jsonError("No valid messages were provided.", 400, "BAD_REQUEST");
        }

        const openaiKey = process.env.OPENAI_API_KEY?.trim();
        if (!openaiKey) {
          return jsonError(
            "Chat is not connected to OpenAI. Add OPENAI_API_KEY to server secrets.",
            503,
            "OPENAI_NOT_CONFIGURED",
          );
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
          return jsonError(
            "Supabase is not configured on this server.",
            503,
            "SUPABASE_NOT_CONFIGURED",
          );
        }

        const authorization = request.headers.get("authorization") ?? "";
        const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
        const supabase = createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: userResult } = await supabase.auth.getUser(token);
        const userId = userResult?.user?.id;
        if (!userId) {
          return jsonError("Your session expired. Sign in again.", 401, "UNAUTHORIZED");
        }

        const existingUserMessages = messages.filter((message) => message.role === "user");
        const isTweak = existingUserMessages.length > 1;
        const creditResult = await checkAndConsume(
          supabase,
          userId,
          token,
          threadId ?? null,
          isTweak ? "tweak" : "script",
        );

        if (!creditResult.allowed) {
          const noScripts = creditResult.reason === "no_scripts";
          return Response.json(
            {
              creditError: true,
              type: noScripts ? "no_scripts" : "no_tweaks",
              message: noScripts
                ? "You've used all 5 free scripts. Top up credits to keep creating."
                : "You've used all 3 free tweaks for this script. Start a new chat or top up credits.",
              tweakCount: creditResult.tweakCount,
            },
            { status: 402, headers: jsonHeaders },
          );
        }

        let contextBrief: string | null = null;
        if (threadId) {
          const { data: thread } = await supabase
            .from("threads")
            .select("context_brief")
            .eq("id", threadId)
            .maybeSingle();
          contextBrief = (thread?.context_brief as string | null) ?? null;
        }

        const { data: activePreset } = await supabase
          .from("presets")
          .select("name, niche, audience, tone, language, default_voice_id, default_voice_name")
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle();

        let system = MASTER_SYSTEM_PROMPT;
        if (contextBrief) {
          system += `\n\nLOCKED BRIEF: "${contextBrief}". Every output must serve this brief.`;
        }
        if (activePreset) {
          system += `\n\nACTIVE PRESET "${activePreset.name}":`;
          if (activePreset.niche) system += `\n- Niche: ${activePreset.niche}`;
          if (activePreset.audience) system += `\n- Audience: ${activePreset.audience}`;
          if (activePreset.tone) system += `\n- Tone: ${activePreset.tone}`;
          if (activePreset.language) system += `\n- Language: ${activePreset.language}`;
          if (activePreset.default_voice_name) {
            system += `\n- Voice: ${activePreset.default_voice_name}${
              activePreset.default_voice_id ? ` (${activePreset.default_voice_id})` : ""
            }`;
          }
        }

        const openai = createOpenAI({ apiKey: openaiKey });
        const model = openai.responses(process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini");
        const collectedSources: Array<{ title: string; url: string; snippet: string }> = [];

        const tools = {
          search_trending_topics: tool({
            description:
              "Search current web sources before making real-world factual claims. Returns cited titles, URLs, and snippets.",
            inputSchema: z.object({ query: z.string().describe("A focused web search query.") }),
            execute: async ({ query }) => {
              try {
                const results = await searchWebWithOpenAI(query);
                results.forEach((result) => collectedSources.push(result));
                return { results };
              } catch (error) {
                return { error: error instanceof Error ? error.message : "Search failed" };
              }
            },
          }),

          generate_content_pack: tool({
            description:
              "Return the complete structured Vidzo content pack after any required research.",
            inputSchema: ContentPackSchema,
            execute: async (rawInput) => {
              try {
                const input = rawInput as ContentPack;
                let sanitized = input;

                try {
                  const sourcePool = collectedSources
                    .map(
                      (source, index) =>
                        `[${index + 1}] ${source.title} — ${source.url}\n${source.snippet}`,
                    )
                    .join("\n\n");
                  const { output } = await generateText({
                    model,
                    output: Output.object({ schema: ContentPackSchema }),
                    system:
                      "Validate the draft against the source pool. Remove or generalize unsupported factual claims. Preserve language, tone, and production prompts.",
                    prompt: `SOURCE POOL:\n${sourcePool || "(no sources collected)"}\n\nDRAFT PACK:\n${JSON.stringify(input)}`,
                  });

                  if (output) {
                    sanitized = output as ContentPack;
                    const allowedUrls = new Set(collectedSources.map((source) => source.url));
                    sanitized.sources =
                      allowedUrls.size > 0
                        ? sanitized.sources.filter((source) => allowedUrls.has(source.url))
                        : [];
                  }
                } catch (error) {
                  console.error("[chat] validator failed; using the generated draft:", error);
                }

                const { error: saveError } = await supabase.from("scripts").insert({
                  user_id: userId,
                  thread_id: threadId ?? null,
                  topic: sanitized.topic,
                  data: sanitized,
                });
                if (saveError) console.error("[chat] content pack save failed:", saveError);

                return { saved: !saveError, ...sanitized };
              } catch (error) {
                console.error("[chat] generate_content_pack failed:", error);
                return {
                  saved: false,
                  error: error instanceof Error ? error.message : "Content pack generation failed",
                };
              }
            },
          }),
        };

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(messages),
          tools,
          stopWhen: stepCountIs(12),
          abortSignal: request.signal,
          onError: ({ error }) => {
            console.error("[chat] OpenAI stream failed:", error);
          },
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onError: chatStreamErrorMessage,
          onFinish: async ({ messages: finalMessages }) => {
            if (!threadId) return;
            try {
              const lastUser = [...finalMessages]
                .reverse()
                .find((message) => message.role === "user");
              const lastAssistant = finalMessages[finalMessages.length - 1];
              const rows: Array<{
                thread_id: string;
                user_id: string;
                role: string;
                parts: unknown;
              }> = [];

              if (lastUser) {
                rows.push({
                  thread_id: threadId,
                  user_id: userId,
                  role: "user",
                  parts: lastUser.parts,
                });
              }
              if (lastAssistant?.role === "assistant") {
                rows.push({
                  thread_id: threadId,
                  user_id: userId,
                  role: "assistant",
                  parts: lastAssistant.parts,
                });
              }

              if (rows.length > 0) {
                await supabase.from("messages").insert(rows);
                await supabase
                  .from("threads")
                  .update({ updated_at: new Date().toISOString() })
                  .eq("id", threadId);
              }
            } catch (error) {
              console.error("[chat] persistence failed:", error);
            }
          },
        });
      },
    },
  },
});
