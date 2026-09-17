import "server-only";

import { z } from "zod";

import {
  AgentSlugSchema,
  CONTENT_STAGES,
  type AgentSlug,
  type ContentStage,
} from "@/lib/api/contracts";

// The deployed AIDERA Bridge is a lean backend: booleans arrive as 0/1, several rich
// objects the frontend expects are scalars or absent, and collection item shapes cannot be
// observed while the Bridge is empty. These adapters map the real Bridge payloads into the
// frontend contract shapes, filling only what is knowable and leaving unobservable item
// arrays empty instead of fabricating rows.

function toBool(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function toInt(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : fallback;
}

function nonEmpty(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function nowIso(): string {
  return new Date().toISOString();
}

function toIso(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

const AGENT_SLUGS = [
  "ceo",
  "research",
  "writer",
  "validator",
  "growth",
  "design",
  "qa",
] as const satisfies readonly AgentSlug[];

const AGENT_STATUSES = ["idle", "working", "offline", "disabled"] as const;

const STAGE_LABELS: Record<ContentStage, string> = {
  ideas: "Ideas",
  ceo_planning: "CEO Planning",
  waiting_plan_approval: "Waiting Plan Approval",
  research: "Research",
  writing: "Writing",
  validation: "Validation",
  growth_review: "Growth Review",
  waiting_copy_approval: "Waiting Copy Approval",
  design: "Design",
  qa: "QA",
  final_approval: "Final Approval",
  scheduled: "Scheduled",
  published: "Published",
  performance_review: "Performance Review",
  blocked: "Blocked",
};

// --- Dashboard -------------------------------------------------------------

const BridgeDashboardSchema = z.object({
  active_jobs: z.number().optional(),
  blocked_contents: z.number().optional(),
  states: z
    .object({ queued: z.array(z.unknown()).optional() })
    .optional(),
  estimates: z
    .object({
      tokens: z.number().optional(),
      duration_seconds: z.number().optional(),
    })
    .optional(),
});

export function adaptDashboard(data: unknown): unknown {
  const b = BridgeDashboardSchema.parse(data);

  return {
    needs_decision: [],
    active_agents: [],
    upcoming: [],
    overdue_count: 0,
    not_ready_count: 0,
    pipeline_health: {
      queued: b.states?.queued?.length ?? 0,
      working: toInt(b.active_jobs),
      failed: 0,
      blocked: toInt(b.blocked_contents),
    },
    rollup: {
      token_estimate: b.estimates?.tokens ?? null,
      cost_estimate_usd: null,
      duration_seconds: b.estimates?.duration_seconds ?? null,
    },
    updated_at: nowIso(),
  };
}

// --- Agents ----------------------------------------------------------------

const BridgeAgentSchema = z.object({
  slug: z.string(),
  name: z.string(),
  role: z.string(),
  profile: z.string().optional(),
  model: z.string().optional(),
  status: z.string().optional(),
  enabled: z.unknown().optional(),
});

function adaptAgentBase(raw: unknown) {
  const b = BridgeAgentSchema.parse(raw);
  const slug = AgentSlugSchema.parse(b.slug);
  const enabled = toBool(b.enabled ?? true);
  const status = (AGENT_STATUSES as readonly string[]).includes(b.status ?? "")
    ? (b.status as (typeof AGENT_STATUSES)[number])
    : enabled
      ? "idle"
      : "disabled";
  const profile = b.profile && /^aidera-/.test(b.profile) ? b.profile : `aidera-${slug}`;

  return {
    slug,
    name: b.name,
    role: b.role,
    profile,
    model: b.model && b.model.length > 0 ? b.model : "default",
    status,
    enabled,
    counts: { active_runs: 0, pending_tasks: 0, completed_runs: 0 },
    last_activity: null,
  };
}

export function adaptAgentList(data: unknown): unknown {
  return z.array(z.unknown()).parse(data).map(adaptAgentBase);
}

export function adaptAgent(data: unknown): unknown {
  return { ...adaptAgentBase(data), skills: [], active_instructions: [] };
}

// --- Settings --------------------------------------------------------------

const GATE_META = {
  plan: {
    label: "Approval rencana",
    description: "Rencana CEO harus disetujui sebelum dikonversi menjadi content card.",
  },
  copy: {
    label: "Approval copy",
    description: "Copy harus disetujui sebelum masuk tahap Design.",
  },
  final: {
    label: "Approval paket final",
    description: "Paket final harus disetujui sebelum masuk jadwal publikasi.",
  },
  instruction: {
    label: "Approval instruksi permanen",
    description: "Instruksi permanen hanya aktif setelah disetujui dan dapat di-rollback.",
  },
} as const;

const AGENT_NAMES: Record<AgentSlug, string> = {
  ceo: "CEO",
  research: "Research",
  writer: "Writer",
  validator: "Validator",
  growth: "Growth Critic",
  design: "Design Director",
  qa: "QA",
};

const NOTIFY_EVENTS = ["approval_requested", "run_failed", "content_blocked"] as const;

const BridgeSettingsSchema = z.object({
  gates: z.record(z.string(), z.unknown()).optional(),
  automation: z.unknown().optional(),
  retries: z.number().optional(),
  models: z.record(z.string(), z.unknown()).optional(),
  telegram: z.unknown().optional(),
  model_options: z.array(z.string()).optional(),
});

function adaptTelegram(value: unknown) {
  if (value && typeof value === "object") {
    const t = value as Record<string, unknown>;
    const notify = Array.isArray(t.notify_on)
      ? t.notify_on.filter(
          (event): event is (typeof NOTIFY_EVENTS)[number] =>
            typeof event === "string" && (NOTIFY_EVENTS as readonly string[]).includes(event),
        )
      : [];

    return {
      enabled: toBool(t.enabled),
      chat_id_configured: toBool(t.chat_id_configured ?? t.chat_id),
      notify_on: notify,
    };
  }

  return { enabled: toBool(value), chat_id_configured: false, notify_on: [] };
}

function modelFor(
  models: Record<string, unknown> | undefined,
  slug: string,
  fallback: string,
): string {
  const value = models?.[slug];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export function adaptSettings(data: unknown): unknown {
  const b = BridgeSettingsSchema.parse(data);
  const defaultModel = b.model_options?.[0] ?? "default";

  return {
    gates: (["plan", "copy", "final", "instruction"] as const).map((key) => ({
      key,
      label: GATE_META[key].label,
      description: GATE_META[key].description,
      enabled: b.gates ? toBool(b.gates[key]) : true,
      required: true,
    })),
    automation_enabled: toBool(b.automation),
    auto_publish_enabled: false,
    retry_limit: Math.min(2, Math.max(0, toInt(b.retries, 2))),
    agent_models: AGENT_SLUGS.map((slug) => ({
      agent: slug,
      name: AGENT_NAMES[slug],
      model: modelFor(b.models, slug, defaultModel),
      enabled: true,
    })),
    telegram: adaptTelegram(b.telegram),
    branding: {
      handle: "@aidera",
      tagline: "Maximize your AI & Digital Tools! 🚀",
      canvas: "1080×1350",
      aspect_ratio: "4:5",
      safe_margin_px: 50,
    },
    updated_at: nowIso(),
  };
}

// --- Calendar --------------------------------------------------------------

const BridgeCalendarSchema = z.object({
  view: z.string().optional(),
  days: z.array(z.object({ date: z.string() })).optional(),
});

export function adaptCalendar(data: unknown): unknown {
  const b = BridgeCalendarSchema.parse(data);
  const rawView = b.view ?? "month";
  const view = rawView === "week" || rawView === "list" ? rawView : "month";
  const days = b.days ?? [];
  const first = days[0]?.date;
  const last = days[days.length - 1]?.date;

  return {
    view,
    range: {
      start: first ? `${first}T00:00:00+07:00` : null,
      end: last ? `${last}T23:59:59+07:00` : null,
      timezone: "Asia/Jakarta",
    },
    events: [],
  };
}

// --- Board / Workflow (endpoints the Bridge does not implement yet) ---------

export function emptyBoard(): unknown {
  return {
    columns: CONTENT_STAGES.map((stage) => ({
      stage,
      label: STAGE_LABELS[stage],
      cards: [],
      count: 0,
      wip_limit: null,
    })),
    updated_at: nowIso(),
  };
}

const WORKFLOW_STAGES: {
  stage: ContentStage;
  label: string;
  agent: AgentSlug | null;
  gate: "plan" | "copy" | "final" | "instruction" | null;
  next: ContentStage[];
}[] = [
  { stage: "ideas", label: "Ideas", agent: null, gate: null, next: ["ceo_planning", "research"] },
  { stage: "ceo_planning", label: "CEO Planning", agent: "ceo", gate: null, next: ["waiting_plan_approval"] },
  { stage: "waiting_plan_approval", label: "Waiting Plan Approval", agent: null, gate: "plan", next: ["research", "blocked"] },
  { stage: "research", label: "Research", agent: "research", gate: null, next: ["writing"] },
  { stage: "writing", label: "Writing", agent: "writer", gate: null, next: ["validation"] },
  { stage: "validation", label: "Validation", agent: "validator", gate: null, next: ["growth_review"] },
  { stage: "growth_review", label: "Growth Review", agent: "growth", gate: null, next: ["waiting_copy_approval"] },
  { stage: "waiting_copy_approval", label: "Waiting Copy Approval", agent: null, gate: "copy", next: ["design", "writing", "blocked"] },
  { stage: "design", label: "Design", agent: "design", gate: null, next: ["qa"] },
  { stage: "qa", label: "QA", agent: "qa", gate: null, next: ["final_approval"] },
  { stage: "final_approval", label: "Final Approval", agent: null, gate: "final", next: ["scheduled", "writing", "blocked"] },
  { stage: "scheduled", label: "Scheduled", agent: null, gate: null, next: ["published"] },
  { stage: "published", label: "Published", agent: null, gate: null, next: ["performance_review"] },
  { stage: "performance_review", label: "Performance Review", agent: "growth", gate: null, next: ["ideas"] },
  { stage: "blocked", label: "Blocked", agent: null, gate: null, next: ["ideas", "research", "writing"] },
];

export function staticWorkflow(automationEnabled = false): unknown {
  return {
    stages: WORKFLOW_STAGES,
    automation_enabled: automationEnabled,
  };
}

// --- Runs ------------------------------------------------------------------

const BridgeRunSchema = z.object({
  id: z.number(),
  agent: z.string(),
  status: z.string(),
  prompt: z.string().optional(),
  result: z.unknown().optional(),
  error: z.string().nullish(),
  token_input: z.number().nullish(),
  token_output: z.number().nullish(),
  cost_usd: z.number().nullish(),
  created_at: z.string().optional(),
  finished_at: z.string().nullish(),
});

// The Bridge run result carries the agent_response body but omits `schema_version`; inject it
// so the frontend renders it as structured output instead of the unstructured fallback.
export function adaptRun(data: unknown): unknown {
  const b = BridgeRunSchema.parse(data);
  const result =
    b.result && typeof b.result === "object"
      ? { schema_version: "aidera.agent_response.v1", ...(b.result as Record<string, unknown>) }
      : null;

  return {
    id: b.id,
    agent: b.agent,
    status: b.status,
    prompt: b.prompt ?? "",
    result,
    error: b.error ?? null,
    token_input: b.token_input ?? null,
    token_output: b.token_output ?? null,
    cost_usd: b.cost_usd ?? null,
    created_at: toIso(b.created_at) ?? nowIso(),
    finished_at: toIso(b.finished_at),
  };
}

// --- Contents --------------------------------------------------------------

const CONTENT_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

const BridgeContentSchema = z.object({
  id: z.number(),
  code: z.string().nullish(),
  title: z.string().nullish(),
  hook: z.string().nullish(),
  summary: z.string().nullish(),
  format: z.string().nullish(),
  pillar: z.string().nullish(),
  status: z.string().nullish(),
  stage: z.string().nullish(),
  priority: z.string().nullish(),
  owner: z.string().nullish(),
  scheduled_at: z.string().nullish(),
  archived: z.unknown().optional(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
});

type BridgeContent = z.infer<typeof BridgeContentSchema>;

// The Bridge stores content with `status` (frontend expects `stage`), integer `archived`,
// SQLite datetimes, and often-empty `hook`/`pillar`. It also omits pipeline fields the card
// contract requires (approval, artifact_count, sort_order, version). Map what exists and fill
// the rest with neutral defaults so the library/detail render; empty related arrays stay empty.
function contentCardFields(b: BridgeContent) {
  const stageRaw = b.stage ?? b.status ?? "ideas";
  const stage = (CONTENT_STAGES as readonly string[]).includes(stageRaw) ? stageRaw : "ideas";
  const priority = (CONTENT_PRIORITIES as readonly string[]).includes(b.priority ?? "")
    ? b.priority
    : "medium";
  const owner =
    typeof b.owner === "string" && (AGENT_SLUGS as readonly string[]).includes(b.owner)
      ? b.owner
      : null;

  return {
    id: b.id,
    code: nonEmpty(b.code, `AID-${b.id}`),
    title: nonEmpty(b.title, "Tanpa judul"),
    hook: nonEmpty(b.hook, "—"),
    format: nonEmpty(b.format, "—"),
    pillar: nonEmpty(b.pillar, "—"),
    priority,
    owner,
    stage,
    scheduled_at: toIso(b.scheduled_at),
    approval: "not_required" as const,
    blocker: null,
    revision_requested: false,
    artifact_count: 0,
    active_run_status: null,
    sort_order: 0,
    version: 1,
    updated_at: toIso(b.updated_at) ?? toIso(b.created_at) ?? nowIso(),
  };
}

export function adaptContentList(data: unknown): unknown {
  return z.array(z.unknown()).parse(data).map((raw) => {
    const b = BridgeContentSchema.parse(raw);
    return {
      ...contentCardFields(b),
      summary: nonEmpty(b.summary, "—"),
      archived: toBool(b.archived),
    };
  });
}

export function adaptContentDetail(data: unknown): unknown {
  const wrapper = z.object({ content: z.unknown() }).parse(data);
  const b = BridgeContentSchema.parse(wrapper.content);

  return {
    ...contentCardFields(b),
    summary: nonEmpty(b.summary, "—"),
    objective: "—",
    cta_concept: "—",
    plan_id: null,
    archived: toBool(b.archived),
    artifacts: [],
    tasks: [],
    approvals: [],
    activity: [],
    metrics: null,
    final_package_artifact_id: null,
  };
}
