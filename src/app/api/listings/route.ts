import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { checkAndAwardBadges } from "@/lib/badges";
import { createNotification } from "@/lib/notify";
import { LISTING_DURATION_DAYS } from "@/lib/utils";
import type { BookCondition, ListingType } from "@/generated/prisma/client";

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

/**
 * GET /api/listings
 *
 * Search & filter listings. Supported query params:
 *   q, category, district, condition (comma-separated), listingType,
 *   sort (recent | oldest | price_asc | price_desc), page
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim() || undefined;
    const category = sp.get("category") || undefined;
    const district = sp.get("district") || undefined;
    const conditionRaw = sp.get("condition") || undefined;
    const listingType = sp.get("listingType") || undefined;
    const sort = sp.get("sort") || "recent";
    const page = Math.max(1, Number(sp.get("page") ?? 1));

    // Whitelist enum values from the URL so malformed params never 500.
    const condition = conditionRaw
      ? (conditionRaw
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

    const [listings, total] = await Promise.all([
      db.book.findMany({
        where,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              district: true,
            },
          },
        },
      }),
      db.book.count({ where }),
    ]);

    return NextResponse.json({
      listings,
      total,
      page,
      pageSize: PAGE_SIZE,
      hasMore: page * PAGE_SIZE < total,
    });
  } catch (error) {
    console.error("[api/listings] GET failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/listings
 *
 * Creates a new book listing owned by the current user. Listings live for
 * 30 days (expiresAt) and can be "bumped" to extend their lifespan.
 */
export async function POST(req: Request) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const {
      title,
      author,
      category,
      condition,
      hasDamage,
      damageDescription,
      images,
      listingType,
      price,
      exchangePreference,
      description,
    } = body as Record<string, unknown>;

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (typeof author !== "string" || !author.trim()) {
      return NextResponse.json({ error: "Author is required" }, { status: 400 });
    }
    if (typeof category !== "string" || !category.trim()) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const listingTypeValue = (listingType as ListingType) ?? "BOTH";
    const sellOnly = listingTypeValue !== "EXCHANGE_ONLY";
    const priceValue =
      typeof price === "number" && Number.isFinite(price) && price >= 0 && sellOnly
        ? price
        : null;

    if (sellOnly && priceValue == null) {
      return NextResponse.json(
        { error: "Please set a price for sellable listings" },
        { status: 400 },
      );
    }

    const book = await db.book.create({
      data: {
        title: title.trim(),
        author: author.trim(),
        category: category.trim(),
        condition: (condition as BookCondition) ?? "GOOD",
        hasDamage: Boolean(hasDamage),
        damageDescription:
          typeof damageDescription === "string" && damageDescription.trim()
            ? damageDescription.trim()
            : null,
        images: Array.isArray(images)
          ? images.filter((i): i is string => typeof i === "string" && i.length > 0).slice(0, 6)
          : [],
        listingType: listingTypeValue,
        price: priceValue,
        exchangePreference:
          typeof exchangePreference === "string" && exchangePreference.trim()
            ? exchangePreference.trim()
            : null,
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        expiresAt: new Date(Date.now() + LISTING_DURATION_DAYS * 86_400_000),
        userId: user.id,
      },
    });

    await Promise.all([
      checkAndAwardBadges(user.id),
      createNotification(
        user.id,
        "Your book is live! 🎉",
        `"${book.title}" is now listed on BookLoop for 30 days.`,
        `/listings/${book.id}`,
      ),
    ]);

    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    console.error("[api/listings] POST failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
