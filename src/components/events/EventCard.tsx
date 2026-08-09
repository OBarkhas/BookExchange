import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { formatDateTime, cn } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import { AttendButton } from "./AttendButton";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    location: string;
    eventDate: Date;
    organizer: { id: string; name: string | null; imageUrl: string | null };
    _count: { attendees: number };
  };
  myId: string | null;
  attending: boolean;
}

export default function EventCard({ event, myId, attending }: EventCardProps) {
  const date = new Date(event.eventDate);
  const isPast = date < new Date();
  const isMine = myId === event.organizer.id;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-amber-100 bg-white/85 shadow-sm shadow-amber-900/5 transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10",
        isPast && "opacity-60",
      )}
    >
      <div className="flex items-center gap-4 border-b border-amber-50 bg-gradient-to-r from-amber-50 to-yellow-50 p-5">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm">
          <span className="text-lg font-bold leading-none">
            {date.getDate()}
          </span>
          <span className="text-[10px] font-semibold uppercase">
            {date.toLocaleDateString("en-US", { month: "short" })}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/events/${event.id}`}
            className="line-clamp-1 font-semibold text-zinc-900 transition-colors hover:text-amber-700"
          >
            {event.title}
          </Link>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
            <MapPin className="h-3 w-3 shrink-0" /> {event.location}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-400">
            <CalendarDays className="h-3 w-3 shrink-0" />
            {formatDateTime(event.eventDate)}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-2 text-sm leading-relaxed text-stone-600">
          {event.description}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar
              name={event.organizer.name}
              imageUrl={event.organizer.imageUrl}
              size="xs"
              userId={event.organizer.id}
            />
            <div className="leading-tight">
              <p className="text-xs font-medium text-stone-700">
                {event.organizer.name ?? "Book lover"}
                {isMine && (
                  <span className="ml-1 text-[10px] font-semibold text-amber-600">
                    · host
                  </span>
                )}
              </p>
              <p className="flex items-center gap-0.5 text-[11px] text-stone-400">
                <Users className="h-2.5 w-2.5" />
                {event._count.attendees} attending
              </p>
            </div>
          </div>
          {!isPast && (
            <AttendButton
              eventId={event.id}
              attending={attending}
              myId={myId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
