"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Library,
  Star,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  count?: number;
  iconName?: string;
}

interface AnimatedTabsProps {
  items: TabItem[];
  active: string;
  basePath: string;
  defaultTab: string;
  layoutId?: string;
}

const ICONS: Record<string, LucideIcon> = {
  sent: ArrowUpRight,
  received: ArrowDownLeft,
  listings: Library,
  shelf: Library,
  wishlist: Star,
};

export default function AnimatedTabs({
  items,
  active,
  basePath,
  defaultTab,
  layoutId = "tabs",
}: AnimatedTabsProps) {
  return (
    <div className="flex w-full items-center gap-1 overflow-x-auto rounded-2xl border border-amber-100/90 bg-white/80 p-1 shadow-sm shadow-amber-900/5 backdrop-blur-sm sm:w-fit [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const isActive = item.value === active;
        const href =
          item.value === defaultTab ? basePath : `${basePath}?tab=${item.value}`;
        const Icon = item.iconName ? ICONS[item.iconName] : undefined;
        return (
          <Link
            key={item.value}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex min-h-11 min-w-fit flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-all duration-200 active:scale-[0.97] sm:min-h-10 sm:flex-none sm:px-4",
              isActive
                ? "text-white"
                : "text-stone-600 hover:bg-amber-50 hover:text-zinc-900",
            )}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 shadow-sm shadow-amber-500/25"
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
              />
            )}
            {Icon && <Icon className="relative h-4 w-4 shrink-0" />}
            <span className="relative whitespace-nowrap">{item.label}</span>
            {typeof item.count === "number" && (
              <span
                className={cn(
                  "relative rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums",
                  isActive ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700",
                )}
              >
                {item.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
