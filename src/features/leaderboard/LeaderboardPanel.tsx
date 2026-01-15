import { useEffect } from "react";
import { Crown, Medal, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatScore } from "@/lib/format";
import { useContestStore } from "@/store/contestStore";

const rankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-4 w-4 text-primary" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-muted-foreground" />;
  if (rank === 3) return <Crown className="h-4 w-4 text-accent" />;
  return null;
};

type LeaderboardPanelProps = {
  contestId: string;
};

export const LeaderboardPanel = ({ contestId }: LeaderboardPanelProps) => {
  const { leaderboard, leaderboardLoading, loadLeaderboard } = useContestStore();

  useEffect(() => {
    void loadLeaderboard(contestId);
  }, [contestId, loadLeaderboard]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Leaderboard
            </CardTitle>
            <CardDescription>Top performers for this contest.</CardDescription>
          </div>
          {leaderboard ? (
            <Badge variant={leaderboard.source === "db" ? "secondary" : "default"}>
              {leaderboard.source === "db" ? "Final" : "Live"}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {leaderboardLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : leaderboard && leaderboard.entries.length ? (
          <div className="space-y-3">
            {leaderboard.entries.map((entry) => (
              <div
                key={entry.userId}
                className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {entry.rank}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">User {entry.userId.slice(0, 6)}</p>
                    <p className="text-xs text-muted-foreground">{entry.userId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{formatScore(entry.score)}</span>
                  {rankIcon(entry.rank)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Leaderboard will populate once participants start answering.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

