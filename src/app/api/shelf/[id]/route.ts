import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import type { ShelfStatus } from "@/generated/prisma/client";

export async function PATCH(
  req: Request,
  { params }: RouteContext<"/api/shelf/[id]">,
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const item = await db.userBookShelf.findUnique({ where: { id } });
    if (!item || item.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);

    const data: {
      status?: ShelfStatus;
      rating?: number | null;
      title?: string;
      author?: string;
    } = {};

    if (body?.status && ["READING", "COMPLETED", "WANT_TO_READ"].includes(body.status)) {
      data.status = body.status as ShelfStatus;
    }
    if (typeof body?.rating === "number") {
      data.rating =
        body.rating >= 1 && body.rating <= 5 ? Math.round(body.rating) : null;
    }
    if (typeof body?.title === "string" && body.title.trim()) {
      data.title = body.title.trim();
    }
    if (typeof body?.author === "string" && body.author.trim()) {
      data.author = body.author.trim();
    }

    const updated = await db.userBookShelf.update({ where: { id }, data });
    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("[api/shelf/:id] PATCH failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: RouteContext<"/api/shelf/[id]">,
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const item = await db.userBookShelf.findUnique({ where: { id } });
    if (!item || item.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.userBookShelf.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/shelf/:id] DELETE failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
