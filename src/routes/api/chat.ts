import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from "ai";
import { checkAndConsume } from "@/lib/credits.server";
import { finalizeContentPack, type ContentPackData } from "@/lib/content-pack";
import { checkContentEngine, generateContentPack } from "@/lib/openai.server";
import {
  buildPromptEngineInput,
  shouldUseWebResearch,
  type PromptPreset,
} from "@/lib/prompt-engine.server";
import { resolveReferenceAssets } from "@/lib/reference-assets.server";

type ChatRequestBody = { messages?: unknown; threadId?: string };

const jsonHeaders = { "Content-Type": "application/json" };

function jsonError(message: string, status: number, code: string, detail?: string) {
  return Response.json({ error: message, code, detail }, { status, headers: jsonHeaders });
}

function chatStreamErrorMessage(error: unknown) {
  console.error("[chat] generation failed:", error);
  const message = error instanceof Error ? error.message : String(error ?? "Unknown chat error");
  if (/api key|authentication|unauthorized|401|invalid_api_key/i.test(message)) {
    return "Gemini rejected the request. Check GEMINI_API_KEY in Supabase Edge Function secrets.";
  }
  if (/model|not found|does not exist|404/i.test(message)) {
    return "The selected Gemini model is unavailable. Check GEMINI_MODEL in Supabase secrets.";
  }
  if (/rate|quota|billing|429|insufficient/i.test(message)) {
    return "Gemini is rate-limited or out of quota. Check billing and retry.";
  }
  return message || "Chat failed while generating the content pack. Please retry.";
}

function sanitiseMessages(raw: unknown[]): UIMessage[] {
  const validRoles = new Set(["user", "assistant", "system"]);
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
    );
}

function getMessageText(message: UIMessage | undefined) {
  return (
    message?.parts
      .filter((part): part is Extract<(typeof message.parts)[number], { type: "text" }> => {
        return part.type === "text";
      })
      .map((part) => part.text)
      .join("\n")
      .trim() ?? ""
  );
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authorization = request.headers.get("authorization") ?? "";
        const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
        if (!token) return jsonError("Sign in to check the content engine.", 401, "UNAUTHORIZED");
        try {
          const health = await checkContentEngine({ token, signal: request.signal });
          return Response.json(health, { headers: jsonHeaders });
        } catch (error) {
          return jsonError(
            error instanceof Error ? error.message : "Content engine health check failed.",
            503,
            "CONTENT_ENGINE_UNAVAILABLE",
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

        if (!Array.isArray(body.messages)) {
          return jsonError("messages must be an array.", 400, "BAD_REQUEST");
        }
        const messages = sanitiseMessages(body.messages);
        const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
        const userRequest = getMessageText(lastUserMessage);
        if (!userRequest) {
          return jsonError("A prompt is required.", 400, "BAD_REQUEST");
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

        const threadId = body.threadId;
        const threadPromise = threadId
          ? supabase.from("threads").select("context_brief").eq("id", threadId).maybeSingle()
          : Promise.resolve({ data: null });
        const presetPromise = supabase
          .from("presets")
          .select("name, niche, audience, tone, language, default_voice_id, default_voice_name")
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle();
        const latestPackPromise = threadId
          ? supabase
              .from("scripts")
              .select("data")
              .eq("thread_id", threadId)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null });
        const [threadResult, presetResult, latestPackResult] = await Promise.all([
          threadPromise,
          presetPromise,
          latestPackPromise,
        ]);
        const currentPack = (latestPackResult.data as { data?: unknown } | null)?.data ?? null;
        const isTweak = Boolean(currentPack);

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

        const lockedBrief =
          (threadResult.data as { context_brief?: string | null } | null)?.context_brief ?? null;
        const preset = (presetResult.data as PromptPreset | null) ?? null;
        const research = shouldUseWebResearch(userRequest, lockedBrief);
        const promptInput = buildPromptEngineInput({
          userRequest,
          lockedBrief,
          preset,
          currentPack,
          research,
        });
        const toolCallId = randomUUID();

        const stream = createUIMessageStream({
          originalMessages: messages,
          onError: chatStreamErrorMessage,
          execute: async ({ writer }) => {
            writer.write({ type: "start" });
            writer.write({ type: "start-step" });
            writer.write({
              type: "tool-input-start",
              toolCallId,
              toolName: "generate_content_pack",
              providerExecuted: true,
              title: "Building a 9:16 content pack",
            });
            writer.write({
              type: "tool-input-available",
              toolCallId,
              toolName: "generate_content_pack",
              providerExecuted: true,
              input: {
                prompt: userRequest,
                mode: currentPack ? "revision" : "new",
                research: research ? "one web search allowed" : "no web search",
                requests: 1,
              },
            });

            try {
              const generated = await generateContentPack({
                input: promptInput,
                research,
                token,
                signal: request.signal,
              });
              const preliminaryPack = finalizeContentPack(generated.pack, generated.generation, []);
              writer.write({
                type: "tool-output-available",
                toolCallId,
                output: preliminaryPack,
                providerExecuted: true,
                preliminary: true,
              });

              const referenceAssets = await resolveReferenceAssets({
                supabase,
                userId,
                pack: generated.pack,
                userRequest,
              });
              const finalPack: ContentPackData = finalizeContentPack(
                generated.pack,
                generated.generation,
                referenceAssets,
              );
              const { error: saveError } = await supabase.from("scripts").insert({
                user_id: userId,
                thread_id: threadId ?? null,
                topic: finalPack.topic,
                data: finalPack,
              });
              if (saveError) console.error("[chat] content pack save failed:", saveError);

              writer.write({
                type: "tool-output-available",
                toolCallId,
                output: finalPack,
                providerExecuted: true,
              });
              writer.write({ type: "finish-step" });
              writer.write({
                type: "finish",
                finishReason: "stop",
                messageMetadata: {
                  requestCount: 1,
                  latencyMs: finalPack.generation.latencyMs,
                },
              });
            } catch (error) {
              writer.write({
                type: "tool-output-error",
                toolCallId,
                errorText: chatStreamErrorMessage(error),
                providerExecuted: true,
              });
              writer.write({ type: "finish-step" });
              writer.write({ type: "finish", finishReason: "error" });
            }
          },
          onFinish: async ({ responseMessage }) => {
            if (!threadId) return;
            try {
              const rows = [
                {
                  thread_id: threadId,
                  user_id: userId,
                  role: "user",
                  parts: lastUserMessage?.parts ?? [{ type: "text", text: userRequest }],
                },
                {
                  thread_id: threadId,
                  user_id: userId,
                  role: "assistant",
                  parts: responseMessage.parts,
                },
              ];
              await Promise.all([
                supabase.from("messages").insert(rows),
                supabase
                  .from("threads")
                  .update({ updated_at: new Date().toISOString() })
                  .eq("id", threadId),
              ]);
            } catch (error) {
              console.error("[chat] persistence failed:", error);
            }
          },
        });

        return createUIMessageStreamResponse({ stream });
      },
    },
  },
});
