import { Link, useNavigate } from "@tanstack/react-router";
import { Home, MessageSquare, LayoutDashboard, Shield, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { useRole } from "@/lib/role";
import { useAuth } from "@/lib/auth";
import { useAdminAuth } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function Nav() {
  const { role, setRole } = useRole();
  const { user, signOut } = useAuth();
  const { isAdmin, signOut: adminSignOut } = useAdminAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links =
    role === "student" ? [
          { to: "/browse", label: "Browse", icon: Home },
          { to: "/messages", label: "Messages", icon: MessageSquare },
        ] : role === "landlord" ? [
            { to: "/landlord", label: "Dashboard", icon: LayoutDashboard },
            { to: "/messages", label: "Messages", icon: MessageSquare },
          ] : role === "admin" ? [{ to: "/admin", label: "Admin", icon: Shield }] : [];

  const allLinks = [
    ...links,
    { to: "/admin", label: "Admin", icon: Shield },
  ];

  const switchTo = async (r: "student" | "landlord") => {
    try {
      await setRole(r);
      navigate({ to: r === "student" ? "/browse" : "/landlord" });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not switch role");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Home className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">RentEase</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {allLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm font-medium bg-muted text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="capitalize">
                  {role ?? "Account"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  {user.email ?? user.phoneNumber ?? "Signed in"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {role === "admin" ? (
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Admin account
                  </DropdownMenuLabel>
                ) : (
                  <>
                    <DropdownMenuLabel>Switch role</DropdownMenuLabel>
                    <DropdownMenuItem disabled={role === "student"} onClick={() => switchTo("student")}>
                      Student
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={role === "landlord"} onClick={() => switchTo("landlord")}>
                      Landlord
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">Admin</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Admin session</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { adminSignOut(); navigate({ to: "/" }); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out of admin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => navigate({ to: "/login" })}>Sign in</Button>
          )}
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col p-2">
            {allLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
