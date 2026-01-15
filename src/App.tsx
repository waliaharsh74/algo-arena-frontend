import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { Crown, Flame, Rocket, Swords, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { useAuthStore } from "@/store/authStore";
import { useContestStore } from "@/store/contestStore";
import { AuthPanel } from "@/features/auth/AuthPanel";
import { ContestExplorer } from "@/features/contests/ContestExplorer";
import { ContestWorkspace } from "@/features/contests/ContestWorkspace";

const App = () => {
  const { user, status, refresh, logout } = useAuthStore();
  const { contestsByStatus, loadAllContests } = useContestStore();

  useEffect(() => {
    void refresh();
    void loadAllContests();
  }, [refresh, loadAllContests]);

  const counts = useMemo(
    () => ({
      active: contestsByStatus.active.length,
      upcoming: contestsByStatus.upcoming.length,
      past: contestsByStatus.past.length,
    }),
    [contestsByStatus]
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:py-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Swords className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Algo Arena</p>
              <h1 className="text-2xl font-semibold">MCQ Contest Platform</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">API {env.apiBaseUrl}</Badge>
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

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="bg-hero-glow">
            <CardHeader>
              <CardTitle className="text-3xl leading-tight">
                Live MCQ battles with real-time scoring and ranked leaderboards.
              </CardTitle>
              <CardDescription className="text-base">
                Compete in timed rounds, track your accuracy, and climb the leaderboard as
                answers land. Clean architecture, tight feedback loops.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary">Timed questions</Badge>
                <Badge variant="secondary">Instant scoring</Badge>
                <Badge variant="secondary">Role-based access</Badge>
                <Badge variant="secondary">Zustand + Zod</Badge>
                <Badge variant="secondary">Shadcn UI</Badge>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <StatCard label="Active" value={counts.active} icon={<Flame className="h-4 w-4" />} />
                <StatCard label="Upcoming" value={counts.upcoming} icon={<Rocket className="h-4 w-4" />} />
                <StatCard label="Past rounds" value={counts.past} icon={<Crown className="h-4 w-4" />} />
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-up">
            <CardHeader>
              <CardTitle>Session status</CardTitle>
              <CardDescription>Connection details and session activity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                <p className="text-xs uppercase text-muted-foreground">Auth status</p>
                <p className="text-lg font-semibold">
                  {status === "authenticated" ? "Authenticated" : "Guest"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                <p className="text-xs uppercase text-muted-foreground">Cookies</p>
                <p className="text-sm text-muted-foreground">
                  Auth uses secure HttpOnly cookies. Make sure the API origin matches the
                  frontend.
                </p>
              </div>
              {user ? (
                <Button variant="outline" onClick={() => void logout()}>
                  Sign out
                </Button>
              ) : (
                <Button asChild>
                  <a href="#auth">Create an account</a>
                </Button>
              )}
            </CardContent>
          </Card>
        </section>

        <main className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <ContestExplorer />
          </div>
          <div className="space-y-6">
            {user ? <UserCard /> : <AuthPanel />}
            <ContestWorkspace />
          </div>
        </main>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon }: { label: string; value: number; icon: ReactNode }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm">
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-primary">
      {icon}
    </div>
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  </div>
);

const UserCard = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="h-5 w-5 text-primary" />
          Signed in
        </CardTitle>
        <CardDescription>Welcome back, {user.email}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
          <p className="text-xs uppercase text-muted-foreground">Role</p>
          <p className="text-lg font-semibold">{user.role}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
          <p className="text-xs uppercase text-muted-foreground">Member since</p>
          <p className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default App;

