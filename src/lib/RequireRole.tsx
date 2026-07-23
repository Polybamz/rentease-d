import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useRole, type Role } from "@/lib/role";

/**
 * Shared client-side guard for role-restricted pages (/landlord, /admin,
 * /messages). Redirects to /login when signed out, to / when signed in with
 * a role that isn't allowed here, otherwise renders `children` with the
 * confirmed uid/role.
 *
 * This mirrors — but does not replace — the enforcement in firestore.rules;
 * it only prevents the UI from flashing pages a user shouldn't see.
 */
export function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: (ctx: { uid: string; role: Role }) => ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const navigate = useNavigate();

  const ready = !authLoading && !roleLoading;
  const allowed = ready && !!user && !!role && roles.includes(role);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!role || !roles.includes(role)) {
      navigate({ to: "/" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, role, navigate]);

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-muted-foreground">
        Checking access…
      </div>
    );
  }

  return <>{children({ uid: user.uid, role })}</>;
}
