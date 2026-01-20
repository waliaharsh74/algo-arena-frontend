import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDateRange, formatDuration, getContestStatus } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import { useContestStore } from "@/store/contestStore";
import { contestStatus, type AdminQuestion } from "@/types/api";
import { createQuestionInputSchema, importQuestionsInputSchema, updateQuestionInputSchema } from "@/types/requests";

type QuestionChoiceFormValues = {
  value: string;
  isCorrect: boolean;
};

type QuestionFormValues = {
  title: string;
  description: string;
  points: string;
  maxTimeSeconds: string;
  order: string;
  isMultiple: boolean;
  choices: QuestionChoiceFormValues[];
};

type QuestionFormErrors = Partial<Record<keyof QuestionFormValues, string>> & {
  choices?: string;
};

type ImportFormValues = {
  sourceContestId: string;
  questionIds: string;
  startOrder: string;
};

type ImportFormErrors = Partial<Record<keyof ImportFormValues, string>>;

const emptyQuestionFormValues: QuestionFormValues = {
  title: "",
  description: "",
  points: "10",
  maxTimeSeconds: "60",
  order: "",
  isMultiple: false,
  choices: [
    { value: "", isCorrect: false },
    { value: "", isCorrect: false },
  ],
};

const emptyImportFormValues: ImportFormValues = {
  sourceContestId: "",
  questionIds: "",
  startOrder: "",
};

