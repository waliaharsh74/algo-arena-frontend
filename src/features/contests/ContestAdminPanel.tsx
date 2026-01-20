import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useState } from "react";
import { Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatDateRange, formatDuration, getContestStatus } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useContestStore } from "@/store/contestStore";
import type { Contest, ContestStatus } from "@/types/api";
import { createContestInputSchema, updateContestInputSchema } from "@/types/requests";

const statusCopy: Record<ContestStatus, string> = {
  upcoming: "Upcoming",
  active: "Live now",
  past: "Finished",
};

type ContestFormValues = {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
};

type ContestFormErrors = Partial<Record<keyof ContestFormValues, string>>;

const emptyFormValues: ContestFormValues = {
  title: "",
  description: "",
  startTime: "",
  endTime: "",
};

const toInputDateTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const ContestAdminPanel = () => {
  const {
    contestsByStatus,
    listLoading,
    listLoaded,
    selectContest,
    activeContestId,
    createContest,
    updateContest,
    createLoading,
    updateLoading,
  } = useContestStore();
  const [status, setStatus] = useState<ContestStatus>("active");
  const [formValues, setFormValues] = useState<ContestFormValues>(emptyFormValues);
  const [formErrors, setFormErrors] = useState<ContestFormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const isEditing = Boolean(editingId);
  const isSaving = createLoading || updateLoading;

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

  const handleFieldChange =
    (field: keyof ContestFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const resetForm = () => {
    setFormValues(emptyFormValues);
    setFormErrors({});
    setEditingId(null);
  };

  const handleEdit = (contest: Contest) => {
    setEditingId(contest.id);
    setFormValues({
      title: contest.title,
      description: contest.description ?? "",
      startTime: toInputDateTime(contest.startTime),
      endTime: toInputDateTime(contest.endTime),
    });
    setFormErrors({});
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const schema = editingId ? updateContestInputSchema : createContestInputSchema;
    const parsed = schema.safeParse(formValues);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setFormErrors({
        title: fieldErrors.title?.[0],
        description: fieldErrors.description?.[0],
        startTime: fieldErrors.startTime?.[0],
        endTime: fieldErrors.endTime?.[0],
      });
      return;
    }

    const startDate = new Date(parsed.data.startTime);
    const endDate = new Date(parsed.data.endTime);
    const description = parsed.data.description?.trim() ?? "";
    const payload = {
      title: parsed.data.title.trim(),
      description: description ? description : null,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    };

    setFormErrors({});
    const saved = editingId
      ? await updateContest(editingId, payload)
      : await createContest(payload);

    if (saved) {
      resetForm();
    }
  };

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Contest admin
            </CardTitle>
            <CardDescription>Create, schedule, and refine contest rounds.</CardDescription>
          </div>
          <Badge variant="secondary">Admin only</Badge>
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
            <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-border/60 bg-background/80 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Admin console</p>
                    <h3 className="text-lg font-semibold">
                      {isEditing ? "Edit contest" : "Create contest"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isEditing
                        ? "Update timing or refresh the contest details."
                        : "Schedule a new contest for the next round."}
                    </p>
                  </div>
                  {isEditing ? <Badge variant="secondary">Editing</Badge> : null}
                </div>
                <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold" htmlFor="contest-title">
                      Title
                    </label>
                    <Input
                      id="contest-title"
                      placeholder="Lightning round: Arrays"
                      value={formValues.title}
                      onChange={handleFieldChange("title")}
                      disabled={isSaving}
                    />
                    {formErrors.title ? (
                      <p className="text-xs text-destructive">{formErrors.title}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold" htmlFor="contest-description">
                      Description
                    </label>
                    <Textarea
                      id="contest-description"
                      placeholder="Short, focused MCQ round for quick points."
                      value={formValues.description}
                      onChange={handleFieldChange("description")}
                      disabled={isSaving}
                      rows={3}
                    />
                    {formErrors.description ? (
                      <p className="text-xs text-destructive">{formErrors.description}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Optional. Keep it short and focused.
                      </p>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="contest-start">
                        Start time
                      </label>
                      <Input
                        id="contest-start"
                        type="datetime-local"
                        value={formValues.startTime}
                        onChange={handleFieldChange("startTime")}
                        disabled={isSaving}
                      />
                      {formErrors.startTime ? (
                        <p className="text-xs text-destructive">{formErrors.startTime}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" htmlFor="contest-end">
                        End time
                      </label>
                      <Input
                        id="contest-end"
                        type="datetime-local"
                        value={formValues.endTime}
                        onChange={handleFieldChange("endTime")}
                        disabled={isSaving}
                      />
                      {formErrors.endTime ? (
                        <p className="text-xs text-destructive">{formErrors.endTime}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={isSaving}>
                      {isEditing
                        ? updateLoading
                          ? "Saving..."
                          : "Save changes"
                        : createLoading
                          ? "Creating..."
                          : "Create contest"}
                    </Button>
                    {isEditing ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </form>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Manage contests</p>
                    <p className="text-sm font-semibold">{statusCopy[status]} lane</p>
                  </div>
                  <Badge variant="outline">{list.length} total</Badge>
                </div>
                <div className="space-y-3">
                  {isLoading
                    ? Array.from({ length: 3 }).map((_, index) => (
                        <ContestCardSkeleton key={`admin-skeleton-${index}`} />
                      ))
                    : list.map((contest) => (
                        <AdminContestCard
                          key={contest.id}
                          contest={contest}
                          isSelected={contest.id === activeContestId}
                          onSelect={() => selectContest(contest.id)}
                          onEdit={() => handleEdit(contest)}
                        />
                      ))}
                  {!isLoading && list.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                      No contests here yet. Create the next round to populate this lane.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

type AdminContestCardProps = {
  contest: Contest;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
};

const AdminContestCard = ({ contest, isSelected, onSelect, onEdit }: AdminContestCardProps) => {
  const status = getContestStatus(contest);

  return (
    <div
      className={cn(
        "rounded-3xl border border-border/60 bg-background/80 p-4 transition hover:border-primary/50",
        isSelected && "border-primary/60 bg-primary/5"
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status.key === "active" ? "default" : "muted"}>{status.label}</Badge>
            {contest.finalizedAt ? <Badge variant="secondary">Finalized</Badge> : null}
          </div>
          <p className="text-sm font-semibold">{contest.title}</p>
          <p className="text-xs text-muted-foreground">
            {formatDateRange(contest.startTime, contest.endTime)} |{" "}
            {formatDuration(contest.startTime, contest.endTime)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button
            variant={isSelected ? "default" : "secondary"}
            size="sm"
            onClick={onSelect}
          >
            {isSelected ? "Selected" : "Open"}
          </Button>
        </div>
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
