import { Link, useNavigate } from "@tanstack/react-router";
import { Home, MessageSquare, LayoutDashboard, Shield, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { useRole } from "@/lib/role";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Nav() {
  const { role, setRole } = useRole();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links =
    role === "student"
      ? [
          { to: "/browse", label: "Browse", icon: Home },
          { to: "/messages", label: "Messages", icon: MessageSquare },
        ]
      : role === "landlord"
        ? [
            { to: "/landlord", label: "Dashboard", icon: LayoutDashboard },
            { to: "/messages", label: "Messages", icon: MessageSquare },
          ]
        : role === "admin"
          ? [{ to: "/admin", label: "Admin", icon: Shield }]
          : [];

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
          {links.map((l) => (
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
          {role ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="capitalize">
                  {role}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Switch role</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => { setRole("student"); navigate({ to: "/browse" }); }}>
                  Student
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setRole("landlord"); navigate({ to: "/landlord" }); }}>
                  Landlord
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setRole("admin"); navigate({ to: "/admin" }); }}>
                  Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setRole(null); navigate({ to: "/" }); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
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
            {links.map((l) => (
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
