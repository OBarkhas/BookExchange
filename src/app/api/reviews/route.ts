import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { createNotification } from "@/lib/notify";
import { checkAndAwardBadges } from "@/lib/badges";

/**
 * POST /api/reviews  body: { receiverId, rating, comment }
 *
 * One review per (reviewer, receiver) pair — posting again updates the existing one.
 */
export async function POST(req: Request) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    const receiverId =
      typeof body?.receiverId === "string" ? body.receiverId : null;
    if (!receiverId) {
      return NextResponse.json(
        { error: "receiverId is required" },
        { status: 400 },
      );
    }
    if (receiverId === user.id) {
      return NextResponse.json(
        { error: "You can't review yourself" },
        { status: 400 },
      );
    }

    const rating =
      typeof body?.rating === "number" &&
      body.rating >= 1 &&
      body.rating <= 5
        ? Math.round(body.rating)
        : null;
    if (rating == null) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    const receiver = await db.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const comment =
      typeof body?.comment === "string" && body.comment.trim()
        ? body.comment.trim().slice(0, 500)
        : null;

    // One review per (reviewer, receiver) pair, enforced atomically by the
    // @@unique constraint and upsert.
    const review = await db.review.upsert({
      where: {
        reviewerId_receiverId: { reviewerId: user.id, receiverId },
      },
      create: { reviewerId: user.id, receiverId, rating, comment },
      update: { rating, comment },
    });

    await Promise.all([
      checkAndAwardBadges(receiverId),
      createNotification(
        receiverId,
        "You received a review ⭐",
        `${user.name ?? "Someone"} rated you ${rating}/5.`,
        `/profile/${receiverId}`,
      ),
    ]);

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("[api/reviews] POST failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
