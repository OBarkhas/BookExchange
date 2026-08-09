import Link from "next/link";
import { MessageSquare, MapPin, BookOpen } from "lucide-react";
import {
  REQUEST_STATUS_COLORS,
  REQUEST_STATUS_LABELS,
} from "@/lib/categories";
import { formatPrice, timeAgo } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import Avatar from "@/components/ui/Avatar";
import RequestActions from "./RequestActions";

interface RequestCardProps {
  request: {
    id: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED";
    message: string | null;
    offeredBook: string | null;
    createdAt: Date | string;
    book: {
      id: string;
      title: string;
      author: string;
      images: string[];
      price: number | null;
    };
    sender: {
      id: string;
      name: string | null;
      imageUrl: string | null;
      district: string | null;
    };
    receiver: {
      id: string;
      name: string | null;
      imageUrl: string | null;
      district: string | null;
    };
    messages: Array<{ content: string; createdAt: Date | string; senderId: string }>;
    _count: { messages: number };
  };
  myId: string;
}

export default function RequestCard({ request, myId }: RequestCardProps) {
  const isOwner = request.receiver.id === myId;
  const counterpart = isOwner ? request.sender : request.receiver;
  const lastMessage = request.messages[0];
  const cover = request.book.images[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white/85 shadow-sm shadow-amber-900/5 transition-all duration-300 hover:border-amber-300 hover:shadow-md">
      <div className="flex flex-col gap-4 p-5 sm:flex-row">
        <Link
          href={`/listings/${request.book.id}`}
          className="block shrink-0"
        >
          <div className="relative h-24 w-20 overflow-hidden rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100">
            {cover ? (
              <img
                src={cover}
                alt={request.book.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <BookOpen className="h-6 w-6 text-amber-300" />
              </div>
            )}
          </div>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/listings/${request.book.id}`}
              className="font-semibold text-zinc-900 hover:text-amber-700"
            >
              {request.book.title}
            </Link>
            <StatusBadge
              label={REQUEST_STATUS_LABELS[request.status]}
              className={REQUEST_STATUS_COLORS[request.status]}
            />
          </div>
          <p className="mt-0.5 text-sm text-stone-500">
            {request.book.author}
            {request.book.price != null &&
              ` · ${formatPrice(request.book.price)}`}
          </p>

          <div className="mt-3 flex items-center gap-2.5">
            <Avatar
              name={counterpart.name}
              imageUrl={counterpart.imageUrl}
              size="sm"
              userId={counterpart.id}
            />
            <div className="leading-tight">
              <p className="text-sm font-medium text-stone-700">
                {isOwner ? "From" : "To"} {counterpart.name ?? "Book lover"}
                <span className="ml-1 font-normal text-stone-400">
                  · {timeAgo(request.createdAt)}
                </span>
              </p>
              {counterpart.district && (
                <p className="flex items-center gap-0.5 text-xs text-stone-400">
                  <MapPin className="h-3 w-3" /> {counterpart.district}
                </p>
              )}
            </div>
          </div>

          {request.message && (
            <p className="mt-2 line-clamp-2 rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-600 ring-1 ring-stone-100">
              “{request.message}”
            </p>
          )}
          {request.offeredBook && (
            <p className="mt-1.5 text-xs font-medium text-teal-600">
              Offering: {request.offeredBook}
            </p>
          )}

          {lastMessage && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-stone-400">
              <MessageSquare className="h-3 w-3" />
              {lastMessage.senderId === myId ? "You: " : ""}
              {lastMessage.content}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <RequestActions
              requestId={request.id}
              status={request.status}
              isOwner={isOwner}
            />
            <Link
              href={`/messages/${request.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-amber-500/25 transition-all hover:from-amber-600 hover:to-amber-700 active:scale-95"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat{request._count.messages > 0
                ? ` (${request._count.messages})`
                : ""}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
