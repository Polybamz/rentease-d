import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Upload, FileText, Receipt, Home, Loader2 } from "lucide-react";
import { AMENITIES, type Listing } from "@/lib/mockData";
import { useListingsByLandlord, useTenants, usePayments, createListing } from "@/lib/firestoreData";
import { uploadImage, MAX_UPLOAD_BYTES } from "@/lib/cloudinary";
import { CURRENCY_LABEL, formatXaf } from "@/lib/currency";

import { RequireRole } from "@/lib/RequireRole";

import { StatusBadge } from "@/components/rentease/Badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/landlord/")({
  component: LandlordDashboard,
  head: () => ({ meta: [{ title: "Landlord dashboard — RentEase" }] }),
});

/** Placeholder amount used by the sample agreement/receipt documents. */
const DEMO_RENT = 312_000;

function LandlordDashboard() {
  return (
    <RequireRole roles={["landlord"]}>
      {({ uid }) => <LandlordDashboardInner landlordId={uid} />}
    </RequireRole>
  );
}

function LandlordDashboardInner({ landlordId: myLandlordId }: { landlordId: string }) {
  const items = useListingsByLandlord(myLandlordId);
  const tenants = useTenants();
  const paymentLog = usePayments();
  const [previewDoc, setPreviewDoc] = useState<null | {
    type: "agreement" | "receipt";
    tenant: string;
  }>(null);

  // Add listing form
  const [f, setF] = useState({
    title: "",
    price: "",
    deposit: "",
    roomType: "Studio" as Listing["roomType"],
    availableFrom: "",
    amenities: [] as string[],
    description: "",
    photo: "",
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const uploadPhoto = async (file: File) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("That image is larger than 10 MB");
      return;
    }
    setUploadingPhoto(true);
    try {
      const { url } = await uploadImage(file, `listings/${myLandlordId}`);
      setF((prev) => ({ ...prev, photo: url }));
    } catch (err) {
      console.error(err);
      toast.error("Photo upload failed", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const submitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    const n: Listing = {
      id: crypto.randomUUID(),
      title: f.title || "Untitled listing",
      photos: [
        f.photo ||
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=70",
      ],
      price: Number(f.price) || 0,
      deposit: Number(f.deposit) || 0,
      distanceKm: 1.0,
      campus: "Riverside University",
      roomType: f.roomType,
      occupants: 1,
      amenities: f.amenities,
      landlordId: myLandlordId,
      rating: 0,
      reviewCount: 0,
      status: "Pending Review",
      availableFrom: f.availableFrom || "2026-09-01",
      address: "New listing",
      lat: 40.72,
      lng: -74.0,
      description: f.description,
    };
    try {
      await createListing(n);
      setF({
        title: "",
        price: "",
        deposit: "",
        roomType: "Studio",
        availableFrom: "",
        amenities: [],
        description: "",
        photo: "",
      });
      toast.success("Listing submitted", { description: "It's now Pending Review by our team." });
    } catch (err) {
      console.error(err);
      toast.error("Could not save listing");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Landlord Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage your properties, tenants, and payments.
          </p>
        </div>
      </div>

      <Tabs defaultValue="listings">
        <TabsList>
          <TabsTrigger value="listings">My Listings</TabsTrigger>
          <TabsTrigger value="new">Add New</TabsTrigger>
          <TabsTrigger value="tenants">Tenancies</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((l) => (
              <div
                key={l.id}
                className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]"
              >
                <img src={l.photos[0]} className="aspect-[4/3] w-full object-cover" alt={l.title} />
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-1 font-semibold">{l.title}</h3>
                    <StatusBadge status={l.status} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatXaf(l.price)}/mo · {l.roomType}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          <form
            onSubmit={submitListing}
            className="grid gap-6 rounded-2xl border bg-card p-6 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <Label>Photo</Label>
              <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-sm text-muted-foreground hover:bg-muted">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  disabled={uploadingPhoto}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto(file);
                  }}
                />
                {uploadingPhoto ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                  </>
                ) : f.photo ? (
                  <img src={f.photo} className="h-40 rounded-lg object-cover" alt="preview" />
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Click to upload a photo
                  </>
                )}
              </label>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                className="mt-2"
                value={f.title}
                onChange={(e) => setF({ ...f, title: e.target.value })}
                placeholder="Sunny studio near campus"
              />
            </div>
            <div>
              <Label>Room type</Label>
              <Select
                value={f.roomType}
                onValueChange={(v) => setF({ ...f, roomType: v as Listing["roomType"] })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Studio", "Private Room", "Shared Room", "1BR", "2BR"].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rent / month ({CURRENCY_LABEL})</Label>
              <Input
                type="number"
                className="mt-2"
                value={f.price}
                onChange={(e) => setF({ ...f, price: e.target.value })}
              />
            </div>
            <div>
              <Label>Deposit ({CURRENCY_LABEL})</Label>
              <Input
                type="number"
                className="mt-2"
                value={f.deposit}
                onChange={(e) => setF({ ...f, deposit: e.target.value })}
              />
            </div>
            <div>
              <Label>Available from</Label>
              <Input
                type="date"
                className="mt-2"
                value={f.availableFrom}
                onChange={(e) => setF({ ...f, availableFrom: e.target.value })}
              />
            </div>
            <div>
              <Label>Map pin (address)</Label>
              <Input className="mt-2" placeholder="Click map to pin (mock)" />
            </div>
            <div className="md:col-span-2">
              <Label>Amenities</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {AMENITIES.map((a) => (
                  <label key={a} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={f.amenities.includes(a)}
                      onCheckedChange={(v) =>
                        setF({
                          ...f,
                          amenities: v ? [...f.amenities, a] : f.amenities.filter((x) => x !== a),
                        })
                      }
                    />
                    {a}
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                className="mt-2"
                rows={4}
                value={f.description}
                onChange={(e) => setF({ ...f, description: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={uploadingPhoto}>
                <Plus className="mr-2 h-4 w-4" /> Submit for review
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="tenants" className="mt-6 space-y-6">
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="mb-4 font-semibold">Current tenants</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Listing</TableHead>
                  <TableHead>Move-in</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.listing}</TableCell>
                    <TableCell>{t.moveIn}</TableCell>
                    <TableCell>{formatXaf(t.rent)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewDoc({ type: "agreement", tenant: t.name })}
                        >
                          <FileText className="mr-1 h-3 w-3" /> Agreement
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewDoc({ type: "receipt", tenant: t.name })}
                        >
                          <Receipt className="mr-1 h-3 w-3" /> Receipt
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <h3 className="mb-4 font-semibold">Payment log</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentLog.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.tenant}</TableCell>
                    <TableCell>{p.month}</TableCell>
                    <TableCell>{formatXaf(p.amount)}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "Paid" ? "bg-success/15 text-success" : "bg-warning/20 text-warning-foreground"}`}
                      >
                        {p.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {previewDoc?.type === "agreement" ? "Rental Agreement" : "Payment Receipt"} Preview
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-lg border bg-[oklch(0.99_0.005_90)] p-8 font-serif text-sm shadow-inner">
            <div className="mb-6 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded bg-primary text-primary-foreground">
                  <Home className="h-4 w-4" />
                </div>
                <span className="font-bold">RentEase</span>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                Document #{Math.floor(Math.random() * 90000 + 10000)}
                <br />
                Issued {new Date().toLocaleDateString()}
              </div>
            </div>
            {previewDoc?.type === "agreement" ? (
              <>
                <h2 className="text-lg font-bold">Residential Tenancy Agreement</h2>
                <p className="mt-3">
                  This agreement is made between <b>Amara Okafor</b> (Landlord) and{" "}
                  <b>{previewDoc.tenant}</b> (Tenant) for the property listed on RentEase.
                </p>
                <div className="my-4 grid grid-cols-2 gap-3">
                  <div>
                    <b>Term:</b> 12 months
                  </div>
                  <div>
                    <b>Rent:</b> {formatXaf(DEMO_RENT)} / month
                  </div>
                  <div>
                    <b>Deposit:</b> {formatXaf(DEMO_RENT)}
                  </div>
                  <div>
                    <b>Start date:</b> 2026-09-01
                  </div>
                </div>
                <p>
                  Both parties agree to the standard terms outlined in the RentEase master
                  agreement…
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold">Payment Receipt</h2>
                <p className="mt-3">
                  Received from <b>{previewDoc?.tenant}</b> the sum of <b>{formatXaf(DEMO_RENT)}</b>{" "}
                  as monthly rent payment.
                </p>
                <div className="my-4 grid grid-cols-2 gap-3">
                  <div>
                    <b>Period:</b> July 2026
                  </div>
                  <div>
                    <b>Method:</b> Bank Transfer
                  </div>
                  <div>
                    <b>Reference:</b> RE-{Math.floor(Math.random() * 900000)}
                  </div>
                  <div>
                    <b>Status:</b> Paid
                  </div>
                </div>
              </>
            )}
            <div className="mt-8 border-t pt-4 text-xs text-muted-foreground">
              RentEase demo document — not a legal record.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
