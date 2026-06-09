import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { MASTER_SYSTEM_PROMPT } from "@/lib/prompts";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

type ChatRequestBody = { messages?: unknown; threadId?: string };

const ScriptSchema = z.object({
  topic: z.string().describe("Topic name in English or Hinglish"),
  whyViral: z.string().describe("2-line explanation in English of why this can go viral"),
  script: z.string().describe("Full 30-40 second Hinglish script (~80-110 words). Multi-line, story style."),
  visualDirection: z.array(z.string()).describe("Shot-by-shot visual directions, 4-7 entries"),
  onScreenText: z.array(z.string()).describe("Short punchy text overlays, 4-7 entries"),
  voiceoverStyle: z.string().describe("Pace, emotion, pauses in 1-2 sentences"),
  thumbnailOptions: z.array(z.string()).length(3).describe("Three thumbnail/first-frame text options in Hinglish"),
  caption: z.string().describe("One short Instagram/YouTube caption"),
  hashtags: z.array(z.string()).min(8).max(12).describe("8-12 hashtags including #"),
  sourcesToVerify: z.array(z.string()).optional().describe("Facts/numbers that need verification"),
});

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

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const firecrawlKey = process.env.FIRECRAWL_API_KEY;

        const tools = {
          search_trending_topics: tool({
            description:
              "Search the web for trending startup, founder, funding, D2C, Shark Tank India, AI, or business stories. Use a focused query like 'Indian startup funding this week' or 'D2C viral brand 2025'. Returns 5-10 fresh results with titles, URLs, and snippets.",
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
                  body: JSON.stringify({
                    query,
                    limit: 8,
                    tbs: "qdr:m",
                  }),
                });
                if (!res.ok) {
                  const t = await res.text();
                  return { error: `Search failed: ${res.status} ${t.slice(0, 200)}` };
                }
                const data = (await res.json()) as {
                  data?: { web?: Array<{ url: string; title: string; description?: string }> };
                };
                const items = data?.data?.web ?? [];
                return {
                  results: items.slice(0, 10).map((r) => ({
                    title: r.title,
                    url: r.url,
                    snippet: r.description ?? "",
                  })),
                };
              } catch (e) {
                return { error: e instanceof Error ? e.message : "Search failed" };
              }
            },
          }),
          generate_script: tool({
            description:
              "Generate a structured 30-40 second Hinglish YouTube Shorts script. Use this for EVERY final script — never write the script as free text. The saved script goes into the user's library automatically.",
            inputSchema: ScriptSchema,
            execute: async (input) => {
              const { error } = await supabase.from("scripts").insert({
                user_id: userId,
                thread_id: threadId ?? null,
                topic: input.topic,
                data: input,
              });
              if (error) console.error("script save failed", error);
              return { saved: !error, ...input };
            },
          }),
        };

        const result = streamText({
          model,
          system: MASTER_SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages as UIMessage[]),
          tools,
          stopWhen: stepCountIs(50),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
          onFinish: async ({ messages: finalMessages }) => {
            if (!threadId) return;
            try {
              // Persist only new user + assistant messages from this turn
              const lastUser = [...finalMessages]
                .reverse()
                .find((m) => m.role === "user");
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
                // Avoid duplicating the user msg if it was already persisted (we always append both fresh from this turn)
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
