import "server-only";

import type { z } from "zod";

import type { ErrorEnvelope } from "@/lib/api/contracts";
import { getServerEnv } from "@/lib/bridge/env";

type BridgeJsonMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type BridgeJsonPath =
  | "/api/dashboard"
  | "/api/activities"
  | "/api/agents"
  | `/api/agents/${string}`
  | "/api/threads"
  | `/api/threads/${number}/messages`
  | "/api/plans"
  | `/api/plans/${number}/approve`
  | "/api/runs"
  | `/api/runs/${number}`
  | "/api/board"
  | "/api/calendar"
  | "/api/contents"
  | `/api/contents/${number}`
  | `/api/contents/${number}/stage`
  | `/api/contents/${number}/schedule`
  | "/api/approvals"
  | `/api/approvals/${number}`
  | `/api/approvals/${number}/approve`
  | `/api/approvals/${number}/reject`
  | `/api/approvals/${number}/revise`
  | "/api/instructions"
  | "/api/instructions/history"
  | `/api/instructions/${number}/approve`
  | `/api/instructions/${number}/reject`
  | `/api/instructions/${number}/rollback`
  | "/api/artifacts"
  | `/api/artifacts/${number}`
  | `/api/artifacts/${number}/compare/${number}`
  | "/api/settings"
  | "/api/workflow";

export interface BridgeJsonRequest {
  method?: BridgeJsonMethod;
  query?: URLSearchParams;
  body?: unknown;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export class BridgeError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: Record<string, unknown>,
    public readonly retryAfter: string | null,
  ) {
    super(message);
    this.name = "BridgeError";
  }
}

function parseErrorPayload(payload: unknown): ErrorEnvelope["error"] {
  if (typeof payload !== "object" || payload === null || !("error" in payload)) {
    return {
      code: "bridge_error",
      message: "Bridge request failed",
      details: {},
    };
  }

  const error = payload.error;

  if (typeof error !== "object" || error === null) {
    return {
      code: "bridge_error",
      message: "Bridge request failed",
      details: {},
    };
  }

  const code = "code" in error && typeof error.code === "string" ? error.code : "bridge_error";
  const message = "message" in error && typeof error.message === "string"
    ? error.message
    : "Bridge request failed";
  const details = "details" in error && typeof error.details === "object" && error.details !== null
    ? error.details as Record<string, unknown>
    : {};

  return { code, message, details };
}

export async function bridgeFetch(
  path: BridgeJsonPath,
  request: BridgeJsonRequest = {},
): Promise<unknown> {
  const environment = getServerEnv();

  if (environment.dataMode !== "live" || !environment.bridgeUrl || !environment.bridgeToken) {
    throw new BridgeError(
      503,
      "bridge_not_configured",
      "Bridge JSON client is available only in configured live mode",
      {},
      null,
    );
  }

  const url = new URL(path, environment.bridgeUrl);

  if (request.query) {
    url.search = request.query.toString();
  }

  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${environment.bridgeToken}`,
  });

  if (request.body !== undefined) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }

  if (request.idempotencyKey) {
    headers.set("Idempotency-Key", request.idempotencyKey);
  }

  const response = await fetch(url, {
    method: request.method ?? "GET",
    cache: "no-store",
    headers,
    body: request.body === undefined ? undefined : JSON.stringify(request.body),
    signal: request.signal,
  });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = parseErrorPayload(payload);
    throw new BridgeError(
      response.status,
      error.code,
      error.message,
      error.details,
      response.headers.get("retry-after"),
    );
  }

  return payload;
}

export async function bridgeJson<T>(
  path: BridgeJsonPath,
  schema: z.ZodType<T>,
  request: BridgeJsonRequest = {},
): Promise<T> {
  const payload = await bridgeFetch(path, request);

  return schema.parse(payload);
}
