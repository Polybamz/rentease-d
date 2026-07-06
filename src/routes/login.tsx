import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Home, Shield } from "lucide-react";
import { useRole } from "@/lib/role";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — RentEase" }] }),
});

function LoginPage() {
  const { setRole } = useRole();
  const navigate = useNavigate();
  const pick = (r: "student" | "landlord" | "admin", to: string) => {
    setRole(r);
    navigate({ to });
  };
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold md:text-4xl">Continue as…</h1>
        <p className="mt-2 text-muted-foreground">Pick a role to explore the prototype. No password needed.</p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          { r: "student", to: "/browse", icon: GraduationCap, title: "Student", body: "Search verified listings, message landlords, and manage your rental." },
          { r: "landlord", to: "/landlord", icon: Home, title: "Landlord", body: "Post listings, manage tenants, and track monthly payments." },
          { r: "admin", to: "/admin", icon: Shield, title: "Admin", body: "Approve listings, review reports, and monitor platform activity." },
        ].map((c) => (
          <button
            key={c.r}
            onClick={() => pick(c.r as any, c.to)}
            className="group rounded-2xl border bg-card p-6 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-primary hover:shadow-[var(--shadow-elevated)]"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
              <c.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{c.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
