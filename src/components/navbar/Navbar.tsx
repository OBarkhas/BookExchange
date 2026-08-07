"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  Menu,
  X,
  Repeat,
  MessageSquare,
  CalendarDays,
  Library,
  Compass,
  Plus,
} from "lucide-react";
import { Show, UserButton } from "@clerk/nextjs";
import NotificationBell from "./NotificationBell";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/browse", label: "Browse", icon: Compass },
  { href: "/exchanges", label: "Exchanges", icon: Repeat },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/shelf", label: "My Shelf", icon: Library },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-amber-100/80 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm shadow-amber-500/25">
            <BookOpen className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900">
            Book<span className="text-amber-600">Loop</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-amber-100/80 text-amber-700"
                    : "text-stone-600 hover:bg-amber-50 hover:text-stone-900",
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Show when="signed-in">
            <Link
              href="/listings/new"
              className="hidden items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-amber-500/30 transition-all duration-200 hover:from-amber-600 hover:to-amber-700 active:scale-95 sm:flex"
            >
              <Plus className="h-4 w-4" />
              List a book
            </Link>
            <NotificationBell />
            <div className="ml-1 flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-amber-300 ring-offset-2 ring-offset-cream transition-shadow duration-200 hover:shadow-md hover:shadow-amber-500/20">
              <UserButton
                appearance={{
                  elements: { avatarBox: "w-8 h-8" },
                }}
              />
            </div>
            <button
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 transition-colors hover:bg-amber-100/70 lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </Show>
          <Show when="signed-out">
            <Link
              href="/listings/new"
              className="hidden rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-amber-500/30 transition-all duration-200 hover:from-amber-600 hover:to-amber-700 active:scale-95 sm:block"
            >
              List a book
            </Link>
          </Show>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-amber-100/80 bg-cream px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-amber-100/80 text-amber-700"
                      : "text-stone-600 hover:bg-amber-50",
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/listings/new"
              onClick={() => setMobileOpen(false)}
              className="mt-1 flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              List a book
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
