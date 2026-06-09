import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { getThreadMessages } from "@/lib/threads.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ScriptCard } from "@/components/script-card";
import { Search, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ThreadView,
});

function ThreadView() {
  const { threadId } = useParams({ from: "/_authenticated/chat/$threadId" });
  const load = useServerFn(getThreadMessages);

  const messagesQ = useQuery({
    queryKey: ["messages", threadId],
    queryFn: () => load({ data: { threadId } }),
  });

  if (messagesQ.isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <ChatWindow
      key={threadId}
      threadId={threadId}
      initialMessages={(messagesQ.data ?? []) as unknown as UIMessage[]}
    />
  );
}

function ChatWindow({
  threadId,
  initialMessages,
}: {
  threadId: string;
  initialMessages: UIMessage[];
}) {
  const [input, setInput] = useState("");
  const [bearer, setBearer] = useState<string | null>(null);
  const sentPending = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setBearer(data.session?.access_token ?? null);
    });
  }, []);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: bearer ? { Authorization: `Bearer ${bearer}` } : undefined,
        body: { threadId },
      }),
    [bearer, threadId],
  );

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
  });

  useEffect(() => {
    if (sentPending.current || !bearer) return;
    const pending = sessionStorage.getItem(`pending:${threadId}`);
    if (pending && messages.length === 0) {
      sentPending.current = true;
      sessionStorage.removeItem(`pending:${threadId}`);
      sendMessage({ text: pending });
    }
  }, [bearer, threadId, messages.length, sendMessage]);

  const handleSubmit = (message: { text?: string }) => {
    const text = (message.text ?? input).trim();
    if (!text) return;
    setInput("");
    sendMessage({ text });
  };

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="h-full flex flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="max-w-3xl mx-auto w-full px-4 py-6">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-16">
              Start typing — search trending topics or paste your own idea.
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent>
                {m.parts.map((part, i) => {
                  if (part.type === "text") {
                    return m.role === "assistant" ? (
                      <MessageResponse key={i}>{part.text}</MessageResponse>
                    ) : (
                      <div key={i} className="whitespace-pre-wrap">{part.text}</div>
                    );
                  }
                  // Tool parts: AI SDK v6 uses `tool-<name>` part types
                  if (part.type === "tool-search_trending_topics") {
                    const p = part as unknown as {
                      state: string;
                      input?: { query?: string };
                      output?: { results?: Array<{ title: string; url: string; snippet: string }>; error?: string };
                    };
                    return (
                      <div key={i} className="rounded-lg border border-border bg-secondary/40 p-3 text-xs">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Search className="h-3.5 w-3.5" />
                          Searching: <span className="text-foreground">{p.input?.query ?? "…"}</span>
                          {p.state !== "output-available" && <Loader2 className="h-3 w-3 animate-spin" />}
                        </div>
                        {p.output?.results && (
                          <ul className="mt-2 space-y-1.5">
                            {p.output.results.slice(0, 6).map((r) => (
                              <li key={r.url}>
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {r.title}
                                </a>
                                <div className="text-muted-foreground line-clamp-2">{r.snippet}</div>
                              </li>
                            ))}
                          </ul>
                        )}
                        {p.output?.error && <div className="mt-2 text-destructive">{p.output.error}</div>}
                      </div>
                    );
                  }
                  if (part.type === "tool-generate_script") {
                    const p = part as unknown as {
                      state: string;
                      output?: Record<string, unknown>;
                    };
                    if (p.state !== "output-available" || !p.output) {
                      return (
                        <div key={i} className="rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Generating script…
                        </div>
                      );
                    }
                    return <ScriptCard key={i} data={p.output as never} />;
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && (
            <div className="text-sm text-muted-foreground">
              <Shimmer>Thinking…</Shimmer>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border p-4">
        <div className="max-w-3xl mx-auto">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Trending topic dhundo, ya script tweak karo…"
              autoFocus
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} disabled={isLoading && !input} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
