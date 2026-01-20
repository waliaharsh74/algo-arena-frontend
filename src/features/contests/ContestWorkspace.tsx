import { useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  Crown,
  Flag,
  Play,
  Radar,
  Timer,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCountdown, formatDateRange, formatDuration, formatScore, getContestStatus } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useContestStore } from "@/store/contestStore";
import { LeaderboardPanel } from "@/features/leaderboard/LeaderboardPanel";
import { QuestionPanel } from "@/features/quiz/QuestionPanel";

export const ContestWorkspace = () => {
  const { user } = useAuthStore();
  const {
    activeContest,
    detailLoading,
    joinContest,
    joinLoading,
    questions,
    answers,
    progress,
    progressLoading,
    questionsLoading,
  } = useContestStore();
  const [tab, setTab] = useState("overview");

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const contestStatus = useMemo(
    () => (activeContest ? getContestStatus(activeContest) : null),
    [activeContest]
  );
  const isContestActive = contestStatus?.key === "active";
  const joinNote =
    contestStatus?.key === "upcoming"
      ? `Contest opens in ${formatCountdown(activeContest?.startTime)}.`
      : contestStatus?.key === "past"
        ? "Contest has ended. Final leaderboard is available."
        : "Contest not available yet.";

  const handleJoin = async () => {
    if (!activeContest) return;
    const success = await joinContest(activeContest.id);
    if (success) {
      setTab("play");
    }
  };

  if (!activeContest && !detailLoading) {
    return (
      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radar className="h-5 w-5 text-primary" />
            Contest workspace
          </CardTitle>
          <CardDescription>Select a contest to view details and start answering.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Choose a contest from the pipeline to open the workspace. Your live score and
            leaderboard will appear here.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activeContest) {
    return (
      <Card className="animate-fade-up">
        <CardHeader>
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {activeContest.title}
            </CardTitle>
            <CardDescription>{activeContest.description || "High-intensity MCQ round."}</CardDescription>
          </div>
          {contestStatus ? (
            <Badge variant={contestStatus.key === "active" ? "default" : "secondary"}>
              {contestStatus.label}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">
              Overview
            </TabsTrigger>
            <TabsTrigger value="play" className="flex-1">
              Play
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex-1">
              Leaderboard
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="mt-4 space-y-6">
              <div className="rounded-3xl border border-border/60 bg-background/80 p-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Schedule</p>
                    <p className="text-sm font-semibold">{formatDateRange(activeContest.startTime, activeContest.endTime)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-semibold">{formatDuration(activeContest.startTime, activeContest.endTime)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Questions loaded</p>
                    <p className="text-sm font-semibold">
                      {questionsLoading ? "Loading..." : totalQuestions || "Not loaded"}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {!user ? (
                    <div className="rounded-2xl border border-border bg-muted/60 px-4 py-2 text-xs text-muted-foreground">
                      Sign in to join this contest.
                    </div>
                  ) : isContestActive ? (
                    <Button onClick={handleJoin} disabled={joinLoading}>
                      <Play className="h-4 w-4" />
                      {joinLoading ? "Joining..." : "Join and start"}
                    </Button>
                  ) : (
                    <div className="rounded-2xl border border-border bg-muted/60 px-4 py-2 text-xs text-muted-foreground">
                      {joinNote}
                    </div>
                  )}
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Timer className="h-3 w-3" />
                    Timed MCQ format
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Flag className="h-3 w-3" />
                    Auto-scored submissions
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-border/60 bg-background/80 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase text-muted-foreground">Your score</p>
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-2 text-3xl font-semibold">{formatScore(progress?.score)}</p>
                  <p className="text-xs text-muted-foreground">Live score updates after each answer.</p>
                </div>
                <div className="rounded-3xl border border-border/60 bg-background/80 p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase text-muted-foreground">Rank</p>
                    <Crown className="h-4 w-4 text-primary" />
                  </div>
                  <p className="mt-2 text-3xl font-semibold">
                    {progressLoading ? "..." : progress?.rank ?? "--"}
                  </p>
                  <p className="text-xs text-muted-foreground">Current position on the live board.</p>
                </div>
              </div>

              <div className="rounded-3xl border border-border/60 bg-background/80 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Progress</p>
                    <p className="text-sm font-semibold">
                      {answeredCount}/{totalQuestions || "-"} answered
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="mt-3" />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="play">
            <div className="mt-4">
              <QuestionPanel
                contestId={activeContest.id}
                questions={questions}
                answers={answers}
                isLoading={questionsLoading}
              />
            </div>
          </TabsContent>
          <TabsContent value="leaderboard">
            <div className={cn("mt-4")}> 
              <LeaderboardPanel contestId={activeContest.id} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

