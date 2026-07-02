import { createFileRoute } from "@tanstack/react-router";
import { HiggsfieldPromptEngine } from "@/components/higgsfield-prompt-engine";

export const Route = createFileRoute("/_authenticated/chat/higgsfield")({
  component: HiggsfieldPromptEngine,
});
