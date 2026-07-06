import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import type { Listing } from "@/lib/mockData";
import { StarRating, VerifiedBadge } from "./Badges";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      to="/listing/$id"
      params={{ id: listing.id }}
      className="group block overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={listing.photos[0]}
          alt={listing.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold">{listing.title}</h3>
          <VerifiedBadge />
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {listing.distanceKm} km to campus · {listing.roomType}
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="text-lg font-semibold">
            ${listing.price}
            <span className="text-sm font-normal text-muted-foreground">/mo</span>
          </div>
          {listing.rating > 0 && <StarRating value={listing.rating} count={listing.reviewCount} />}
        </div>
      </div>
    </Link>
  );
}
