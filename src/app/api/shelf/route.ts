import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { checkAndAwardBadges } from "@/lib/badges";
import type { ShelfStatus } from "@/generated/prisma/client";

export async function GET() {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shelf = await db.userBookShelf.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ shelf });
  } catch (error) {
    console.error("[api/shelf] GET failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const title = body?.title;
    const author = body?.author;

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (typeof author !== "string" || !author.trim()) {
      return NextResponse.json({ error: "Author is required" }, { status: 400 });
    }

    const rating =
      typeof body?.rating === "number" &&
      body.rating >= 1 &&
      body.rating <= 5
        ? Math.round(body.rating)
        : null;

    const statusValue = ["READING", "COMPLETED", "WANT_TO_READ"].includes(
      body?.status,
    )
      ? (body.status as ShelfStatus)
      : "COMPLETED";

    const item = await db.userBookShelf.create({
      data: {
        title: title.trim(),
        author: author.trim(),
        status: statusValue,
        rating,
        userId: user.id,
      },
    });

    await checkAndAwardBadges(user.id);

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("[api/shelf] POST failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
