import { notFound } from "next/navigation";
import { MapPin, BadgeCheck, Star, MessageSquare } from "lucide-react";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { formatDate, formatPrice, timeAgo } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import StarRating from "@/components/ui/StarRating";
import EmptyState from "@/components/ui/EmptyState";
import ReviewForm from "@/components/profile/ReviewForm";
import { BADGE_ORDER, BADGES } from "@/lib/badges";
import { cn } from "@/lib/utils";

export default async function ProfilePage({
  params,
}: PageProps<"/profile/[userId]">) {
  const { userId } = await params;
  const me = await getDbUser();

  const profile = await db.user.findUnique({
    where: { id: userId },
    include: {
      badges: { orderBy: { awardedAt: "desc" } },
      reviewsReceived: {
        orderBy: { createdAt: "desc" },
        include: {
          reviewer: { select: { id: true, name: true, imageUrl: true } },
        },
      },
      books: {
        where: { isAvailable: true, expiresAt: { gt: new Date() } },
        orderBy: { lastBumpedAt: "desc" },
        take: 6,
        include: {
          user: { select: { id: true, name: true, imageUrl: true, district: true } },
        },
      },
      _count: {
        select: { books: true, userShelves: true, reviewsReceived: true },
      },
    },
  });

  if (!profile) notFound();

  const isOwnProfile = me?.id === profile.id;
  const reviewAgg = await db.review.aggregate({
    where: { receiverId: profile.id },
    _avg: { rating: true },
    _count: true,
  });
  const reviewCount = reviewAgg._count;

  const totalListings = profile._count.books;
  const reviews = profile.reviewsReceived;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="overflow-hidden rounded-3xl border border-amber-100 bg-white/90 shadow-sm">
        <div className="h-28 bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-200" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="rounded-3xl border-4 border-white bg-white shadow-lg">
                <Avatar
                  name={profile.name}
                  imageUrl={profile.imageUrl}
                  size="xl"
                  className="ring-0"
                />
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                  {profile.name ?? "Book lover"}
                </h1>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500">
                  {profile.district && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {profile.district}
                    </span>
                  )}
                  <span>Joined {formatDate(profile.createdAt)}</span>
                  {isOwnProfile && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      This is you
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pb-1">
              <StatPill
                icon={Star}
                value={
                  reviewCount > 0
                    ? `${(reviewAgg._avg.rating ?? 0).toFixed(1)}★`
                    : "—"
                }
                label={`${reviewCount} review${reviewCount === 1 ? "" : "s"}`}
              />
              <StatPill
                icon={BadgeCheck}
                value={String(profile.badges.length)}
                label="badges"
              />
            </div>
          </div>

          {profile.bio && (
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-stone-600">
              {profile.bio}
            </p>
          )}
          {profile.locationDetail && (
            <p className="mt-2 text-xs text-stone-400">
              📍 {profile.locationDetail}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Active listings ({profile.books.length})
            </h2>
            {profile.books.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No active listings"
                description="This reader doesn't have any books listed right now."
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {profile.books.map((book) => (
                  <a
                    key={book.id}
                    href={`/listings/${book.id}`}
                    className="group overflow-hidden rounded-2xl border border-amber-100 bg-white/85 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-amber-100 to-yellow-100">
                      {book.images[0] ? (
                        <img
                          src={book.images[0]}
                          alt={book.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl">
                          📖
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-semibold text-zinc-900 group-hover:text-amber-700">
                        {book.title}
                      </p>
                      <p className="truncate text-xs text-stone-500">
                        {book.author}
                      </p>
                      {book.price != null && (
                        <p className="mt-1 text-sm font-bold text-amber-600">
                          {formatPrice(book.price)}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900">
              <MessageSquare className="h-5 w-5 text-amber-500" />
              Reviews
            </h2>
            {reviews.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No reviews yet"
                description="After an exchange, both readers can rate each other here."
              />
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-amber-100 bg-white/85 p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={review.reviewer.name}
                          imageUrl={review.reviewer.imageUrl}
                          size="sm"
                        />
                        <p className="text-sm font-semibold text-zinc-900">
                          {review.reviewer.name ?? "Book lover"}
                        </p>
                      </div>
                      <div className="text-right">
                        <StarRating value={review.rating} size={14} />
                        <p className="mt-0.5 text-[11px] text-stone-400">
                          {timeAgo(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm leading-relaxed text-stone-600">
                        “{review.comment}”
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          {!isOwnProfile && (
            <ReviewForm receiverId={profile.id} />
          )}

          <section className="rounded-3xl border border-amber-100 bg-white/85 p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
              <BadgeCheck className="h-5 w-5 text-amber-500" /> Badges
            </h2>
            {profile.badges.length === 0 ? (
              <p className="mt-3 text-sm text-stone-400">
                No badges yet — activity unlocks them!
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {BADGE_ORDER.map((key) => {
                  const meta = BADGES[key];
                  const earned = profile.badges.find(
                    (b) => b.badgeName === meta.name,
                  );
                  return (
                    <div
                      key={key}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-2xl p-3 text-center ring-1",
                        earned
                          ? "bg-gradient-to-b from-amber-50 to-yellow-50 ring-amber-200"
                          : "bg-stone-50 opacity-50 ring-stone-100 grayscale",
                      )}
                      title={meta.description}
                    >
                      <span className="text-2xl">{meta.icon}</span>
                      <p className="text-xs font-semibold text-zinc-900">
                        {meta.name}
                      </p>
                      <p className="text-[10px] leading-tight text-stone-400">
                        {meta.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-amber-100 bg-white/85 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Quick stats</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Books listed</dt>
                <dd className="font-semibold text-zinc-900">{totalListings}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">On shelf</dt>
                <dd className="font-semibold text-zinc-900">
                  {profile._count.userShelves}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Reviews received</dt>
                <dd className="font-semibold text-zinc-900">
                  {profile._count.reviewsReceived}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Star;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3.5 py-2 ring-1 ring-amber-100">
      <Icon className="h-4 w-4 text-amber-500" />
      <span className="text-sm font-bold text-zinc-900">{value}</span>
      <span className="text-xs text-stone-400">{label}</span>
    </div>
  );
}
