import { createFileRoute } from "@tanstack/react-router";
import {
  compileForEndpoint,
  handleHiggsfieldApiError,
  jsonOk,
  readHiggsfieldInput,
  saveHiggsfieldRender,
} from "@/lib/higgsfield-api.server";

export const Route = createFileRoute("/api/render")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const input = await readHiggsfieldInput(request);
          const result = compileForEndpoint(input);
          const renderHistory = await saveHiggsfieldRender(request, result);
          return jsonOk({
            status: "prompt_ready",
            render_history: renderHistory,
            result,
          });
        } catch (error) {
          return handleHiggsfieldApiError(error);
        }
      },
    },
  },
});
