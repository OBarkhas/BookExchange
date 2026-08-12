"use client";

import { useOptimistic, useTransition } from "react";
import { Check, X, CheckCheck, Ban } from "lucide-react";
import { updateRequestStatus } from "@/actions/requests";
import { showToast } from "@/components/ui/ToastContainer";
import type { RequestStatus } from "@/generated/prisma/client";

interface RequestActionsProps {
  requestId: string;
  status: RequestStatus;
  isOwner: boolean;
}

export default function RequestActions({
  requestId,
  status,
  isOwner,
}: RequestActionsProps) {
  const [, startTransition] = useTransition();
  const [optimisticStatus, addOptimistic] = useOptimistic(
    status,
    (_current: RequestStatus, next: RequestStatus) => next,
  );

  const transition = async (nextStatus: RequestStatus) => {
    startTransition(() => addOptimistic(nextStatus));
    try {
      await updateRequestStatus(requestId, nextStatus);
      if (nextStatus === "ACCEPTED") {
        showToast("Request accepted — chat unlocked! 🎉");
      } else if (nextStatus === "REJECTED") {
        showToast("Request declined", "info");
      } else if (nextStatus === "COMPLETED") {
        showToast("Exchange completed! 🏆");
      }
    } catch (err) {
      addOptimistic(status);
      showToast(err instanceof Error ? err.message : "Action failed", "error");
    }
  };

  if (optimisticStatus === "PENDING" && isOwner) {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => transition("ACCEPTED")}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-emerald-600 active:scale-95"
        >
          <Check className="h-3.5 w-3.5" /> Accept
        </button>
        <button
          type="button"
          onClick={() => transition("REJECTED")}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-50 active:scale-95"
        >
          <X className="h-3.5 w-3.5" /> Decline
        </button>
      </div>
    );
  }

  if (optimisticStatus === "PENDING") {
    return (
      <button
        type="button"
        onClick={() => transition("REJECTED")}
        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-500 transition-all hover:bg-stone-50 active:scale-95"
      >
        <Ban className="h-3.5 w-3.5" /> Cancel request
      </button>
    );
  }

  if (optimisticStatus === "ACCEPTED") {
    return (
      <button
        type="button"
        onClick={() => transition("COMPLETED")}
        className="inline-flex items-center gap-1 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-violet-600 active:scale-95"
      >
        <CheckCheck className="h-3.5 w-3.5" /> Mark completed
      </button>
    );
  }

  return null;
}
