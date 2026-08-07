"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, CalendarCheck } from "lucide-react";
import { fetcher } from "@/lib/utils";
import { showToast } from "@/components/ui/ToastContainer";
import { cn } from "@/lib/utils";

export function AttendButton({
  eventId,
  attending,
  myId,
}: {
  eventId: string;
  attending: boolean;
  myId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      if (attending) {
        await fetcher(`/api/events/${eventId}/attend`, { method: "DELETE" });
        showToast("RSVP cancelled", "info");
      } else {
        await fetcher(`/api/events/${eventId}/attend`, { method: "POST" });
        showToast("You're going! 🎉");
      }
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not RSVP", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={!myId || busy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60",
        attending
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          : "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/30 hover:from-amber-600 hover:to-amber-700",
      )}
    >
      {attending ? (
        <>
          <CalendarCheck className="h-3.5 w-3.5" /> Going
        </>
      ) : (
        <>
          <CalendarPlus className="h-3.5 w-3.5" /> Join
        </>
      )}
    </button>
  );
}
