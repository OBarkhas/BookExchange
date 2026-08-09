import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react";
import { db } from "@/lib/db";
import { getDbUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import { AttendButton } from "@/components/events/AttendButton";

export default async function EventDetailPage({
  params,
}: PageProps<"/events/[id]">) {
  const { id } = await params;
  const user = await getDbUser();

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

  if (!event) notFound();

  const myId = user?.id ?? null;
  const attending = event.attendees.some((a) => a.user.id === myId);
  const isPast = event.eventDate < new Date();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/events"
        className="mb-5 flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
      >
        <ArrowLeft className="h-4 w-4" /> All events
      </Link>

      <div className="overflow-hidden rounded-3xl border border-amber-100 bg-white/90 shadow-sm">
        <div className="bg-gradient-to-r from-amber-100 via-amber-50 to-yellow-100 p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md">
                <span className="text-2xl font-bold leading-none">
                  {event.eventDate.getDate()}
                </span>
                <span className="text-xs font-semibold uppercase">
                  {event.eventDate.toLocaleDateString("en-US", { month: "short" })}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                  {event.title}
                </h1>
                {isPast && <StatusBadge label="Past event" className="mt-1 bg-stone-100 text-stone-500 ring-stone-200" />}
              </div>
            </div>
            {!isPast && (
              <AttendButton eventId={event.id} attending={attending} myId={myId} />
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-4 text-sm text-stone-600">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-amber-500" /> {event.location}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-amber-500" />
              {formatDateTime(event.eventDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-amber-500" />
              {event.attendees.length} attending
            </span>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-400">
            About this meet
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-600">
            {event.description}
          </p>

          <div className="mt-8 flex items-center gap-3">
            <Avatar
              name={event.organizer.name}
              imageUrl={event.organizer.imageUrl}
              size="md"
              userId={event.organizer.id}
            />
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Hosted by {event.organizer.name ?? "Book lover"}
              </p>
              <Link
                href={`/profile/${event.organizer.id}`}
                className="text-xs font-medium text-amber-600 hover:text-amber-700"
              >
                View profile
              </Link>
            </div>
          </div>

          <h3 className="mt-10 text-sm font-semibold uppercase tracking-wide text-stone-400">
            Attendees ({event.attendees.length})
          </h3>
          {event.attendees.length === 0 ? (
            <p className="mt-3 text-sm text-stone-400">
              No one has RSVP&apos;d yet — be the first!
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {event.attendees.map((attendee) => (
                <Link
                  key={attendee.id}
                  href={`/profile/${attendee.user.id}`}
                  className="flex items-center gap-2.5 rounded-xl border border-amber-100 bg-cream p-3 transition-colors hover:border-amber-300"
                >
                  <Avatar
                    name={attendee.user.name}
                    imageUrl={attendee.user.imageUrl}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {attendee.user.name ?? "Book lover"}
                      {attendee.user.id === event.organizer.id && (
                        <span className="ml-1 text-[10px] font-semibold text-amber-600">
                          host
                        </span>
                      )}
                    </p>
                    {attendee.user.district && (
                      <p className="truncate text-xs text-stone-400">
                        {attendee.user.district}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