export const ContestQuestionPanel = () => {
  const { user } = useAuthStore();
  const {
    contestsByStatus,
    activeContest,
    activeContestId,
    adminQuestions,
    adminQuestionsLoading,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    importQuestions,
    questionCreateLoading,
    questionUpdateLoading,
    questionDeleteLoading,
    questionImportLoading,
    loadAdminQuestions,
  } = useContestStore();
  const [questionValues, setQuestionValues] = useState<QuestionFormValues>(emptyQuestionFormValues);
  const [questionErrors, setQuestionErrors] = useState<QuestionFormErrors>({});
  const [importValues, setImportValues] = useState<ImportFormValues>(emptyImportFormValues);
  const [importErrors, setImportErrors] = useState<ImportFormErrors>({});
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [orderTouched, setOrderTouched] = useState(false);

  const availableContests = useMemo(
    () =>
      contestStatus
        .flatMap((status) => contestsByStatus[status])
        .filter((contest) => contest.id !== activeContestId),
    [contestsByStatus, activeContestId]
  );

  const isContestSelected = Boolean(activeContestId);
  const isEditing = Boolean(editingQuestionId);
  const isSaving = questionCreateLoading || questionUpdateLoading;
  const contestStatusInfo = useMemo(
    () => (activeContest ? getContestStatus(activeContest) : null),
    [activeContest]
  );
  const nextOrder = useMemo(() => {
    if (!adminQuestions.length) return 1;
    return Math.max(...adminQuestions.map((question) => question.order)) + 1;
  }, [adminQuestions]);

  useEffect(() => {
    if (activeContestId) {
      void loadAdminQuestions(activeContestId);
    }
  }, [activeContestId, loadAdminQuestions]);

  useEffect(() => {
    setEditingQuestionId(null);
    setOrderTouched(false);
    setQuestionErrors({});
    setQuestionValues(emptyQuestionFormValues);
  }, [activeContestId]);

  useEffect(() => {
    if (!activeContestId || isEditing) return;
    setQuestionValues((prev) => {
      const suggested = String(nextOrder);
      if ((orderTouched && prev.order) || prev.order === suggested) {
        return prev;
      }
      return { ...prev, order: suggested };
    });
  }, [activeContestId, isEditing, nextOrder, orderTouched]);

  const handleQuestionFieldChange =
    (field: keyof QuestionFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setQuestionValues((prev) => ({ ...prev, [field]: value }));
      setQuestionErrors((prev) => ({ ...prev, [field]: undefined }));
      if (field === "order") {
        setOrderTouched(true);
      }
    };

  const handleMultipleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    setQuestionValues((prev) => {
      if (checked) {
        return { ...prev, isMultiple: true };
      }
      const firstCorrect = prev.choices.findIndex((choice) => choice.isCorrect);
      const nextChoices = prev.choices.map((choice, index) => ({
        ...choice,
        isCorrect: index === firstCorrect,
      }));
      return { ...prev, isMultiple: false, choices: nextChoices };
    });
    setQuestionErrors((prev) => ({ ...prev, choices: undefined }));
  };

  const handleChoiceChange = (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setQuestionValues((prev) => ({
      ...prev,
      choices: prev.choices.map((choice, choiceIndex) =>
        choiceIndex === index ? { ...choice, value } : choice
      ),
    }));
    setQuestionErrors((prev) => ({ ...prev, choices: undefined }));
  };

  const handleChoiceCorrectToggle = (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    setQuestionValues((prev) => ({
      ...prev,
      choices: prev.choices.map((choice, choiceIndex) => {
        if (choiceIndex !== index) {
          return prev.isMultiple ? choice : { ...choice, isCorrect: false };
        }
        return { ...choice, isCorrect: checked };
      }),
    }));
    setQuestionErrors((prev) => ({ ...prev, choices: undefined }));
  };

  const addChoice = () => {
    setQuestionValues((prev) => ({
      ...prev,
      choices: [...prev.choices, { value: "", isCorrect: false }],
    }));
  };

  const removeChoice = (index: number) => {
    setQuestionValues((prev) => {
      if (prev.choices.length <= 2) return prev;
      return { ...prev, choices: prev.choices.filter((_, choiceIndex) => choiceIndex !== index) };
    });
    setQuestionErrors((prev) => ({ ...prev, choices: undefined }));
  };

  const resetQuestionForm = () => {
    setQuestionValues(emptyQuestionFormValues);
    setQuestionErrors({});
    setEditingQuestionId(null);
    setOrderTouched(false);
  };

  const buildQuestionPayload = (values: QuestionFormValues) => ({
    title: values.title,
    description: values.description,
    isMultiple: values.isMultiple,
    points: values.points,
    maxTimeSeconds: values.maxTimeSeconds,
    choices: values.choices,
  });

  const handleQuestionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeContestId) return;
    if (isEditing && editingQuestionId) {
      const parsed = updateQuestionInputSchema.safeParse(buildQuestionPayload(questionValues));
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten().fieldErrors;
        setQuestionErrors({
          title: fieldErrors.title?.[0],
          description: fieldErrors.description?.[0],
          points: fieldErrors.points?.[0],
          maxTimeSeconds: fieldErrors.maxTimeSeconds?.[0],
          choices: fieldErrors.choices?.[0],
        });
        return;
      }

      const description = parsed.data.description?.trim() ?? "";
      const payload = {
        ...parsed.data,
        description: description ? description : null,
      };

      setQuestionErrors({});
      const updated = await updateQuestion(editingQuestionId, payload);
      if (updated) {
        resetQuestionForm();
        void loadAdminQuestions(activeContestId);
      }
      return;
    }

    const parsed = createQuestionInputSchema.safeParse({
      ...buildQuestionPayload(questionValues),
      order: questionValues.order,
    });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setQuestionErrors({
        title: fieldErrors.title?.[0],
        description: fieldErrors.description?.[0],
        points: fieldErrors.points?.[0],
        maxTimeSeconds: fieldErrors.maxTimeSeconds?.[0],
        order: fieldErrors.order?.[0],
        choices: fieldErrors.choices?.[0],
      });
      return;
    }

    const description = parsed.data.description?.trim() ?? "";
    const payload = {
      ...parsed.data,
      description: description ? description : null,
    };

    setQuestionErrors({});
    const created = await createQuestion(activeContestId, payload);
    if (created) {
      resetQuestionForm();
    }
  };

  const handleEditQuestion = (question: AdminQuestion) => {
    setEditingQuestionId(question.id);
    setQuestionValues({
      title: question.title,
      description: question.description ?? "",
      points: String(question.points),
      maxTimeSeconds: String(question.maxTimeSeconds),
      order: String(question.order),
      isMultiple: question.isMultiple,
      choices: question.choices.map((choice) => ({
        value: choice.value,
        isCorrect: choice.isCorrect,
      })),
    });
    setQuestionErrors({});
    setOrderTouched(true);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const removed = await deleteQuestion(questionId);
    if (removed) {
      if (editingQuestionId === questionId) {
        resetQuestionForm();
      }
      if (activeContestId) {
        void loadAdminQuestions(activeContestId);
      }
    }
  };

  const handleImportFieldChange =
    (field: keyof ImportFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setImportValues((prev) => ({ ...prev, [field]: value }));
      setImportErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const resetImportForm = () => {
    setImportValues(emptyImportFormValues);
    setImportErrors({});
  };

  const handleImportSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeContestId) return;
    const parsed = importQuestionsInputSchema.safeParse(importValues);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setImportErrors({
        sourceContestId: fieldErrors.sourceContestId?.[0],
        questionIds: fieldErrors.questionIds?.[0],
        startOrder: fieldErrors.startOrder?.[0],
      });
      return;
    }

    setImportErrors({});
    const imported = await importQuestions(activeContestId, parsed.data);
    if (imported) {
      resetImportForm();
    }
  };

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Question management</CardTitle>
            <CardDescription>Add fresh MCQs or pull in a ready-made question set.</CardDescription>
          </div>
          <Badge variant="secondary">Admin only</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {!activeContest ? (
          <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Select a contest from the admin panel to start managing questions.
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-background/80 px-4 py-2 text-sm">
            <span className="text-xs uppercase text-muted-foreground">Selected contest</span>
            <span className="font-semibold">{activeContest.title}</span>
          </div>
        )}

        {activeContest ? (
          <div className="mt-5 grid gap-6 ">
            
            <div className="rounded-3xl border border-border/60 bg-background/80 p-5">
            <div className="rounded-3xl border border-border/60 bg-background/80 p-5 mb-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase text-muted-foreground">Contest details</p>
                  <h3 className="text-lg font-semibold">{activeContest.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {activeContest.description || "High-intensity MCQ round."}
                  </p>
                </div>
                {contestStatusInfo ? (
                  <Badge
                    variant={contestStatusInfo.key === "active" ? "default" : "secondary"}
                  >
                    {contestStatusInfo.label}
                  </Badge>
                ) : null}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Schedule</p>
                  <p className="text-sm font-semibold">
                    {formatDateRange(activeContest.startTime, activeContest.endTime)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-semibold">
                    {formatDuration(activeContest.startTime, activeContest.endTime)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Questions</p>
                  <p className="text-sm font-semibold">
                    {adminQuestionsLoading ? "Loading..." : adminQuestions.length}
                  </p>
                </div>
              </div>
            </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase text-muted-foreground">Contest questions</p>
                  <h3 className="text-lg font-semibold">Added questions</h3>
                  <p className="text-xs text-muted-foreground">
                    Review the lineup and adjust your own questions.
                  </p>
                </div>
                <Badge variant="outline">{adminQuestions.length} total</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {adminQuestionsLoading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <ContestQuestionSkeleton key={`contest-question-${index}`} />
                    ))
                  : adminQuestions.map((question) => {
                      const canManage = Boolean(question.createdById && question.createdById === user?.id);
                      return (
                        <div
                          key={question.id}
                          className="rounded-2xl border border-border/60 bg-white/70 p-4"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">#{question.order}</Badge>
                                <p className="text-sm font-semibold">{question.title}</p>
                                <Badge variant="outline">
                                  {question.isMultiple ? "Multi-select" : "Single-select"}
                                </Badge>
                                {!canManage ? <Badge variant="secondary">Read only</Badge> : null}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {question.description || "No description provided."}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span>{question.points} pts</span>
                                <span>{question.maxTimeSeconds}s</span>
                                <span>{question.choices.length} choices</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditQuestion(question)}
                                disabled={!canManage || isSaving}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteQuestion(question.id)}
                                disabled={!canManage || questionDeleteLoading}
                              >
                                {questionDeleteLoading ? "Deleting..." : "Delete"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                {!adminQuestionsLoading && adminQuestions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No questions attached yet. Add a question or import a set to get started.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border/60 bg-background/80 p-5">
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground">
                {isEditing ? "Editing question" : "Create question"}
              </p>
              <h3 className="text-lg font-semibold">
                {isEditing ? "Update this MCQ" : "Add a new MCQ"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? "Refresh the question copy, scoring, or correct answers."
                  : "Define the prompt, scoring, and choices."}
              </p>
            </div>
            <form className="mt-4 space-y-4" onSubmit={handleQuestionSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="question-title">
                  Title
                </label>
                <Input
                  id="question-title"
                  placeholder="What is the time complexity of binary search?"
                  value={questionValues.title}
                  onChange={handleQuestionFieldChange("title")}
                  disabled={!isContestSelected || isSaving}
                />
                {questionErrors.title ? (
                  <p className="text-xs text-destructive">{questionErrors.title}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="question-description">
                  Description
                </label>
                <Textarea
                  id="question-description"
                  placeholder="Optional context for the question."
                  value={questionValues.description}
                  onChange={handleQuestionFieldChange("description")}
                  disabled={!isContestSelected || isSaving}
                  rows={3}
                />
                {questionErrors.description ? (
                  <p className="text-xs text-destructive">{questionErrors.description}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Optional. Clarify tricky prompts.</p>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="question-points">
                    Points
                  </label>
                  <Input
                    id="question-points"
                    type="number"
                    min={1}
                    value={questionValues.points}
                    onChange={handleQuestionFieldChange("points")}
                    disabled={!isContestSelected || isSaving}
                  />
                  {questionErrors.points ? (
                    <p className="text-xs text-destructive">{questionErrors.points}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="question-time">
                    Time limit (sec)
                  </label>
                  <Input
                    id="question-time"
                    type="number"
                    min={1}
                    value={questionValues.maxTimeSeconds}
                    onChange={handleQuestionFieldChange("maxTimeSeconds")}
                    disabled={!isContestSelected || isSaving}
                  />
                  {questionErrors.maxTimeSeconds ? (
                    <p className="text-xs text-destructive">{questionErrors.maxTimeSeconds}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="question-order">
                    Order (optional)
                  </label>
                  <Input
                    id="question-order"
                    type="number"
                    min={1}
                    value={questionValues.order}
                    onChange={handleQuestionFieldChange("order")}
                    disabled={!isContestSelected || isSaving || isEditing}
                  />
                  {questionErrors.order ? (
                    <p className="text-xs text-destructive">{questionErrors.order}</p>
                  ) : isEditing ? (
                    <p className="text-xs text-muted-foreground">Order is locked during edits.</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Leave blank to append after the last question.
                    </p>
                  )}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={questionValues.isMultiple}
                  onChange={handleMultipleChange}
                  disabled={!isContestSelected || isSaving}
                  className="h-4 w-4 accent-primary"
                />
                Allow multiple correct answers
              </label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Choices</label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addChoice}
                    disabled={!isContestSelected || isSaving}
                  >
                    Add choice
                  </Button>
                </div>
                {questionValues.choices.map((choice, index) => (
                  <div
                    key={`choice-${index}`}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-white/60 p-3"
                  >
                    <Input
                      placeholder={`Choice ${index + 1}`}
                      value={choice.value}
                      onChange={handleChoiceChange(index)}
                      disabled={!isContestSelected || isSaving}
                      className="flex-1"
                    />
                    <label className="flex items-center gap-2 text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={choice.isCorrect}
                        onChange={handleChoiceCorrectToggle(index)}
                        disabled={!isContestSelected || isSaving}
                        className="h-4 w-4 accent-primary"
                      />
                      Correct
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeChoice(index)}
                      disabled={
                        !isContestSelected || isSaving || questionValues.choices.length <= 2
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                {questionErrors.choices ? (
                  <p className="text-xs text-destructive">{questionErrors.choices}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Add at least two choices and mark the correct option.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={!isContestSelected || isSaving}>
                  {isEditing
                    ? questionUpdateLoading
                      ? "Saving..."
                      : "Save changes"
                    : questionCreateLoading
                      ? "Saving..."
                      : "Add question"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetQuestionForm}
                  disabled={!isContestSelected || isSaving}
                >
                  {isEditing ? "Cancel" : "Reset"}
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-border/60 bg-background/80 p-5">
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground">Import questions</p>
              <h3 className="text-lg font-semibold">Copy from another contest</h3>
              <p className="text-xs text-muted-foreground">
                Pull an existing set and append it to this contest.
              </p>
            </div>
            <form className="mt-4 space-y-4" onSubmit={handleImportSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="import-source">
                  Source contest
                </label>
                <select
                  id="import-source"
                  value={importValues.sourceContestId}
                  onChange={handleImportFieldChange("sourceContestId")}
                  disabled={!isContestSelected || questionImportLoading || availableContests.length === 0}
                  className="flex h-11 w-full rounded-2xl border border-border bg-white/70 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <option value="">Select a contest</option>
                  {availableContests.map((contest) => (
                    <option key={contest.id} value={contest.id}>
                      {contest.title}
                    </option>
                  ))}
                </select>
                {availableContests.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No other contests available yet.</p>
                ) : null}
                {importErrors.sourceContestId ? (
                  <p className="text-xs text-destructive">{importErrors.sourceContestId}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="import-ids">
                  Question IDs (optional)
                </label>
                <Textarea
                  id="import-ids"
                  placeholder="Paste question IDs separated by commas or spaces."
                  value={importValues.questionIds}
                  onChange={handleImportFieldChange("questionIds")}
                  disabled={!isContestSelected || questionImportLoading || availableContests.length === 0}
                  rows={3}
                />
                {importErrors.questionIds ? (
                  <p className="text-xs text-destructive">{importErrors.questionIds}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Leave blank to import every question from the selected contest.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="import-start">
                  Start order (optional)
                </label>
                <Input
                  id="import-start"
                  type="number"
                  min={1}
                  value={importValues.startOrder}
                  onChange={handleImportFieldChange("startOrder")}
                  disabled={!isContestSelected || questionImportLoading || availableContests.length === 0}
                />
                {importErrors.startOrder ? (
                  <p className="text-xs text-destructive">{importErrors.startOrder}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Leave blank to append after the last existing question.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  disabled={!isContestSelected || questionImportLoading || availableContests.length === 0}
                >
                  {questionImportLoading ? "Importing..." : "Import questions"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetImportForm}
                  disabled={!isContestSelected || questionImportLoading}
                >
                  Reset
                </Button>
              </div>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ContestQuestionSkeleton = () => (
  <div className="rounded-2xl border border-border/60 bg-white/60 p-4">
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  </div>
);
