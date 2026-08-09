import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { createNotification } from "@/lib/notify";

export async function POST(
  req: Request,
  { params }: RouteContext<"/api/listings/[id]/request">,
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const book = await db.book.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (book.userId === user.id) {
      return NextResponse.json(
        { error: "You can't request your own book" },
        { status: 400 },
      );
    }
    if (!book.isAvailable || book.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "This listing is no longer available" },
        { status: 400 },
      );
    }

    const existing = await db.exchangeRequest.findFirst({
      where: { bookId: book.id, senderId: user.id, status: "PENDING" },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending request for this book" },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => null);
    const message =
      body && typeof body.message === "string" && body.message.trim()
        ? body.message.trim().slice(0, 500)
        : null;
    const offeredBook =
      body && typeof body.offeredBook === "string" && body.offeredBook.trim()
        ? body.offeredBook.trim().slice(0, 200)
        : null;

    const request = await db.exchangeRequest.create({
      data: {
        bookId: book.id,
        senderId: user.id,
        receiverId: book.userId,
        message,
        offeredBook,
      },
    });

    await createNotification(
      book.userId,
      "New swap request! 📬",
      `${user.name ?? "Someone"} wants to get "${book.title}".`,
      "/exchanges",
    );

    return NextResponse.json({ request }, { status: 201 });
  } catch (error) {
    console.error("[api/listings/:id/request] POST failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
