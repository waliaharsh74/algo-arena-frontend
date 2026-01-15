import type { Contest } from "@/types/api";

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "TBD";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return dateTimeFormatter.format(date);
};

export const formatDateRange = (start?: string | null, end?: string | null) =>
  `${formatDateTime(start)} - ${formatDateTime(end)}`;

export const formatDuration = (start?: string | null, end?: string | null) => {
  if (!start || !end) return "TBD";
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  if (Number.isNaN(startTime) || Number.isNaN(endTime)) return "TBD";
  const diffMs = Math.max(endTime - startTime, 0);
  const minutes = Math.round(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours <= 0) return `${Math.max(1, minutes)}m`;
  if (hours < 24) return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
};

export const formatCountdown = (target?: string | null) => {
  if (!target) return "TBD";
  const targetTime = new Date(target).getTime();
  if (Number.isNaN(targetTime)) return "TBD";
  const diffMs = targetTime - Date.now();
  if (diffMs <= 0) return "Now";
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
};

export const getContestStatus = (contest: Contest) => {
  const start = new Date(contest.startTime).getTime();
  const end = new Date(contest.endTime).getTime();
  const now = Date.now();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return { key: "upcoming" as const, label: "Scheduled" };
  }
  if (now < start) return { key: "upcoming" as const, label: "Upcoming" };
  if (now <= end) return { key: "active" as const, label: "Live" };
  return { key: "past" as const, label: "Completed" };
};

export const formatScore = (score?: number | null) => {
  if (score === undefined || score === null) return "--";
  return Math.round(score).toString();
};

