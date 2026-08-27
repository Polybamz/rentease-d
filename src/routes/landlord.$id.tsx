import { createFileRoute } from "@tanstack/react-router";
import { useLandlord, useListingsByLandlord, useReviews } from "@/lib/firestoreData";

import { StarRating, VerifiedBadge } from "@/components/rentease/Badges";
import { ListingCard } from "@/components/rentease/ListingCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/landlord/$id")({
  component: LandlordProfile,
  head: () => ({ meta: [{ title: "Landlord — RentEase" }] }),
});

function LandlordProfile() {
  const { id } = Route.useParams();
  const l = useLandlord(id);
  const theirListingsAll = useListingsByLandlord(id);
  const allReviews = useReviews();
  if (!l) return <div className="p-10">Not found</div>;
  const theirListings = theirListingsAll.filter((x) => x.status === "Live");
  const theirReviews = allReviews.filter((r) => r.landlordId === l.id);


  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: theirReviews.filter((r) => r.rating === star).length,
  }));
  const total = Math.max(theirReviews.length, 1);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col items-start gap-6 rounded-2xl border bg-card p-6 md:flex-row md:items-center">
        <Avatar className="h-20 w-20"><AvatarImage src={l.avatar} /><AvatarFallback>{l.name[0]}</AvatarFallback></Avatar>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{l.name}</h1>
            {l.verified && <VerifiedBadge />}
          </div>
          <p className="mt-1 text-muted-foreground">{l.bio}</p>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <StarRating value={l.rating} count={l.reviewCount} />
            <span className="text-muted-foreground">Member since {l.joined}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="mb-4 text-lg font-semibold">Listings</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {theirListings.map((li) => <ListingCard key={li.id} listing={li} />)}
          </div>

          <h2 className="mb-4 mt-10 text-lg font-semibold">Tenant reviews</h2>
          <div className="space-y-3">
            {theirReviews.map((r) => (
              <div key={r.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8"><AvatarImage src={r.avatar} /><AvatarFallback>{r.author[0]}</AvatarFallback></Avatar>
                    <div>
                      <div className="text-sm font-medium">{r.author}</div>
                      <div className="text-xs text-muted-foreground">{r.date}</div>
                    </div>
                  </div>
                  <StarRating value={r.rating} />
                </div>
                <p className="mt-2 text-sm">{r.text}</p>
              </div>
            ))}
            {theirReviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
          </div>
        </div>

        <aside>
          <div className="sticky top-20 rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">Rating breakdown</h3>
            <div className="mt-4 space-y-2">
              {breakdown.map((b) => (
                <div key={b.star} className="flex items-center gap-2 text-sm">
                  <span className="w-4 text-muted-foreground">{b.star}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-warning" style={{ width: `${(b.count / total) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right text-xs text-muted-foreground">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
