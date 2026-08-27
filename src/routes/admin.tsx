import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Shield, LogOut, Check, X, Flag, Home, AlertCircle, BarChart3 } from "lucide-react";
import { useListings, useReports, updateListingStatus, deleteReport } from "@/lib/firestoreData";
import type { Listing } from "@/lib/mockData";
import { formatXaf } from "@/lib/currency";
import { StatusBadge } from "@/components/rentease/Badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useAdminAuth } from "@/lib/adminAuth";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — RentEase" }, { name: "robots", content: "noindex" }] }),
});

function AdminPage() {
  const { isAdmin } = useAdminAuth();
  return isAdmin ? <AdminDashboard /> : <AdminLogin />;
}

function AdminLogin() {
  const { signIn } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (signIn(username, password)) {
      toast.success("Welcome, admin");
    } else {
      toast.error("Invalid admin credentials");
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
        <Shield className="h-5 w-5" />
      </div>
      <h1 className="mt-4 text-2xl font-semibold">Admin sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your admin credentials to open the RentEase admin dashboard.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-username">Username</Label>
          <Input
            id="admin-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-password">Password</Label>
          <Input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Sign in to admin
        </Button>
      </form>
    </div>
  );
}

function ListingTable({
  listings,
  showActions = false,
  onApprove,
  onReject,
}: {
  listings: Listing[];
  showActions?: boolean;
  onApprove?: (l: Listing) => void;
  onReject?: (l: Listing) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Listing</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                No listings.
              </TableCell>
            </TableRow>
          )}
          {listings.map((l) => (
            <TableRow key={l.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <img src={l.photos[0]} className="h-10 w-14 rounded object-cover" alt="" />
                  <div className="font-medium">{l.title}</div>
                </div>
              </TableCell>
              <TableCell>{formatXaf(l.price)}</TableCell>
              <TableCell>{l.roomType}</TableCell>
              <TableCell>
                <StatusBadge status={l.status} />
              </TableCell>
              <TableCell className="text-right">
                {showActions && (
                  <div className="inline-flex gap-2">
                    <Button size="sm" onClick={() => onApprove?.(l)}>
                      <Check className="mr-1 h-3 w-3" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onReject?.(l)}>
                      <X className="mr-1 h-3 w-3" /> Reject
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AdminDashboard() {
  const { signOut } = useAdminAuth();
  const items = useListings();
  const reportedListings = useReports();

  const decide = async (id: string, next: "Live" | "Rejected") => {
    try {
      await updateListingStatus(id, next);
      toast.success(next === "Live" ? "Listing approved" : "Listing rejected");
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  const resolveReport = async (id: string) => {
    try {
      await deleteReport(id);
      toast.success("Report resolved");
    } catch (err) {
      console.error(err);
      toast.error("Could not resolve report");
    }
  };

  const pending = items.filter((l) => l.status === "Pending Review");
  const live = items.filter((l) => l.status === "Live");

  const stats = [
    { label: "Total listings", value: items.length, icon: Home },
    { label: "Live listings", value: live.length, icon: BarChart3 },
    { label: "Pending reviews", value: pending.length, icon: AlertCircle },
    { label: "Reported listings", value: reportedListings.length, icon: Flag },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Approve listings and monitor platform activity.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            signOut();
            toast.success("Signed out of admin");
          }}
        >
          <LogOut className="mr-1 h-3 w-3" /> Sign out
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-3xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Pending listings ({pending.length})</h2>
        <ListingTable
          listings={pending}
          showActions
          onApprove={(l) => decide(l.id, "Live")}
          onReject={(l) => decide(l.id, "Rejected")}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Live listings ({live.length})</h2>
        <ListingTable listings={live} />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">
          Reported listings ({reportedListings.length})
        </h2>
        <div className="overflow-hidden rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportedListings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No reported listings.
                  </TableCell>
                </TableRow>
              )}
              {reportedListings.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {r.listingId ? (
                      <Link
                        to="/listing/$id"
                        params={{ id: r.listingId }}
                        className="text-primary underline"
                      >
                        {r.listing || `Listing ${r.listingId}`}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{r.listing || r.listingId}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.reason}</TableCell>
                  <TableCell>{r.reporter}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => resolveReport(r.id)}>
                      <X className="mr-1 h-3 w-3" /> Resolve
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
