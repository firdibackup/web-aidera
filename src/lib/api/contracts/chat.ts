import { z } from "zod";

import {
  AgentSlugSchema,
  DataSourceFieldSchema,
  IsoDateTimeSchema,
  PositiveIdSchema,
} from "./common";

export const KnownBlockTypeSchema = z.enum([
  "recommendation",
  "warning",
  "checklist",
  "comparison",
  "plan_item",
  "metric",
  "quote",
  "code",
  "prompt",
]);

export const BlockSeveritySchema = z.enum(["info", "success", "warning", "critical"]);

export const StructuredBlockItemSchema = z
  .object({
    id: z.string().min(1).optional(),
    label: z.string().min(1),
    checked: z.boolean().optional(),
  })
  .strict();

export const KnownStructuredBlockSchema = z
  .object({
    type: KnownBlockTypeSchema,
    title: z.string().min(1),
    content: z.string().optional(),
    severity: BlockSeveritySchema.optional(),
    items: z.array(StructuredBlockItemSchema).optional(),
    before: z.string().optional(),
    after: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const UnknownStructuredBlockSchema = z
  .object({
    type: z.literal("unknown"),
    original_type: z.string().min(1),
    title: z.string().min(1),
    raw: z.unknown(),
  })
  .strict();

export const StructuredBlockSchema = z.union([
  KnownStructuredBlockSchema,
  UnknownStructuredBlockSchema,
]);

export type KnownStructuredBlock = z.infer<typeof KnownStructuredBlockSchema>;
export type UnknownStructuredBlock = z.infer<typeof UnknownStructuredBlockSchema>;
export type StructuredBlock = z.infer<typeof StructuredBlockSchema>;

const UnknownRecordSchema = z.record(z.string(), z.unknown());

export function parseStructuredBlock(input: unknown): StructuredBlock {
  const known = KnownStructuredBlockSchema.safeParse(input);

  if (known.success) {
    return known.data;
  }

  const record = UnknownRecordSchema.safeParse(input);
  const type = record.success && typeof record.data.type === "string" ? record.data.type : "invalid";
  const title = record.success && typeof record.data.title === "string"
    ? record.data.title
    : "Blok tidak dikenali";

  return {
    type: "unknown",
    original_type: type,
    title,
    raw: input,
  };
}

export const SafeStructuredBlocksSchema = z.array(z.unknown()).transform((blocks) =>
  blocks.map(parseStructuredBlock),
);

export const AgentArtifactSchema = z
  .object({
    id: PositiveIdSchema.optional(),
    type: z.enum([
      "research",
      "draft",
      "validation",
      "growth",
      "design_brief",
      "qa",
      "final",
    ]),
    title: z.string().min(1),
    version: z.number().int().positive(),
    path: z.string().min(1),
  })
  .strict();

export const ProposedInstructionSchema = z
  .object({
    scope: z.enum(["agent", "workflow", "content"]),
    text: z.string().min(1),
    reason: z.string().min(1),
  })
  .strict();

export const AgentActionSchema = z
  .object({
    type: z.enum(["approve", "revise", "save_instruction", "send_to_agent", "create_tasks"]),
    label: z.string().min(1),
    payload: z.record(z.string(), z.unknown()),
  })
  .strict();

export const AgentResponseV1Schema = z
  .object({
    schema_version: z.literal("aidera.agent_response.v1"),
    message: z.string(),
    summary: z
      .object({
        title: z.string().min(1),
        items: z.array(z.string().min(1)),
      })
      .strict()
      .optional(),
    blocks: SafeStructuredBlocksSchema,
    artifacts: z.array(AgentArtifactSchema),
    proposedInstructions: z.array(ProposedInstructionSchema).optional(),
    actions: z.array(AgentActionSchema),
    unstructured: z.boolean().optional(),
    raw: z.unknown().optional(),
  })
  .strict();

export type AgentResponseV1 = z.infer<typeof AgentResponseV1Schema>;

export function parseAgentResponseV1(input: unknown): AgentResponseV1 {
  const parsed = AgentResponseV1Schema.safeParse(input);

  if (parsed.success) {
    return parsed.data;
  }

  return {
    schema_version: "aidera.agent_response.v1",
    message: typeof input === "string" ? input : "Respons agent tidak dapat dibaca sebagai output terstruktur.",
    blocks: [],
    artifacts: [],
    actions: [],
    unstructured: true,
    raw: input,
  };
}

export const SafeAgentResponseV1Schema = z
  .unknown()
  .refine((input) => input !== undefined, "Structured response is required")
  .transform(parseAgentResponseV1);

export const ThreadScopeSchema = z.enum(["global", "plan", "content"]);

export const ThreadSchema = z
  .object({
    id: PositiveIdSchema,
    agent: AgentSlugSchema,
    title: z.string().min(1),
    scope: ThreadScopeSchema,
    plan_id: PositiveIdSchema.nullable(),
    content_id: PositiveIdSchema.nullable(),
    context_summary: z.string().min(1),
    last_message: z.string().min(1).nullable(),
    last_message_at: IsoDateTimeSchema.nullable(),
    created_at: IsoDateTimeSchema,
    updated_at: IsoDateTimeSchema,
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const MessageRoleSchema = z.enum(["user", "assistant", "system"]);

export const MessageSchema = z
  .object({
    id: PositiveIdSchema,
    thread_id: PositiveIdSchema,
    role: MessageRoleSchema,
    content: z.string(),
    structured: z.union([z.null(), SafeAgentResponseV1Schema]),
    created_at: IsoDateTimeSchema,
    data_source: DataSourceFieldSchema,
  })
  .strict();

export type ThreadScope = z.infer<typeof ThreadScopeSchema>;
export type Thread = z.infer<typeof ThreadSchema>;
export type Message = z.infer<typeof MessageSchema>;
