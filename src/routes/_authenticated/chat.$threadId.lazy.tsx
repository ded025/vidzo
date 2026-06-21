import { createLazyFileRoute, getRouteApi, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getThreadMessages } from "@/lib/threads.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { ChatMessage, ChatMessageContent, ChatMessageText } from "@/components/chat-message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { ContentPackCard, type ContentPackData } from "@/components/content-pack-card";
import {
  AlertCircle,
  CheckCircle2,
  Coins,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

const routeApi = getRouteApi("/_authenticated/chat/$threadId");

export const Route = createLazyFileRoute("/_authenticated/chat/$threadId")({
  component: ThreadView,
});

const FREE_SCRIPTS = 5;
const FREE_TWEAKS = 3;

type ChatHealth = {
  status: "checking" | "ok" | "degraded";
  message: string;
  model?: string;
};

function getChatErrorMessage(error: Error | undefined, health: ChatHealth) {
  if (health.status === "degraded") return health.message;
  const message = error?.message ?? "";
  if (/session|unauthorized|401/i.test(message)) {
    return "Your session expired. Sign in again, then resend the prompt.";
  }
  if (/openai|api key|model|quota|rate/i.test(message)) return message;
  return "Chat could not complete that request. Your draft is still here — retry in a moment.";
}

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
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/chat/new" })}>
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
      <Link
        to="/chat/credits"
        className="ml-auto text-[var(--vidzo-blue)] hover:underline font-medium"
      >
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
  const bearerRef = useRef<string | null>(null);
  const [bearerReady, setBearerReady] = useState(false);
  const sentPending = useRef(false);
  const [creditError, setCreditError] = useState<CreditError | null>(null);
  const [balance, setBalance] = useState<number>(FREE_SCRIPTS);
  const [tweakCount, setTweakCount] = useState<number>(0);
  const [health, setHealth] = useState<ChatHealth>({
    status: "checking",
    message: "Checking chat connection",
  });

  const checkHealth = useCallback(async () => {
    setHealth({ status: "checking", message: "Checking chat connection" });
    try {
      const response = await fetch("/api/chat", {
        method: "GET",
        headers: bearerRef.current ? { Authorization: `Bearer ${bearerRef.current}` } : undefined,
      });
      const data = (await response.json().catch(() => null)) as {
        status?: string;
        message?: string;
        model?: string;
        error?: string;
      } | null;
      if (response.ok && data?.status === "ok") {
        setHealth({
          status: "ok",
          message: "Supabase AI is configured",
          model: data.model,
        });
      } else {
        setHealth({
          status: "degraded",
          message:
            data?.error ||
            data?.message ||
            "Chat health check failed. Add OPENAI_API_KEY to Supabase Edge Function secrets.",
          model: data?.model,
        });
      }
    } catch {
      setHealth({
        status: "degraded",
        message: "Chat health check could not reach the server. Check your connection and retry.",
      });
    }
  }, []);

  // Resolve Supabase session token
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

  // Free mode — reset tweak counter on new thread
  useEffect(() => {
    setTweakCount(0);
  }, [threadId]);

  useEffect(() => {
    if (bearerReady) void checkHealth();
  }, [bearerReady, checkHealth]);

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

  // Surface any streaming errors to console for debugging
  useEffect(() => {
    if (error) console.error("[chat] stream error", error);
  }, [error]);

  // Auto-send any pending message stored in sessionStorage (from chat.new.tsx)
  useEffect(() => {
    if (sentPending.current || !bearerReady || health.status !== "ok") return;
    const pending = sessionStorage.getItem(`pending:${threadId}`);
    if (pending && messages.length === 0) {
      sentPending.current = true;
      sessionStorage.removeItem(`pending:${threadId}`);
      sendMessage({ text: pending });
    }
  }, [bearerReady, health.status, threadId, messages.length, sendMessage]);

  const isTweak = messages.some(
    (message) =>
      message.role === "assistant" &&
      message.parts.some(
        (part) =>
          part.type === "tool-generate_content_pack" &&
          (part as { state?: string }).state === "output-available",
      ),
  );

  // FIX: Signature matches PromptInput's onSubmit(message: PromptInputMessage, event)
  // Previously the handler took { text?: string } which matched but relied on
  // stale `input` state as fallback — now we read message.text directly.
  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (!text || health.status !== "ok") return;
    // Guard: session must be resolved before sending
    if (!bearerRef.current) {
      console.warn("[chat] bearer not ready yet, dropping send");
      return;
    }
    setCreditError(null);
    sendMessage({ text });
    if (isTweak) setTweakCount((c) => c + 1);
  };

  const isLoading = status === "submitted" || status === "streaming";
  const tweaksLeft = Math.max(0, FREE_TWEAKS - tweakCount);
  const chatBlocked = health.status !== "ok";
  const errorMessage = getChatErrorMessage(error, health);
  const activeAssistant = messages[messages.length - 1];
  const currentPackVisible =
    activeAssistant?.role === "assistant" &&
    activeAssistant.parts.some(
      (part) =>
        part.type === "tool-generate_content_pack" &&
        (part as { state?: string }).state === "output-available",
    );

  // Show a session-loading state so messages are never silently dropped
  if (!bearerReady) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Connecting…</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Credit status bar */}
      <CreditBar balance={balance} tweakCount={tweakCount} isTweak={isTweak} />

      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-5xl px-4 py-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              {health.status === "checking" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : health.status === "ok" ? (
                <CheckCircle2 className="size-3.5 text-emerald-500" />
              ) : (
                <AlertCircle className="size-3.5 text-destructive" />
              )}
              {health.message}
              {health.model ? <span className="hidden sm:inline">· {health.model}</span> : null}
            </span>
            <Button size="sm" variant="ghost" onClick={() => void checkHealth()}>
              <RefreshCw className="size-3.5" />
              Check
            </Button>
          </div>

          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-16">
              Type your brief. The whole chat will lock onto it.
            </div>
          )}
          {messages.map((m) => (
            <ChatMessage key={m.id} from={m.role}>
              <ChatMessageContent>
                {m.parts.map((part, i) => {
                  if (part.type === "text") {
                    return m.role === "assistant" ? (
                      <ChatMessageText key={i}>{part.text}</ChatMessageText>
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
                      errorText?: string;
                      input?: { research?: string };
                      output?: Record<string, unknown> & { error?: string };
                    };
                    if (p.state === "output-error") {
                      return (
                        <div
                          key={i}
                          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                          role="alert"
                        >
                          {p.errorText || "Content pack generation failed. Please retry."}
                        </div>
                      );
                    }
                    if (p.state !== "output-available" || !p.output) {
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 p-3 text-xs text-muted-foreground"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>
                            Building one structured 9:16 pack
                            {p.input?.research ? ` — ${p.input.research}` : ""}
                          </span>
                        </div>
                      );
                    }
                    if (p.output.error) {
                      return (
                        <div
                          key={i}
                          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                          role="alert"
                        >
                          {p.output.error}
                        </div>
                      );
                    }
                    return (
                      <ContentPackCard key={i} data={p.output as unknown as ContentPackData} />
                    );
                  }
                  return null;
                })}
              </ChatMessageContent>
            </ChatMessage>
          ))}
          {isLoading && !currentPackVisible && (
            <div
              className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm"
              role="status"
              aria-live="polite"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                V
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">Vidzo is thinking</span>
                <span className="inline-flex gap-1" aria-hidden="true">
                  <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-current" />
                </span>
              </div>
            </div>
          )}
          {/* Surface stream errors inline so the user knows something went wrong */}
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {creditError ? (
        <CreditWall err={creditError} threadId={threadId} />
      ) : (
        <div className="border-t border-border p-4">
          <div className="mx-auto max-w-4xl">
            {isTweak && tweaksLeft === 0 && (
              <p className="text-xs text-amber-500 mb-2 flex items-center gap-1.5">
                <Coins className="h-3 w-3" />
                Next tweak will use 1 credit from your balance.
              </p>
            )}
            {/* FIX: PromptInput is uncontrolled — it manages its own textarea value
                internally and passes the final text via onSubmit(message). We no
                longer try to control its value prop externally, which was causing
                the input to fight PromptInput's own clear logic. */}
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputTextarea
                placeholder={
                  isTweak
                    ? tweaksLeft > 0
                      ? `Tweak ${tweaksLeft} of ${FREE_TWEAKS} free tweaks left…`
                      : "Tweak using credits…"
                    : "Describe your video idea…"
                }
                autoFocus
                disabled={isLoading || chatBlocked}
              />
              <PromptInputFooter className="justify-end">
                {/* FIX: disabled={isLoading || !input} — previous `&&` logic
                    meant the button was enabled while streaming if the textarea
                    had text, allowing double-submits and broken state. */}
                <PromptInputSubmit status={status} disabled={isLoading || chatBlocked} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      )}
    </div>
  );
}
