"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, MessageSquare } from "lucide-react";
import { fetcher, timeAgo } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import { showToast } from "@/components/ui/ToastContainer";

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string | Date;
  sender: { id: string; name: string | null; imageUrl: string | null };
}

interface ChatThreadProps {
  requestId: string;
  initialMessages: ChatMessage[];
  myId: string;
  title: string;
}

export default function ChatThread({
  requestId,
  initialMessages,
  myId,
  title,
}: ChatThreadProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<string | null>(null);
  const pendingRef = useRef<string[]>([]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const data = await fetcher<{ messages: ChatMessage[] }>(
          `/api/requests/${requestId}/messages`,
          { cache: "no-store" },
        );
        if (cancelled) return;
        const serverKey = data.messages.map((m) => m.id).join("|");
        if (serverKey === lastRef.current && pendingRef.current.length === 0) {
          return;
        }
        setMessages((prev) => {
          const pendingIds = new Set(pendingRef.current);
          const held = prev.filter(
            (m) =>
              pendingIds.has(m.id) &&
              !data.messages.some((s) => s.id === m.id),
          );
          const merged = [...data.messages, ...held];
          lastRef.current = merged.map((m) => m.id).join("|");
          return merged;
        });
        scrollToBottom();
      } catch {
      }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [requestId, scrollToBottom]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      content,
      createdAt: new Date(),
      sender: { id: myId, name: null, imageUrl: null },
    };
    pendingRef.current = [...pendingRef.current, tempId];
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    lastRef.current = [...messages, optimistic].map((m) => m.id).join("|");
    scrollToBottom();
    setSending(true);

    try {
      const data = await fetcher<{ message: ChatMessage }>(
        `/api/requests/${requestId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        },
      );
      pendingRef.current = pendingRef.current.filter((id) => id !== tempId);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? data.message : m)),
      );
      lastRef.current = [...messages, data.message].map((m) => m.id).join("|");
    } catch (err) {
      pendingRef.current = pendingRef.current.filter((id) => id !== tempId);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      showToast(
        err instanceof Error ? err.message : "Could not send message",
        "error",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-17rem)] min-h-[22rem] flex-col overflow-hidden rounded-3xl border border-amber-100 bg-white/90 shadow-sm backdrop-blur-sm sm:h-[calc(100vh-16rem)] sm:min-h-[28rem]">
      <div className="flex items-center gap-3 border-b border-amber-50 bg-cream/70 px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <MessageSquare className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {title}
          </p>
          <p className="text-xs text-stone-400">Private swap chat</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <MessageSquare className="h-8 w-8 text-amber-200" />
            <p className="text-sm font-medium text-stone-500">
              Chat unlocked!
            </p>
            <p className="max-w-xs text-xs text-stone-400">
              Start the conversation to arrange your book exchange.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const mine = message.sender.id === myId;
            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}
              >
                <Avatar
                  name={message.sender.name}
                  imageUrl={message.sender.imageUrl}
                  size="xs"
                  userId={message.sender.id}
                  className={mine ? "ring-amber-300" : "ring-stone-200"}
                />
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[75%] ${
                    mine
                      ? "rounded-br-md bg-gradient-to-br from-amber-500 to-amber-600 text-white"
                      : "rounded-bl-md bg-stone-100 text-zinc-800"
                  }`}
                >
                  <p className="whitespace-pre-line break-words text-sm leading-relaxed">
                    {message.content}
                  </p>
                  <p
                    className={`mt-1 text-[10px] ${
                      mine ? "text-amber-100" : "text-stone-400"
                    }`}
                  >
                    {timeAgo(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className="flex items-center gap-2 border-t border-amber-50 bg-cream/70 p-2.5 sm:p-3.5"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write a message…"
          className="h-11 min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-4 text-sm text-zinc-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/30 transition-all hover:from-amber-600 hover:to-amber-700 active:scale-95 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
