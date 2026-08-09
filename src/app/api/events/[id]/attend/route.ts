import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { createNotification } from "@/lib/notify";

export async function POST(
  _req: Request,
  { params }: RouteContext<"/api/events/[id]/attend">,
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const event = await db.event.findUnique({
      where: { id },
      include: { organizer: { select: { id: true } } },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const existing = await db.eventAttendee.findUnique({
      where: { eventId_userId: { eventId: id, userId: user.id } },
    });
    if (!existing) {
      await db.eventAttendee.create({
        data: { eventId: id, userId: user.id },
      });
      if (event.organizerId !== user.id) {
        await createNotification(
          event.organizerId,
          "New RSVP 🎟️",
          `${user.name ?? "Someone"} is coming to "${event.title}".`,
          "/events",
        );
      }
    }

    return NextResponse.json({ attending: true }, { status: 201 });
  } catch (error) {
    console.error("[api/events/:id/attend] POST failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: RouteContext<"/api/events/[id]/attend">,
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.eventAttendee.deleteMany({
      where: { eventId: id, userId: user.id },
    });

    return NextResponse.json({ attending: false });
  } catch (error) {
    console.error("[api/events/:id/attend] DELETE failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
