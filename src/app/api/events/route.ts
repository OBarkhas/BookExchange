import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { checkAndAwardBadges } from "@/lib/badges";

export async function GET(req: NextRequest) {
  try {
    const user = await getDbUser();
    const myId = user?.id ?? null;

    const showAll = req.nextUrl.searchParams.get("all") === "1";
    const events = await db.event.findMany({
      where: showAll ? undefined : { eventDate: { gte: new Date() } },
      orderBy: { eventDate: "asc" },
      include: {
        organizer: { select: { id: true, name: true, imageUrl: true } },
        _count: { select: { attendees: true } },
      },
    });

    let attendingIds: string[] = [];
    if (myId) {
      const attendance = await db.eventAttendee.findMany({
        where: { userId: myId },
        select: { eventId: true },
      });
      attendingIds = attendance.map((a) => a.eventId);
    }

    return NextResponse.json({ events, attendingIds, myId });
  } catch (error) {
    console.error("[api/events] GET failed:", error);
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

    if (typeof body?.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (typeof body?.description !== "string" || !body.description.trim()) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 },
      );
    }
    if (typeof body?.location !== "string" || !body.location.trim()) {
      return NextResponse.json({ error: "Location is required" }, { status: 400 });
    }

    const eventDate = new Date(body.eventDate);
    if (Number.isNaN(eventDate.getTime())) {
      return NextResponse.json(
        { error: "A valid event date is required" },
        { status: 400 },
      );
    }

    const event = await db.$transaction(async (tx) => {
      const created = await tx.event.create({
        data: {
          title: body.title.trim().slice(0, 120),
          description: body.description.trim().slice(0, 2000),
          location: body.location.trim().slice(0, 200),
          eventDate,
          organizerId: user.id,
        },
      });
      await tx.eventAttendee.create({
        data: { eventId: created.id, userId: user.id },
      });
      return created;
    });

    await checkAndAwardBadges(user.id);

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("[api/events] POST failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
