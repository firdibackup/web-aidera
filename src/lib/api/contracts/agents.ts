import { z } from "zod";

import {
  AgentSlugSchema,
  DataSourceFieldSchema,
  IsoDateTimeSchema,
  NonNegativeIntegerSchema,
  PositiveIdSchema,
} from "./common";

export const AgentStatusSchema = z.enum(["idle", "working", "offline", "disabled"]);

export const AgentCountsSchema = z
  .object({
    active_runs: NonNegativeIntegerSchema,
    pending_tasks: NonNegativeIntegerSchema,
    completed_runs: NonNegativeIntegerSchema,
  })
  .strict();

export const AgentInstructionSchema = z
  .object({
    id: PositiveIdSchema,
    scope: z.enum(["agent", "workflow", "content"]),
    text: z.string().min(1),
    version: z.number().int().positive(),
    approved_at: IsoDateTimeSchema,
  })
  .strict();

export const AgentSchema = z
  .object({
    slug: AgentSlugSchema,
    name: z.string().min(1),
    role: z.string().min(1),
    profile: z.string().regex(/^aidera-/),
    model: z.string().min(1),
    status: AgentStatusSchema,
    enabled: z.boolean(),
    counts: AgentCountsSchema,
    last_activity: IsoDateTimeSchema.nullable(),
    skills: z.array(z.string().min(1)),
    active_instructions: z.array(AgentInstructionSchema),
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const AgentListItemSchema = AgentSchema.omit({
  skills: true,
  active_instructions: true,
});

export type AgentStatus = z.infer<typeof AgentStatusSchema>;
export type Agent = z.infer<typeof AgentSchema>;
export type AgentListItem = z.infer<typeof AgentListItemSchema>;
