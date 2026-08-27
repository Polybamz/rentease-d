import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * Standalone admin authentication for RentEase.
 *
 * Intentionally simple — no database and no backend auth service. The admin
 * credentials are stored right here in the source and compared directly
 * against whatever the user types on the admin login screen. On a match the
 * admin area opens; otherwise access is denied.
 *
 * SECURITY WARNING: because these live in client-side code, they are visible
 * to anyone who can read the deployed bundle. They only gate the /admin UI —
 * they are NOT a substitute for real, server-side security. To change them,
 * edit ADMIN_USERNAME / ADMIN_PASSWORD below and rebuild the app.
 */
export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "RentEase@Admin2026";

const STORAGE_KEY = "rentease.admin.session";

function readSession(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

type AdminAuthCtx = {
  isAdmin: boolean;
  /** Compare typed credentials against the stored ones. Returns true on match. */
  signIn: (username: string, password: string) => boolean;
  signOut: () => void;
};

const Ctx = createContext<AdminAuthCtx>({
  isAdmin: false,
  signIn: () => false,
  signOut: () => {},
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setAdmin] = useState<boolean>(readSession);

  // Keep multiple tabs in sync via the storage event.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = () => setAdmin(readSession());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value: AdminAuthCtx = {
    isAdmin,
    signIn: (username, password) => {
      const ok = username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD;
      if (ok) {
        window.localStorage.setItem(STORAGE_KEY, "1");
        setAdmin(true);
      }
      return ok;
    },
    signOut: () => {
      window.localStorage.removeItem(STORAGE_KEY);
      setAdmin(false);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAdminAuth = () => useContext(Ctx);
