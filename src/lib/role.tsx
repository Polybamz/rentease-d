import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { upsertLandlordProfile } from "@/lib/firestoreData";

export type Role = "student" | "landlord" | "admin" | null;
export type SelectableRole = "student" | "landlord";

type RoleCtx = {
  role: Role;
  loading: boolean;
  /** Set the current user's role. Admin cannot be assigned from the client. */
  setRole: (r: SelectableRole | null) => Promise<void>;
};

const Ctx = createContext<RoleCtx>({
  role: null,
  loading: true,
  setRole: async () => {},
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [role, setRoleState] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (authLoading) return;
      if (!user) {
        setRoleState(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? (snap.data() as { role?: Role }) : undefined;
        const r = data?.role ?? null;
        if (!cancelled) setRoleState(r ?? null);
      } catch (err) {
        console.error("[role] load failed", err);
        if (!cancelled) setRoleState(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const setRole = async (r: SelectableRole | null) => {
    if (!user) throw new Error("Sign in required to set a role.");
    // Never allow client-side promotion to admin.
    if ((r as string) === "admin") throw new Error("Admin role cannot be set from the client.");
    await setDoc(
      doc(db, "users", user.uid),
      { role: r, email: user.email ?? null, updatedAt: Date.now() },
      { merge: true },
    );
    if (r === "landlord") {
      // Give every landlord a real profile doc keyed by their own uid, so
      // listings/conversations/dashboards can all key off request.auth.uid
      // instead of a shared, hard-coded landlord id.
      await upsertLandlordProfile({
        id: user.uid,
        name: user.displayName || user.email || "Landlord",
        avatar: user.photoURL || `https://i.pravatar.cc/120?u=${user.uid}`,
        verified: false,
        rating: 0,
        reviewCount: 0,
        joined: String(new Date().getFullYear()),
        bio: "",
      });
    }
    setRoleState(r);
  };

  return <Ctx.Provider value={{ role, loading, setRole }}>{children}</Ctx.Provider>;
}

export const useRole = () => useContext(Ctx);
