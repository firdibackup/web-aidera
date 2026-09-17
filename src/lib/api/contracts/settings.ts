import { z } from "zod";

import {
  AgentSlugSchema,
  DataSourceFieldSchema,
  IsoDateTimeSchema,
  PositiveIdSchema,
} from "./common";
import { ContentStageSchema } from "./board";

export const ApprovalGateSchema = z
  .object({
    key: z.enum(["plan", "copy", "final", "instruction"]),
    label: z.string().min(1),
    description: z.string().min(1),
    enabled: z.boolean(),
    required: z.boolean(),
  })
  .strict();

export const AgentModelSettingSchema = z
  .object({
    agent: AgentSlugSchema,
    name: z.string().min(1),
    model: z.string().min(1),
    enabled: z.boolean(),
  })
  .strict();

export const TelegramSettingsSchema = z
  .object({
    enabled: z.boolean(),
    chat_id_configured: z.boolean(),
    notify_on: z.array(z.enum(["approval_requested", "run_failed", "content_blocked"])),
  })
  .strict();

export const BrandingSettingsSchema = z
  .object({
    handle: z.literal("@aidera"),
    tagline: z.string().min(1),
    canvas: z.literal("1080×1350"),
    aspect_ratio: z.literal("4:5"),
    safe_margin_px: z.literal(50),
  })
  .strict();

export const SettingsSchema = z
  .object({
    gates: z.array(ApprovalGateSchema).min(1),
    automation_enabled: z.boolean(),
    auto_publish_enabled: z.literal(false),
    retry_limit: z.number().int().min(0).max(2),
    agent_models: z.array(AgentModelSettingSchema).length(7),
    telegram: TelegramSettingsSchema,
    branding: BrandingSettingsSchema,
    updated_at: IsoDateTimeSchema,
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const WorkflowStageNodeSchema = z
  .object({
    stage: ContentStageSchema,
    label: z.string().min(1),
    agent: AgentSlugSchema.nullable(),
    gate: z.enum(["plan", "copy", "final", "instruction"]).nullable(),
    next: z.array(ContentStageSchema),
  })
  .strict();

export const WorkflowSchema = z
  .object({
    stages: z.array(WorkflowStageNodeSchema).min(1),
    automation_enabled: z.boolean(),
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const UpdateSettingsInputSchema = z
  .object({
    automation_enabled: z.boolean().optional(),
    retry_limit: z.number().int().min(0).max(2).optional(),
    gates: z
      .array(
        z
          .object({
            key: z.enum(["plan", "copy", "final", "instruction"]),
            enabled: z.boolean(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict()
  .refine(
    (input) => Object.keys(input).length > 0,
    "At least one setting must be provided",
  );

export const BridgeEventSchema = z
  .object({
    id: PositiveIdSchema,
    type: z.enum(["activity", "run", "content", "approval", "artifact", "heartbeat"]),
    target_type: z.string().min(1).optional(),
    target_id: PositiveIdSchema.optional(),
    message: z.string().min(1).optional(),
    payload: z.record(z.string(), z.unknown()).optional(),
    created_at: IsoDateTimeSchema,
  })
  .strict();

export type ApprovalGate = z.infer<typeof ApprovalGateSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type UpdateSettingsInput = z.infer<typeof UpdateSettingsInputSchema>;
export type BridgeEvent = z.infer<typeof BridgeEventSchema>;
