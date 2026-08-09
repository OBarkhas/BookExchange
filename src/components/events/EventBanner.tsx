import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";

interface BannerEvent {
  id: string;
  title: string;
  location: string;
  eventDate: Date;
  _count: { attendees: number };
}

export default function EventBanner({ events }: { events: BannerEvent[] }) {
  if (events.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <CalendarDays className="h-4 w-4 text-amber-500" />
          Upcoming swap meets
        </h2>
        <Link
          href="/events"
          className="text-xs font-medium text-amber-600 transition-colors hover:text-amber-700"
        >
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {events.map((event) => {
          const date = new Date(event.eventDate);
          return (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-amber-100 bg-white/85 p-3.5 shadow-sm shadow-amber-900/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm">
                <span className="text-base font-bold leading-none">
                  {date.getDate()}
                </span>
                <span className="text-[9px] font-semibold uppercase">
                  {date.toLocaleDateString("en-US", { month: "short" })}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 transition-colors group-hover:text-amber-700">
                  {event.title}
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-stone-400">
                  <MapPin className="h-3 w-3 shrink-0" /> {event.location}
                  <span className="text-stone-300">·</span>
                  {event._count.attendees} going
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
