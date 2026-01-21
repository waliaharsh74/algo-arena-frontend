import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { notifyError } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { useContestStore } from "@/store/contestStore";
import type { Question } from "@/types/api";

type AnswerRecord = {
  choiceIds: string[];
  awardedPoints: number;
  submittedAt: string;
};

type QuestionPanelProps = {
  contestId: string;
  questions: Question[];
  answers: Record<string, AnswerRecord>;
  isLoading: boolean;
};

export const QuestionPanel = ({ contestId, questions, answers, isLoading }: QuestionPanelProps) => {
  const { submitAnswer, submitLoading } = useContestStore();
  const [index, setIndex] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startedAtRef = useRef<Record<string, number>>({});

  const current = questions[index];
  const answerRecord = current ? answers[current.id] : undefined;
  const isAnswered = Boolean(answerRecord);

  useEffect(() => {
    setIndex(0);
    setSelectedChoices([]);
    setElapsedSeconds(0);
    startedAtRef.current = {};
  }, [contestId]);

  useEffect(() => {
    if (index >= questions.length) {
      setIndex(0);
    }
  }, [index, questions.length]);

  useEffect(() => {
    if (!current) {
      setSelectedChoices([]);
      setElapsedSeconds(0);
      return;
    }

    const storedChoices = answers[current.id]?.choiceIds ?? [];
    setSelectedChoices(storedChoices);

    if (answers[current.id]) {
      setElapsedSeconds(current.maxTimeSeconds);
      return;
    }

    if (!startedAtRef.current[current.id]) {
      startedAtRef.current[current.id] = Date.now();
    }

    const startedAt = startedAtRef.current[current.id];
    setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
  }, [current, answers]);

  useEffect(() => {
    if (!current || isAnswered) return;
    const startedAt = startedAtRef.current[current.id];
    if (!startedAt) return;
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [current, isAnswered]);

  const timeRemaining = useMemo(() => {
    if (!current) return 0;
    return Math.max(current.maxTimeSeconds - elapsedSeconds, 0);
  }, [current, elapsedSeconds]);

  const isLocked = isAnswered || timeRemaining <= 0;

  const timePercent = useMemo(() => {
    if (!current || current.maxTimeSeconds <= 0) return 0;
    return Math.round((timeRemaining / current.maxTimeSeconds) * 100);
  }, [current, timeRemaining]);

  const questionProgress = questions.length
    ? Math.round(((index + 1) / questions.length) * 100)
    : 0;

  const toggleChoice = (choiceId: string) => {
    if (!current || isLocked) return;
    if (current.isMultiple) {
      setSelectedChoices((prev) =>
        prev.includes(choiceId) ? prev.filter((id) => id !== choiceId) : [...prev, choiceId]
      );
    } else {
      setSelectedChoices([choiceId]);
    }
  };

  const handleSubmit = async () => {
    if (!current) return;
    if (!selectedChoices.length) {
      notifyError(new Error("Select at least one option."));
      return;
    }
    if (timeRemaining <= 0) {
      notifyError(new Error("Time limit reached for this question."));
      return;
    }
    const timeTakenSeconds = Math.max(1, Math.min(elapsedSeconds, current.maxTimeSeconds));
    await submitAnswer(contestId, {
      questionId: current.id,
      choiceIds: selectedChoices,
      timeTakenSeconds,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading questions...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, indexValue) => (
            <Skeleton key={indexValue} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!current) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No questions yet</CardTitle>
          <CardDescription>Join the contest to unlock MCQs.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              Question {index + 1} of {questions.length}
            </CardTitle>
            <CardDescription>{current.title}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={current.isMultiple ? "secondary" : "outline"}>
              {current.isMultiple ? "Multi select" : "Single select"}
            </Badge>
            <Badge variant="outline">{current.points} pts</Badge>
          </div>
        </div>
        <Progress value={questionProgress} className="mt-4" />
      </CardHeader>
      <CardContent className="space-y-5">
        {current.description ? (
          <p className="text-sm text-muted-foreground">{current.description}</p>
        ) : null}
        <div className="space-y-3">
          {current.choices.map((choice, choiceIndex) => {
            const isSelected = selectedChoices.includes(choice.id);
            const label = String.fromCharCode(65 + choiceIndex);
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => toggleChoice(choice.id)}
                disabled={isLocked}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-left text-sm transition hover:border-primary/50",
                  isSelected && "border-primary bg-primary/10",
                  isLocked && "cursor-not-allowed opacity-70"
                )}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {label}
                </span>
                <span className="flex-1">{choice.value}</span>
                {isSelected ? <CheckCircle2 className="h-4 w-4 text-primary" /> : null}
              </button>
            );
          })}
        </div>
        <div className="rounded-2xl border border-border/60 bg-muted/50 px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              <span>Time remaining</span>
            </div>
            <span className={timeRemaining <= 10 ? "text-destructive" : "text-foreground"}>
              {timeRemaining}s
            </span>
          </div>
          <Progress value={timePercent} className="mt-2" />
        </div>
        {answerRecord ? (
          <div className="rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm">
            Answer submitted. Points earned: {answerRecord.awardedPoints}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
              disabled={index === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={index === questions.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleSubmit} disabled={submitLoading || isAnswered || timeRemaining <= 0}>
            {submitLoading ? "Submitting..." : isAnswered ? "Submitted" : "Submit answer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
