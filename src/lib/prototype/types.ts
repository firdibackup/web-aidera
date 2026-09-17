import { z } from "zod";

import {
  ActivitySchema,
  AgentSchema,
  ApprovalSchema,
  ContentDetailSchema,
  DashboardSchema,
  InstructionSchema,
  MessageSchema,
  PlanSchema,
  SettingsSchema,
  ThreadSchema,
  WorkflowSchema,
} from "@/lib/api/contracts";

export const PrototypeDatasetSchema = z
  .object({
    dashboard: DashboardSchema,
    activities: z.array(ActivitySchema),
    agents: z.array(AgentSchema).length(7),
    threads: z.array(ThreadSchema),
    messages: z.array(MessageSchema),
    plans: z.array(PlanSchema),
    contents: z.array(ContentDetailSchema),
    approvals: z.array(ApprovalSchema),
    instructions: z.array(InstructionSchema),
    settings: SettingsSchema,
    workflow: WorkflowSchema,
  })
  .strict();

export type PrototypeDatasetInput = z.input<typeof PrototypeDatasetSchema>;
export type PrototypeDataset = z.output<typeof PrototypeDatasetSchema>;
