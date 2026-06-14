import { createLazyFileRoute, getRouteApi, useNavigate } from "@tanstack/react-router";
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
import { ContentPackCard, type ContentPackData } from "@/components/content-pack-card";
import { Loader2, ShieldCheck, Coins, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

const routeApi = getRouteApi("/_authenticated/chat/$threadId");

export const Route = createLazyFileRoute("/_authenticated/chat/$threadId")({
  component: ThreadView,
});

const FREE_SCRIPTS = 5;
const FREE_TWEAKS = 3;

function ThreadView() {
  const { threadId } = routeApi.useParams();
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

type CreditError = {
  creditError: true;
  type: "no_scripts" | "no_tweaks";
  message: string;
  tweakCount?: number;
};

function CreditWall({ err, threadId }: { err: CreditError; threadId: string }) {
  const navigate = useNavigate();
  const isNoScripts = err.type === "no_scripts";
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-border bg-gradient-to-br from-card to-card/80 p-8 text-center shadow-lg">
        <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-gradient-to-br from-[var(--vidzo-magenta)] to-[var(--vidzo-blue)] flex items-center justify-center">
          <Lock className="h-7 w-7 text-white" />
        </div>
        <h3 className="text-xl font-black tracking-tight mb-2">
          {isNoScripts ? "Script credits used up" : "Tweak limit reached"}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{err.message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {!isNoScripts && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: "/chat/new" })}
            >
              Start new chat
            </Button>
          )}
          <Link to="/chat/credits">
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-[var(--vidzo-magenta)] to-[var(--vidzo-blue)] text-white border-0 hover:opacity-90"
            >
              <Coins className="h-4 w-4 mr-1.5" />
              Get more credits
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function CreditBar({
  balance,
  tweakCount,
  isTweak,
}: {
  balance: number;
  tweakCount: number;
  isTweak: boolean;
}) {
  const tweaksLeft = Math.max(0, FREE_TWEAKS - tweakCount);
  const scriptsLeft = balance;
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-secondary/30 text-xs text-muted-foreground">
      <Sparkles className="h-3.5 w-3.5 text-[var(--vidzo-magenta)] shrink-0" />
      <span>
        {isTweak
          ? tweaksLeft > 0
            ? `${tweaksLeft} free tweak${tweaksLeft !== 1 ? "s" : ""} left in this chat`
            : `Free tweaks used — credits will be consumed`
          : scriptsLeft > 0
          ? `${scriptsLeft} free script${scriptsLeft !== 1 ? "s" : ""} remaining`
          : "No free scripts — credits will be consumed"}
      </span>
      <Link to="/chat/credits" className="ml-auto text-[var(--vidzo-blue)] hover:underline font-medium">
        {scriptsLeft <= 1 ? "Top up →" : null}
      </Link>
    </div>
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
  const bearerRef = useRef<string | null>(null);
  const [bearerReady, setBearerReady] = useState(false);
  const sentPending = useRef(false);
  const [creditError, setCreditError] = useState<CreditError | null>(null);
  const [balance, setBalance] = useState<number>(FREE_SCRIPTS);
  const [tweakCount, setTweakCount] = useState<number>(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      bearerRef.current = data.session?.access_token ?? null;
      setBearerReady(!!bearerRef.current);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      bearerRef.current = session?.access_token ?? null;
      setBearerReady(!!bearerRef.current);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Free mode — no credit / tweak limits
  useEffect(() => {
    setBalance(null);
    setTweakCount(0);
  }, [bearerReady, threadId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: (): Record<string, string> =>
          bearerRef.current ? { Authorization: `Bearer ${bearerRef.current}` } : {},
        body: { threadId },
      }),
    [threadId],
  );


  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
  });

  useEffect(() => {
    if (error) console.error("[chat] error", error);
  }, [error]);

  useEffect(() => {
    if (sentPending.current || !bearerReady) return;
    const pending = sessionStorage.getItem(`pending:${threadId}`);
    if (pending && messages.length === 0) {
      sentPending.current = true;
      sessionStorage.removeItem(`pending:${threadId}`);
      sendMessage({ text: pending });
    }
  }, [bearerReady, threadId, messages.length, sendMessage]);

  const isTweak = messages.filter((m) => m.role === "user").length >= 1;

  const handleSubmit = (message: { text?: string }) => {
    const text = (message.text ?? input).trim();
    if (!text) return;
    if (!bearerRef.current) return;
    setCreditError(null);
    setInput("");
    sendMessage({ text });
    // Optimistically update tweak counter
    if (isTweak) setTweakCount((c) => c + 1);
  };

  const isLoading = status === "submitted" || status === "streaming";
  const tweaksLeft = Math.max(0, FREE_TWEAKS - tweakCount);
  const inputBlocked = !!(creditError);

  return (
    <div className="h-full flex flex-col">
      {/* Credit status bar */}
      <CreditBar balance={balance} tweakCount={tweakCount} isTweak={isTweak} />

      <Conversation className="flex-1">
        <ConversationContent className="max-w-3xl mx-auto w-full px-4 py-6">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-16">
              Type your brief. The whole chat will lock onto it.
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
                      <div key={i} className="whitespace-pre-wrap">
                        {part.text}
                      </div>
                    );
                  }
                  if (part.type === "tool-search_trending_topics") {
                    const p = part as unknown as {
                      state: string;
                      output?: {
                        results?: Array<{ title: string; url: string; snippet: string }>;
                        error?: string;
                      };
                    };
                    const done = p.state === "output-available";
                    const count = p.output?.results?.length ?? 0;
                    return (
                      <div
                        key={i}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground"
                      >
                        {done ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                            Researched {count} {count === 1 ? "source" : "sources"}
                          </>
                        ) : (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Researching sources…
                          </>
                        )}
                        {p.output?.error && (
                          <span className="text-destructive ml-2">Research unavailable</span>
                        )}
                      </div>
                    );
                  }
                  if (part.type === "tool-generate_content_pack") {
                    const p = part as unknown as {
                      state: string;
                      output?: Record<string, unknown>;
                    };
                    if (p.state !== "output-available" || !p.output) {
                      return (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground flex items-center gap-2"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Drafting + validating against sources…
                        </div>
                      );
                    }
                    return <ContentPackCard key={i} data={p.output as unknown as ContentPackData} />;
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

      {creditError ? (
        <CreditWall err={creditError} threadId={threadId} />
      ) : (
        <div className="border-t border-border p-4">
          <div className="max-w-3xl mx-auto">
            {isTweak && tweaksLeft === 0 && (
              <p className="text-xs text-amber-500 mb-2 flex items-center gap-1.5">
                <Coins className="h-3 w-3" />
                Next tweak will use 1 credit from your balance.
              </p>
            )}
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputTextarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isTweak
                    ? tweaksLeft > 0
                      ? `Tweak ${tweaksLeft} of ${FREE_TWEAKS} free tweaks left…`
                      : "Tweak using credits…"
                    : "Describe your video idea…"
                }
                autoFocus
              />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit status={status} disabled={isLoading && !input} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      )}
    </div>
  );
}
