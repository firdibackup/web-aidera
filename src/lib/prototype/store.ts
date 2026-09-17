import "server-only";

import {
  type AgentSlug,
  AgentSlugSchema,
  type Approval,
  type ApprovalDecisionInput,
  type ApprovalQuery,
  type ApprovalRejectionInput,
  type Artifact,
  type ArtifactComparison,
  type ArtifactQuery,
  type CalendarData,
  type CalendarQuery,
  CONTENT_STAGES,
  type Board,
  type ContentCard,
  type ContentDetail,
  type ContentListItem,
  type ContentQuery,
  type Instruction,
  type InstructionDecisionInput,
  type InstructionQuery,
  type MoveContentStageInput,
  type ScheduleContentInput,
  type ApprovePlanInput,
  type Plan,
  type Message,
  type Settings,
  type Thread,
  type Activity,
  type Dashboard,
  type UpdateSettingsInput,
  type Workflow,
  PROTOTYPE_DATA_SOURCE,
} from "@/lib/api/contracts";
import { isPrototypeMode } from "@/lib/bridge/env";
import { isWithinCalendarRange, toJakartaIso } from "@/lib/dates/jakarta";
import type { PrototypeDataset } from "@/lib/prototype/types";

const stageLabels: Record<(typeof CONTENT_STAGES)[number], string> = {
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

const priorityRank: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function toCard(content: ContentDetail): ContentCard {
  return {
    id: content.id,
    code: content.code,
    title: content.title,
    hook: content.hook,
    format: content.format,
    pillar: content.pillar,
    priority: content.priority,
    owner: content.owner,
    stage: content.stage,
    scheduled_at: content.scheduled_at,
    approval: content.approval,
    blocker: content.blocker,
    revision_requested: content.revision_requested,
    artifact_count: content.artifact_count,
    active_run_status: content.active_run_status,
    sort_order: content.sort_order,
    version: content.version,
    updated_at: content.updated_at,
    data_source: content.data_source,
  };
}

function toListItem(content: ContentDetail): ContentListItem {
  return { ...toCard(content), summary: content.summary, archived: content.archived };
}

function diffLines(before: string, after: string) {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const total = Math.max(beforeLines.length, afterLines.length);
  const lines: ArtifactComparison["diff"] = [];

  for (let index = 0; index < total; index += 1) {
    const left = beforeLines[index];
    const right = afterLines[index];

    if (left === right && left !== undefined) {
      lines.push({ kind: "context", text: left });
      continue;
    }

    if (left !== undefined) {
      lines.push({ kind: "removed", text: `- ${left}` });
    }

    if (right !== undefined) {
      lines.push({ kind: "added", text: `+ ${right}` });
    }
  }

  return lines;
}

function updateTimestamp(): string {
  return toJakartaIso(new Date());
}

export class PrototypeStoreError extends Error {
  constructor(
    public readonly code: "not_found" | "conflict" | "invalid_reference",
    message: string,
    public readonly status: 404 | 409 | 422,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "PrototypeStoreError";
  }
}

class PrototypeStore {
  private readonly approvedPlansByKey = new Map<string, Plan>();
  private readonly movedContentsByKey = new Map<string, ContentCard>();
  private readonly scheduledContentsByKey = new Map<string, ContentCard>();
  private readonly decidedApprovalsByKey = new Map<string, Approval>();
  private readonly decidedInstructionsByKey = new Map<string, Instruction>();

  constructor(private readonly dataset: PrototypeDataset) {}

  getDashboard(): Dashboard {
    return clone(this.dataset.dashboard);
  }

  listActivities(limit: number, offset: number): Activity[] {
    return clone(this.dataset.activities.slice(offset, offset + limit));
  }

  countActivities(): number {
    return this.dataset.activities.length;
  }

  listAgents() {
    return clone(this.dataset.agents.map((agent) => ({
      slug: agent.slug,
      name: agent.name,
      role: agent.role,
      profile: agent.profile,
      model: agent.model,
      status: agent.status,
      enabled: agent.enabled,
      counts: agent.counts,
      last_activity: agent.last_activity,
      data_source: agent.data_source,
    })));
  }

  getAgent(slug: string) {
    const agentSlug = AgentSlugSchema.safeParse(slug);

    if (!agentSlug.success) {
      throw new PrototypeStoreError("not_found", "Agent not found", 404, { slug });
    }

    const agent = this.dataset.agents.find((candidate) => candidate.slug === agentSlug.data);

    if (!agent) {
      throw new PrototypeStoreError("not_found", "Agent not found", 404, { slug });
    }

    return clone(agent);
  }

  listThreads(agent?: AgentSlug): Thread[] {
    const threads = agent
      ? this.dataset.threads.filter((thread) => thread.agent === agent)
      : this.dataset.threads;

    return clone(threads);
  }

  listMessages(threadId: number, limit: number, offset: number): Message[] {
    if (!this.dataset.threads.some((thread) => thread.id === threadId)) {
      throw new PrototypeStoreError("not_found", "Thread not found", 404, { thread_id: threadId });
    }

    const messages = this.dataset.messages.filter((message) => message.thread_id === threadId);
    return clone(messages.slice(offset, offset + limit));
  }

  countMessages(threadId: number): number {
    return this.dataset.messages.filter((message) => message.thread_id === threadId).length;
  }

  listPlans(): Plan[] {
    return clone(this.dataset.plans);
  }

  approvePlan(planId: number, input: ApprovePlanInput, idempotencyKey: string): Plan {
    const cached = this.approvedPlansByKey.get(idempotencyKey);

    if (cached) {
      return clone(cached);
    }

    const plan = this.dataset.plans.find((candidate) => candidate.id === planId);

    if (!plan) {
      throw new PrototypeStoreError("not_found", "Plan not found", 404, { plan_id: planId });
    }

    const itemIds = input.item_ids === undefined || input.item_ids.length === 0
      ? plan.items.map((item) => item.id)
      : input.item_ids;
    const unknownIds = itemIds.filter((itemId) => !plan.items.some((item) => item.id === itemId));

    if (unknownIds.length > 0) {
      throw new PrototypeStoreError(
        "invalid_reference",
        "One or more plan items do not belong to this plan",
        422,
        { plan_id: planId, item_ids: unknownIds },
      );
    }

    for (const item of plan.items) {
      if (itemIds.includes(item.id)) {
        item.approval_status = "approved";
      }
    }

    const approvedCount = plan.items.filter((item) => item.approval_status === "approved").length;
    plan.status = approvedCount === plan.items.length ? "approved" : "partially_approved";
    plan.updated_at = updateTimestamp();
    this.approvedPlansByKey.set(idempotencyKey, clone(plan));

    return clone(plan);
  }

  getBoard(): Board {
    const columns = CONTENT_STAGES.map((stage) => {
      const cards = this.dataset.contents
        .filter((content) => content.stage === stage)
        .sort((left, right) => left.sort_order - right.sort_order);

      return {
        stage,
        label: stageLabels[stage],
        cards: clone(cards.map(toCard)),
        count: cards.length,
        wip_limit: null,
      };
    });

    return {
      columns,
      updated_at: updateTimestamp(),
      data_source: PROTOTYPE_DATA_SOURCE,
    };
  }

  getCalendar(query: CalendarQuery): CalendarData {
    const events = this.dataset.contents
      .filter((content): content is ContentDetail & { scheduled_at: string } => content.scheduled_at !== null)
      .filter((content) => isWithinCalendarRange(content.scheduled_at, query.start, query.end))
      .map((content) => ({
        id: String(content.id),
        content_id: content.id,
        code: content.code,
        title: content.title,
        start: content.scheduled_at,
        end: null,
        timezone: "Asia/Jakarta" as const,
        all_day: false,
        editable: content.stage !== "published",
        stage: content.stage,
        status: content.active_run_status ?? content.stage,
        platform: "instagram" as const,
        format: content.format,
        pillar: content.pillar,
        priority: content.priority,
        overdue: new Date(content.scheduled_at).getTime() < new Date("2026-09-14T00:00:00+07:00").getTime()
          && content.stage !== "published"
          && content.stage !== "performance_review",
        not_ready: !["scheduled", "published", "performance_review"].includes(content.stage),
        data_source: PROTOTYPE_DATA_SOURCE,
      }));

    return {
      view: query.view,
      range: {
        start: query.start ?? null,
        end: query.end ?? null,
        timezone: "Asia/Jakarta",
      },
      events,
      data_source: PROTOTYPE_DATA_SOURCE,
    };
  }

  moveContentStage(
    contentId: number,
    input: MoveContentStageInput,
    idempotencyKey: string,
  ): ContentCard {
    const cached = this.movedContentsByKey.get(idempotencyKey);

    if (cached) {
      return clone(cached);
    }

    const content = this.getMutableContent(contentId);

    if (input.version !== undefined && input.version !== content.version) {
      throw new PrototypeStoreError(
        "conflict",
        "Content version is stale",
        409,
        { expected_version: content.version, received_version: input.version },
      );
    }

    if (input.after_id != null) {
      this.assertStageNeighbor(input.after_id, input.stage, "after_id");
    }

    if (input.before_id != null) {
      this.assertStageNeighbor(input.before_id, input.stage, "before_id");
    }

    content.stage = input.stage;
    content.sort_order = input.position ?? this.nextSortOrder(input.stage, contentId);
    content.version += 1;
    content.updated_at = updateTimestamp();
    const card = toCard(content);
    this.movedContentsByKey.set(idempotencyKey, clone(card));

    return clone(card);
  }

  scheduleContent(
    contentId: number,
    input: ScheduleContentInput,
    idempotencyKey: string,
  ): ContentCard {
    const cached = this.scheduledContentsByKey.get(idempotencyKey);

    if (cached) {
      return clone(cached);
    }

    const content = this.getMutableContent(contentId);
    content.scheduled_at = input.scheduled_at;
    content.version += 1;
    content.updated_at = updateTimestamp();
    const card = toCard(content);
    this.scheduledContentsByKey.set(idempotencyKey, clone(card));

    return clone(card);
  }

  listContents(query: ContentQuery): ContentListItem[] {
    const needle = query.q?.toLowerCase();
    const filtered = this.dataset.contents.filter((content) => {
      if (query.archived !== undefined && content.archived !== query.archived) {
        return false;
      }

      if (query.stage && content.stage !== query.stage) {
        return false;
      }

      if (query.pillar && content.pillar !== query.pillar) {
        return false;
      }

      if (query.format && content.format !== query.format) {
        return false;
      }

      if (query.priority && content.priority !== query.priority) {
        return false;
      }

      if (needle) {
        const haystack = `${content.code} ${content.title} ${content.hook} ${content.summary}`.toLowerCase();

        if (!haystack.includes(needle)) {
          return false;
        }
      }

      return true;
    });

    const sorted = [...filtered].sort((left, right) => {
      switch (query.sort) {
        case "updated_asc":
          return left.updated_at.localeCompare(right.updated_at);
        case "scheduled_asc":
          return (left.scheduled_at ?? "9999").localeCompare(right.scheduled_at ?? "9999");
        case "priority_desc":
          return (priorityRank[right.priority] ?? 0) - (priorityRank[left.priority] ?? 0);
        case "code_asc":
          return left.code.localeCompare(right.code);
        default:
          return right.updated_at.localeCompare(left.updated_at);
      }
    });

    return clone(sorted.map(toListItem));
  }

  countContents(): number {
    return this.dataset.contents.length;
  }

  getContent(contentId: number): ContentDetail {
    return clone(this.getMutableContent(contentId));
  }

  listApprovals(query: ApprovalQuery): Approval[] {
    const filtered = this.dataset.approvals.filter((approval) => {
      if (query.type && approval.type !== query.type) {
        return false;
      }

      if (query.status && approval.status !== query.status) {
        return false;
      }

      return true;
    });

    return clone(filtered);
  }

  getApproval(approvalId: number): Approval {
    return clone(this.getMutableApproval(approvalId));
  }

  decideApproval(
    approvalId: number,
    decision: "approved" | "rejected" | "revision_requested",
    input: ApprovalDecisionInput | ApprovalRejectionInput,
    idempotencyKey: string,
  ): Approval {
    const cached = this.decidedApprovalsByKey.get(idempotencyKey);

    if (cached) {
      return clone(cached);
    }

    const approval = this.getMutableApproval(approvalId);

    if (approval.status !== "pending") {
      throw new PrototypeStoreError("conflict", "Approval has already been decided", 409, {
        approval_id: approvalId,
        status: approval.status,
      });
    }

    const note = "note" in input ? input.note ?? null : null;
    const decidedAt = updateTimestamp();

    approval.status = decision;
    approval.decided_at = decidedAt;
    approval.decision_note = note;
    approval.history = [
      ...approval.history,
      {
        id: approval.history.length + 1,
        action: decision === "approved"
          ? "approved"
          : decision === "rejected"
            ? "rejected"
            : "revision_requested",
        actor: "Prototype operator",
        note,
        created_at: decidedAt,
      },
    ];

    this.syncApprovalTarget(approval);
    this.decidedApprovalsByKey.set(idempotencyKey, clone(approval));

    return clone(approval);
  }

  listInstructions(query: InstructionQuery): Instruction[] {
    const filtered = this.dataset.instructions.filter((instruction) => {
      if (query.agent && instruction.agent !== query.agent) {
        return false;
      }

      if (query.scope && instruction.scope !== query.scope) {
        return false;
      }

      if (query.status && instruction.status !== query.status) {
        return false;
      }

      return true;
    });

    return clone(filtered);
  }

  decideInstruction(
    instructionId: number,
    decision: "approve" | "reject" | "rollback",
    input: InstructionDecisionInput,
    idempotencyKey: string,
  ): Instruction {
    const cached = this.decidedInstructionsByKey.get(idempotencyKey);

    if (cached) {
      return clone(cached);
    }

    const instruction = this.dataset.instructions.find((candidate) => candidate.id === instructionId);

    if (!instruction) {
      throw new PrototypeStoreError("not_found", "Instruction not found", 404, {
        instruction_id: instructionId,
      });
    }

    const decidedAt = updateTimestamp();
    const note = input.note ?? null;

    if (decision === "rollback") {
      if (instruction.status !== "superseded") {
        throw new PrototypeStoreError(
          "conflict",
          "Only a superseded version can be rolled back",
          409,
          { instruction_id: instructionId, status: instruction.status },
        );
      }

      for (const candidate of this.dataset.instructions) {
        if (
          candidate.id !== instruction.id
          && candidate.status === "active"
          && candidate.agent === instruction.agent
          && candidate.scope === instruction.scope
        ) {
          candidate.status = "superseded";
        }
      }

      instruction.status = "active";
      instruction.decided_at = decidedAt;
      instruction.decision_note = note;
      this.decidedInstructionsByKey.set(idempotencyKey, clone(instruction));

      return clone(instruction);
    }

    if (instruction.status !== "proposed") {
      throw new PrototypeStoreError("conflict", "Instruction has already been decided", 409, {
        instruction_id: instructionId,
        status: instruction.status,
      });
    }

    if (decision === "approve") {
      if (instruction.supersedes_id !== null) {
        const previous = this.dataset.instructions.find(
          (candidate) => candidate.id === instruction.supersedes_id,
        );

        if (previous) {
          previous.status = "superseded";
        }
      }

      instruction.status = "active";
      this.syncAgentInstructions(instruction);
    } else {
      instruction.status = "rejected";
    }

    instruction.decided_at = decidedAt;
    instruction.decision_note = note;
    this.decidedInstructionsByKey.set(idempotencyKey, clone(instruction));

    return clone(instruction);
  }

  listArtifacts(query: ArtifactQuery): Artifact[] {
    const artifacts = this.dataset.contents.flatMap((content) => content.artifacts);
    const filtered = artifacts.filter((artifact) => {
      if (query.content_id && artifact.content_id !== query.content_id) {
        return false;
      }

      if (query.type && artifact.type !== query.type) {
        return false;
      }

      return true;
    });

    return clone(filtered);
  }

  getArtifact(artifactId: number): Artifact {
    const artifact = this.dataset.contents
      .flatMap((content) => content.artifacts)
      .find((candidate) => candidate.id === artifactId);

    if (!artifact) {
      throw new PrototypeStoreError("not_found", "Artifact not found", 404, {
        artifact_id: artifactId,
      });
    }

    return clone(artifact);
  }

  compareArtifacts(baseId: number, otherId: number): ArtifactComparison {
    const base = this.getArtifact(baseId);
    const other = this.getArtifact(otherId);

    return {
      base,
      other,
      diff: diffLines(base.body, other.body),
      data_source: PROTOTYPE_DATA_SOURCE,
    };
  }

  getSettings(): Settings {
    return clone(this.dataset.settings);
  }

  updateSettings(input: UpdateSettingsInput): Settings {
    const settings = this.dataset.settings;

    if (input.automation_enabled !== undefined) {
      settings.automation_enabled = input.automation_enabled;
      this.dataset.workflow.automation_enabled = input.automation_enabled;
    }

    if (input.retry_limit !== undefined) {
      settings.retry_limit = input.retry_limit;
    }

    if (input.gates) {
      for (const update of input.gates) {
        const gate = settings.gates.find((candidate) => candidate.key === update.key);

        if (!gate) {
          throw new PrototypeStoreError("not_found", "Gate not found", 404, { key: update.key });
        }

        if (gate.required && !update.enabled) {
          throw new PrototypeStoreError(
            "conflict",
            "Required approval gates cannot be disabled",
            409,
            { key: update.key },
          );
        }

        gate.enabled = update.enabled;
      }
    }

    settings.updated_at = updateTimestamp();

    return clone(settings);
  }

  getWorkflow(): Workflow {
    return clone(this.dataset.workflow);
  }

  private getMutableApproval(approvalId: number): Approval {
    const approval = this.dataset.approvals.find((candidate) => candidate.id === approvalId);

    if (!approval) {
      throw new PrototypeStoreError("not_found", "Approval not found", 404, {
        approval_id: approvalId,
      });
    }

    return approval;
  }

  private syncApprovalTarget(approval: Approval): void {
    if (approval.target_type === "content") {
      const content = this.dataset.contents.find((candidate) => candidate.id === approval.target_id);

      if (!content) {
        return;
      }

      content.approval = approval.status === "approved"
        ? "approved"
        : approval.status === "rejected"
          ? "rejected"
          : "revision_requested";
      content.revision_requested = approval.status === "revision_requested";
      content.version += 1;
      content.updated_at = approval.decided_at ?? updateTimestamp();

      const summary = content.approvals.find((candidate) => candidate.id === approval.id);

      if (summary) {
        summary.status = approval.status;
        summary.decided_at = approval.decided_at;
      }

      return;
    }

    if (approval.target_type === "plan") {
      const plan = this.dataset.plans.find((candidate) => candidate.id === approval.target_id);

      if (!plan) {
        return;
      }

      if (approval.status === "approved") {
        for (const item of plan.items) {
          item.approval_status = "approved";
        }

        plan.status = "approved";
      } else if (approval.status === "rejected") {
        plan.status = "rejected";
      }

      plan.updated_at = approval.decided_at ?? updateTimestamp();
      return;
    }

    const instruction = this.dataset.instructions.find(
      (candidate) => candidate.id === approval.target_id,
    );

    if (!instruction || instruction.status !== "proposed") {
      return;
    }

    if (approval.status === "approved") {
      if (instruction.supersedes_id !== null) {
        const previous = this.dataset.instructions.find(
          (candidate) => candidate.id === instruction.supersedes_id,
        );

        if (previous) {
          previous.status = "superseded";
        }
      }

      instruction.status = "active";
      this.syncAgentInstructions(instruction);
    } else if (approval.status === "rejected") {
      instruction.status = "rejected";
    }

    instruction.decided_at = approval.decided_at;
    instruction.decision_note = approval.decision_note;
  }

  private syncAgentInstructions(instruction: Instruction): void {
    if (!instruction.agent) {
      return;
    }

    const agent = this.dataset.agents.find((candidate) => candidate.slug === instruction.agent);

    if (!agent) {
      return;
    }

    agent.active_instructions = [
      ...agent.active_instructions.filter((active) => active.id !== instruction.supersedes_id),
      {
        id: instruction.id,
        scope: instruction.scope,
        text: instruction.text,
        version: instruction.version,
        approved_at: instruction.decided_at ?? updateTimestamp(),
      },
    ];
  }

  private getMutableContent(contentId: number): ContentDetail {
    const content = this.dataset.contents.find((candidate) => candidate.id === contentId);

    if (!content) {
      throw new PrototypeStoreError("not_found", "Content not found", 404, { content_id: contentId });
    }

    return content;
  }

  private assertStageNeighbor(
    contentId: number,
    stage: MoveContentStageInput["stage"],
    field: "after_id" | "before_id",
  ): void {
    const neighbor = this.dataset.contents.find((candidate) => candidate.id === contentId);

    if (!neighbor || neighbor.stage !== stage) {
      throw new PrototypeStoreError(
        "invalid_reference",
        `${field} must identify a card in the destination stage`,
        422,
        { [field]: contentId, stage },
      );
    }
  }

  private nextSortOrder(stage: MoveContentStageInput["stage"], movingId: number): number {
    const lastPosition = this.dataset.contents
      .filter((content) => content.stage === stage && content.id !== movingId)
      .reduce((maximum, content) => Math.max(maximum, content.sort_order), 0);

    return lastPosition + 1000;
  }
}

const prototypeStoreSymbol = Symbol.for("aidera.prototype.store");
const globalPrototypeStore = globalThis as typeof globalThis & {
  [prototypeStoreSymbol]?: PrototypeStore;
};

export async function getPrototypeStore(): Promise<PrototypeStore> {
  if (!isPrototypeMode()) {
    throw new Error("Prototype store is unavailable outside prototype mode");
  }

  if (!globalPrototypeStore[prototypeStoreSymbol]) {
    const { createPrototypeDataset } = await import("@/mocks/prototype-dataset");
    globalPrototypeStore[prototypeStoreSymbol] = new PrototypeStore(createPrototypeDataset());
  }

  return globalPrototypeStore[prototypeStoreSymbol];
}

export async function resetPrototypeStore(): Promise<void> {
  if (!isPrototypeMode()) {
    throw new Error("Prototype store is unavailable outside prototype mode");
  }

  const { createPrototypeDataset } = await import("@/mocks/prototype-dataset");
  globalPrototypeStore[prototypeStoreSymbol] = new PrototypeStore(createPrototypeDataset());
}
