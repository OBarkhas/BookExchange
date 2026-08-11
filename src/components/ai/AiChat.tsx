"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Send,
  Square,
  Sparkles,
  BookOpen,
  Timer,
  BarChart3,
  Plus,
  MessageSquare,
  Trash2,
  X,
  Check,
  PanelLeft,
} from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { showToast } from "@/components/ui/ToastContainer";

type Role = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
}

interface SessionSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: { content: string; role: string } | null;
}

const SUGGESTIONS = [
  {
    icon: Sparkles,
    label: "Personalized picks",
    prompt:
      "Recommend 5 books I would love based on my shelf and wishlist, and explain why each one fits me.",
  },
  {
    icon: Timer,
    label: "Reading time estimate",
    prompt:
      "I'm about to start a 320-page book. How many days will it take me to finish if I read about 25 minutes a day?",
  },
  {
    icon: BookOpen,
    label: "What should I read next?",
    prompt:
      "Based on what I've already read and what's on my shelf, what should I read next and why?",
  },
  {
    icon: BarChart3,
    label: "My library stats",
    prompt:
      "Summarize my library: how many books I've finished, what I'm currently reading, and what's on my wishlist.",
  },
];

function isChatMessage(value: unknown): value is ChatMessage {
  if (value == null || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.length > 0
  );
}

function sanitizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isChatMessage);
}

function sessionPreview(content: string): string {
  const plain = content
    .replace(/[#>*_`~-]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > 42 ? `${plain.slice(0, 42)}…` : plain;
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1.5">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400"
          style={{ animationDelay: `${dot * 0.15}s` }}
        />
      ))}
    </span>
  );
}

function InlineText({ text }: { text: string }) {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {tokens.map((token, index) => {
        if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
          return <strong key={index}>{token.slice(2, -2)}</strong>;
        }
        if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
          return <em key={index}>{token.slice(1, -1)}</em>;
        }
        if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
          return (
            <code
              key={index}
              className="rounded bg-amber-50 px-1 py-0.5 font-mono text-[0.85em] text-amber-800 ring-1 ring-amber-100"
            >
              {token.slice(1, -1)}
            </code>
          );
        }
        const link = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
        if (link) {
          return (
            <a
              key={index}
              href={link[2]}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-amber-600 underline decoration-amber-300 underline-offset-2 hover:text-amber-700"
            >
              {link[1]}
            </a>
          );
        }
        return <span key={index}>{token}</span>;
      })}
    </>
  );
}

