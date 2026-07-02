import { createFileRoute } from "@tanstack/react-router";
import { classifyPrompt, detectIntent, generateHooks } from "@/lib/higgsfield-prompt-engine";
import { handleHiggsfieldApiError, jsonOk, readHiggsfieldInput } from "@/lib/higgsfield-api.server";

export const Route = createFileRoute("/api/hooks")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const input = await readHiggsfieldInput(request);
          const intelligence = classifyPrompt(input);
          const intent = detectIntent(input, intelligence);
          return jsonOk({
            hooks: generateHooks(input, intelligence, intent),
            intent,
            intelligence,
          });
        } catch (error) {
          return handleHiggsfieldApiError(error);
        }
      },
    },
  },
});
