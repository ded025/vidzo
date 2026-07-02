import { createFileRoute } from "@tanstack/react-router";
import {
  compileForEndpoint,
  handleHiggsfieldApiError,
  jsonOk,
  readHiggsfieldInput,
} from "@/lib/higgsfield-api.server";

export const Route = createFileRoute("/api/compiler")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const input = await readHiggsfieldInput(request);
          return jsonOk(compileForEndpoint(input));
        } catch (error) {
          return handleHiggsfieldApiError(error);
        }
      },
    },
  },
});
