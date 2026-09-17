import { z } from "zod";

import { DiffLineSchema } from "./approvals";
import {
  AgentSlugSchema,
  DataSourceFieldSchema,
  IsoDateTimeSchema,
  PositiveIdSchema,
} from "./common";

export const InstructionScopeSchema = z.enum(["agent", "workflow", "content"]);
export const InstructionStatusSchema = z.enum([
  "proposed",
  "active",
  "rejected",
  "superseded",
]);

export const InstructionSchema = z
  .object({
    id: PositiveIdSchema,
    agent: AgentSlugSchema.nullable(),
    scope: InstructionScopeSchema,
    title: z.string().min(1),
    text: z.string().min(1),
    reason: z.string().min(1),
    status: InstructionStatusSchema,
    version: z.number().int().positive(),
    proposed_by: z.string().min(1),
    proposed_at: IsoDateTimeSchema,
    decided_at: IsoDateTimeSchema.nullable(),
    decision_note: z.string().min(1).nullable(),
    supersedes_id: PositiveIdSchema.nullable(),
    diff: z.array(DiffLineSchema),
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const InstructionQuerySchema = z
  .object({
    agent: AgentSlugSchema.optional(),
    scope: InstructionScopeSchema.optional(),
    status: InstructionStatusSchema.optional(),
  })
  .strict();

export const InstructionDecisionInputSchema = z
  .object({
    note: z.string().trim().min(1).max(1000).optional(),
  })
  .strict();

export type InstructionScope = z.infer<typeof InstructionScopeSchema>;
export type InstructionStatus = z.infer<typeof InstructionStatusSchema>;
export type Instruction = z.infer<typeof InstructionSchema>;
export type InstructionQuery = z.infer<typeof InstructionQuerySchema>;
export type InstructionDecisionInput = z.infer<typeof InstructionDecisionInputSchema>;
