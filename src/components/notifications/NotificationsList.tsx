"use client";

import { useEffect, useState } from "react";
import { BellRing, Trash2, Check, Inbox } from "lucide-react";
import { fetcher, timeAgo } from "@/lib/utils";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetcher<{ notifications: NotificationItem[] }>("/api/notifications", {
      cache: "no-store",
    })
      .then((data) => {
        if (!cancelled) setNotifications(data.notifications);
      })
      .catch(() => {
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await fetcher("/api/notifications", { method: "PATCH" }).catch(() => {});
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => {});
  };

  const remove = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await fetcher(`/api/notifications/${id}`, { method: "DELETE" }).catch(
      () => {},
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-stone-500">
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
            : "You're all caught up"}
        </p>
        {unreadCount > 0 && (
          <Button size="sm" variant="secondary" onClick={markAllRead}>
            <Check className="h-3.5 w-3.5" /> Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl bg-amber-100/40"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No notifications yet"
          description="When someone requests your books or messages you, it will show up here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "group flex items-start gap-3 rounded-2xl border border-amber-100 bg-white/85 p-4 shadow-sm transition-colors hover:border-amber-300",
                !n.isRead && "border-amber-200 bg-amber-50/50",
              )}
            >
              <span
                className={cn(
                  "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                  n.isRead ? "bg-transparent" : "bg-amber-500",
                )}
              />
              <a
                href={n.link ?? "/notifications"}
                onClick={() => markRead(n.id)}
                className="min-w-0 flex-1"
              >
                <p className="font-semibold text-zinc-900">{n.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-stone-500">
                  {n.message}
                </p>
                <p className="mt-1.5 text-xs text-stone-400">
                  {timeAgo(n.createdAt)}
                </p>
              </a>
              <button
                onClick={() => remove(n.id)}
                aria-label="Delete notification"
                className="rounded-lg p-1.5 text-stone-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {notifications.length > 0 && (
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-stone-400">
          <BellRing className="h-3 w-3" /> Notifications also appear in the bell
          icon while you browse.
        </p>
      )}
    </div>
  );
}
