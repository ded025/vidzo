import { createFileRoute } from "@tanstack/react-router";
import {
  classifyPrompt,
  detectIntent,
  generateMotion,
  selectCamera,
} from "@/lib/higgsfield-prompt-engine";
import { handleHiggsfieldApiError, jsonOk, readHiggsfieldInput } from "@/lib/higgsfield-api.server";

export const Route = createFileRoute("/api/motion")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const input = await readHiggsfieldInput(request);
          const intelligence = classifyPrompt(input);
          const intent = detectIntent(input, intelligence);
          const camera = selectCamera(input, intelligence, intent);
          return jsonOk({
            motion: generateMotion(input, camera, intent),
            camera,
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
