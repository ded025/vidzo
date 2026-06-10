import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "./about";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · Vidzo" },
      { name: "description", content: "How Vidzo handles your data." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <PageShell title="Privacy Policy">
      <p>Last updated: June 2026.</p>
      <p>
        We respect your privacy. This page explains what data Vidzo collects and how we use it.
      </p>
      <h2>What we collect</h2>
      <p>
        Account info you provide (email, name), the briefs and prompts you submit, the content
        packs we generate for you, and basic usage telemetry (page views, error logs).
      </p>
      <h2>How we use it</h2>
      <p>
        To run the service, save your generations and presets, improve quality, and contact you
        about your account. We do not sell your personal information.
      </p>
      <h2>Third-party services</h2>
      <p>
        We use trusted infrastructure providers for authentication, database storage, AI inference,
        and web search. These providers process data only on our behalf.
      </p>
      <h2>Your choices</h2>
      <p>
        You can delete your chats, generations, and account at any time from inside the app or by
        emailing <a href="mailto:support@vidzo.in">support@vidzo.in</a>.
      </p>
      <h2>Contact</h2>
      <p>
        Privacy questions? Email <a href="mailto:support@vidzo.in">support@vidzo.in</a>.
      </p>
    </PageShell>
  );
}
