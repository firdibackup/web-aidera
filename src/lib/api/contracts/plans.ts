import { z } from "zod";

import {
  DataSourceFieldSchema,
  IsoDateSchema,
  IsoDateTimeSchema,
  PositiveIdSchema,
} from "./common";

export const PlanCadenceSchema = z.enum(["weekly", "monthly"]);
export const PlanStatusSchema = z.enum(["draft", "pending_approval", "partially_approved", "approved", "rejected", "archived"]);
export const PlanItemApprovalStatusSchema = z.enum(["pending", "approved", "rejected", "revision_requested"]);

export const PlanItemSchema = z
  .object({
    id: PositiveIdSchema,
    plan_id: PositiveIdSchema,
    title: z.string().min(1),
    hook: z.string().min(1),
    summary: z.string().min(1),
    source: z.string().min(1),
    format: z.string().min(1),
    pillar: z.string().min(1),
    objective: z.string().min(1),
    cta_concept: z.string().min(1),
    planned_date: IsoDateSchema,
    approval_status: PlanItemApprovalStatusSchema,
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const PlanSchema = z
  .object({
    id: PositiveIdSchema,
    cadence: PlanCadenceSchema,
    period_start: IsoDateSchema,
    period_end: IsoDateSchema,
    goal: z.string().min(1),
    target_audience: z.string().min(1),
    content_pillars: z.array(z.string().min(1)).min(1),
    frequency: z.string().min(1),
    references: z.array(z.string().min(1)),
    previous_performance: z.string().min(1).nullable(),
    notes: z.string().min(1).nullable(),
    status: PlanStatusSchema,
    items: z.array(PlanItemSchema),
    created_at: IsoDateTimeSchema,
    updated_at: IsoDateTimeSchema,
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const ApprovePlanInputSchema = z
  .object({
    item_ids: z.array(PositiveIdSchema).optional(),
    note: z.string().trim().min(1).max(1000).optional(),
  })
  .strict();

export type PlanCadence = z.infer<typeof PlanCadenceSchema>;
export type PlanStatus = z.infer<typeof PlanStatusSchema>;
export type PlanItem = z.infer<typeof PlanItemSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type ApprovePlanInput = z.infer<typeof ApprovePlanInputSchema>;
