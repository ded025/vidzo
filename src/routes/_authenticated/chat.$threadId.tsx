import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Production Room · Vidzo" },
    { name: "description", content: "Develop, research, and refine a Vidzo content production." },
    { property: "og:title", content: "Production Room · Vidzo" },
    { property: "og:description", content: "A focused Vidzo production workspace." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});
