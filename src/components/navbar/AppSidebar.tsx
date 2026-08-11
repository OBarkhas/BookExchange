"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Compass, Repeat, MessageSquare, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  {
    href: "/browse",
    label: "Browse",
    hint: "Market & events",
    icon: Compass,
  },
  {
    href: "/exchanges",
    label: "Exchanges",
    hint: "Requests & swaps",
    icon: Repeat,
  },
  {
    href: "/messages",
    label: "Messages",
    hint: "Swap chats",
    icon: MessageSquare,
  },
  {
    href: "/ai",
    label: "AI Coach",
    hint: "Recommendations & Q&A",
    icon: Sparkles,
  },
  {
    href: "/profile",
    label: "Profile",
    hint: "Shelf & badges",
    icon: User,
  },
];

function isSectionActive(pathname: string, href: string) {
  if (href === "/profile") return pathname.startsWith("/profile/");
  if (href === "/browse") return pathname === "/" || pathname.startsWith("/browse");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppSidebar({ userId }: { userId: string }) {
  const pathname = usePathname();
  const profileHref = `/profile/${userId}`;

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-amber-100/80 bg-white/75 backdrop-blur-md lg:flex">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-stone-400">
            Menu
          </p>
          <nav className="space-y-1.5">
            {sections.map((section) => {
              const active = isSectionActive(pathname, section.href);
              const href =
                section.href === "/profile" ? profileHref : section.href;
              return (
                <Link
                  key={section.href}
                  href={href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                    active
                      ? "text-white"
                      : "text-stone-600 hover:bg-amber-50 hover:text-zinc-900",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 shadow-sm shadow-amber-500/25"
                      transition={{ type: "spring", damping: 28, stiffness: 320 }}
                    />
                  )}
                  <section.icon
                    className={cn(
                      "relative h-5 w-5 transition-transform duration-200",
                      !active && "group-hover:scale-110",
                    )}
                  />
                  <span className="relative flex-1">
                    {section.label}
                    <span
                      className={cn(
                        "block text-[11px] font-normal",
                        active ? "text-amber-100" : "text-stone-400",
                      )}
                    >
                      {section.hint}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-amber-100/80 p-4">
          <Link
            href="/listings/new"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-amber-500/30 transition-all duration-200 hover:from-amber-600 hover:to-amber-700 active:scale-[0.98]"
          >
            List a book
          </Link>
        </div>
      </aside>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 w-full border-t border-amber-100/80 bg-cream/95 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] shadow-[0_-4px_20px_-8px_rgba(120,53,15,0.12)] backdrop-blur-md lg:hidden"
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-1.5">
          {sections.map((section) => {
            const active = isSectionActive(pathname, section.href);
            const href =
              section.href === "/profile" ? profileHref : section.href;
            return (
              <Link
                key={section.href}
                href={href}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors duration-200",
                  active ? "text-amber-600" : "text-stone-500",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active-mobile"
                    className="absolute inset-0 rounded-xl bg-amber-100/80"
                    transition={{ type: "spring", damping: 28, stiffness: 320 }}
                  />
                )}
                <section.icon className="relative h-5 w-5" />
                <span className="relative">{section.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
