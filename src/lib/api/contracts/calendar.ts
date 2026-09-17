import { z } from "zod";

import {
  DataSourceFieldSchema,
  IsoDateTimeSchema,
  PositiveIdSchema,
} from "./common";
import {
  ContentPrioritySchema,
  ContentStageSchema,
} from "./board";

export const CalendarViewSchema = z.enum(["month", "week", "list"]);

export const CalendarQuerySchema = z
  .object({
    view: CalendarViewSchema.default("month"),
    start: IsoDateTimeSchema.optional(),
    end: IsoDateTimeSchema.optional(),
  })
  .strict()
  .superRefine((query, context) => {
    if (query.start && query.end && new Date(query.start).getTime() >= new Date(query.end).getTime()) {
      context.addIssue({
        code: "custom",
        message: "Calendar start must be before end",
        path: ["end"],
      });
    }
  });

export const CalendarEventSchema = z
  .object({
    id: z.string().min(1),
    content_id: PositiveIdSchema,
    code: z.string().min(1),
    title: z.string().min(1),
    start: IsoDateTimeSchema,
    end: IsoDateTimeSchema.nullable(),
    timezone: z.literal("Asia/Jakarta"),
    all_day: z.boolean(),
    editable: z.boolean(),
    stage: ContentStageSchema,
    status: z.string().min(1),
    platform: z.enum(["instagram"]),
    format: z.string().min(1),
    pillar: z.string().min(1),
    priority: ContentPrioritySchema,
    overdue: z.boolean(),
    not_ready: z.boolean(),
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const CalendarDataSchema = z
  .object({
    view: CalendarViewSchema,
    range: z
      .object({
        start: IsoDateTimeSchema.nullable(),
        end: IsoDateTimeSchema.nullable(),
        timezone: z.literal("Asia/Jakarta"),
      })
      .strict(),
    events: z.array(CalendarEventSchema),
    data_source: DataSourceFieldSchema,
  })
  .strict();

export const ScheduleContentInputSchema = z
  .object({
    scheduled_at: IsoDateTimeSchema.nullable(),
  })
  .strict();

export type CalendarView = z.infer<typeof CalendarViewSchema>;
export type CalendarQuery = z.infer<typeof CalendarQuerySchema>;
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
export type CalendarData = z.infer<typeof CalendarDataSchema>;
export type ScheduleContentInput = z.infer<typeof ScheduleContentInputSchema>;
