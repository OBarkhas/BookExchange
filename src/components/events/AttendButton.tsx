"use client";

import { useOptimistic, useTransition } from "react";
import { CalendarPlus, CalendarCheck } from "lucide-react";
import { toggleAttend } from "@/actions/events";
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
  const [, startTransition] = useTransition();
  const [optimisticAttending, addOptimistic] = useOptimistic(
    attending,
    (_current: boolean, next: boolean) => next,
  );

  const toggle = async () => {
    if (!myId) return;
    const next = !optimisticAttending;
    startTransition(() => addOptimistic(next));
    try {
      const result = await toggleAttend(eventId, next);
      showToast(
        result.attending ? "You're going! 🎉" : "RSVP cancelled",
        result.attending ? "success" : "info",
      );
    } catch (err) {
      addOptimistic(attending);
      showToast(err instanceof Error ? err.message : "Could not RSVP", "error");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!myId}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60",
        optimisticAttending
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          : "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/30 hover:from-amber-600 hover:to-amber-700",
      )}
    >
      {optimisticAttending ? (
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
