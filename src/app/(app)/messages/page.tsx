import Link from "next/link";
import { MessageSquare, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import {
  REQUEST_STATUS_COLORS,
  REQUEST_STATUS_LABELS,
} from "@/lib/categories";
import { timeAgo } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import Avatar from "@/components/ui/Avatar";

export default async function MessagesPage() {
  const user = await getDbUser();

  const requests = await db.exchangeRequest.findMany({
    where: { OR: [{ senderId: user!.id }, { receiverId: user!.id }] },
    orderBy: { createdAt: "desc" },
    include: {
      book: { select: { id: true, title: true, images: true } },
      sender: { select: { id: true, name: true, imageUrl: true } },
      receiver: { select: { id: true, name: true, imageUrl: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderId: true },
      },
    },
  });

  const sorted = [...requests].sort((a, b) => {
    const aDate = a.messages[0]?.createdAt ?? a.createdAt;
    const bDate = b.messages[0]?.createdAt ?? b.createdAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Messages"
        subtitle="Private chats with your swap & sale partners."
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations yet"
          description="Request a book from the marketplace to unlock a private chat with its owner."
          action={
            <Link
              href="/browse"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-amber-500/30 transition-all hover:from-amber-600 hover:to-amber-700"
            >
              Browse books
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((request) => {
            const counterpart =
              request.sender.id === user!.id ? request.receiver : request.sender;
            const last = request.messages[0];
            return (
              <Link
                key={request.id}
                href={`/messages/${request.id}`}
                className="flex items-center gap-4 rounded-2xl border border-amber-100 bg-white/85 p-4 shadow-sm shadow-amber-900/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
              >
                <Avatar
                  name={counterpart.name}
                  imageUrl={counterpart.imageUrl}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {counterpart.name ?? "Book lover"}
                    </p>
                    <span className="shrink-0 text-[11px] text-stone-400">
                      {timeAgo(last?.createdAt ?? request.createdAt)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-stone-500">
                    <span className="font-medium text-amber-600">
                      {request.book.title}
                    </span>{" "}
                    · {last ? (last.senderId === user!.id ? "You: " : "") + last.content : "Say hello 👋"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StatusBadge
                    label={REQUEST_STATUS_LABELS[request.status]}
                    className={REQUEST_STATUS_COLORS[request.status]}
                  />
                  <span className="flex items-center text-amber-500">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
