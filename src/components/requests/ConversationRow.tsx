"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, ChevronRight } from "lucide-react";
import { deleteConversation } from "@/actions/requests";
import { timeAgo, cn } from "@/lib/utils";
import {
  REQUEST_STATUS_COLORS,
  REQUEST_STATUS_LABELS,
} from "@/lib/categories";
import type { RequestStatus } from "@/generated/prisma/client";
import StatusBadge from "@/components/ui/StatusBadge";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { showToast } from "@/components/ui/ToastContainer";

interface Conversation {
  id: string;
  status: RequestStatus;
  createdAt: string | Date;
  book: { title: string };
  sender: { id: string; name: string | null; imageUrl: string | null };
  receiver: { id: string; name: string | null; imageUrl: string | null };
  messages: Array<{
    content: string;
    createdAt: string | Date;
    senderId: string;
  }>;
}

interface ConversationRowProps {
  conversation: Conversation;
  myId: string;
}

export default function ConversationRow({
  conversation,
  myId,
}: ConversationRowProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removing, setRemoving] = useState(false);

  const counterpart =
    conversation.sender.id === myId
      ? conversation.receiver
      : conversation.sender;
  const last = conversation.messages[0];

  const remove = async () => {
    setDeleting(true);
    setRemoving(true);
    try {
      await deleteConversation(conversation.id);
      setConfirming(false);
      showToast("Conversation deleted");
    } catch (err) {
      setRemoving(false);
      showToast(
        err instanceof Error ? err.message : "Could not delete conversation",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-3 rounded-2xl border border-amber-100 bg-white/85 p-3.5 shadow-sm shadow-amber-900/5 transition-all duration-300 hover:border-amber-300 hover:shadow-md sm:gap-4 sm:p-4",
          removing && "pointer-events-none opacity-40",
        )}
      >
        <Avatar
          name={counterpart.name}
          imageUrl={counterpart.imageUrl}
          size="md"
          userId={counterpart.id}
        />

        <Link
          href={`/messages/${conversation.id}`}
          className="min-w-0 flex-1"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {counterpart.name ?? "Book lover"}
            </p>
            <span className="shrink-0 text-[11px] text-stone-400">
              {timeAgo(last?.createdAt ?? conversation.createdAt)}
            </span>
          </div>
          <p className="truncate text-xs text-stone-500">
            <span className="font-medium text-amber-600">
              {conversation.book.title}
            </span>{" "}
            ·{" "}
            {last
              ? (last.senderId === myId ? "You: " : "") + last.content
              : "Say hello 👋"}
          </p>
        </Link>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge
            label={REQUEST_STATUS_LABELS[conversation.status]}
            className={REQUEST_STATUS_COLORS[conversation.status]}
          />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setConfirming(true)}
              aria-label="Delete conversation"
              title="Delete conversation"
              className="rounded-lg p-1.5 text-stone-300 transition-colors hover:bg-rose-50 hover:text-rose-500 active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <ChevronRight className="h-4 w-4 text-amber-500" />
          </div>
        </div>
      </div>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Delete this conversation?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={remove}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-stone-600">
          This permanently removes the chat with{" "}
          <span className="font-semibold text-zinc-900">
            {counterpart.name ?? "this reader"}
          </span>{" "}
          from your messages and exchanges. Their copy stays intact, and this
          can&apos;t be undone.
        </p>
      </Modal>
    </>
  );
}
