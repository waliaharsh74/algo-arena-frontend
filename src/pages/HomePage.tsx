import type { ReactNode } from "react";
import { useMemo } from "react";
import { Crown, Flame, Rocket } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { useContestStore } from "@/store/contestStore";

export const HomePage = () => {
  const { user } = useAuthStore();
  const { contestsByStatus } = useContestStore();
  const isAdmin = user?.role === "ADMIN";

  const counts = useMemo(
    () => ({
      active: contestsByStatus.active.length,
      upcoming: contestsByStatus.upcoming.length,
      past: contestsByStatus.past.length,
    }),
    [contestsByStatus]
  );

  return (
    <div className="space-y-10">
      <section className="">
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
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <StatCard label="Active" value={counts.active} icon={<Flame className="h-4 w-4" />} />
              <StatCard label="Upcoming" value={counts.upcoming} icon={<Rocket className="h-4 w-4" />} />
              <StatCard label="Past rounds" value={counts.past} icon={<Crown className="h-4 w-4" />} />
            </div>
          </CardContent>
        </Card>
        <Card className="animate-fade-up">
          {/* <CardHeader>
            <CardTitle>Session status</CardTitle>
            <CardDescription>Connection details and session activity.</CardDescription>
          </CardHeader> */}
          {/* <CardContent className="space-y-4">
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
          </CardContent> */}
        </Card>
      </section>

      <section className="">
        <div className="space-y-6">
          <Card className="animate-fade-up">
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
              <CardDescription>Jump into the arena or manage upcoming rounds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/contests">Explore contests</Link>
                </Button>
                {isAdmin ? (
                  <Button asChild variant="outline">
                    <Link to="/contests/create">Create contest</Link>
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-xs uppercase text-muted-foreground">Live rounds</p>
                  <p className="text-lg font-semibold">{counts.active}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-xs uppercase text-muted-foreground">Upcoming</p>
                  <p className="text-lg font-semibold">{counts.upcoming}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          {/* <UserCard /> */}
          {/* <Card className="animate-fade-up">
            <CardHeader>
              <CardTitle>Arena playbook</CardTitle>
              <CardDescription>Stay sharp during live rounds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Focus on accuracy first, speed follows.</p>
              <p>Review explanations between rounds to close gaps.</p>
              <p>Admins can schedule contests during low-traffic windows.</p>
            </CardContent>
          </Card> */}
        </div>
      </section>
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

// const UserCard = () => {
//   const { user } = useAuthStore();

//   if (!user) return null;

//   return (
//     <Card className="animate-fade-up">
//       <CardHeader>
//         <CardTitle className="flex items-center gap-2">
//           <UserRound className="h-5 w-5 text-primary" />
//           Signed in
//         </CardTitle>
//         <CardDescription>Welcome back, {user.email}.</CardDescription>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
//           <p className="text-xs uppercase text-muted-foreground">Role</p>
//           <p className="text-lg font-semibold">{user.role}</p>
//         </div>
//         <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
//           <p className="text-xs uppercase text-muted-foreground">Member since</p>
//           <p className="text-sm text-muted-foreground">
//             {new Date(user.createdAt).toLocaleDateString()}
//           </p>
//         </div>
//       </CardContent>
//     </Card>
//   );
// };
