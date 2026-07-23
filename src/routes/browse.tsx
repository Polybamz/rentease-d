import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { AMENITIES } from "@/lib/mockData";
import { useListings } from "@/lib/firestoreData";

import { ListingCard } from "@/components/rentease/ListingCard";
import { StaticMap } from "@/components/rentease/StaticMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const searchSchema = z.object({
  // Populated by the landing-page hero search so a query is shareable and
  // survives a refresh instead of living only in local component state.
  q: z.string().optional(),
});

export const Route = createFileRoute("/browse")({
  component: BrowsePage,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Browse listings — RentEase" }] }),
});

function useFilters(initialQ: string) {
  const [q, setQ] = useState(initialQ);
  const [price, setPrice] = useState<[number, number]>([100, 1500]);
  const [maxDist, setMaxDist] = useState(5);
  const [room, setRoom] = useState<string>("any");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [occupants, setOccupants] = useState(1);
  return {
    q,
    setQ,
    price,
    setPrice,
    maxDist,
    setMaxDist,
    room,
    setRoom,
    amenities,
    setAmenities,
    occupants,
    setOccupants,
  };
}

function Filters(f: ReturnType<typeof useFilters>) {
  return (
    <div className="space-y-6 p-1">
      <div>
        <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
          Price / month
        </Label>
        <Slider
          min={100}
          max={2000}
          step={20}
          value={f.price}
          onValueChange={(v) => f.setPrice(v as [number, number])}
        />
        <div className="mt-2 flex justify-between text-sm text-muted-foreground">
          <span>${f.price[0]}</span>
          <span>${f.price[1]}</span>
        </div>
      </div>
      <div>
        <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
          Distance to campus
        </Label>
        <Slider
          min={0.2}
          max={5}
          step={0.1}
          value={[f.maxDist]}
          onValueChange={(v) => f.setMaxDist(v[0])}
        />
        <div className="mt-2 text-sm text-muted-foreground">Within {f.maxDist.toFixed(1)} km</div>
      </div>
      <div>
        <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
          Room type
        </Label>
        <Select value={f.room} onValueChange={f.setRoom}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="Studio">Studio</SelectItem>
            <SelectItem value="Private Room">Private Room</SelectItem>
            <SelectItem value="Shared Room">Shared Room</SelectItem>
            <SelectItem value="1BR">1 Bedroom</SelectItem>
            <SelectItem value="2BR">2 Bedroom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
          Occupants
        </Label>
        <Input
          type="number"
          min={1}
          max={6}
          value={f.occupants}
          onChange={(e) => f.setOccupants(Number(e.target.value))}
        />
      </div>
      <div>
        <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
          Amenities
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES.map((a) => (
            <label key={a} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={f.amenities.includes(a)}
                onCheckedChange={(v) =>
                  f.setAmenities(v ? [...f.amenities, a] : f.amenities.filter((x) => x !== a))
                }
              />
              {a}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function BrowsePage() {
  const { q } = Route.useSearch();
  const f = useFilters(q ?? "");
  const [highlight, setHighlight] = useState<string | undefined>();
  const listings = useListings();

  const results = useMemo(() => {
    return listings
      .filter((l) => l.status === "Live")
      .filter((l) => l.price >= f.price[0] && l.price <= f.price[1])
      .filter((l) => l.distanceKm <= f.maxDist)
      .filter((l) => f.room === "any" || l.roomType === f.room)
      .filter((l) => l.occupants >= f.occupants || l.roomType === "Studio")
      .filter((l) => f.amenities.every((a) => l.amenities.includes(a)))
      .filter(
        (l) =>
          !f.q ||
          l.title.toLowerCase().includes(f.q.toLowerCase()) ||
          l.address.toLowerCase().includes(f.q.toLowerCase()),
      );
  }, [f, listings]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Search row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={f.q}
            onChange={(e) => f.setQ(e.target.value)}
            placeholder="Search by title or neighborhood"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="md:hidden">
              <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <Filters {...f} />
            </div>
          </SheetContent>
        </Sheet>
        <div className="text-sm text-muted-foreground">{results.length} results</div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-2xl border bg-card p-4">
            <Filters {...f} />
          </div>
        </aside>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {results.map((l) => (
            <div
              key={l.id}
              onMouseEnter={() => setHighlight(l.id)}
              onMouseLeave={() => setHighlight(undefined)}
            >
              <ListingCard listing={l} />
            </div>
          ))}
          {results.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
              No listings match your filters.
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-20 h-[calc(100vh-6rem)]">
            <StaticMap
              listings={results}
              highlightId={highlight}
              onSelect={setHighlight}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
