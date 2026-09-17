import { describe, expect, it } from "vitest";

import {
  AgentResponseV1Schema,
  BoardSchema,
  CONTENT_STAGES,
  MoveContentStageInputSchema,
  parseAgentResponseV1,
  parseStructuredBlock,
  ScheduleContentInputSchema,
} from "@/lib/api/contracts";

describe("structured agent response", () => {
  it("accepts a valid v1 payload", () => {
    const parsed = AgentResponseV1Schema.parse({
      schema_version: "aidera.agent_response.v1",
      message: "Ringkasan riset.",
      blocks: [{ type: "recommendation", title: "Fokus hook", content: "Perkuat 3 detik pertama." }],
      artifacts: [],
      actions: [],
    });

    expect(parsed.blocks[0]?.type).toBe("recommendation");
  });

  it("falls back safely for unknown block types", () => {
    const block = parseStructuredBlock({ type: "hologram", title: "Blok baru" });

    expect(block.type).toBe("unknown");
    expect(block.type === "unknown" ? block.original_type : null).toBe("hologram");
  });

  it("never throws for malformed agent output", () => {
    const parsed = parseAgentResponseV1({ nonsense: true });

    expect(parsed.unstructured).toBe(true);
    expect(parsed.blocks).toHaveLength(0);
  });
});

describe("board contracts", () => {
  it("requires all fifteen stages", () => {
    expect(CONTENT_STAGES).toHaveLength(15);

    const result = BoardSchema.safeParse({
      columns: [],
      updated_at: "2026-09-13T09:00:00+07:00",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an unknown stage on move", () => {
    expect(MoveContentStageInputSchema.safeParse({ stage: "archive" }).success).toBe(false);
    expect(MoveContentStageInputSchema.safeParse({ stage: "qa" }).success).toBe(true);
  });

  it("rejects identical neighbour ids", () => {
    const result = MoveContentStageInputSchema.safeParse({
      stage: "qa",
      after_id: 4,
      before_id: 4,
    });

    expect(result.success).toBe(false);
  });
});

describe("schedule contract", () => {
  it("requires an explicit offset", () => {
    expect(ScheduleContentInputSchema.safeParse({ scheduled_at: "2026-09-20T09:00:00" }).success).toBe(
      false,
    );
    expect(
      ScheduleContentInputSchema.safeParse({ scheduled_at: "2026-09-20T09:00:00+07:00" }).success,
    ).toBe(true);
  });

  it("allows clearing a schedule", () => {
    expect(ScheduleContentInputSchema.safeParse({ scheduled_at: null }).success).toBe(true);
  });
});
