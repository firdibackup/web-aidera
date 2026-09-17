import "server-only";

import { ZodError, type z } from "zod";

import {
  PROTOTYPE_DATA_SOURCE,
  type ResponseMeta,
} from "@/lib/api/contracts";
import { BridgeError } from "@/lib/bridge/json";
import { PrototypeStoreError } from "@/lib/prototype/store";

export interface RouteContext<TParams extends Record<string, string>> {
  params: Promise<TParams>;
}

export function prototypeMeta(
  pagination?: Pick<ResponseMeta, "total" | "limit" | "offset">,
): ResponseMeta {
  return {
    ...pagination,
    data_source: PROTOTYPE_DATA_SOURCE,
  };
}

export function jsonData<T>(data: T, meta?: ResponseMeta, status = 200): Response {
  return Response.json(meta ? { data, meta } : { data }, { status });
}

export async function parseJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw new RouteInputError("invalid_json", "Request body must contain valid JSON", {});
  }

  return schema.parse(payload);
}

export function getIdempotencyKey(request: Request): string {
  const key = request.headers.get("idempotency-key")?.trim();

  if (key && key.length <= 200) {
    return key;
  }

  if (key) {
    throw new RouteInputError(
      "invalid_idempotency_key",
      "Idempotency-Key must be at most 200 characters",
      {},
    );
  }

  return crypto.randomUUID();
}

export function parsePositiveInteger(value: string, field: string): number {
  if (!/^\d+$/.test(value)) {
    throw new RouteInputError("invalid_path_parameter", `${field} must be a positive integer`, {
      [field]: value,
    });
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new RouteInputError("invalid_path_parameter", `${field} must be a positive integer`, {
      [field]: value,
    });
  }

  return parsed;
}

export class RouteInputError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details: Record<string, unknown>,
  ) {
    super(message);
    this.name = "RouteInputError";
  }
}

export function routeError(error: unknown): Response {
  if (error instanceof ZodError) {
    return Response.json(
      {
        error: {
          code: "validation_error",
          message: "Request validation failed",
          details: { issues: error.issues },
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof RouteInputError) {
    return Response.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: 400 },
    );
  }

  if (error instanceof PrototypeStoreError) {
    return Response.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
  }

  if (error instanceof BridgeError) {
    const headers = new Headers();

    if (error.retryAfter) {
      headers.set("Retry-After", error.retryAfter);
    }

    return Response.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status, headers },
    );
  }

  return Response.json(
    {
      error: {
        code: "internal_error",
        message: "The request could not be completed",
        details: {},
      },
    },
    { status: 500 },
  );
}
