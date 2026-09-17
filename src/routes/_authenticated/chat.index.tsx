import { createFileRoute } from "@tanstack/react-router";
import { CreatePackPanel } from "@/components/create-pack-panel";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatIndex,
  head: () => ({ meta: [
    { title: "New Production · Vidzo" },
    { name: "description", content: "Turn a brief into a complete short-form production pack." },
    { property: "og:title", content: "New Production · Vidzo" },
    { property: "og:description", content: "Start a new Vidzo production." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

function ChatIndex() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent items-center justify-center mb-4 shadow-lg">
            <span className="text-primary-foreground font-black text-lg">V</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            What are we making today?
          </h1>
          <p className="mt-2 text-muted-foreground">
            Drop your brief or upload a file. Pick a format. We build the full pack.
          </p>
        </div>
        <CreatePackPanel autoFocus />
      </div>
    </div>
  );
}
