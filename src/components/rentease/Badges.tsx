import { BadgeCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary",
        className,
      )}
    >
      <BadgeCheck className="h-3.5 w-3.5" />
      Verified
    </span>
  );
}

export function StarRating({ value, count, size = 14 }: { value: number; count?: number; size?: number }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="inline-flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className={i < full ? "fill-warning text-warning" : "text-muted-foreground/30"}
          />
        ))}
      </span>
      <span className="font-medium">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-muted-foreground">({count})</span>}
    </span>
  );
}

export function StatusBadge({ status }: { status: "Live" | "Pending Review" | "Rejected" }) {
  const map = {
    Live: "bg-success/15 text-success",
    "Pending Review": "bg-warning/20 text-warning-foreground",
    Rejected: "bg-destructive/15 text-destructive",
  } as const;
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", map[status])}>
      {status}
    </span>
  );
}
