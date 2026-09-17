import { z } from "zod";

import { ApprovalSummarySchema } from "./approvals";
import {
  AgentSlugSchema,
  DataSourceFieldSchema,
  IsoDateTimeSchema,
  NonNegativeIntegerSchema,
  PositiveIdSchema,
} from "./common";
import {
  ContentCardSchema,
  ContentPrioritySchema,
  ContentStageSchema,
} from "./board";
import { ActivitySchema } from "./dashboard";

export const ArtifactTypeSchema = z.enum([
  "research",
  "draft",
  "validation",
  "growth",
  "design_brief",
  "qa",
  "final",
]);

export const ArtifactSchema = z
  .object({
    id: PositiveIdSchema,
    content_id: PositiveIdSchema,
    type: ArtifactTypeSchema,
    title: z.string().min(1),
    version: z.number().int().positive(),
    path: z.string().min(1),
    summary: z.string().min(1),
    body: z.string().min(1),
    created_by: z.string().min(1),
    created_at: IsoDateTimeSchema,
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const TaskStatusSchema = z.enum([
  "queued",
  "working",
  "completed",
  "failed",
  "blocked",
  "cancelled",
]);

export const TaskSchema = z
  .object({
    id: PositiveIdSchema,
    content_id: PositiveIdSchema,
    stage: ContentStageSchema,
    agent: AgentSlugSchema,
    status: TaskStatusSchema,
    attempts: NonNegativeIntegerSchema,
    max_attempts: z.number().int().positive().max(3),
    error_summary: z.string().min(1).nullable(),
    created_at: IsoDateTimeSchema,
    updated_at: IsoDateTimeSchema,
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const ContentMetricsSchema = z
  .object({
    views: NonNegativeIntegerSchema,
    reach: NonNegativeIntegerSchema,
    likes: NonNegativeIntegerSchema,
    comments: NonNegativeIntegerSchema,
    shares: NonNegativeIntegerSchema,
    saves: NonNegativeIntegerSchema,
    follows: NonNegativeIntegerSchema,
    recorded_at: IsoDateTimeSchema,
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const ContentDetailSchema = ContentCardSchema.extend({
  summary: z.string().min(1),
  objective: z.string().min(1),
  cta_concept: z.string().min(1),
  plan_id: PositiveIdSchema.nullable(),
  archived: z.boolean(),
  artifacts: z.array(ArtifactSchema),
  tasks: z.array(TaskSchema),
  approvals: z.array(ApprovalSummarySchema),
  activity: z.array(ActivitySchema),
  metrics: ContentMetricsSchema.nullable(),
  final_package_artifact_id: PositiveIdSchema.nullable(),
});

export const ContentListItemSchema = ContentCardSchema.extend({
  summary: z.string().min(1),
  archived: z.boolean(),
});

export const CreateContentInputSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    format: z.string().trim().min(1).max(80),
    pillar: z.string().trim().min(1).max(80),
    priority: ContentPrioritySchema,
  })
  .strict();

export const CreatedContentSchema = z
  .object({
    id: PositiveIdSchema,
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const ContentSortSchema = z.enum([
  "updated_desc",
  "updated_asc",
  "scheduled_asc",
  "priority_desc",
  "code_asc",
]);

const BooleanQuerySchema = z.enum(["true", "false"]).transform((value) => value === "true");

export const ContentQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(200).optional(),
    stage: ContentStageSchema.optional(),
    pillar: z.string().trim().min(1).max(80).optional(),
    format: z.string().trim().min(1).max(80).optional(),
    priority: ContentPrioritySchema.optional(),
    archived: BooleanQuerySchema.optional(),
    sort: ContentSortSchema.default("updated_desc"),
  })
  .strict();

export const ArtifactQuerySchema = z
  .object({
    content_id: z.coerce.number().int().positive().optional(),
    type: ArtifactTypeSchema.optional(),
  })
  .strict();

export const ArtifactComparisonSchema = z
  .object({
    base: ArtifactSchema,
    other: ArtifactSchema,
    diff: z.array(
      z
        .object({
          kind: z.enum(["context", "added", "removed"]),
          text: z.string(),
        })
        .strict(),
    ),
    data_source: DataSourceFieldSchema,
  })
  .strict();

export type ArtifactType = z.infer<typeof ArtifactTypeSchema>;
export type Artifact = z.infer<typeof ArtifactSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type ContentMetrics = z.infer<typeof ContentMetricsSchema>;
export type ContentDetail = z.infer<typeof ContentDetailSchema>;
export type ContentListItem = z.infer<typeof ContentListItemSchema>;
export type CreateContentInput = z.infer<typeof CreateContentInputSchema>;
export type CreatedContent = z.infer<typeof CreatedContentSchema>;
export type ContentQuery = z.infer<typeof ContentQuerySchema>;
export type ContentSort = z.infer<typeof ContentSortSchema>;
export type ArtifactQuery = z.infer<typeof ArtifactQuerySchema>;
export type ArtifactComparison = z.infer<typeof ArtifactComparisonSchema>;
