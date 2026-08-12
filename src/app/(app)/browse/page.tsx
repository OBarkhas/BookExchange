import Link from "next/link";
import { db } from "@/lib/db";
import type { BookCondition, ListingType } from "@/generated/prisma/client";
import BookCard, { type BookCardBook } from "@/components/books/BookCard";
import BookFilters, { type FilterState } from "@/components/books/BookFilters";
import EventBanner from "@/components/events/EventBanner";
import PostCard from "@/components/feed/PostCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { BookOpen, ChevronLeft, ChevronRight, MessagesSquare } from "lucide-react";

const PAGE_SIZE = 12;

const VALID_CONDITIONS = new Set<BookCondition>([
  "LIKE_NEW",
  "GOOD",
  "ACCEPTABLE",
]);
const VALID_LISTING_TYPES = new Set<ListingType>([
  "EXCHANGE_ONLY",
  "SELL_ONLY",
  "BOTH",
]);

type BrowseParams = Record<string, string | string[] | undefined>;

function buildPageHref(params: BrowseParams, page: number): string {
  const search = new URLSearchParams();
  for (const key of ["q", "category", "condition", "listingType", "district", "sort"] as const) {
    const value = params[key];
    if (typeof value === "string" && value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `/browse?${qs}` : "/browse";
}

export default async function BrowsePage({
  searchParams,
}: PageProps<"/browse">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const district = typeof sp.district === "string" ? sp.district : "";
  const listingType = typeof sp.listingType === "string" ? sp.listingType : "";
  const sort = typeof sp.sort === "string" ? sp.sort : "recent";
  const page = Math.max(1, Number(sp.page) || 1);

  const conditionParam = typeof sp.condition === "string" ? sp.condition : "";
  const condition = conditionParam
    ? (conditionParam
        .split(",")
        .map((c) => c.trim())
        .filter((c): c is BookCondition => VALID_CONDITIONS.has(c as BookCondition)))
    : undefined;
  const listingTypeValue =
    listingType && VALID_LISTING_TYPES.has(listingType as ListingType)
      ? (listingType as ListingType)
      : undefined;

  const where = {
    isAvailable: true,
    expiresAt: { gt: new Date() },
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { author: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
            { category: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(category ? { category } : {}),
    ...(condition && condition.length > 0
      ? { condition: { in: condition } }
      : {}),
    ...(listingTypeValue ? { listingType: listingTypeValue } : {}),
    ...(district ? { user: { district } } : {}),
  };

  const orderBy =
    sort === "price_asc"
      ? { price: "asc" as const }
      : sort === "price_desc"
        ? { price: "desc" as const }
        : sort === "oldest"
          ? { createdAt: "asc" as const }
          : { lastBumpedAt: "desc" as const };

  const [listings, total, districtsResult, upcomingEvents, posts] =
    await Promise.all([
      db.book.findMany({
        where,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          title: true,
          author: true,
          category: true,
          condition: true,
          listingType: true,
          price: true,
          images: true,
          lastBumpedAt: true,
          user: {
            select: { id: true, name: true, imageUrl: true, district: true },
          },
        },
      }),
      db.book.count({ where }),
      db.user.findMany({
        where: {
          books: { some: { isAvailable: true, expiresAt: { gt: new Date() } } },
        },
        select: { district: true },
        distinct: ["district"],
      }),
      db.event.findMany({
        where: { eventDate: { gte: new Date() } },
        orderBy: { eventDate: "asc" },
        take: 3,
        select: {
          id: true,
          title: true,
          location: true,
          eventDate: true,
          _count: { select: { attendees: true } },
        },
      }),
      db.communityPost.findMany({
        where: {
          ...(q
            ? {
                OR: [
                  { title: { contains: q, mode: "insensitive" as const } },
                  { body: { contains: q, mode: "insensitive" as const } },
                ],
              }
            : {}),
          ...(category ? { category } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          kind: true,
          title: true,
          body: true,
          category: true,
          createdAt: true,
          user: { select: { id: true, name: true, imageUrl: true } },
        },
      }),
    ]);

  const districts = districtsResult
    .map((u) => u.district)
    .filter((d): d is string => Boolean(d))
    .sort();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const initialFilters: FilterState = {
    q,
    category,
    condition: conditionParam,
    listingType,
    district,
    sort,
  };

  const filterKey = [q, category, conditionParam, listingType, district, sort].join("|");

  return (
    <div>
      <PageHeader
        title="Browse Books"
        subtitle={`${total} pre-loved ${total === 1 ? "book" : "books"} waiting for a new home`}
      />

      <EventBanner events={upcomingEvents} />

      <BookFilters key={filterKey} initial={initialFilters} districts={districts} />

      {posts.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <MessagesSquare className="h-4 w-4 text-violet-500" />
              Community posts
            </h2>
            <span className="text-xs text-stone-400">
              {posts.length} recent
            </span>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {listings.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={BookOpen}
            title="No books found"
            description="Try adjusting your filters or check back soon — new listings appear every day."
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((book) => (
            <BookCard key={book.id} book={book as BookCardBook} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          {page > 1 ? (
            <Link
              href={buildPageHref(sp, page - 1)}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-amber-200 bg-white px-4 text-sm font-semibold text-stone-700 shadow-sm transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-stone-900"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Link>
          ) : (
            <span className="flex h-10 items-center gap-1.5 rounded-xl border border-stone-100 px-4 text-sm font-semibold text-stone-300">
              <ChevronLeft className="h-4 w-4" /> Previous
            </span>
          )}

          <p className="text-sm text-stone-400">
            Page {page} of {totalPages}
          </p>

          {page < totalPages ? (
            <Link
              href={buildPageHref(sp, page + 1)}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 text-sm font-semibold text-white shadow-sm shadow-amber-500/30 transition-all hover:from-amber-600 hover:to-amber-700 active:scale-95"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span className="flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-stone-300">
              Next <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
