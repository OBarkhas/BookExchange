import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
}

export default function Input({
  label,
  error,
  hint,
  leftIcon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-stone-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            "h-10 w-full rounded-xl border bg-white px-3.5 text-sm text-zinc-900 placeholder:text-stone-400 transition-all duration-200 focus:outline-none focus:ring-2",
            leftIcon ? "pl-9" : undefined,
            error
              ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
              : "border-stone-200 focus:border-amber-400 focus:ring-amber-100",
            className,
          )}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-stone-400">{hint}</p>
      ) : null}
    </div>
  );
}
