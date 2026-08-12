"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { BookOpen, ChevronDown, User, Bell, LogOut } from "lucide-react";
import NotificationBell from "./NotificationBell";
import PostComposer from "@/components/feed/PostComposer";
import Avatar from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export default function Topbar({ userId }: { userId: string }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-amber-100/80 bg-cream/85 pt-[max(env(safe-area-inset-top),0px)] backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between gap-2 px-4 sm:h-16 sm:max-w-2xl sm:gap-3 sm:px-6 lg:max-w-6xl">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2 sm:gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm shadow-amber-500/25">
            <BookOpen className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="truncate text-lg font-bold tracking-tight text-zinc-900">
            Book<span className="text-amber-600">Loop</span>
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <PostComposer
            label="Post"
            className="hidden shrink-0 sm:inline-flex"
          />

          <NotificationBell />

          <div ref={menuRef} className="relative flex shrink-0 items-center">
            <Link
              href={`/profile/${userId}`}
              aria-label="Open my profile"
              title="My profile"
              className="rounded-full ring-2 ring-amber-300 ring-offset-2 ring-offset-cream transition-shadow duration-200 hover:shadow-md hover:shadow-amber-500/20"
            >
              <Avatar
                name={user?.fullName ?? null}
                imageUrl={user?.imageUrl ?? null}
                size="sm"
                className="ring-0"
              />
            </Link>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Account menu"
              aria-expanded={menuOpen}
              className="ml-0.5 flex h-7 w-6 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-amber-100/70 hover:text-stone-700"
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  menuOpen && "rotate-180",
                )}
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-xl shadow-amber-900/10">
                <div className="border-b border-stone-100 bg-amber-50/50 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {user?.fullName ?? "Book lover"}
                  </p>
                  <p className="truncate text-xs text-stone-400">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
                <Link
                  href={`/profile/${userId}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-amber-50"
                >
                  <User className="h-4 w-4 text-amber-500" /> My profile
                </Link>
                <Link
                  href="/notifications"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-stone-700 transition-colors hover:bg-amber-50"
                >
                  <Bell className="h-4 w-4 text-amber-500" /> Notifications
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                  className="flex w-full items-center gap-2.5 border-t border-stone-100 px-4 py-3 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
