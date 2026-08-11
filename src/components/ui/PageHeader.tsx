import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  compact?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
  compact = false,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        compact ? "mb-4" : "mb-8",
      )}
    >
      <div className="min-w-0">
        <h1
          className={cn(
            "font-bold tracking-tight text-zinc-900",
            compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl",
          )}
        >
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      )}
    </div>
  );
}
