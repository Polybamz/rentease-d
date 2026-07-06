import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ShieldCheck, MessageCircle, Home, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListingCard } from "@/components/rentease/ListingCard";
import { listings } from "@/lib/mockData";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const featured = listings.filter((l) => l.status === "Live").slice(0, 3);
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,oklch(0.93_0.04_195),transparent_60%),radial-gradient(circle_at_80%_0%,oklch(0.95_0.03_90),transparent_50%)]" />
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Every landlord manually verified
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
              Find <span className="text-primary">verified student housing</span> near your campus.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Search real listings, message landlords directly, and manage your tenancy — all in one calm, trustworthy place built for students.
            </p>

            <div className="mt-8 flex flex-col gap-2 rounded-2xl border bg-card p-2 shadow-[var(--shadow-card)] md:flex-row md:items-center">
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campus or neighborhood"
                  className="border-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="hidden h-8 w-px bg-border md:block" />
              <div className="flex flex-1 items-center gap-2 px-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="border-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <Button asChild size="lg" className="md:ml-2">
                <Link to="/browse">Search</Link>
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link to="/login">I'm a Student</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/login">I'm a Landlord</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-semibold md:text-3xl">How RentEase works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { icon: Search, title: "Search verified listings", body: "Filter by price, distance, room type, and amenities. Every landlord is verified." },
            { icon: MessageCircle, title: "Message landlords directly", body: "Ask questions and book viewings without leaving the app." },
            { icon: Home, title: "Move in with confidence", body: "Manage your tenancy, payments, and reviews in one dashboard." },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold md:text-3xl">Featured near Riverside</h2>
          <Link to="/browse" className="text-sm font-medium text-primary hover:underline">Browse all →</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-4 rounded-3xl bg-primary/5 p-8 md:grid-cols-3 md:p-12">
          {[
            { n: "1,200+", l: "Verified listings" },
            { n: "4.8★", l: "Average landlord rating" },
            { n: "24h", l: "Median response time" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-3xl font-semibold text-primary">{s.n}</div>
              <div className="text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-semibold md:text-3xl">Students love it</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { n: "Maya P.", t: "Signed my lease in 3 days. The verified badge gave me real peace of mind." },
            { n: "Chen W.", t: "Way easier than scrolling Facebook groups. Messaging is fast." },
            { n: "Sofia R.", t: "Loved being able to compare listings on the map side-by-side." },
          ].map((r) => (
            <blockquote key={r.n} className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="flex gap-0.5 text-warning">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-3 text-sm">"{r.t}"</p>
              <footer className="mt-3 text-sm font-medium text-muted-foreground">— {r.n}</footer>
            </blockquote>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground">
          © 2026 RentEase · Prototype
        </div>
      </footer>
    </div>
  );
}
