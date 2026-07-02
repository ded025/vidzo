import { createFileRoute } from "@tanstack/react-router";
import {
  handleHiggsfieldApiError,
  jsonOk,
  readHiggsfieldInput,
  saveHiggsfieldVariations,
  variationsForEndpoint,
} from "@/lib/higgsfield-api.server";

export const Route = createFileRoute("/api/generate-variations")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const input = await readHiggsfieldInput(request);
          const variations = variationsForEndpoint(input, input.variationCount ?? 20);
          const renderHistory = await saveHiggsfieldVariations(request, input, variations);
          return jsonOk({
            status: "variations_ready",
            render_history: renderHistory,
            variations,
          });
        } catch (error) {
          return handleHiggsfieldApiError(error);
        }
      },
    },
  },
});
