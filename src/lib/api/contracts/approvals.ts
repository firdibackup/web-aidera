import { z } from "zod";

import {
  DataSourceFieldSchema,
  IsoDateTimeSchema,
  PositiveIdSchema,
} from "./common";

export const ApprovalTypeSchema = z.enum(["plan", "copy", "final", "instruction"]);
export const ApprovalStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "revision_requested",
]);

export const DiffLineSchema = z
  .object({
    kind: z.enum(["context", "added", "removed"]),
    text: z.string(),
  })
  .strict();

export const ApprovalHistoryEntrySchema = z
  .object({
    id: PositiveIdSchema,
    action: z.enum(["requested", "approved", "rejected", "revision_requested"]),
    actor: z.string().min(1),
    note: z.string().min(1).nullable(),
    created_at: IsoDateTimeSchema,
  })
  .strict();

export const ApprovalSummarySchema = z
  .object({
    id: PositiveIdSchema,
    type: ApprovalTypeSchema,
    status: ApprovalStatusSchema,
    title: z.string().min(1),
    requester: z.string().min(1),
    requested_at: IsoDateTimeSchema,
    decided_at: IsoDateTimeSchema.nullable(),
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const ApprovalSchema = ApprovalSummarySchema.extend({
  target_type: z.enum(["plan", "content", "instruction"]),
  target_id: PositiveIdSchema,
  target_version: z.number().int().positive(),
  reason: z.string().min(1),
  impact: z.string().min(1),
  before: z.string().nullable(),
  after: z.string().nullable(),
  diff: z.array(DiffLineSchema),
  decision_note: z.string().min(1).nullable(),
  history: z.array(ApprovalHistoryEntrySchema),
});

export const ApprovalDecisionInputSchema = z
  .object({
    note: z.string().trim().min(1).max(1000).optional(),
  })
  .strict();

export const ApprovalRejectionInputSchema = z
  .object({
    note: z.string().trim().min(1).max(1000),
  })
  .strict();

export const ApprovalQuerySchema = z
  .object({
    type: ApprovalTypeSchema.optional(),
    status: ApprovalStatusSchema.optional(),
  })
  .strict();

export type ApprovalType = z.infer<typeof ApprovalTypeSchema>;
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;
export type DiffLine = z.infer<typeof DiffLineSchema>;
export type ApprovalSummary = z.infer<typeof ApprovalSummarySchema>;
export type Approval = z.infer<typeof ApprovalSchema>;
export type ApprovalDecisionInput = z.infer<typeof ApprovalDecisionInputSchema>;
export type ApprovalRejectionInput = z.infer<typeof ApprovalRejectionInputSchema>;
export type ApprovalQuery = z.infer<typeof ApprovalQuerySchema>;
