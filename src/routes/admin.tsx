import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Check, X, Flag, Users, Home, AlertCircle } from "lucide-react";
import { useListings, useReports, updateListingStatus } from "@/lib/firestoreData";
import { StatusBadge } from "@/components/rentease/Badges";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/lib/role";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — RentEase" }, { name: "robots", content: "noindex" }] }),
});

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) navigate({ to: "/login" });
    else if (role !== "admin") navigate({ to: "/" });
  }, [user, role, authLoading, roleLoading, navigate]);

  const items = useListings();
  const reportedListings = useReports();

  if (authLoading || roleLoading || !user || role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-muted-foreground">
        Checking access…
      </div>
    );
  }

  const decide = async (id: string, next: "Live" | "Rejected") => {
    try {
      await updateListingStatus(id, next);
      toast.success(next === "Live" ? "Listing approved" : "Listing rejected");
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  const pending = items.filter((l) => l.status === "Pending Review");

  const stats = [
    { label: "Total listings", value: items.length, icon: Home },
    { label: "Pending reviews", value: pending.length, icon: AlertCircle },
    { label: "Active users", value: 428, icon: Users },
    { label: "Reported listings", value: reportedListings.length, icon: Flag },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p className="text-sm text-muted-foreground">Approve listings and monitor platform activity.</p>

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
        <div className="overflow-hidden rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead><TableHead>Price</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No listings awaiting review.</TableCell></TableRow>
              )}
              {pending.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={l.photos[0]} className="h-10 w-14 rounded object-cover" alt="" />
                      <div className="font-medium">{l.title}</div>
                    </div>
                  </TableCell>
                  <TableCell>${l.price}</TableCell>
                  <TableCell>{l.roomType}</TableCell>
                  <TableCell><StatusBadge status={l.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <Button size="sm" onClick={() => decide(l.id, "Live")}><Check className="mr-1 h-3 w-3" /> Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => decide(l.id, "Rejected")}><X className="mr-1 h-3 w-3" /> Reject</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Reported listings</h2>
        <div className="overflow-hidden rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Listing</TableHead><TableHead>Reason</TableHead><TableHead>Reporter</TableHead><TableHead>Date</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {reportedListings.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.listing}</TableCell>
                  <TableCell className="text-muted-foreground">{r.reason}</TableCell>
                  <TableCell>{r.reporter}</TableCell>
                  <TableCell>{r.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
