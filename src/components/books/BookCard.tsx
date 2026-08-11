import Link from "next/link";
import { BookOpen, MapPin, ArrowLeftRight } from "lucide-react";
import type { Book, User } from "@/generated/prisma/client";
import {
  CONDITION_COLORS,
  CONDITION_LABELS,
  LISTING_TYPE_COLORS,
  LISTING_TYPE_LABELS,
} from "@/lib/categories";
import { formatPrice, timeAgo } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import Avatar from "@/components/ui/Avatar";

export type BookCardBook = Book & {
  user: Pick<User, "id" | "name" | "imageUrl" | "district">;
};

interface BookCardProps {
  book: BookCardBook;
}

export default function BookCard({ book }: BookCardProps) {
  const cover = book.images[0];
  const forSale = book.price != null;

  return (
    <div className="group flex w-full max-w-full flex-col overflow-hidden rounded-2xl border border-amber-100 bg-white/90 shadow-sm shadow-amber-900/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10 [contain-intrinsic-size:auto_26rem] [content-visibility:auto]">
      <Link
        href={`/listings/${book.id}`}
        className="relative block aspect-[4/3] overflow-hidden bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-100"
      >
        {cover ? (
          <img
            src={cover}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-12 w-12 text-amber-300" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <StatusBadge
            label={LISTING_TYPE_LABELS[book.listingType]}
            className={LISTING_TYPE_COLORS[book.listingType]}
          />
        </div>
        {forSale && (
          <div className="absolute bottom-3 right-3 rounded-xl bg-zinc-900/85 px-3 py-1.5 text-sm font-bold text-amber-300 shadow-lg backdrop-blur-sm">
            {formatPrice(book.price)}
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link
          href={`/listings/${book.id}`}
          className="line-clamp-1 font-semibold text-zinc-900 transition-colors group-hover:text-amber-700"
        >
          {book.title}
        </Link>
        <p className="mt-0.5 line-clamp-1 text-sm text-stone-500">{book.author}</p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <StatusBadge
            label={CONDITION_LABELS[book.condition]}
            className={CONDITION_COLORS[book.condition]}
          />
          <StatusBadge
            label={book.category}
            className="bg-stone-50 text-stone-600 ring-stone-200"
          />
        </div>

        <div className="mt-auto flex items-center justify-between pt-4">
          <Link
            href={`/profile/${book.user.id}`}
            className="flex items-center gap-2 rounded-lg transition-colors hover:bg-amber-50/70"
          >
            <Avatar
              name={book.user.name}
              imageUrl={book.user.imageUrl}
              size="xs"
            />
            <div className="leading-tight">
              <p className="text-xs font-medium text-stone-700 group-hover:text-amber-700">
                {book.user.name ?? "Book lover"}
              </p>
              {book.user.district && (
                <p className="flex items-center gap-0.5 text-[11px] text-stone-400">
                  <MapPin className="h-2.5 w-2.5" /> {book.user.district}
                </p>
              )}
            </div>
          </Link>
          {!forSale && (
            <span className="flex items-center gap-1 rounded-lg bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-600">
              <ArrowLeftRight className="h-3 w-3" /> Swap
            </span>
          )}
        </div>

        <p className="mt-2 text-[11px] text-stone-400">
          Bumped {timeAgo(book.lastBumpedAt)}
        </p>
      </div>
    </div>
  );
}
