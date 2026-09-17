import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import {
  ActivitySchema,
  AgentListItemSchema,
  AgentSchema,
  AgentSlugSchema,
  ApprovalSchema,
  type ApprovalQuery,
  ApprovePlanInputSchema,
  ArtifactComparisonSchema,
  BoardSchema,
  CalendarDataSchema,
  type CalendarQuery,
  ContentCardSchema,
  ContentDetailSchema,
  ContentListItemSchema,
  type ContentQuery,
  DashboardSchema,
  InstructionSchema,
  type InstructionQuery,
  MessageSchema,
  MoveContentStageInputSchema,
  PlanSchema,
  ScheduleContentInputSchema,
  SettingsSchema,
  ThreadSchema,
  UpdateSettingsInputSchema,
  WorkflowSchema,
  type AgentSlug,
  type ApprovePlanInput,
  type MoveContentStageInput,
  type ScheduleContentInput,
  type UpdateSettingsInput,
} from "@/lib/api/contracts";
import { bff, createIdempotencyKey } from "@/lib/api/client";
import { queryKeys, type ThreadFilters } from "@/lib/query/keys";
import {
  optimisticallyMoveBoardCard,
  optimisticallyScheduleContent,
  restoreQueries,
  snapshotQueries,
  type CacheSnapshot,
} from "@/lib/query/optimistic";
import {
  invalidateApprovalDecisionMutation,
  invalidateContentScheduleMutation,
  invalidateContentStageMutation,
  invalidateInstructionDecisionMutation,
  invalidatePlanApprovalMutation,
  invalidateSettingsMutation,
} from "@/lib/query/invalidation";

function queryString(values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export const dashboardQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.dashboard,
    queryFn: () => bff("/api/dashboard", DashboardSchema),
    staleTime: 15_000,
  });

export const activitiesQueryOptions = (limit = 10, offset = 0) =>
  queryOptions({
    queryKey: queryKeys.activities(limit, offset),
    queryFn: () => bff(
      `/api/activities${queryString({ limit, offset })}`,
      z.array(ActivitySchema),
    ),
    staleTime: 15_000,
  });

export const agentsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.agents,
    queryFn: () => bff("/api/agents", z.array(AgentListItemSchema)),
    staleTime: 30_000,
  });

export const agentQueryOptions = (slug: AgentSlug) => {
  const safeSlug = AgentSlugSchema.parse(slug);

  return queryOptions({
    queryKey: queryKeys.agent(safeSlug),
    queryFn: () => bff(`/api/agents/${safeSlug}`, AgentSchema),
    staleTime: 30_000,
  });
};

export const threadsQueryOptions = (filters: ThreadFilters = {}) =>
  queryOptions({
    queryKey: queryKeys.threads(filters),
    queryFn: () => bff(
      `/api/threads${queryString({ agent: filters.agent })}`,
      z.array(ThreadSchema),
    ),
    staleTime: 15_000,
  });

export const messagesQueryOptions = (threadId: number, limit = 50, offset = 0) =>
  queryOptions({
    queryKey: queryKeys.messages(threadId, limit, offset),
    queryFn: () => bff(
      `/api/threads/${threadId}/messages${queryString({ limit, offset })}`,
      z.array(MessageSchema),
    ),
    staleTime: 5_000,
  });

export const plansQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.plans(),
    queryFn: () => bff("/api/plans", z.array(PlanSchema)),
    staleTime: 15_000,
  });

export const boardQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.board(),
    queryFn: () => bff("/api/board", BoardSchema),
    staleTime: 10_000,
  });

export const calendarQueryOptions = (query: CalendarQuery) =>
  queryOptions({
    queryKey: queryKeys.calendar(query),
    queryFn: () => bff(
      `/api/calendar${queryString({ view: query.view, start: query.start, end: query.end })}`,
      CalendarDataSchema,
    ),
    staleTime: 10_000,
  });

interface MoveStageMutationContext {
  snapshot: CacheSnapshot;
}

interface ScheduleMutationContext {
  snapshot: CacheSnapshot;
}

export const moveContentStageMutationOptions = (queryClient: Parameters<typeof snapshotQueries>[0]) =>
  mutationOptions({
    mutationFn: ({ id, input }: { id: number; input: MoveContentStageInput }) =>
      bff(`/api/contents/${id}/stage`, ContentCardSchema, {
        method: "POST",
        headers: { "Idempotency-Key": createIdempotencyKey() },
        body: MoveContentStageInputSchema.parse(input),
      }),
    onMutate: async ({ id, input }): Promise<MoveStageMutationContext> => {
      await queryClient.cancelQueries({ queryKey: ["aidera", "board"] });
      const snapshot = snapshotQueries(queryClient, ["aidera", "board"]);
      optimisticallyMoveBoardCard(queryClient, id, input);
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        restoreQueries(queryClient, context.snapshot);
      }
    },
    onSettled: (_data, _error, variables) =>
      invalidateContentStageMutation(queryClient, variables.id),
  });

