"use client";

import Link from "next/link";
import { cn, initials } from "@/lib/utils";

interface AvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  userId?: string;
  className?: string;
}

const sizes = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export default function Avatar({
  name,
  imageUrl,
  size = "md",
  userId,
  className,
}: AvatarProps) {
  const hasRingOverride = className?.includes("ring-");

  const inner = (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-100 to-amber-200 font-bold text-amber-700",
        sizes[size],
        !hasRingOverride && "ring-1 ring-amber-200/60",
        className,
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name ?? "User"}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );

  if (!userId) return inner;

  return (
    <Link
      href={`/profile/${userId}`}
      aria-label={name ? `View ${name}'s profile` : "View profile"}
      onClick={(e) => e.stopPropagation()}
      className="shrink-0 rounded-full transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 active:scale-95"
    >
      {inner}
    </Link>
  );
}
