import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/30 hover:from-amber-600 hover:to-amber-700 active:scale-[0.98]",
  secondary:
    "border border-amber-200 bg-white text-stone-700 shadow-sm hover:border-amber-300 hover:bg-amber-50 hover:text-stone-900 active:scale-[0.98]",
  outline:
    "border border-stone-200 bg-transparent text-stone-600 hover:border-stone-300 hover:bg-stone-50 active:scale-[0.98]",
  ghost:
    "text-stone-600 hover:bg-amber-100/70 hover:text-stone-900 active:scale-[0.98]",
  danger:
    "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm shadow-rose-500/30 hover:from-rose-600 hover:to-rose-700 active:scale-[0.98]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
