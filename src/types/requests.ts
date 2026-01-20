import { z } from "zod";

const limits = {
  contestTitleMaxLength: 200,
  contestDescriptionMaxLength: 2000,
  questionTitleMaxLength: 500,
  questionDescriptionMaxLength: 2000,
  choiceValueMaxLength: 500,
};

const oneDayMs = 24 * 60 * 60 * 1000;

const isValidDateString = (value: string) => !Number.isNaN(new Date(value).getTime());

const dateStringSchema = (label: string) =>
  z
    .string()
    .min(1, `${label} is required.`)
    .refine((value) => isValidDateString(value), {
      message: `${label} is invalid.`,
    });

const positiveIntSchema = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} must be a number.` })
    .int({ message: `${label} must be a whole number.` })
    .positive({ message: `${label} must be greater than 0.` });

const optionalPositiveIntSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return value;
  },
  z.coerce.number().int().positive().optional()
);

const questionIdsSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const ids = value
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    return ids.length ? ids : undefined;
  },
  z.array(z.string().uuid()).optional()
);

const contestBaseSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required.")
      .max(limits.contestTitleMaxLength, `Title must be at most ${limits.contestTitleMaxLength} characters.`),
    description: z
      .string()
      .trim()
      .max(
        limits.contestDescriptionMaxLength,
        `Description must be at most ${limits.contestDescriptionMaxLength} characters.`
      )
      .nullable()
      .optional(),
    startTime: dateStringSchema("Start time"),
    endTime: dateStringSchema("End time"),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!isValidDateString(data.startTime) || !isValidDateString(data.endTime)) return;
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    if (start >= end) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be after start time.",
      });
    }
  });

export const updateContestInputSchema = contestBaseSchema;

export const createContestInputSchema = contestBaseSchema.superRefine((data, ctx) => {
  if (!isValidDateString(data.startTime)) return;
  const start = new Date(data.startTime);
  if (start.getTime() < Date.now() + oneDayMs) {
    ctx.addIssue({
      code: "custom",
      path: ["startTime"],
      message: "Start time must be at least 1 day from now.",
    });
  }
});

const choiceInputSchema = z
  .object({
    value: z
      .string()
      .trim()
      .min(1, "Choice value is required.")
      .max(limits.choiceValueMaxLength, `Choice value must be at most ${limits.choiceValueMaxLength} characters.`),
    isCorrect: z.boolean(),
  })
  .strict();

export const createQuestionInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required.")
      .max(limits.questionTitleMaxLength, `Title must be at most ${limits.questionTitleMaxLength} characters.`),
    description: z
      .string()
      .trim()
      .max(
        limits.questionDescriptionMaxLength,
        `Description must be at most ${limits.questionDescriptionMaxLength} characters.`
      )
      .nullable()
      .optional(),
    isMultiple: z.boolean().default(false),
    points: positiveIntSchema("Points"),
    maxTimeSeconds: positiveIntSchema("Time limit"),
    order: optionalPositiveIntSchema,
    choices: z.array(choiceInputSchema).min(2, "At least two choices are required."),
  })
  .strict()
  .superRefine((data, ctx) => {
    const correctCount = data.choices.filter((choice) => choice.isCorrect).length;
    if (correctCount === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: "At least one correct option is required.",
      });
    }
    if (!data.isMultiple && correctCount !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: "Exactly one correct option is required for single-select.",
      });
    }
    const values = data.choices.map((choice) => choice.value);
    const uniqueValues = new Set(values);
    if (uniqueValues.size !== values.length) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: "Duplicate choice values are not allowed.",
      });
    }
  });

export const updateQuestionInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required.")
      .max(limits.questionTitleMaxLength, `Title must be at most ${limits.questionTitleMaxLength} characters.`),
    description: z
      .string()
      .trim()
      .max(
        limits.questionDescriptionMaxLength,
        `Description must be at most ${limits.questionDescriptionMaxLength} characters.`
      )
      .nullable()
      .optional(),
    isMultiple: z.boolean().default(false),
    points: positiveIntSchema("Points"),
    maxTimeSeconds: positiveIntSchema("Time limit"),
    choices: z.array(choiceInputSchema).min(2, "At least two choices are required."),
  })
  .strict()
  .superRefine((data, ctx) => {
    const correctCount = data.choices.filter((choice) => choice.isCorrect).length;
    if (correctCount === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: "At least one correct option is required.",
      });
    }
    if (!data.isMultiple && correctCount !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: "Exactly one correct option is required for single-select.",
      });
    }
    const values = data.choices.map((choice) => choice.value);
    const uniqueValues = new Set(values);
    if (uniqueValues.size !== values.length) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: "Duplicate choice values are not allowed.",
      });
    }
  });

export const importQuestionsInputSchema = z
  .object({
    sourceContestId: z.string().uuid("Select a source contest."),
    questionIds: questionIdsSchema,
    startOrder: optionalPositiveIntSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!data.questionIds?.length) return;
    const uniqueIds = new Set(data.questionIds);
    if (uniqueIds.size !== data.questionIds.length) {
      ctx.addIssue({
        code: "custom",
        path: ["questionIds"],
        message: "Duplicate question ids are not allowed.",
      });
    }
  });
