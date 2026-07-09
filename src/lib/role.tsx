import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";

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
        const r = (snap.exists() ? (snap.data() as any).role : null) as Role;
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
    if ((r as any) === "admin") throw new Error("Admin role cannot be set from the client.");
    await setDoc(
      doc(db, "users", user.uid),
      { role: r, email: user.email ?? null, updatedAt: Date.now() },
      { merge: true },
    );
    setRoleState(r);
  };

  return <Ctx.Provider value={{ role, loading, setRole }}>{children}</Ctx.Provider>;
}

export const useRole = () => useContext(Ctx);
