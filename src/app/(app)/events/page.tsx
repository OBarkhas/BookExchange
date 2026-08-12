import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import PageHeader from "@/components/ui/PageHeader";
import EventCard from "@/components/events/EventCard";
import EmptyState from "@/components/ui/EmptyState";

export default async function EventsPage() {
  const user = await getDbUser();
  const myId = user?.id ?? null;

  const [events, attendance] = await Promise.all([
    db.event.findMany({
      where: { eventDate: { gte: new Date() } },
      orderBy: { eventDate: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        eventDate: true,
        organizer: { select: { id: true, name: true, imageUrl: true } },
        _count: { select: { attendees: true } },
      },
    }),
    myId
      ? db.eventAttendee.findMany({
          where: { userId: myId },
          select: { eventId: true },
        })
      : Promise.resolve([]),
  ]);

  const attendingIds = new Set(attendance.map((a) => a.eventId));

  return (
    <div>
      <PageHeader
        title="Book Swap Meets"
        subtitle="Meet local readers, swap books face to face, and make friends."
        actions={
          <Link
            href="/events/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-amber-500/30 transition-all hover:from-amber-600 hover:to-amber-700 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Host a meet
          </Link>
        }
      />

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No swap meets yet"
          description="Be the first to host a meetup in your community — gather a few book lovers and swap stories along with books."
          action={
            <Link
              href="/events/new"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-amber-500/30 transition-all hover:from-amber-600 hover:to-amber-700"
            >
              Host the first meet
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              myId={myId}
              attending={attendingIds.has(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