export const scheduleContentMutationOptions = (queryClient: Parameters<typeof snapshotQueries>[0]) =>
  mutationOptions({
    mutationFn: ({ id, input }: { id: number; input: ScheduleContentInput }) =>
      bff(`/api/contents/${id}/schedule`, ContentCardSchema, {
        method: "POST",
        headers: { "Idempotency-Key": createIdempotencyKey() },
        body: ScheduleContentInputSchema.parse(input),
      }),
    onMutate: async ({ id, input }): Promise<ScheduleMutationContext> => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["aidera", "board"] }),
        queryClient.cancelQueries({ queryKey: ["aidera", "calendar"] }),
      ]);
      const snapshot = [
        ...snapshotQueries(queryClient, ["aidera", "board"]),
        ...snapshotQueries(queryClient, ["aidera", "calendar"]),
      ];
      optimisticallyScheduleContent(queryClient, id, input);
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        restoreQueries(queryClient, context.snapshot);
      }
    },
    onSettled: (_data, _error, variables) =>
      invalidateContentScheduleMutation(queryClient, variables.id),
  });

export const approvePlanMutationOptions = (queryClient: Parameters<typeof snapshotQueries>[0]) =>
  mutationOptions({
    mutationFn: ({ id, input }: { id: number; input: ApprovePlanInput }) =>
      bff(`/api/plans/${id}/approve`, PlanSchema, {
        method: "POST",
        headers: { "Idempotency-Key": createIdempotencyKey() },
        body: ApprovePlanInputSchema.parse(input),
      }),
    onSuccess: (_data, variables) => invalidatePlanApprovalMutation(queryClient, variables.id),
  });

export const contentsQueryOptions = (filters: Partial<ContentQuery> = {}) =>
  queryOptions({
    queryKey: queryKeys.contents(filters),
    queryFn: () => bff(
      `/api/contents${queryString({
        q: filters.q,
        stage: filters.stage,
        pillar: filters.pillar,
        format: filters.format,
        priority: filters.priority,
        sort: filters.sort,
        archived: filters.archived === undefined ? undefined : String(filters.archived),
      })}`,
      z.array(ContentListItemSchema),
    ),
    staleTime: 15_000,
  });

export const contentQueryOptions = (contentId: number) =>
  queryOptions({
    queryKey: queryKeys.content(contentId),
    queryFn: () => bff(`/api/contents/${contentId}`, ContentDetailSchema),
    staleTime: 15_000,
  });

export const approvalsQueryOptions = (filters: Partial<ApprovalQuery> = {}) =>
  queryOptions({
    queryKey: queryKeys.approvals(filters),
    queryFn: () => bff(
      `/api/approvals${queryString({ type: filters.type, status: filters.status })}`,
      z.array(ApprovalSchema),
    ),
    staleTime: 10_000,
  });

export const approvalQueryOptions = (approvalId: number) =>
  queryOptions({
    queryKey: queryKeys.approval(approvalId),
    queryFn: () => bff(`/api/approvals/${approvalId}`, ApprovalSchema),
    staleTime: 10_000,
  });

export const instructionsQueryOptions = (filters: Partial<InstructionQuery> = {}) =>
  queryOptions({
    queryKey: queryKeys.instructions(filters),
    queryFn: () => bff(
      `/api/instructions${queryString({
        agent: filters.agent,
        scope: filters.scope,
        status: filters.status,
      })}`,
      z.array(InstructionSchema),
    ),
    staleTime: 60_000,
  });

export const artifactComparisonQueryOptions = (baseId: number, otherId: number) =>
  queryOptions({
    queryKey: queryKeys.artifactComparison(baseId, otherId),
    queryFn: () => bff(`/api/artifacts/${baseId}/compare/${otherId}`, ArtifactComparisonSchema),
    staleTime: 60_000,
  });

export const settingsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.settings,
    queryFn: () => bff("/api/settings", SettingsSchema),
    staleTime: 300_000,
  });

export const workflowQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.workflow,
    queryFn: () => bff("/api/workflow", WorkflowSchema),
    staleTime: 300_000,
  });

export type ApprovalDecision = "approve" | "reject" | "revise";

export const decideApprovalMutationOptions = (
  queryClient: Parameters<typeof snapshotQueries>[0],
) =>
  mutationOptions({
    mutationFn: ({
      id,
      decision,
      note,
    }: {
      id: number;
      decision: ApprovalDecision;
      note?: string;
    }) =>
      bff(`/api/approvals/${id}/${decision}`, ApprovalSchema, {
        method: "POST",
        headers: { "Idempotency-Key": createIdempotencyKey() },
        body: decision === "approve" ? (note ? { note } : {}) : { note: note ?? "" },
      }),
    onSuccess: (_data, variables) => invalidateApprovalDecisionMutation(queryClient, variables.id),
  });

export type InstructionDecision = "approve" | "reject" | "rollback";

export const decideInstructionMutationOptions = (
  queryClient: Parameters<typeof snapshotQueries>[0],
) =>
  mutationOptions({
    mutationFn: ({
      id,
      decision,
      note,
    }: {
      id: number;
      decision: InstructionDecision;
      note?: string;
    }) =>
      bff(`/api/instructions/${id}/${decision}`, InstructionSchema, {
        method: "POST",
        headers: { "Idempotency-Key": createIdempotencyKey() },
        body: note ? { note } : {},
      }),
    onSuccess: () => invalidateInstructionDecisionMutation(queryClient),
  });

export const updateSettingsMutationOptions = (
  queryClient: Parameters<typeof snapshotQueries>[0],
) =>
  mutationOptions({
    mutationFn: (input: UpdateSettingsInput) =>
      bff("/api/settings", SettingsSchema, {
        method: "PUT",
        headers: { "Idempotency-Key": createIdempotencyKey() },
        body: UpdateSettingsInputSchema.parse(input),
      }),
    onSuccess: () => invalidateSettingsMutation(queryClient),
  });
