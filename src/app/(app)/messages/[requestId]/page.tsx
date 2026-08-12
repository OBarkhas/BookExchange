import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import {
  REQUEST_STATUS_COLORS,
  REQUEST_STATUS_LABELS,
} from "@/lib/categories";
import StatusBadge from "@/components/ui/StatusBadge";
import Avatar from "@/components/ui/Avatar";
import ChatThread from "@/components/requests/ChatThread";
import RequestActions from "@/components/requests/RequestActions";
import DeleteConversationButton from "@/components/requests/DeleteConversationButton";

export default async function MessageThreadPage({
  params,
}: PageProps<"/messages/[requestId]">) {
  const { requestId } = await params;
  const user = await getDbUser();

  const request = await db.exchangeRequest.findUnique({
    where: { id: requestId },
    include: {
      book: { select: { id: true, title: true, images: true } },
      sender: { select: { id: true, name: true, imageUrl: true } },
      receiver: { select: { id: true, name: true, imageUrl: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, name: true, imageUrl: true } },
        },
      },
    },
  });

  if (!request) notFound();
  if (request.sender.id !== user!.id && request.receiver.id !== user!.id) {
    notFound();
  }

  const hiddenForMe =
    (request.sender.id === user!.id && request.hiddenBySender) ||
    (request.receiver.id === user!.id && request.hiddenByReceiver);
  if (hiddenForMe) notFound();

  const counterpart =
    request.sender.id === user!.id ? request.receiver : request.sender;
  const isOwner = request.receiver.id === user!.id;
  const cover = request.book.images[0];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/messages"
          className="flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          <ArrowLeft className="h-4 w-4" /> All messages
        </Link>
        <StatusBadge
          label={REQUEST_STATUS_LABELS[request.status]}
          className={REQUEST_STATUS_COLORS[request.status]}
        />
      </div>

      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-amber-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center">
        <Link
          href={`/listings/${request.book.id}`}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100">
            {cover ? (
              <img
                src={cover}
                alt={request.book.title}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <BookOpen className="h-4 w-4 text-amber-300" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {request.book.title}
            </p>
            <p className="truncate text-xs text-stone-400">
              chatting with {counterpart.name ?? "book lover"}
            </p>
          </div>
        </Link>
        <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
          <Avatar
            name={counterpart.name}
            imageUrl={counterpart.imageUrl}
            size="md"
            userId={counterpart.id}
          />
          <RequestActions
            requestId={request.id}
            status={request.status}
            isOwner={isOwner}
          />
          <DeleteConversationButton requestId={request.id} />
        </div>
      </div>

      <ChatThread
        requestId={request.id}
        initialMessages={request.messages}
        myId={user!.id}
        title={request.book.title}
      />
    </div>
  );
}
