import type { BadgeTone } from "@/components/ui/badge";
import type {
  ApprovalStatus,
  ApprovalType,
  ContentCard,
  ContentStage,
  InstructionStatus,
} from "@/lib/api/contracts";

export const stageLabels: Record<ContentStage, string> = {
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

export const approvalBadgeTone: Record<ContentCard["approval"], BadgeTone> = {
  not_required: "neutral",
  pending: "warning",
  approved: "success",
  rejected: "danger",
  revision_requested: "info",
};

export const approvalBadgeLabel: Record<ContentCard["approval"], string> = {
  not_required: "Tanpa gate",
  pending: "Menunggu ACC",
  approved: "Disetujui",
  rejected: "Ditolak",
  revision_requested: "Revisi",
};

export const priorityTone: Record<ContentCard["priority"], BadgeTone> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

export const approvalStatusTone: Record<ApprovalStatus, BadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  revision_requested: "info",
};

export const approvalStatusLabel: Record<ApprovalStatus, string> = {
  pending: "Menunggu keputusan",
  approved: "Disetujui",
  rejected: "Ditolak",
  revision_requested: "Revisi diminta",
};

export const approvalTypeLabel: Record<ApprovalType, string> = {
  plan: "Rencana",
  copy: "Copy",
  final: "Paket final",
  instruction: "Instruksi",
};

export const instructionStatusTone: Record<InstructionStatus, BadgeTone> = {
  proposed: "warning",
  active: "success",
  rejected: "danger",
  superseded: "neutral",
};

export const instructionStatusLabel: Record<InstructionStatus, string> = {
  proposed: "Diusulkan",
  active: "Aktif",
  rejected: "Ditolak",
  superseded: "Versi lama",
};
