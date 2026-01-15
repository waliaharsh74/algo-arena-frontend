import { z } from "zod";

export const contestStatus = ["upcoming", "active", "past"] as const;
export type ContestStatus = (typeof contestStatus)[number];

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["USER", "ADMIN"]),
  createdAt: z.string().datetime(),
});

export const contestSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  finalizedAt: z.string().datetime().nullable().optional(),
  createdById: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const choiceSchema = z.object({
  id: z.string().uuid(),
  value: z.string(),
});

export const questionSchema = z.object({
  id: z.string().uuid(),
  order: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  isMultiple: z.boolean(),
  points: z.number().int(),
  maxTimeSeconds: z.number().int(),
  choices: z.array(choiceSchema),
});

export const leaderboardEntrySchema = z.object({
  userId: z.string().uuid(),
  score: z.number(),
  rank: z.number().int(),
});

export const progressSchema = z.object({
  score: z.number(),
  rank: z.number().int().nullable(),
});

export const submitAnswerResponseSchema = z.object({
  score: z.number(),
  awardedPoints: z.number(),
});

export const contestsResponseSchema = z.object({
  contests: z.array(contestSchema),
});

export const contestResponseSchema = z.object({
  contest: contestSchema,
});

export const questionsResponseSchema = z.object({
  questions: z.array(questionSchema),
});

export const progressResponseSchema = z.object({
  progress: progressSchema,
});

export const leaderboardResponseSchema = z.object({
  source: z.enum(["redis", "db"]),
  entries: z.array(leaderboardEntrySchema),
});

export const authResponseSchema = z.object({
  user: userSchema,
});

export const logoutResponseSchema = z.object({
  success: z.boolean(),
});

export const joinContestResponseSchema = z.object({
  contestId: z.string().uuid(),
  userId: z.string().uuid(),
});

export type User = z.infer<typeof userSchema>;
export type Contest = z.infer<typeof contestSchema>;
export type Question = z.infer<typeof questionSchema>;
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
export type Progress = z.infer<typeof progressSchema>;
export type SubmitAnswerResult = z.infer<typeof submitAnswerResponseSchema>;
export type LeaderboardResponse = z.infer<typeof leaderboardResponseSchema>;
