import { createFileRoute } from "@tanstack/react-router";
import {
  DEFAULT_PERSONAS,
  classifyPrompt,
  detectIntent,
  selectPersona,
} from "@/lib/higgsfield-prompt-engine";
import { handleHiggsfieldApiError, jsonOk, readHiggsfieldInput } from "@/lib/higgsfield-api.server";

export const Route = createFileRoute("/api/persona")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const input = await readHiggsfieldInput(request);
          const intelligence = classifyPrompt(input);
          const intent = detectIntent(input, intelligence);
          return jsonOk({
            persona: selectPersona(input, intelligence, intent),
            personas: DEFAULT_PERSONAS,
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
