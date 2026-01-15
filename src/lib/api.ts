import { z } from "zod";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/errors";

const errorPayloadSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.unknown().optional(),
  }),
});

const parseJson = async (res: Response) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const buildError = (res: Response, payload: unknown) => {
  const parsed = errorPayloadSchema.safeParse(payload);
  if (parsed.success) {
    const { message, code, details } = parsed.data.error;
    return new ApiError(message, res.status, { code, details });
  }
  return new ApiError("Request failed", res.status, {
    code: "REQUEST_FAILED",
  });
};

const request = async <T>(
  path: string,
  options: RequestInit,
  schema: z.ZodType<T>
): Promise<T> => {
  const url = `${env.apiBaseUrl}${path}`;
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    throw buildError(response, payload);
  }

  const data = payload?.data ?? payload;
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError("Unexpected response from server", response.status, {
      code: "INVALID_RESPONSE",
      details: parsed.error.flatten(),
    });
  }

  return parsed.data;
};

export const api = {
  get: <T>(path: string, schema: z.ZodType<T>) =>
    request(path, { method: "GET" }, schema),
  post: <T>(path: string, body: unknown, schema: z.ZodType<T>) =>
    request(
      path,
      {
        method: "POST",
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      schema
    ),
  patch: <T>(path: string, body: unknown, schema: z.ZodType<T>) =>
    request(
      path,
      {
        method: "PATCH",
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      schema
    ),
};

