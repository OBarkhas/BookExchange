import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  BadgeCheck,
  Star,
  MessageSquare,
  Library,
  ArrowLeftRight,
} from "lucide-react";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { formatDate, timeAgo, cn } from "@/lib/utils";
import { EXCHANGE_LOCKED_STATUSES } from "@/lib/categories";
import Avatar from "@/components/ui/Avatar";
import StarRating from "@/components/ui/StarRating";
import EmptyState from "@/components/ui/EmptyState";
import ReviewForm from "@/components/profile/ReviewForm";
import BioEditor from "@/components/profile/BioEditor";
import AnimatedTabs from "@/components/ui/AnimatedTabs";
import ListingManageCard from "@/components/books/ListingManageCard";
import ShelfSection from "@/components/shelf/ShelfSection";
import WishlistSection from "@/components/shelf/WishlistSection";
import { BADGE_ORDER, BADGES } from "@/lib/badges";
import type {
  Book,
  RequestStatus,
  UserBookShelf,
  Wishlist,
} from "@/generated/prisma/client";

type ProfileTab = "listings" | "shelf" | "wishlist";

export default async function ProfilePage({
  params,
  searchParams,
}: PageProps<"/profile/[userId]">) {
  const { userId } = await params;
  const sp = await searchParams;
  const me = await getDbUser();

  const isOwnProfile = me?.id === userId;

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
    },
  });

  if (!profile) notFound();

  const rawTab = sp.tab;
  const tab: ProfileTab =
    isOwnProfile && (rawTab === "shelf" || rawTab === "wishlist")
      ? rawTab
      : "listings";

  const [reviewAgg, shelf, wishlist, completedSwaps, books] = await Promise.all([
    db.review.aggregate({
      where: { receiverId: profile.id },
      _avg: { rating: true },
      _count: true,
    }),
    isOwnProfile
      ? db.userBookShelf.findMany({
          where: { userId: profile.id },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve<UserBookShelf[]>([]),
    isOwnProfile
      ? db.wishlist.findMany({
          where: { userId: profile.id },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve<Wishlist[]>([]),
    db.exchangeRequest.count({
      where: {
        OR: [{ senderId: profile.id }, { receiverId: profile.id }],
        status: "COMPLETED",
      },
    }),
    db.book.findMany({
      where: {
        userId: profile.id,
        expiresAt: { gt: new Date() },
        ...(isOwnProfile ? {} : { isAvailable: true }),
      },
      orderBy: { lastBumpedAt: "desc" },
      include: isOwnProfile
        ? {
            requests: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { status: true },
            },
          }
        : undefined,
    }),
  ]);

  const reviewCount = reviewAgg._count;
  const avgRating = reviewAgg._avg.rating ?? 0;
  const reviews = profile.reviewsReceived;
  const activeListings = books.filter((b) => b.isAvailable).length;

  const stats = [
    { label: "Active listings", value: activeListings, icon: Library },
    { label: "Completed swaps", value: completedSwaps, icon: ArrowLeftRight },
    {
      label: "Rating",
      value: reviewCount > 0 ? `${avgRating.toFixed(1)} ★` : "—",
      hint: `${reviewCount} review${reviewCount === 1 ? "" : "s"}`,
      icon: Star,
    },
    { label: "Badges", value: profile.badges.length, icon: BadgeCheck },
  ];

  const tabItems = [
    {
      value: "listings",
      label: "Active Listings",
      iconName: "listings",
      count: activeListings,
    },
    ...(isOwnProfile
      ? [
          { value: "shelf", label: "My Shelf", iconName: "shelf", count: shelf.length },
          {
            value: "wishlist",
            label: "Wishlist",
            iconName: "wishlist",
            count: wishlist.length,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="overflow-hidden rounded-3xl border border-amber-100 bg-white/90 shadow-sm">
        <div className="h-28 bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-200" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="rounded-3xl border-4 border-white bg-white shadow-lg transition-transform duration-200 hover:scale-[1.02]">
                <Avatar
                  name={profile.name}
                  imageUrl={profile.imageUrl}
                  size="xl"
                  userId={profile.id}
                  className="ring-0"
                />
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                  {profile.name ?? "Book lover"}
                </h1>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500">
                  {profile.district && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                      <MapPin className="h-3 w-3" /> {profile.district}
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
          </div>

          <BioEditor
            profileId={profile.id}
            initialBio={profile.bio}
            canEdit={isOwnProfile}
          />
          {profile.locationDetail && (
            <p className="mt-2 text-xs text-stone-400">
              📍 {profile.locationDetail}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-white/85 px-4 py-3.5 shadow-sm shadow-amber-900/5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight text-zinc-900">
                {stat.value}
              </p>
              <p className="truncate text-xs text-stone-400">
                {stat.label}
                {"hint" in stat && stat.hint ? ` · ${stat.hint}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <AnimatedTabs
          layoutId="profile-tabs"
          basePath={`/profile/${profile.id}`}
          defaultTab="listings"
          active={tab}
          items={tabItems}
        />

        {tab === "listings" && (
          <div className="mt-6 space-y-10">
            <section>
              <h2 className="mb-1 text-lg font-semibold text-zinc-900">
                {isOwnProfile
                  ? `Your listings (${books.length})`
                  : `Active listings (${activeListings})`}
              </h2>
              {isOwnProfile && books.length > 0 && (
                <p className="mb-4 text-xs text-stone-400">
                  {activeListings} active
                  {books.length - activeListings > 0 &&
                    ` · ${books.length - activeListings} sold/paused`}
                </p>
              )}
              {books.length === 0 ? (
                <EmptyState
                  icon={Library}
                  title="No active listings"
                  description={
                    isOwnProfile
                      ? "List a book to start swapping with your neighbourhood."
                      : "This reader doesn't have any books listed right now."
                  }
                  action={
                    isOwnProfile ? (
                      <Link
                        href="/listings/new"
                        className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-amber-500/30 transition-all hover:from-amber-600 hover:to-amber-700"
                      >
                        List a book
                      </Link>
                    ) : undefined
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {books.map((book) => {
                    const reqStatus = (
                      book as Book & { requests?: { status: RequestStatus }[] }
                    ).requests?.[0]?.status;
                    const hasActiveExchange =
                      !!reqStatus &&
                      EXCHANGE_LOCKED_STATUSES.includes(reqStatus);
                    return (
                      <ListingManageCard
                        key={book.id}
                        book={book}
                        hasActiveExchange={hasActiveExchange}
                        canManage={isOwnProfile}
                        layout="grid"
                      />
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-900">
                <MessageSquare className="h-5 w-5 text-amber-500" />
                Reviews
              </h2>
              {!isOwnProfile && <ReviewForm receiverId={profile.id} />}
              {reviews.length === 0 ? (
                <EmptyState
                  icon={Star}
                  title="No reviews yet"
                  description="After an exchange, both readers can rate each other here."
                />
              ) : (
                <div className="mt-4 space-y-4">
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
                            userId={review.reviewer.id}
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

            <section className="rounded-3xl border border-amber-100 bg-white/85 p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
                <BadgeCheck className="h-5 w-5 text-amber-500" /> Badges
              </h2>
              {profile.badges.length === 0 ? (
                <p className="mt-3 text-sm text-stone-400">
                  No badges yet — activity unlocks them!
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
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
          </div>
        )}

        {tab === "shelf" && isOwnProfile && (
          <div className="mt-6">
            <ShelfSection initialShelf={shelf} />
          </div>
        )}
        {tab === "wishlist" && isOwnProfile && (
          <div className="mt-6">
            <WishlistSection initialWishlist={wishlist} />
          </div>
        )}
      </div>
    </div>
  );
}
