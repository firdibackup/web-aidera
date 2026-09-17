import { z } from "zod";

import {
  AgentSlugSchema,
  DataSourceFieldSchema,
  IsoDateTimeSchema,
  NonNegativeIntegerSchema,
  PositiveIdSchema,
} from "./common";

export const DecisionItemSchema = z
  .object({
    id: PositiveIdSchema,
    type: z.enum(["plan", "copy", "final", "instruction"]),
    title: z.string().min(1),
    reason: z.string().min(1),
    requested_at: IsoDateTimeSchema,
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const ActiveAgentSchema = z
  .object({
    slug: AgentSlugSchema,
    name: z.string().min(1),
    status: z.literal("working"),
    run_id: PositiveIdSchema,
    started_at: IsoDateTimeSchema,
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const UpcomingContentSchema = z
  .object({
    id: PositiveIdSchema,
    code: z.string().min(1),
    title: z.string().min(1),
    scheduled_at: IsoDateTimeSchema,
    ready: z.boolean(),
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const PipelineHealthSchema = z
  .object({
    queued: NonNegativeIntegerSchema,
    working: NonNegativeIntegerSchema,
    failed: NonNegativeIntegerSchema,
    blocked: NonNegativeIntegerSchema,
  })
  .strict();

export const DashboardSchema = z
  .object({
    needs_decision: z.array(DecisionItemSchema),
    active_agents: z.array(ActiveAgentSchema),
    upcoming: z.array(UpcomingContentSchema),
    overdue_count: NonNegativeIntegerSchema,
    not_ready_count: NonNegativeIntegerSchema,
    pipeline_health: PipelineHealthSchema,
    rollup: z
      .object({
        token_estimate: NonNegativeIntegerSchema.nullable(),
        cost_estimate_usd: z.number().nonnegative().nullable(),
        duration_seconds: NonNegativeIntegerSchema.nullable(),
      })
      .strict(),
    updated_at: IsoDateTimeSchema,
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const ActivitySchema = z
  .object({
    id: PositiveIdSchema,
    actor: z.string().min(1),
    event_type: z.enum([
      "task_created",
      "run_queued",
      "run_started",
      "run_completed",
      "run_failed",
      "run_cancelled",
      "artifact_saved",
      "handoff",
      "approval_requested",
      "approval_decided",
      "retry",
      "stage_moved",
      "instruction_version_changed",
    ]),
    target_type: z.string().min(1),
    target_id: PositiveIdSchema,
    message: z.string().min(1),
    created_at: IsoDateTimeSchema,
    data_source: DataSourceFieldSchema,
  })
  .strict();

export type Dashboard = z.infer<typeof DashboardSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
