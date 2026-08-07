import { cn, initials } from "@/lib/utils";

interface AvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
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
  className,
}: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-100 to-amber-200 font-bold text-amber-700 ring-2 ring-amber-200/70",
        sizes[size],
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
}
