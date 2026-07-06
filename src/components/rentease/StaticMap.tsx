import type { Listing } from "@/lib/mockData";
import { MapPin } from "lucide-react";

export function StaticMap({
  listings,
  highlightId,
  onSelect,
  className = "h-full min-h-[400px]",
}: {
  listings: Listing[];
  highlightId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  // Static positioned map with mock pins
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-[linear-gradient(135deg,oklch(0.94_0.02_195),oklch(0.97_0.01_90))] ${className}`}
    >
      {/* faux streets */}
      <svg className="absolute inset-0 h-full w-full opacity-40" viewBox="0 0 400 400" preserveAspectRatio="none">
        <path d="M0 80 L400 100" stroke="oklch(0.8 0.02 200)" strokeWidth="2" />
        <path d="M0 200 L400 220" stroke="oklch(0.8 0.02 200)" strokeWidth="3" />
        <path d="M0 320 L400 300" stroke="oklch(0.8 0.02 200)" strokeWidth="2" />
        <path d="M80 0 L100 400" stroke="oklch(0.8 0.02 200)" strokeWidth="2" />
        <path d="M220 0 L240 400" stroke="oklch(0.8 0.02 200)" strokeWidth="3" />
        <path d="M340 0 L320 400" stroke="oklch(0.8 0.02 200)" strokeWidth="2" />
      </svg>
      <div className="absolute left-4 top-4 rounded-md bg-card/90 px-2 py-1 text-xs font-medium shadow-sm">
        Riverside University Area
      </div>
      {listings.map((l, i) => {
        const left = 15 + ((i * 89) % 70);
        const top = 20 + ((i * 53) % 60);
        const active = highlightId === l.id;
        return (
          <button
            key={l.id}
            onClick={() => onSelect?.(l.id)}
            style={{ left: `${left}%`, top: `${top}%` }}
            className={`absolute -translate-x-1/2 -translate-y-full transition ${
              active ? "z-10 scale-110" : "hover:scale-105"
            }`}
          >
            <div
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-md ${
                active ? "bg-foreground text-background" : "bg-card text-foreground"
              }`}
            >
              <MapPin className="h-3 w-3" />${l.price}
            </div>
          </button>
        );
      })}
    </div>
  );
}
