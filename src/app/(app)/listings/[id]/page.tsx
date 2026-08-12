import { notFound } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  MapPin,
  CalendarClock,
  Pencil,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import {
  CONDITION_COLORS,
  CONDITION_LABELS,
  LISTING_TYPE_COLORS,
  LISTING_TYPE_LABELS,
} from "@/lib/categories";
import { daysRemaining, formatPrice, formatDate } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import Avatar from "@/components/ui/Avatar";
import { ListingOwnerActions, RequestBookButton } from "@/components/books/BookDetailClient";
import EmptyState from "@/components/ui/EmptyState";

export default async function ListingDetailPage({
  params,
}: PageProps<"/listings/[id]">) {
  const { id } = await params;
  const user = await getDbUser();

  const book = await db.book.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          district: true,
          locationDetail: true,
          bio: true,
          createdAt: true,
        },
      },
    },
  });

  if (!book) notFound();

  const isOwner = user?.id === book.userId;
  const isExpired = book.expiresAt <= new Date();

  const pendingRequests = isOwner
    ? await db.exchangeRequest.findMany({
        where: { bookId: book.id, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        include: {
          sender: { select: { id: true, name: true, imageUrl: true } },
        },
      })
    : [];

  const cover = book.images[0];

  return (
    <div className="mx-auto max-w-5xl">
      {isOwner && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
          <p className="text-sm font-medium text-stone-600">
            Manage your listing
          </p>
          <ListingOwnerActions
            bookId={book.id}
            isAvailable={book.isAvailable}
            isExpired={isExpired}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-sm">
            <div className="relative aspect-[4/3] bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-100">
              {cover ? (
                <img
                  src={cover}
                  alt={book.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BookOpen className="h-20 w-20 text-amber-300" />
                </div>
              )}
            </div>
            {book.images.length > 1 && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-amber-50 p-3">
                {book.images.map((img, i) => (
                  <img
                    key={`${img}-${i}`}
                    src={img}
                    alt={`${book.title} photo ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="h-16 w-20 shrink-0 cursor-pointer rounded-lg border border-amber-100 object-cover transition-transform hover:scale-105"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-3xl border border-amber-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
              About this book
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-600">
              {book.description || "The seller hasn't added a description yet."}
            </p>

            {book.hasDamage && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Condition note
                  </p>
                  <p className="mt-1 text-sm text-amber-700">
                    {book.damageDescription ||
                      "This book has some wear or damage."}
                  </p>
                </div>
              </div>
            )}

            {book.exchangePreference && (
              <div className="mt-4 rounded-2xl bg-teal-50/70 p-4 ring-1 ring-teal-100">
                <p className="text-sm font-semibold text-teal-800">
                  Swap preference
                </p>
                <p className="mt-1 text-sm text-teal-700">
                  {book.exchangePreference}
                </p>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <InfoTile label="Category" value={book.category} />
              <InfoTile
                label="Condition"
                value={
                  <StatusBadge
                    label={CONDITION_LABELS[book.condition]}
                    className={CONDITION_COLORS[book.condition]}
                  />
                }
              />
              <InfoTile
                label="Type"
                value={
                  <StatusBadge
                    label={LISTING_TYPE_LABELS[book.listingType]}
                    className={LISTING_TYPE_COLORS[book.listingType]}
                  />
                }
              />
              <InfoTile
                label="Listed"
                value={formatDate(book.createdAt)}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-amber-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm lg:sticky lg:top-24">
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                label={LISTING_TYPE_LABELS[book.listingType]}
                className={LISTING_TYPE_COLORS[book.listingType]}
              />
              <StatusBadge
                label={CONDITION_LABELS[book.condition]}
                className={CONDITION_COLORS[book.condition]}
              />
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
              {book.title}
            </h1>
            <p className="mt-1 text-stone-500">by {book.author}</p>

            <div className="mt-5 flex items-baseline gap-2">
              {book.price != null ? (
                <>
                  <span className="text-3xl font-bold text-amber-600">
                    {formatPrice(book.price)}
                  </span>
                  <span className="text-sm text-stone-400">or swap</span>
                </>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-1.5 text-sm font-bold text-teal-700 ring-1 ring-teal-200">
                  Free swap
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2.5 text-sm text-stone-500 ring-1 ring-stone-100">
              <CalendarClock className="h-4 w-4 text-amber-500" />
              {isExpired
                ? "Listing has expired"
                : `${daysRemaining(book.expiresAt)} days left in this listing`}
            </div>

            <Link
              href={`/profile/${book.user.id}`}
              className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-100 bg-cream p-4 transition-colors hover:border-amber-300"
            >
              <Avatar
                name={book.user.name}
                imageUrl={book.user.imageUrl}
                size="lg"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-zinc-900">
                  {book.user.name ?? "Book lover"}
                </p>
                {book.user.district && (
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-stone-500">
                    <MapPin className="h-3.5 w-3.5" /> {book.user.district}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-stone-400">
                  Joined {formatDate(book.user.createdAt)}
                </p>
              </div>
            </Link>

            {isOwner ? (
              <div className="mt-5 space-y-3">
                <Link
                  href={`/listings/${book.id}/edit`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50"
                >
                  <Pencil className="h-4 w-4" /> Edit listing
                </Link>
              </div>
            ) : (
              <div className="mt-5">
                <RequestBookButton
                  listingId={book.id}
                  available={book.isAvailable && !isExpired}
                  title={book.title}
                />
              </div>
            )}
          </div>

          {isOwner && pendingRequests.length > 0 && (
            <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50/60 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <CalendarDays className="h-4 w-4 text-amber-500" />
                {pendingRequests.length} pending{" "}
                {pendingRequests.length === 1 ? "request" : "requests"}
              </h3>
              <ul className="mt-3 space-y-2">
                {pendingRequests.map((req) => (
                  <li
                    key={req.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={req.sender.name}
                        imageUrl={req.sender.imageUrl}
                        size="sm"
                        userId={req.sender.id}
                      />
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          {req.sender.name ?? "Book lover"}
                        </p>
                        <p className="text-xs text-stone-500">
                          {req.offeredBook
                            ? `Offering: ${req.offeredBook}`
                            : "Wants this book"}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/exchanges"
                      className="shrink-0 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:from-amber-600 hover:to-amber-700"
                    >
                      Review
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isOwner && pendingRequests.length === 0 && (
            <div className="mt-6">
              <EmptyState
                icon={BookOpen}
                title="No requests yet"
                description="When someone requests this book, you'll see it here and in your exchanges."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-100">
      <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">
        {label}
      </p>
      <div className="mt-1 text-sm font-semibold text-zinc-900">{value}</div>
    </div>
  );
}
