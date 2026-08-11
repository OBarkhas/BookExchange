"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import {
  Send,
  Square,
  Sparkles,
  BookOpen,
  Timer,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const stoppedRef = useRef(false);
  const messageIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/ai/chat")
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed (${response.status})`);
        return response.json();
      })
      .then((data: { messages?: unknown }) => {
        if (cancelled) return;
        const history: ChatMessage[] = Array.isArray(data?.messages)
          ? data.messages.filter(
              (message): message is ChatMessage =>
                message != null &&
                typeof message === "object" &&
                typeof message.id === "string" &&
                (message.role === "user" || message.role === "assistant") &&
                typeof message.content === "string" &&
                message.content.length > 0,
            )
          : [];
        setMessages(history);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsHistoryLoading(false);
      });

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

  async function send(prompt?: string) {
    const content = (prompt ?? input).trim();
    if (!content || isStreaming || isHistoryLoading) return;

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

    const history = [...messages.filter((message) => message.content), userMessage].map(
      (message) => ({ role: message.role, content: message.content }),
    );

    setMessages((previous) => [...previous, userMessage, assistantMessage]);
    setInput("");
    setIsStreaming(true);
    stoppedRef.current = false;

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
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
            message.id === assistantMessage.id ? { ...message, content: acc } : message,
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

  return (
    <div className="flex h-[70vh] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-amber-100 bg-white/80 shadow-sm shadow-amber-900/5 backdrop-blur-sm">
      <div className="flex items-center gap-2.5 border-b border-amber-100/80 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm shadow-amber-500/30">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-zinc-900">Booksy</p>
          <p className="text-[11px] text-stone-400">Personalized reads, powered by Groq</p>
        </div>
        {isStreaming && (
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            Thinking…
          </span>
        )}
      </div>

      <div ref={scrollRef} aria-live="polite" className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {messages.length === 0 ? (
          isHistoryLoading ? (
            <div className="flex h-full items-center justify-center">
              <span className="flex items-center gap-2 text-sm text-stone-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                Loading your conversation…
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
            disabled={isHistoryLoading}
            rows={1}
            placeholder={
              isHistoryLoading
                ? "Loading your conversation…"
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
              disabled={!input.trim() || isHistoryLoading}
              aria-label="Send message"
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-all duration-200 active:scale-95",
                input.trim() && !isHistoryLoading
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
  );
}
