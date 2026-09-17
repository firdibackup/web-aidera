import { z } from "zod";

import {
  AgentSlugSchema,
  DataSourceFieldSchema,
  IsoDateTimeSchema,
  NonNegativeIntegerSchema,
  PositiveIdSchema,
} from "./common";

export const CONTENT_STAGES = [
  "ideas",
  "ceo_planning",
  "waiting_plan_approval",
  "research",
  "writing",
  "validation",
  "growth_review",
  "waiting_copy_approval",
  "design",
  "qa",
  "final_approval",
  "scheduled",
  "published",
  "performance_review",
  "blocked",
] as const;

export const ContentStageSchema = z.enum(CONTENT_STAGES);
export const ContentPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export const ApprovalBadgeSchema = z.enum(["not_required", "pending", "approved", "rejected", "revision_requested"]);
export const ContentRunStatusSchema = z.enum(["queued", "working", "completed", "failed", "cancelled", "blocked"]);

export const ContentCardSchema = z
  .object({
    id: PositiveIdSchema,
    code: z.string().min(1),
    title: z.string().min(1),
    hook: z.string().min(1),
    format: z.string().min(1),
    pillar: z.string().min(1),
    priority: ContentPrioritySchema,
    owner: AgentSlugSchema.nullable(),
    stage: ContentStageSchema,
    scheduled_at: IsoDateTimeSchema.nullable(),
    approval: ApprovalBadgeSchema,
    blocker: z.string().min(1).nullable(),
    revision_requested: z.boolean(),
    artifact_count: NonNegativeIntegerSchema,
    active_run_status: ContentRunStatusSchema.nullable(),
    sort_order: z.number().finite().nonnegative(),
    version: z.number().int().positive(),
    updated_at: IsoDateTimeSchema,
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const BoardColumnSchema = z
  .object({
    stage: ContentStageSchema,
    label: z.string().min(1),
    cards: z.array(ContentCardSchema),
    count: NonNegativeIntegerSchema,
    wip_limit: z.number().int().positive().nullable(),
  })
  .strict()
  .superRefine((column, context) => {
    if (column.cards.some((card) => card.stage !== column.stage)) {
      context.addIssue({
        code: "custom",
        message: "Every card must belong to its board column stage",
        path: ["cards"],
      });
    }

    if (column.count !== column.cards.length) {
      context.addIssue({
        code: "custom",
        message: "Column count must match card count",
        path: ["count"],
      });
    }
  });

export const BoardSchema = z
  .object({
    columns: z.array(BoardColumnSchema).length(CONTENT_STAGES.length),
    updated_at: IsoDateTimeSchema,
    data_source: DataSourceFieldSchema,
  })
  .strict()
  .superRefine((board, context) => {
    const stages = board.columns.map((column) => column.stage);
    const includesEveryStage = CONTENT_STAGES.every((stage) => stages.includes(stage));
    const hasUniqueStages = new Set(stages).size === CONTENT_STAGES.length;

    if (!includesEveryStage || !hasUniqueStages) {
      context.addIssue({
        code: "custom",
        message: "Board must contain each of the 15 stages exactly once",
        path: ["columns"],
      });
    }
  });

export const MoveContentStageInputSchema = z
  .object({
    stage: ContentStageSchema,
    position: z.number().finite().nonnegative().optional(),
    after_id: PositiveIdSchema.nullable().optional(),
    before_id: PositiveIdSchema.nullable().optional(),
    version: z.number().int().positive().optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.after_id !== undefined && input.after_id !== null && input.after_id === input.before_id) {
      context.addIssue({
        code: "custom",
        message: "after_id and before_id must identify different cards",
        path: ["before_id"],
      });
    }
  });

export type ContentStage = z.infer<typeof ContentStageSchema>;
export type ContentPriority = z.infer<typeof ContentPrioritySchema>;
export type ContentCard = z.infer<typeof ContentCardSchema>;
export type BoardColumn = z.infer<typeof BoardColumnSchema>;
export type Board = z.infer<typeof BoardSchema>;
export type MoveContentStageInput = z.infer<typeof MoveContentStageInputSchema>;
