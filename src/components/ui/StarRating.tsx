"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  className?: string;
}

export default function StarRating({
  value,
  onChange,
  size = 18,
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={onChange ? "radiogroup" : undefined}
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= active;
        return (
          <button
            key={star}
            type="button"
            disabled={!onChange}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => onChange && setHovered(star)}
            onMouseLeave={() => onChange && setHovered(0)}
            className={cn(
              "transition-transform",
              onChange && "cursor-pointer hover:scale-125",
              onChange && "focus:outline-none",
            )}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            aria-checked={star === value}
            role={onChange ? "radio" : undefined}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(
                "transition-colors duration-150",
                filled ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
