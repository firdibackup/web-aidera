import { z } from "zod";

import { SafeAgentResponseV1Schema } from "./chat";
import {
  AgentSlugSchema,
  DataSourceFieldSchema,
  IsoDateTimeSchema,
  PositiveIdSchema,
} from "./common";

export const RunStatusSchema = z.enum([
  "queued",
  "running",
  "working",
  "completed",
  "failed",
  "cancelled",
  "blocked",
]);

export const StartRunInputSchema = z
  .object({
    agent: AgentSlugSchema,
    prompt: z.string().min(1).max(8000),
    thread_id: PositiveIdSchema.nullable().optional(),
  })
  .strict();

export const RunSummarySchema = z
  .object({
    run_id: PositiveIdSchema,
    status: RunStatusSchema,
    agent: AgentSlugSchema,
    thread_id: PositiveIdSchema.nullable(),
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const RunDetailSchema = z
  .object({
    id: PositiveIdSchema,
    agent: AgentSlugSchema,
    status: RunStatusSchema,
    prompt: z.string(),
    result: z.union([z.null(), SafeAgentResponseV1Schema]),
    error: z.string().min(1).nullable(),
    token_input: z.number().int().nonnegative().nullable(),
    token_output: z.number().int().nonnegative().nullable(),
    cost_usd: z.number().nonnegative().nullable(),
    created_at: IsoDateTimeSchema,
    finished_at: IsoDateTimeSchema.nullable(),
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const TERMINAL_RUN_STATUSES = ["completed", "failed", "cancelled", "blocked"] as const;

export type RunStatus = z.infer<typeof RunStatusSchema>;
export type StartRunInput = z.infer<typeof StartRunInputSchema>;
export type RunSummary = z.infer<typeof RunSummarySchema>;
export type RunDetail = z.infer<typeof RunDetailSchema>;
