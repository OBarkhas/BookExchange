"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, Inbox } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { fetcher, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const { isLoaded, isSignedIn } = useUser();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;

    const load = () => {
      fetcher<{ notifications: NotificationItem[]; unreadCount: number }>(
        "/api/notifications",
        { cache: "no-store" },
      )
        .then((data) => {
          if (cancelled) return;
          setNotifications(data.notifications.slice(0, 5));
          setUnread(data.unreadCount);
        })
        .catch(() => {
        });
    };

    load();
    const interval = setInterval(load, 20_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const markRead = (id: string) => {
    setUnread((u) => Math.max(0, u - 1));
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {});
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-amber-100/70 hover:text-stone-900"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-xl shadow-amber-900/10">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <p className="text-sm font-semibold text-zinc-900">Notifications</p>
            {unread > 0 && (
              <button
                onClick={() => {
                  fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
                  setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                  setUnread(0);
                }}
                className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Inbox className="h-6 w-6 text-stone-300" />
              <p className="text-sm text-stone-400">You&apos;re all caught up</p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.link ?? "/notifications"}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "block border-b border-stone-50 px-4 py-3 transition-colors hover:bg-amber-50/60",
                      !n.isRead && "bg-amber-50/40",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          n.isRead ? "bg-transparent" : "bg-amber-500",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {n.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">
                          {n.message}
                        </p>
                        <p className="mt-1 text-[11px] text-stone-400">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-stone-100 bg-stone-50/60 py-2.5 text-center text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
