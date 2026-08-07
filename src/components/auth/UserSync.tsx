"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { showToast } from "@/components/ui/ToastContainer";

export default function UserSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      syncedUserId.current = null;
      return;
    }

    if (syncedUserId.current === user.id) return;
    syncedUserId.current = user.id;

    let cancelled = false;

    fetch("/api/auth/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error ?? "Could not sync your account");
        }
        if (!cancelled && data?.created) {
          showToast(`Welcome to BookLoop, ${user.firstName ?? "book lover"}!`);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.error("[UserSync] Account sync failed:", err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user]);

  return null;
}
