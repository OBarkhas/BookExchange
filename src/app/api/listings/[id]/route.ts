import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { LISTING_DURATION_DAYS } from "@/lib/utils";
import { EXCHANGE_LOCKED_STATUSES } from "@/lib/categories";
import type { BookCondition, ListingType } from "@/generated/prisma/client";

export async function GET(
  _req: Request,
  { params }: RouteContext<"/api/listings/[id]">,
) {
  try {
    const { id } = await params;
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

    if (!book) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ book });
  } catch (error) {
    console.error("[api/listings/:id] GET failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: RouteContext<"/api/listings/[id]">,
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const book = await db.book.findUnique({ where: { id } });
    if (!book) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (book.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (body.bump === true) {
      const updated = await db.book.update({
        where: { id },
        data: {
          lastBumpedAt: new Date(),
          expiresAt: new Date(Date.now() + LISTING_DURATION_DAYS * 86_400_000),
        },
      });
      return NextResponse.json({ book: updated });
    }

    if (typeof body.isAvailable === "boolean") {
      const updated = await db.book.update({
        where: { id },
        data: { isAvailable: body.isAvailable },
      });
      return NextResponse.json({ book: updated });
    }

    const locked = await db.exchangeRequest.findFirst({
      where: { bookId: id, status: { in: EXCHANGE_LOCKED_STATUSES } },
      select: { id: true },
    });
    if (locked) {
      return NextResponse.json(
        {
          error:
            "This listing has an active or completed exchange and cannot be edited.",
        },
        { status: 409 },
      );
    }

    const { title, author, category, condition, hasDamage, damageDescription, images, listingType, price, exchangePreference, description } = body as Record<string, unknown>;

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (typeof author !== "string" || !author.trim()) {
      return NextResponse.json({ error: "Author is required" }, { status: 400 });
    }
    if (typeof category !== "string" || !category.trim()) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const listingTypeValue = (listingType as ListingType) ?? book.listingType;
    const sellOnly = listingTypeValue !== "EXCHANGE_ONLY";
    const priceValue =
      typeof price === "number" && Number.isFinite(price) && price >= 0 && sellOnly
        ? price
        : null;

    const updated = await db.book.update({
      where: { id },
      data: {
        title: title.trim(),
        author: author.trim(),
        category: category.trim(),
        condition: (condition as BookCondition) ?? book.condition,
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
      },
    });

    return NextResponse.json({ book: updated });
  } catch (error) {
    console.error("[api/listings/:id] PATCH failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: RouteContext<"/api/listings/[id]">,
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const book = await db.book.findUnique({ where: { id } });
    if (!book) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (book.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.book.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/listings/:id] DELETE failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
