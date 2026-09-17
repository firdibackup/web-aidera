import { z } from "zod";

import {
  ErrorEnvelopeSchema,
  ResponseMetaSchema,
  type ResponseMeta,
} from "@/lib/api/contracts";

export type ApiPath = `/api/${string}`;

export interface BffOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export interface BffResponse<T> {
  data: T;
  meta?: ResponseMeta;
}

export class BffError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: Record<string, unknown>,
    public readonly retryAfter: string | null,
  ) {
    super(message);
    this.name = "BffError";
  }
}

function assertSameOriginApiPath(path: string): asserts path is ApiPath {
  if (!path.startsWith("/api/") || path.startsWith("//") || path.includes("://")) {
    throw new TypeError("BFF requests must use a same-origin /api/* path");
  }
}

export async function bff<T>(
  path: ApiPath,
  schema: z.ZodType<T>,
  options: BffOptions = {},
): Promise<BffResponse<T>> {
  assertSameOriginApiPath(path);

  const headers = new Headers(options.headers);
  headers.delete("authorization");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }

  const response = await fetch(path, {
    ...options,
    cache: options.cache ?? "no-store",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = ErrorEnvelopeSchema.safeParse(payload);
    const error = parsedError.success
      ? parsedError.data.error
      : { code: "bff_error", message: "BFF request failed", details: {} };

    throw new BffError(
      response.status,
      error.code,
      error.message,
      error.details,
      response.headers.get("retry-after"),
    );
  }

  return z
    .object({
      data: schema,
      meta: ResponseMetaSchema.optional(),
    })
    .strict()
    .parse(payload);
}

export function createIdempotencyKey(): string {
  return crypto.randomUUID();
}
