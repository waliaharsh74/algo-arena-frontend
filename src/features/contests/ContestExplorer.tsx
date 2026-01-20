import { useMemo, useState } from "react";
import { Calendar, Clock, Flame, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCountdown, formatDateRange, formatDuration, getContestStatus } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useContestStore } from "@/store/contestStore";
import type { Contest, ContestStatus } from "@/types/api";

const statusCopy: Record<ContestStatus, string> = {
  upcoming: "Upcoming",
  active: "Live now",
  past: "Finished",
};

export const ContestExplorer = () => {
  const { contestsByStatus, listLoading, listLoaded, selectContest, activeContestId } =
    useContestStore();
  const [status, setStatus] = useState<ContestStatus>("active");

  const counts = useMemo(
    () => ({
      upcoming: contestsByStatus.upcoming.length,
      active: contestsByStatus.active.length,
      past: contestsByStatus.past.length,
    }),
    [contestsByStatus]
  );

  const list = contestsByStatus[status];
  const isLoading = listLoading[status] || !listLoaded[status];

  const handleStatusChange = (value: string) => setStatus(value as ContestStatus);

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Contest pipeline
            </CardTitle>
            <CardDescription>Pick a round and jump into live scoring.</CardDescription>
          </div>
          <Badge variant="secondary">{statusCopy[status]}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={status} onValueChange={handleStatusChange}>
          <TabsList className="w-full justify-between">
            <TabsTrigger value="active" className="flex-1">
              Active ({counts.active})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1">
              Upcoming ({counts.upcoming})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1">
              Past ({counts.past})
            </TabsTrigger>
          </TabsList>
          <TabsContent value={status}>
            <div className="mt-4 space-y-4">
              {isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <ContestCardSkeleton key={`browse-skeleton-${index}`} />
                  ))
                : list.map((contest) => (
                    <ContestCard
                      key={contest.id}
                      contest={contest}
                      isSelected={contest.id === activeContestId}
                      onSelect={() => selectContest(contest.id)}
                    />
                  ))}
              {!isLoading && list.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No contests in this lane yet. Check back soon for new rounds.
                </div>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

type ContestCardProps = {
  contest: Contest;
  isSelected: boolean;
  onSelect: () => void;
};

const ContestCard = ({ contest, isSelected, onSelect }: ContestCardProps) => {
  const status = getContestStatus(contest);
  const timeCopy =
    status.key === "upcoming"
      ? `Starts in ${formatCountdown(contest.startTime)}`
      : status.key === "active"
        ? `Ends in ${formatCountdown(contest.endTime)}`
        : "Round completed";

  return (
    <div
      className={cn(
        "rounded-3xl border border-border/60 bg-background/80 p-5 transition hover:border-primary/50",
        isSelected && "border-primary/60 bg-primary/5"
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status.key === "active" ? "default" : "muted"}>{status.label}</Badge>
            {contest.finalizedAt ? <Badge variant="secondary">Finalized</Badge> : null}
          </div>
          <h4 className="text-lg font-semibold">{contest.title}</h4>
          <p className="text-sm text-muted-foreground">
            {contest.description || "Short, focused MCQ round for quick points."}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDateRange(contest.startTime, contest.endTime)}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatDuration(contest.startTime, contest.endTime)}
            </span>
            <span className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              {timeCopy}
            </span>
          </div>
        </div>
        <Button variant={status.key === "active" ? "default" : "outline"} onClick={onSelect}>
          {isSelected ? "Selected" : "View"}
        </Button>
      </div>
    </div>
  );
};

const ContestCardSkeleton = () => (
  <div className="rounded-3xl border border-border/60 bg-background/70 p-5">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);
