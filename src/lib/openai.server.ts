import OpenAI from "openai";

const HEALTH_CACHE_MS = 60_000;
let healthCheckedAt = 0;
let healthCheckPromise: Promise<{ model: string }> | null = null;

export function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return {
    apiKey,
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
  };
}

export async function checkOpenAIConnection() {
  const now = Date.now();
  if (healthCheckPromise && now - healthCheckedAt < HEALTH_CACHE_MS) {
    return healthCheckPromise;
  }

  healthCheckedAt = now;
  healthCheckPromise = (async () => {
    const { apiKey, model } = getOpenAIConfig();
    const client = new OpenAI({ apiKey });
    const availableModel = await client.models.retrieve(model);
    return { model: availableModel.id };
  })();

  try {
    return await healthCheckPromise;
  } catch (error) {
    healthCheckPromise = null;
    healthCheckedAt = 0;
    throw error;
  }
}

export async function searchWebWithOpenAI(query: string) {
  const { apiKey, model } = getOpenAIConfig();
  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model,
    tools: [{ type: "web_search" }],
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Search the web for current, reliable information about: ${query}. Prefer primary and reputable sources. Return concise findings with URL citations.`,
          },
        ],
      },
    ],
  });

  const sources = new Map<string, { title: string; url: string; snippet: string }>();
  for (const item of response.output) {
    if (item.type !== "message") continue;
    for (const content of item.content) {
      if (content.type !== "output_text") continue;
      for (const annotation of content.annotations ?? []) {
        if (annotation.type !== "url_citation" || !annotation.url) continue;
        sources.set(annotation.url, {
          title: annotation.title || new URL(annotation.url).hostname,
          url: annotation.url,
          snippet: content.text.slice(0, 700),
        });
      }
    }
  }

  return Array.from(sources.values()).slice(0, 10);
}
