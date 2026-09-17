import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
  head: () => ({ meta: [
    { title: "Sign In · Vidzo" },
    { name: "description", content: "Sign in to your Vidzo production workspace." },
    { property: "og:title", content: "Sign In · Vidzo" },
    { property: "og:description", content: "Access your Vidzo production workspace." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});
