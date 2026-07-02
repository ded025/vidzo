import { createFileRoute } from "@tanstack/react-router";
import {
  analyzeBrief,
  buildContentStrategy,
  classifyPrompt,
  detectIntent,
} from "@/lib/higgsfield-prompt-engine";
import { handleHiggsfieldApiError, jsonOk, readHiggsfieldInput } from "@/lib/higgsfield-api.server";

export const Route = createFileRoute("/api/intelligence")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const input = await readHiggsfieldInput(request);
          const intelligence = classifyPrompt(input);
          const intent = detectIntent(input, intelligence);
          return jsonOk({
            intelligence,
            brief_intelligence: analyzeBrief(input),
            content_strategy: buildContentStrategy(input, intelligence, intent),
            intent,
          });
        } catch (error) {
          return handleHiggsfieldApiError(error);
        }
      },
    },
  },
});
