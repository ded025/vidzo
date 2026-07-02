import { createFileRoute } from "@tanstack/react-router";
import {
  CAMERA_PRESETS,
  classifyPrompt,
  detectIntent,
  selectCamera,
} from "@/lib/higgsfield-prompt-engine";
import { handleHiggsfieldApiError, jsonOk, readHiggsfieldInput } from "@/lib/higgsfield-api.server";

export const Route = createFileRoute("/api/camera")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const input = await readHiggsfieldInput(request);
          const intelligence = classifyPrompt(input);
          const intent = detectIntent(input, intelligence);
          return jsonOk({
            camera: selectCamera(input, intelligence, intent),
            presets: CAMERA_PRESETS,
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
