import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "./about";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service · Vidzo" },
      { name: "description", content: "The terms governing the use of Vidzo." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <PageShell title="Terms of Service">
      <p>Last updated: June 2026.</p>
      <p>
        By using Vidzo (vidzo.in and related apps) you agree to these terms. If you do not agree,
        please do not use the service.
      </p>
      <h2>Your account</h2>
      <p>
        You are responsible for keeping your login credentials secure and for all activity on your
        account. You must be at least 16 to use Vidzo.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Do not use Vidzo to create content that is illegal, harassing, deceptive, infringing, or
        designed to spread misinformation. We may suspend accounts that violate this.
      </p>
      <h2>Your content</h2>
      <p>
        You own the content packs you generate. By using Vidzo you grant us a limited license to
        store and process your inputs and outputs solely to operate and improve the service.
      </p>
      <h2>AI-generated output</h2>
      <p>
        Vidzo uses AI models and live web sources to produce content packs. We do our best to
        verify factual claims against the sources we cite, but you remain responsible for reviewing
        the output before publishing.
      </p>
      <h2>Service availability</h2>
      <p>Vidzo is provided "as is" without warranties. We may update or change features at any time.</p>
      <h2>Contact</h2>
      <p>
        Questions? Email <a href="mailto:support@vidzo.in">support@vidzo.in</a>.
      </p>
    </PageShell>
  );
}
