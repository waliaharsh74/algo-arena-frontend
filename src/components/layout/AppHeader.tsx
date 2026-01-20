import { Link, NavLink } from "react-router-dom";
import { Swords, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const navLinkBase =
  "rounded-full px-4 py-2 text-sm font-semibold transition-colors";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    navLinkBase,
    isActive
      ? "bg-muted text-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );

export const AppHeader = () => {
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
        >
          <Swords className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Algo Arena</p>
          <h1 className="text-2xl font-semibold">MCQ Contest Platform</h1>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <nav className="flex flex-wrap items-center gap-2" aria-label="Primary">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <NavLink to="/contests" className={navLinkClass} end>
            Explore
          </NavLink>
          {isAdmin ? (
            <NavLink to="/contests/create" className={navLinkClass}>
              Create
            </NavLink>
          ) : null}
        </nav>
        <div className="hidden h-8 w-px bg-border/70 sm:block" />
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserRound className="h-4 w-4" />
                {user.email}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Signed in</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Role: {user.role}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => void logout()}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild>
            <a href="#auth">Sign in</a>
          </Button>
        )}
      </div>
    </header>
  );
};
