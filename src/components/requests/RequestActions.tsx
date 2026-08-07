"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, CheckCheck, Ban } from "lucide-react";
import { fetcher } from "@/lib/utils";
import { showToast } from "@/components/ui/ToastContainer";
import type { RequestStatus } from "@/generated/prisma/client";

interface RequestActionsProps {
  requestId: string;
  status: RequestStatus;
  /** Whether the current user is the receiver (listing owner). */
  isOwner: boolean;
}

export default function RequestActions({
  requestId,
  status,
  isOwner,
}: RequestActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const transition = async (nextStatus: RequestStatus) => {
    setBusy(nextStatus);
    try {
      await fetcher(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (nextStatus === "ACCEPTED") {
        showToast("Request accepted — chat unlocked! 🎉");
      } else if (nextStatus === "REJECTED") {
        showToast("Request declined", "info");
      } else if (nextStatus === "COMPLETED") {
        showToast("Exchange completed! 🏆");
      }
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Action failed", "error");
    } finally {
      setBusy(null);
    }
  };

  if (status === "PENDING" && isOwner) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => transition("ACCEPTED")}
          disabled={busy !== null}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-emerald-600 active:scale-95 disabled:opacity-60"
        >
          <Check className="h-3.5 w-3.5" /> Accept
        </button>
        <button
          onClick={() => transition("REJECTED")}
          disabled={busy !== null}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-50 active:scale-95 disabled:opacity-60"
        >
          <X className="h-3.5 w-3.5" /> Decline
        </button>
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <button
        onClick={() => transition("REJECTED")}
        disabled={busy !== null}
        className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-500 transition-all hover:bg-stone-50 active:scale-95 disabled:opacity-60"
      >
        <Ban className="h-3.5 w-3.5" /> Cancel request
      </button>
    );
  }

  if (status === "ACCEPTED") {
    return (
      <button
        onClick={() => transition("COMPLETED")}
        disabled={busy !== null}
        className="inline-flex items-center gap-1 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-violet-600 active:scale-95 disabled:opacity-60"
      >
        <CheckCheck className="h-3.5 w-3.5" /> Mark completed
      </button>
    );
  }

  return null;
}
