import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, MapPin, Calendar, Banknote, Check, Flag } from "lucide-react";
import { formatXaf } from "@/lib/currency";
import {
  useListing,
  useLandlord,
  useReviews,
  findOrCreateConversation,
  sendMessage,
  reportListing,
} from "@/lib/firestoreData";
import { useAuth } from "@/lib/auth";

import { StarRating, VerifiedBadge } from "@/components/rentease/Badges";
import { StaticMap } from "@/components/rentease/StaticMap";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/listing/$id")({
  component: ListingDetail,
  notFoundComponent: () => <div className="p-10 text-center">Listing not found.</div>,
  head: () => ({ meta: [{ title: "Listing — RentEase" }] }),
});

function ListingDetail() {
  const { id } = Route.useParams();
  const listing = useListing(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selected, setSelected] = useState(0);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState("Hi, is this still available?");
  const [sending, setSending] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [reporting, setReporting] = useState(false);
  const landlord = useLandlord(listing?.landlordId);
  const allReviews = useReviews();

  if (!listing) return <div className="p-10">Not found</div>;
  if (!landlord) return <div className="p-10">Loading…</div>;

  const listingReviews = allReviews.filter((r) => r.listingId === listing.id);

  const openMessageDialog = () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    setMsgOpen(true);
  };

  const send = async () => {
    if (!user || !msg.trim() || sending) return;
    setSending(true);
    try {
      const conversationId = await findOrCreateConversation({
        studentId: user.uid,
        landlordId: landlord.id,
        listingId: listing.id,
      });
      await sendMessage(conversationId, { from: user.uid, text: msg });
      setMsgOpen(false);
      toast.success("Message sent", {
        description: `We'll notify you when ${landlord.name} replies.`,
      });
      navigate({ to: "/messages", search: { conversation: conversationId } });
    } catch (err) {
      console.error(err);
      toast.error("Could not send message");
    } finally {
      setSending(false);
    }
  };

  // If the signed-in user is the landlord who owns this listing, hide the
  // message button — messaging their own property would create a pointless
  // self-conversation.
  const isOwnListing = !!user && user.uid === listing.landlordId;

  // Report-listing flow (student -> admin). Hidden for the listing's own
  // landlord so they can't flag their own property.
  const reportReasons = [
    "Photos look outdated",
    "Listing no longer available",
    "Scam or fraud",
    "Incorrect details",
    "Other",
  ];

  const openReportDialog = () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    setReportReason(reportReasons[0]);
    setReportNote("");
    setReportOpen(true);
  };

  const submitReport = async () => {
    if (!user || !reportReason || reporting) return;
    setReporting(true);
    try {
      const reason = reportNote ? `${reportReason}: ${reportNote}` : reportReason;
      await reportListing({
        listingId: listing.id,
        reason,
        reporter: user.displayName ?? user.uid,
      });
      setReportOpen(false);
      toast.success("Report submitted", {
        description: "Thank you — the team will review it shortly.",
      });
    } catch (err) {
      console.error(err);
      toast.error("Could not submit report");
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <button
        onClick={() => history.back()}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to results
      </button>

      {/* Gallery */}
      <div className="grid gap-2 md:grid-cols-4">
        <div className="md:col-span-3">
          <img
            src={listing.photos[selected]}
            alt={listing.title}
            className="aspect-[16/10] w-full rounded-2xl object-cover"
          />
        </div>
        <div className="flex gap-2 md:flex-col">
          {listing.photos.map((p, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`aspect-[4/3] flex-1 overflow-hidden rounded-xl border-2 ${i === selected ? "border-primary" : "border-transparent"}`}
            >
              <img src={p} className="h-full w-full object-cover" alt="" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">{listing.title}</h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {listing.address} · {listing.distanceKm} km to{" "}
                {listing.campus}
              </div>
            </div>
            <VerifiedBadge />
          </div>

          <div className="mt-4">
            {listing.rating > 0 && (
              <StarRating value={listing.rating} count={listing.reviewCount} />
            )}
          </div>

          <p className="mt-6 text-muted-foreground">{listing.description}</p>

          <h2 className="mt-8 text-lg font-semibold">Amenities</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {listing.amenities.map((a) => (
              <div
                key={a}
                className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm"
              >
                <Check className="h-4 w-4 text-primary" /> {a}
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-lg font-semibold">Location</h2>
          <div className="mt-3 h-64">
            <StaticMap listings={[listing]} highlightId={listing.id} />
          </div>

          <h2 className="mt-8 text-lg font-semibold">Reviews</h2>
          {listingReviews.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No reviews yet for this listing.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {listingReviews.map((r) => (
                <div key={r.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={r.avatar} />
                        <AvatarFallback>{r.author[0]}</AvatarFallback>
                      </Avatar>
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
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside>
          <div className="sticky top-20 space-y-4 rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-semibold">{formatXaf(listing.price)}</span>
              <span className="text-muted-foreground">/mo</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Banknote className="h-3 w-3" /> Deposit
                </div>
                <div className="mt-1 font-medium">{formatXaf(listing.deposit)}</div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" /> Available
                </div>
                <div className="mt-1 font-medium">{listing.availableFrom}</div>
              </div>
            </div>

            {!isOwnListing && (
              <Button className="w-full" size="lg" onClick={openMessageDialog}>
                Message Landlord
              </Button>
            )}
            <Button variant="outline" className="w-full" asChild>
              <Link to="/landlord/$id" params={{ id: landlord.id }}>
                View landlord profile
              </Link>
            </Button>

            <Button variant="outline" className="w-full" onClick={openReportDialog}>
              <Flag className="mr-2 h-4 w-4" />
              Report listing
            </Button>

            <div className="mt-4 border-t pt-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={landlord.avatar} />
                  <AvatarFallback>{landlord.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-medium">
                    {landlord.name}
                    {landlord.verified && <VerifiedBadge />}
                  </div>
                  <StarRating value={landlord.rating} count={landlord.reviewCount} />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {landlord.name}</DialogTitle>
          </DialogHeader>
          <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={5} />
          <Button onClick={send} disabled={sending}>
            {sending ? "Sending…" : "Send message"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this listing</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitReport();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="report-reason">Reason</Label>
              <select
                id="report-reason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {reportReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-note">Additional detail (optional)</Label>
              <Textarea
                id="report-note"
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                rows={3}
                placeholder="Add any extra context…"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReportOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={reporting}>
                {reporting ? "Submitting…" : "Submit report"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
