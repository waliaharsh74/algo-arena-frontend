import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Search, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useContestStore } from "@/store/contestStore";
import { useQuestionBankStore } from "@/store/questionBankStore";
import type { QuestionBankItem } from "@/types/api";

const pageSize = 12;

const parseTags = (value: string) =>
  Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  );

export const QuestionLibraryPanel = () => {
  const { activeContest, activeContestId, attachQuestions, questionAttachLoading } =
    useContestStore();
  const { questions, pagination, loading, loadQuestions } = useQuestionBankStore();
  const [scope, setScope] = useState<"global" | "mine">("global");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [startOrder, setStartOrder] = useState("");
  const [startOrderError, setStartOrderError] = useState<string | null>(null);

  const totalPages = useMemo(() => {
    if (!pagination.total) return 1;
    return Math.ceil(pagination.total / pageSize);
  }, [pagination.total]);

  const canPrevious = page > 0;
  const canNext = (page + 1) * pageSize < pagination.total;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    void loadQuestions({
      scope,
      search: debouncedSearch,
      tags: activeTags,
      limit: pageSize,
      offset: page * pageSize,
    });
  }, [scope, debouncedSearch, activeTags, page, loadQuestions]);

  const handleScopeChange = (value: string) => {
    setScope(value as "global" | "mine");
    setPage(0);
    setSelectedIds(new Set());
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
    setSelectedIds(new Set());
  };

  const handleTagInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTagInput(event.target.value);
  };

  const handleApplyTags = () => {
    setActiveTags(parseTags(tagInput));
    setPage(0);
    setSelectedIds(new Set());
  };

  const handleClearFilters = () => {
    setSearch("");
    setTagInput("");
    setActiveTags([]);
    setPage(0);
    setSelectedIds(new Set());
  };

  const toggleSelection = (questionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!questions.length) return;
    setSelectedIds(new Set(questions.map((question) => question.id)));
  };

  const handleClearSelection = () => setSelectedIds(new Set());

  const goToPage = (nextPage: number) => {
    setPage(nextPage);
    setSelectedIds(new Set());
  };

  const handleStartOrderChange = (event: ChangeEvent<HTMLInputElement>) => {
    setStartOrder(event.target.value);
    setStartOrderError(null);
  };

  const handleAttach = async () => {
    if (!activeContestId || selectedIds.size === 0) return;
    const parsedStartOrder = startOrder.trim() ? Number(startOrder) : undefined;
    if (parsedStartOrder !== undefined && (!Number.isInteger(parsedStartOrder) || parsedStartOrder <= 0)) {
      setStartOrderError("Start order must be a positive number.");
      return;
    }
    const questionIds = questions
      .filter((question) => selectedIds.has(question.id))
      .map((question) => question.id);
    const added = await attachQuestions(activeContestId, {
      questionIds,
      startOrder: parsedStartOrder,
    });
    if (added !== null) {
      setSelectedIds(new Set());
      setStartOrder("");
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Question library
            </CardTitle>
            <CardDescription>
              Search the full bank, filter by tags, and add questions to a contest.
            </CardDescription>
          </div>
          <Badge variant="secondary">Admin only</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {!activeContest ? (
          <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Select a contest to attach questions. You can still browse the library.
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-background/80 px-4 py-2 text-sm">
            <span className="text-xs uppercase text-muted-foreground">Selected contest</span>
            <span className="font-semibold">{activeContest.title}</span>
          </div>
        )}

        <Tabs value={scope} onValueChange={handleScopeChange}>
          <TabsList className="mt-4 w-full sm:w-auto">
            <TabsTrigger value="global" className="flex-1 sm:flex-none">
              Global bank
            </TabsTrigger>
            <TabsTrigger value="mine" className="flex-1 sm:flex-none">
              My questions
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-5 grid gap-4 rounded-3xl border border-border/60 bg-background/80 p-5">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_auto]">
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="question-search">
                Search title or tags
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="question-search"
                  placeholder="Binary search, arrays, DP..."
                  value={search}
                  onChange={handleSearchChange}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="question-tags">
                Filter tags
              </label>
              <div className="relative">
                <Tag className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="question-tags"
                  placeholder="arrays, dp, greedy"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button type="button" variant="secondary" onClick={handleApplyTags}>
                Apply tags
              </Button>
              <Button type="button" variant="ghost" onClick={handleClearFilters}>
                Clear
              </Button>
            </div>
          </div>

          {activeTags.length ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground">Active tags:</span>
              {activeTags.map((tag) => (
                <Badge key={`filter-${tag}`} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{selectedCount} selected</Badge>
              <Button type="button" variant="ghost" size="sm" onClick={handleSelectAll}>
                Select page
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleClearSelection}>
                Clear selection
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="start-order">
                  Start order (optional)
                </label>
                <Input
                  id="start-order"
                  type="number"
                  min={1}
                  value={startOrder}
                  onChange={handleStartOrderChange}
                  disabled={!activeContestId || questionAttachLoading}
                  className={cn("h-9 w-32", startOrderError && "border-destructive")}
                />
                {startOrderError ? (
                  <p className="text-xs text-destructive">{startOrderError}</p>
                ) : null}
              </div>
              <Button
                type="button"
                onClick={handleAttach}
                disabled={!activeContestId || selectedCount === 0 || questionAttachLoading}
              >
                {questionAttachLoading ? "Adding..." : "Add to contest"}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <QuestionCardSkeleton key={`question-skeleton-${index}`} />
              ))
            : questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  selected={selectedIds.has(question.id)}
                  onToggle={() => toggleSelection(question.id)}
                />
              ))}
          {!loading && questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No questions match these filters yet. Try a different tag or search.
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            Showing {pagination.total ? page * pageSize + 1 : 0}-
            {Math.min((page + 1) * pageSize, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canPrevious}
              onClick={() => goToPage(Math.max(page - 1, 0))}
            >
              Previous
            </Button>
            <Badge variant="secondary">
              Page {Math.min(page + 1, totalPages)} of {totalPages}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canNext}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

type QuestionCardProps = {
  question: QuestionBankItem;
  selected: boolean;
  onToggle: () => void;
};

const QuestionCard = ({ question, selected, onToggle }: QuestionCardProps) => (
  <div
    className={cn(
      "rounded-3xl border border-border/60 bg-background/80 p-4 transition hover:border-primary/50",
      selected && "border-primary/60 bg-primary/5"
    )}
  >
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-1 h-4 w-4 accent-primary"
          aria-label={`Select ${question.title}`}
        />
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{question.title}</p>
            <Badge variant="outline">{question.isMultiple ? "Multi-select" : "Single-select"}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {question.description || "No description provided for this question."}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{question.points} pts</span>
            <span>{question.maxTimeSeconds}s</span>
            <span>{question.choicesCount} choices</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {question.tags.length ? (
              question.tags.map((tag) => (
                <Badge key={`${question.id}-${tag}`} variant="secondary">
                  {tag}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary">Untagged</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const QuestionCardSkeleton = () => (
  <div className="rounded-3xl border border-border/60 bg-background/70 p-4">
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-1 items-start gap-3">
        <Skeleton className="mt-1 h-4 w-4 rounded" />
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-14" />
          </div>
        </div>
      </div>
      <Skeleton className="h-9 w-20" />
    </div>
  </div>
);
