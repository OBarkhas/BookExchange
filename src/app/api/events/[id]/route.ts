import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: RouteContext<"/api/events/[id]">,
) {
  try {
    const { id } = await params;
    const event = await db.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true, imageUrl: true } },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, imageUrl: true, district: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("[api/events/:id] GET failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: RouteContext<"/api/events/[id]">,
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const event = await db.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.organizerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const data: Record<string, unknown> = {};

    if (typeof body?.title === "string" && body.title.trim()) {
      data.title = body.title.trim().slice(0, 120);
    }
    if (typeof body?.description === "string" && body.description.trim()) {
      data.description = body.description.trim().slice(0, 2000);
    }
    if (typeof body?.location === "string" && body.location.trim()) {
      data.location = body.location.trim().slice(0, 200);
    }
    if (body?.eventDate) {
      const date = new Date(body.eventDate);
      if (!Number.isNaN(date.getTime())) data.eventDate = date;
    }

    const updated = await db.event.update({ where: { id }, data });
    return NextResponse.json({ event: updated });
  } catch (error) {
    console.error("[api/events/:id] PATCH failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: RouteContext<"/api/events/[id]">,
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const event = await db.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (event.organizerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.event.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/events/:id] DELETE failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
