import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/keys";

export async function invalidateContentStageMutation(
  queryClient: QueryClient,
  contentId: number,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["aidera", "board"] }),
    queryClient.invalidateQueries({ queryKey: ["aidera", "contents"] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.content(contentId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    queryClient.invalidateQueries({ queryKey: ["aidera", "activities"] }),
  ]);
}

export async function invalidateContentScheduleMutation(
  queryClient: QueryClient,
  contentId: number,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["aidera", "calendar"] }),
    queryClient.invalidateQueries({ queryKey: ["aidera", "board"] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.content(contentId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    queryClient.invalidateQueries({ queryKey: ["aidera", "activities"] }),
  ]);
}

export async function invalidatePlanApprovalMutation(
  queryClient: QueryClient,
  planId: number,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["aidera", "plans"] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.plan(planId) }),
    queryClient.invalidateQueries({ queryKey: ["aidera", "approvals"] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    queryClient.invalidateQueries({ queryKey: ["aidera", "activities"] }),
  ]);
}

export async function invalidateApprovalDecisionMutation(
  queryClient: QueryClient,
  approvalId: number,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["aidera", "approvals"] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.approval(approvalId) }),
    queryClient.invalidateQueries({ queryKey: ["aidera", "contents"] }),
    queryClient.invalidateQueries({ queryKey: ["aidera", "content"] }),
    queryClient.invalidateQueries({ queryKey: ["aidera", "plans"] }),
    queryClient.invalidateQueries({ queryKey: ["aidera", "instructions"] }),
    queryClient.invalidateQueries({ queryKey: ["aidera", "board"] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    queryClient.invalidateQueries({ queryKey: ["aidera", "activities"] }),
  ]);
}

export async function invalidateInstructionDecisionMutation(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["aidera", "instructions"] }),
    queryClient.invalidateQueries({ queryKey: ["aidera", "agent"] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.agents }),
    queryClient.invalidateQueries({ queryKey: ["aidera", "approvals"] }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    queryClient.invalidateQueries({ queryKey: ["aidera", "activities"] }),
  ]);
}

export async function invalidateSettingsMutation(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.settings }),
    queryClient.invalidateQueries({ queryKey: queryKeys.workflow }),
    queryClient.invalidateQueries({ queryKey: ["aidera", "activities"] }),
  ]);
}
