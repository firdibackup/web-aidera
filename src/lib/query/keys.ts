import type { AgentSlug, CalendarQuery } from "@/lib/api/contracts";

export interface BoardFilters {
  agent?: AgentSlug;
  pillar?: string;
  format?: string;
  priority?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  approval?: string;
}

export interface PlanFilters {
  cadence?: "weekly" | "monthly";
  status?: string;
}

export interface ThreadFilters {
  agent?: AgentSlug;
}

function stableEntries<T extends object>(filters: T): readonly (readonly [string, unknown])[] {
  return Object.entries(filters as Record<string, unknown>)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([left], [right]) => left.localeCompare(right));
}

export const queryKeys = {
  all: ["aidera"] as const,
  dashboard: ["aidera", "dashboard"] as const,
  activities: (limit = 10, offset = 0) => ["aidera", "activities", { limit, offset }] as const,
  agents: ["aidera", "agents"] as const,
  agent: (slug: AgentSlug) => ["aidera", "agent", slug] as const,
  threads: (filters: ThreadFilters = {}) => ["aidera", "threads", stableEntries(filters)] as const,
  messages: (threadId: number, limit = 50, offset = 0) =>
    ["aidera", "thread", threadId, "messages", { limit, offset }] as const,
  plans: (filters: PlanFilters = {}) => ["aidera", "plans", stableEntries(filters)] as const,
  plan: (id: number) => ["aidera", "plan", id] as const,
  board: (filters: BoardFilters = {}) => ["aidera", "board", stableEntries(filters)] as const,
  calendar: (range: CalendarQuery) => ["aidera", "calendar", stableEntries(range)] as const,
  contents: (filters: Record<string, unknown> = {}) =>
    ["aidera", "contents", stableEntries(filters)] as const,
  content: (id: number) => ["aidera", "content", id] as const,
  approvals: (filters: Record<string, unknown> = {}) =>
    ["aidera", "approvals", stableEntries(filters)] as const,
  approval: (id: number) => ["aidera", "approval", id] as const,
  instructions: (filters: Record<string, unknown> = {}) =>
    ["aidera", "instructions", stableEntries(filters)] as const,
  artifacts: (filters: Record<string, unknown> = {}) =>
    ["aidera", "artifacts", stableEntries(filters)] as const,
  artifactComparison: (baseId: number, otherId: number) =>
    ["aidera", "artifact-comparison", baseId, otherId] as const,
  settings: ["aidera", "settings"] as const,
  workflow: ["aidera", "workflow"] as const,
} as const;
