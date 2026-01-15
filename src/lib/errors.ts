export type ApiErrorDetails = string | Record<string, unknown> | undefined;

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: ApiErrorDetails;

  constructor(message: string, status: number, options?: { code?: string; details?: ApiErrorDetails }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options?.code;
    this.details = options?.details;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

export const isUnauthorized = (error: unknown) =>
  isApiError(error) && error.status === 401;

const formatDetails = (details?: ApiErrorDetails) => {
  if (!details) return undefined;
  if (typeof details === "string") return details;
  if (typeof details === "object") {
    const fieldErrors = (details as { fieldErrors?: Record<string, string[]> }).fieldErrors;
    if (fieldErrors) {
      const entry = Object.entries(fieldErrors).find(
        ([, messages]) => Array.isArray(messages) && messages.length > 0
      );
      if (entry) {
        const [field, messages] = entry;
        return `${field}: ${messages[0]}`;
      }
    }
    return "Request validation failed.";
  }
  return undefined;
};

export const getErrorMessage = (error: unknown, fallback = "Something went wrong") => {
  if (isApiError(error)) return error.message || fallback;
  if (error instanceof Error) return error.message || fallback;
  return fallback;
};

export const getErrorDescription = (error: unknown) => {
  if (isApiError(error)) return formatDetails(error.details);
  return undefined;
};

