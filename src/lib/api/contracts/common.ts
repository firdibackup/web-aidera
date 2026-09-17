import { z } from "zod";

export const PROTOTYPE_NOTICE = "Prototype Data — tidak tersimpan permanen" as const;

export const PrototypeDataSourceSchema = z
  .object({
    mode: z.literal("prototype"),
    label: z.literal("Prototype Data"),
    notice: z.literal(PROTOTYPE_NOTICE),
    persistent_banner: z.literal(true),
  })
  .strict();

export const LiveDataSourceSchema = z
  .object({
    mode: z.literal("live"),
    label: z.literal("Live Data"),
    notice: z.null(),
    persistent_banner: z.literal(false),
  })
  .strict();

export const DataSourceSchema = z.discriminatedUnion("mode", [
  PrototypeDataSourceSchema,
  LiveDataSourceSchema,
]);

export type DataSource = z.infer<typeof DataSourceSchema>;

export const PROTOTYPE_DATA_SOURCE = Object.freeze({
  mode: "prototype",
  label: "Prototype Data",
  notice: PROTOTYPE_NOTICE,
  persistent_banner: true,
} satisfies z.infer<typeof PrototypeDataSourceSchema>);

export const LIVE_DATA_SOURCE = Object.freeze({
  mode: "live",
  label: "Live Data",
  notice: null,
  persistent_banner: false,
} satisfies z.infer<typeof LiveDataSourceSchema>);

export const DataSourceFieldSchema = DataSourceSchema.default(LIVE_DATA_SOURCE);

export const IsoDateTimeSchema = z.iso.datetime({ offset: true });
export const IsoDateSchema = z.iso.date();
export const PositiveIdSchema = z.number().int().positive();
export const NonNegativeIntegerSchema = z.number().int().nonnegative();

export const AgentSlugSchema = z.enum([
  "ceo",
  "research",
  "writer",
  "validator",
  "growth",
  "design",
  "qa",
]);

export type AgentSlug = z.infer<typeof AgentSlugSchema>;

export const PaginationMetaSchema = z
  .object({
    total: NonNegativeIntegerSchema,
    limit: z.number().int().positive(),
    offset: NonNegativeIntegerSchema,
  })
  .strict();

export const PaginationQuerySchema = z
  .object({
    limit: z.coerce.number().int().positive().max(100).default(50),
    offset: z.coerce.number().int().nonnegative().default(0),
  })
  .strict();

export const ResponseMetaSchema = PaginationMetaSchema.partial()
  .extend({
    data_source: DataSourceSchema,
  })
  .strict();

export type ResponseMeta = z.infer<typeof ResponseMetaSchema>;

export function envelopeSchema<T extends z.ZodType>(data: T) {
  return z
    .object({
      data,
      meta: ResponseMetaSchema.optional(),
    })
    .strict();
}

export const ErrorEnvelopeSchema = z
  .object({
    error: z
      .object({
        code: z.string().min(1),
        message: z.string().min(1),
        details: z.record(z.string(), z.unknown()),
      })
      .strict(),
  })
  .strict();

export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;
