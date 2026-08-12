"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { createNotification } from "@/lib/notify";

export async function toggleAttend(eventId: string, attend: boolean) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { organizer: { select: { id: true } } },
  });
  if (!event) throw new Error("Event not found");

  if (attend) {
    const existing = await db.eventAttendee.findUnique({
      where: { eventId_userId: { eventId, userId: user.id } },
    });
    if (!existing) {
      await db.eventAttendee.create({ data: { eventId, userId: user.id } });
      if (event.organizerId !== user.id) {
        await createNotification(
          event.organizerId,
          "New RSVP 🎟️",
          `${user.name ?? "Someone"} is coming to "${event.title}".`,
          "/events",
        );
      }
    }
  } else {
    await db.eventAttendee.deleteMany({ where: { eventId, userId: user.id } });
  }

  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  return { attending: attend };
}
