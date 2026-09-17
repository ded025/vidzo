import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "./about";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact · Vidzo" },
      { name: "description", content: "Get in touch with the Vidzo team." },
      { property: "og:title", content: "Contact · Vidzo" },
      { property: "og:description", content: "Get in touch with the Vidzo team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <PageShell title="Contact us">
      <p>
        We'd love to hear from you — feedback, feature requests, partnerships, press, or just saying
        hi.
      </p>
      <h2>Email</h2>
      <p>
        General + support: <a href="mailto:support@vidzo.in">support@vidzo.in</a>
      </p>
      <h2>Response time</h2>
      <p>
        We reply to most messages within one business day. For account issues, please write from the
        email you signed up with so we can help faster.
      </p>
    </PageShell>
  );
}
