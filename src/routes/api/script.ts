import { createFileRoute } from "@tanstack/react-router";
import {
  classifyPrompt,
  detectIntent,
  generateHooks,
  generateMultiDurationScripts,
  generateScript,
  selectPersona,
} from "@/lib/higgsfield-prompt-engine";
import { handleHiggsfieldApiError, jsonOk, readHiggsfieldInput } from "@/lib/higgsfield-api.server";

export const Route = createFileRoute("/api/script")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const input = await readHiggsfieldInput(request);
          const intelligence = classifyPrompt(input);
          const intent = detectIntent(input, intelligence);
          const persona = selectPersona(input, intelligence, intent);
          const hooks = generateHooks(input, intelligence, intent);
          return jsonOk({
            script: generateScript(input, {
              intelligence,
              intent,
              persona,
              hook: hooks[0],
            }),
            scripts: generateMultiDurationScripts(input, intelligence, intent),
            hooks,
            persona,
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
