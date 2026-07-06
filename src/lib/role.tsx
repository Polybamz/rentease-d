import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "student" | "landlord" | "admin" | null;

type RoleCtx = { role: Role; setRole: (r: Role) => void };
const Ctx = createContext<RoleCtx>({ role: null, setRole: () => {} });

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(null);
  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("rentease_role") as Role) : null;
    if (stored) setRoleState(stored);
  }, []);
  const setRole = (r: Role) => {
    setRoleState(r);
    if (typeof window !== "undefined") {
      if (r) localStorage.setItem("rentease_role", r);
      else localStorage.removeItem("rentease_role");
    }
  };
  return <Ctx.Provider value={{ role, setRole }}>{children}</Ctx.Provider>;
}

export const useRole = () => useContext(Ctx);
