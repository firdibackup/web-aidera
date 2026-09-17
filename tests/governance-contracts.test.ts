import { describe, expect, it } from "vitest";

import {
  ApprovalRejectionInputSchema,
  ApprovalSchema,
  ContentQuerySchema,
  InstructionSchema,
  SettingsSchema,
  UpdateSettingsInputSchema,
} from "@/lib/api/contracts";

describe("approval contracts", () => {
  it("requires a note when rejecting or requesting revision", () => {
    expect(ApprovalRejectionInputSchema.safeParse({}).success).toBe(false);
    expect(ApprovalRejectionInputSchema.safeParse({ note: "   " }).success).toBe(false);
    expect(ApprovalRejectionInputSchema.safeParse({ note: "Klaim belum kuat" }).success).toBe(true);
  });

  it("keeps an immutable target version on the approval payload", () => {
    const result = ApprovalSchema.safeParse({
      id: 1,
      type: "copy",
      status: "pending",
      title: "AID-008",
      requester: "Writer",
      requested_at: "2026-09-13T14:10:00+07:00",
      decided_at: null,
      target_type: "content",
      target_id: 8,
      reason: "Copy perlu disetujui",
      impact: "Membuka tahap design",
      before: null,
      after: null,
      diff: [],
      decision_note: null,
      history: [],
    });

    expect(result.success).toBe(false);
  });
});

describe("instruction contracts", () => {
  it("rejects an unknown lifecycle status", () => {
    const base = {
      id: 1,
      agent: "design",
      scope: "agent",
      title: "Safe area",
      text: "Margin 50 px",
      reason: "Konsistensi",
      version: 1,
      proposed_by: "Design",
      proposed_at: "2026-09-13T12:05:00+07:00",
      decided_at: null,
      decision_note: null,
      supersedes_id: null,
      diff: [],
    };

    expect(InstructionSchema.safeParse({ ...base, status: "auto_applied" }).success).toBe(false);
    expect(InstructionSchema.safeParse({ ...base, status: "proposed" }).success).toBe(true);
  });
});

describe("settings contracts", () => {
  it("forbids auto-publish from ever being enabled", () => {
    const settings = {
      gates: [{ key: "copy", label: "Copy", description: "Gate", enabled: true, required: true }],
      automation_enabled: false,
      auto_publish_enabled: true,
      retry_limit: 2,
      agent_models: [],
      telegram: { enabled: false, chat_id_configured: false, notify_on: [] },
      branding: {
        handle: "@aidera",
        tagline: "Maximize your AI & Digital Tools! 🚀",
        canvas: "1080×1350",
        aspect_ratio: "4:5",
        safe_margin_px: 50,
      },
      updated_at: "2026-09-13T08:00:00+07:00",
    };

    expect(SettingsSchema.safeParse(settings).success).toBe(false);
  });

  it("caps the retry limit at two attempts", () => {
    expect(UpdateSettingsInputSchema.safeParse({ retry_limit: 2 }).success).toBe(true);
    expect(UpdateSettingsInputSchema.safeParse({ retry_limit: 3 }).success).toBe(false);
  });

  it("requires at least one field on update", () => {
    expect(UpdateSettingsInputSchema.safeParse({}).success).toBe(false);
  });
});

describe("content query contract", () => {
  it("defaults sorting and coerces archived flags", () => {
    const parsed = ContentQuerySchema.parse({ archived: "true" });

    expect(parsed.sort).toBe("updated_desc");
    expect(parsed.archived).toBe(true);
  });

  it("rejects unknown sort values", () => {
    expect(ContentQuerySchema.safeParse({ sort: "random" }).success).toBe(false);
  });
});