function Markdown({ content }: { content: string }) {
  const blocks: ReactNode[] = [];
  const list: string[] = [];
  let ordered = false;

  const flush = () => {
    if (list.length === 0) return;
    const items = list.map((item, index) => (
      <li key={index} className="mb-0.5">
        <InlineText text={item} />
      </li>
    ));
    blocks.push(
      ordered ? (
        <ol key={`ol-${blocks.length}`} className="my-1.5 list-decimal space-y-0.5 pl-5 marker:text-amber-500">
          {items}
        </ol>
      ) : (
        <ul key={`ul-${blocks.length}`} className="my-1.5 list-disc space-y-0.5 pl-5 marker:text-amber-400">
          {items}
        </ul>
      ),
    );
    list.length = 0;
  };

  const lines = content.split("\n");
  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    const bullet = /^[-*]\s+(.*)$/.exec(trimmed);
    const number = /^\d+[.)]\s+(.*)$/.exec(trimmed);

    if (bullet || number) {
      const nextOrdered = Boolean(number);
      if (list.length > 0 && ordered !== nextOrdered) flush();
      ordered = nextOrdered;
      list.push((bullet ?? number)![1]);
      continue;
    }

    flush();
    if (!trimmed) continue;

    if (/^###\s/.test(trimmed)) {
      blocks.push(
        <h3 key={`h-${blocks.length}`} className="mt-3 mb-1 text-sm font-bold text-zinc-900">
          <InlineText text={trimmed.replace(/^###\s+/, "")} />
        </h3>,
      );
    } else if (/^##\s/.test(trimmed)) {
      blocks.push(
        <h2 key={`h-${blocks.length}`} className="mt-3 mb-1 text-base font-bold text-zinc-900">
          <InlineText text={trimmed.replace(/^##\s+/, "")} />
        </h2>,
      );
    } else if (/^#\s/.test(trimmed)) {
      blocks.push(
        <h1 key={`h-${blocks.length}`} className="mt-3 mb-1 text-lg font-bold text-zinc-900">
          <InlineText text={trimmed.replace(/^#\s+/, "")} />
        </h1>,
      );
    } else if (/^>\s?/.test(trimmed)) {
      blocks.push(
        <blockquote
          key={`q-${blocks.length}`}
          className="my-1.5 border-l-2 border-amber-300 bg-amber-50/60 py-1 pl-3 text-sm italic text-stone-600"
        >
          <InlineText text={trimmed.replace(/^>\s?/, "")} />
        </blockquote>,
      );
    } else {
      blocks.push(
        <p key={`p-${blocks.length}`} className="my-1">
          <InlineText text={trimmed} />
        </p>,
      );
    }
  }
  flush();

  return <>{blocks}</>;
}

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 py-10 text-center">
      <div className="relative">
        <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-amber-200/50 blur-2xl" />
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30">
          <Sparkles className="h-8 w-8" />
        </span>
      </div>
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Ask your personal reading coach</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-stone-500">
          Booksy knows your listings, shelf, wishlist, and swap history. Get tailored
          recommendations, estimate reading time, or ask anything about books.
        </p>
      </div>
      <div className="grid w-full max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.label}
            type="button"
            onClick={() => onPick(suggestion.prompt)}
            className="group flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/60 px-3.5 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:bg-white hover:shadow-md hover:shadow-amber-500/10"
          >
            <suggestion.icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 transition-transform duration-200 group-hover:scale-110" />
            <span>
              <span className="block text-xs font-semibold text-zinc-800">
                {suggestion.label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-stone-500 line-clamp-2">
                {suggestion.prompt}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AiChat() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState("Booksy");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const stoppedRef = useRef(false);
  const messageIdRef = useRef(0);
  const loadSeqRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const seq = ++loadSeqRef.current;
      try {
        const res = await fetch("/api/ai/chat/sessions", { cache: "no-store" });
        const data = await res.json();
        if (cancelled || seq !== loadSeqRef.current) return;
        const list: SessionSummary[] = Array.isArray(data?.sessions)
          ? data.sessions
          : [];
        setSessions(list);

        if (list.length > 0) {
          setActiveSessionId(list[0].id);
          setActiveTitle(list[0].title);
          const messagesRes = await fetch(
            `/api/ai/chat/sessions/${list[0].id}`,
            { cache: "no-store" },
          );
          if (cancelled || seq !== loadSeqRef.current) return;
          if (messagesRes.ok) {
            const messagesData = await messagesRes.json();
            setMessages(sanitizeMessages(messagesData?.messages));
          }
        }
      } catch {
      } finally {
        if (!cancelled && seq === loadSeqRef.current) setIsLoading(false);
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }, [input]);

  async function refreshSessions() {
    try {
      const res = await fetch("/api/ai/chat/sessions", { cache: "no-store" });
      const data = await res.json();
      if (!Array.isArray(data?.sessions)) return;
      setSessions(data.sessions);
      const active = data.sessions.find(
        (session: SessionSummary) => session.id === activeSessionId,
      );
      if (active) setActiveTitle(active.title);
    } catch {
    }
  }

  async function selectSession(id: string) {
    if (isStreaming || id === activeSessionId) return;
    const seq = ++loadSeqRef.current;
    setSidebarOpen(false);
    setActiveSessionId(id);
    setIsMessagesLoading(true);
    try {
      const res = await fetch(`/api/ai/chat/sessions/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      if (seq !== loadSeqRef.current) return;
      setMessages(sanitizeMessages(data?.messages));
      if (typeof data?.session?.title === "string") {
        setActiveTitle(data.session.title);
      }
    } catch {
      if (seq === loadSeqRef.current) setMessages([]);
    } finally {
      if (seq === loadSeqRef.current) setIsMessagesLoading(false);
    }
  }

  async function newChat() {
    if (isStreaming) return;
    setSidebarOpen(false);
    try {
      const res = await fetch("/api/ai/chat/sessions", { method: "POST" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      const session = data?.session;
      if (!session?.id) throw new Error("Could not start a chat");

      setSessions((previous) => [
        {
          id: session.id,
          title: session.title ?? "New Chat",
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          messageCount: 0,
          lastMessage: null,
        },
        ...previous,
      ]);
      setActiveSessionId(session.id);
      setActiveTitle(session.title ?? "New Chat");
      setMessages([]);
      setInput("");
      textareaRef.current?.focus();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Could not start a chat",
        "error",
      );
    }
  }

  async function deleteSession(id: string) {
    if (isStreaming) return;
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/ai/chat/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const remaining = sessions.filter((session) => session.id !== id);
      setSessions(remaining);
      if (activeSessionId === id) {
        if (remaining.length > 0) {
          await selectSession(remaining[0].id);
        } else {
          setActiveSessionId(null);
          setActiveTitle("Booksy");
          setMessages([]);
        }
      }
      showToast("Conversation deleted");
    } catch {
      showToast("Could not delete conversation", "error");
    }
  }

  async function send(prompt?: string) {
    const content = (prompt ?? input).trim();
    if (!content || isStreaming || isLoading || isMessagesLoading) return;

    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const res = await fetch("/api/ai/chat/sessions", { method: "POST" });
        if (!res.ok) throw new Error("Could not start a chat");
        const data = await res.json();
        const created = data?.session;
        if (!created?.id) throw new Error("Could not start a chat");
        sessionId = created.id;
        setActiveSessionId(sessionId);
        setActiveTitle(created.title ?? "New Chat");
        setSessions((previous) => [
          {
            id: created.id,
            title: created.title ?? "New Chat",
            createdAt: created.createdAt,
            updatedAt: created.updatedAt,
            messageCount: 0,
            lastMessage: null,
          },
          ...previous,
        ]);
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : "Could not start a chat",
          "error",
        );
        return;
      }
    }

    const userMessage: ChatMessage = {
      id: `user-${messageIdRef.current++}`,
      role: "user",
      content,
    };
    const assistantMessage: ChatMessage = {
      id: `assistant-${messageIdRef.current++}`,
      role: "assistant",
      content: "",
    };

    setMessages((previous) => [...previous, userMessage, assistantMessage]);
    setInput("");
    setIsStreaming(true);
    stoppedRef.current = false;

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? `Request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantMessage.id
              ? { ...message, content: acc }
              : message,
          ),
        );
      }
    } catch (error) {
      setMessages((previous) =>
        previous.map((message) => {
          if (message.id !== assistantMessage.id) return message;
          if (message.content) return message;
          if (stoppedRef.current) {
            return { ...message, content: "Stopped." };
          }
          const detail =
            error instanceof Error ? error.message : "Something went wrong";
          return {
            ...message,
            content: `Sorry — I hit a snag: ${detail}. Please try again.`,
          };
        }),
      );
    } finally {
      readerRef.current = null;
      stoppedRef.current = false;
      setIsStreaming(false);
      void refreshSessions();
    }
  }

  async function stop() {
    stoppedRef.current = true;
    const reader = readerRef.current;
    if (reader) await reader.cancel().catch(() => undefined);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void send();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  }

  const lastAssistantId =
    messages.length > 0 && messages[messages.length - 1].role === "assistant"
      ? messages[messages.length - 1].id
      : null;

  const renderSidebarContent = () => (
    <>
      <div className="flex items-center gap-2 px-3 pb-2 pt-3.5">
        <MessageSquare className="h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">
          Chats
        </p>
        <button
          type="button"
          onClick={() => void newChat()}
          disabled={isStreaming}
          className="ml-auto flex shrink-0 items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-amber-500/25 transition-all duration-200 hover:from-amber-600 hover:to-amber-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          New chat
        </button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {isLoading ? (
          <div className="flex items-center gap-2 px-2 py-3 text-xs text-stone-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            Loading chats…
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <p className="text-xs font-medium text-stone-500">
              No conversations yet
            </p>
            <p className="mt-0.5 text-[11px] text-stone-400">
              Start a new chat with Booksy.
            </p>
          </div>
        ) : (
          sessions.map((session) => {
            const active = session.id === activeSessionId;
            const confirming = confirmDeleteId === session.id;
            return (
              <div
                key={session.id}
                role="button"
                tabIndex={0}
                onClick={() => void selectSession(session.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void selectSession(session.id);
                }}
                className={cn(
                  "group relative cursor-pointer rounded-xl px-2.5 py-2 transition-all duration-200",
                  active
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/25"
                    : "text-stone-600 hover:bg-white hover:shadow-sm",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-xs font-semibold",
                      active ? "text-white" : "text-zinc-800",
                    )}
                  >
                    {session.title}
                  </span>
                  {confirming ? (
                    <span
                      className="flex shrink-0 items-center gap-0.5"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => void deleteSession(session.id)}
                        aria-label="Confirm delete"
                        className="rounded-md p-1 hover:bg-rose-100 hover:text-rose-600"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        aria-label="Cancel delete"
                        className="rounded-md p-1 hover:bg-stone-200 hover:text-stone-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setConfirmDeleteId(session.id);
                      }}
                      aria-label={`Delete ${session.title}`}
                      className={cn(
                        "shrink-0 rounded-md p-1 opacity-0 transition-all duration-150 group-hover:opacity-100 focus:opacity-100",
                        active
                          ? "hover:bg-white/20 hover:text-white"
                          : "hover:bg-rose-50 hover:text-rose-600",
                      )}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {session.lastMessage && (
                  <p
                    className={cn(
                      "mt-0.5 truncate text-[11px]",
                      active ? "text-amber-100" : "text-stone-400",
                    )}
                  >
                    {sessionPreview(session.lastMessage.content)}
                  </p>
                )}
                <p
                  className={cn(
                    "mt-0.5 text-[10px]",
                    active ? "text-amber-200/80" : "text-stone-300",
                  )}
                >
                  {session.messageCount} message
                  {session.messageCount === 1 ? "" : "s"} ·{" "}
                  {timeAgo(session.updatedAt)}
                </p>
              </div>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <div className="relative flex h-[70vh] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-amber-100 bg-white/80 shadow-sm shadow-amber-900/5 backdrop-blur-sm md:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-amber-100/80 bg-amber-50/40 md:flex">
        {renderSidebarContent()}
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="absolute inset-0 z-20 bg-zinc-900/30 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-amber-100/80 bg-amber-50/95 backdrop-blur-md md:hidden"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              {renderSidebarContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2.5 border-b border-amber-100/80 px-4 py-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open chat list"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-amber-50 hover:text-amber-700 md:hidden"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm shadow-amber-500/30">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {activeTitle}
            </p>
            <p className="text-[11px] text-stone-400">
              Booksy · Personalized reads, powered by Groq
            </p>
          </div>
          {isStreaming && (
            <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              Thinking…
            </span>
          )}
        </div>

        <div
          ref={scrollRef}
          aria-live="polite"
          className="flex-1 overflow-y-auto px-4 py-5 sm:px-6"
        >
          {messages.length === 0 ? (
            isLoading || isMessagesLoading ? (
              <div className="flex h-full items-center justify-center">
                <span className="flex items-center gap-2 text-sm text-stone-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                  Loading conversation…
                </span>
              </div>
            ) : (
              <EmptyState onPick={(prompt) => void send(prompt)} />
            )
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isLastAssistant = message.id === lastAssistantId;
                if (message.role === "user") {
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex justify-end"
                    >
                      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm shadow-amber-500/20">
                        {message.content}
                      </div>
                    </motion.div>
                  );
                }
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-amber-100 bg-white px-4 py-3 text-sm leading-relaxed text-stone-700 shadow-sm">
                      {message.content ? (
                        <>
                          <Markdown content={message.content} />
                          {isStreaming && isLastAssistant && (
                            <span
                              aria-hidden
                              className="ml-0.5 inline-block h-4 w-[7px] animate-pulse rounded-[2px] bg-amber-500 align-middle"
                            />
                          )}
                        </>
                      ) : (
                        <TypingDots />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-amber-100/80 p-3 sm:p-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || isMessagesLoading}
              rows={1}
              placeholder={
                isLoading || isMessagesLoading
                  ? "Loading conversation…"
                  : "Ask about books, your shelf, or reading time…"
              }
              className="max-h-40 min-h-[44px] flex-1 resize-none rounded-xl border border-amber-200 bg-cream/70 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
            {isStreaming ? (
              <button
                type="button"
                onClick={() => void stop()}
                aria-label="Stop generating"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm shadow-rose-500/30 transition-all duration-200 hover:bg-rose-600 active:scale-95"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isMessagesLoading}
                aria-label="Send message"
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-all duration-200 active:scale-95",
                  input.trim() && !isLoading && !isMessagesLoading
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-500/30 hover:from-amber-600 hover:to-amber-700"
                    : "cursor-not-allowed bg-stone-300 shadow-none",
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </form>
          <p className="mt-2 text-center text-[11px] text-stone-400">
            Booksy can make mistakes — verify important details.
          </p>
        </div>
      </div>
    </div>
  );
}
