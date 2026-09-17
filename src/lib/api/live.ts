import "server-only";

import { z } from "zod";

import {
  LIVE_DATA_SOURCE,
  PaginationMetaSchema,
  type ResponseMeta,
} from "@/lib/api/contracts";
import {
  bridgeFetch,
  bridgeJson,
  type BridgeJsonPath,
  type BridgeJsonRequest,
} from "@/lib/bridge/json";

export async function liveData<T>(
  path: BridgeJsonPath,
  schema: z.ZodType<T>,
  request: BridgeJsonRequest = {},
): Promise<{ data: T; meta?: ResponseMeta }> {
  const bridgeEnvelopeSchema = z
    .object({
      data: schema,
      meta: PaginationMetaSchema.partial().optional(),
    })
    .strict();
  const envelope = await bridgeJson(path, bridgeEnvelopeSchema, request);

  return {
    data: envelope.data,
    meta: envelope.meta
      ? { ...envelope.meta, data_source: LIVE_DATA_SOURCE }
      : { data_source: LIVE_DATA_SOURCE },
  };
}

// The deployed Bridge returns a leaner shape than the frontend contracts. `liveAdapted`
// fetches the raw Bridge envelope, maps `data` into the contract shape via `adapt`, then
// validates the result. Absent fields are filled with honest empty/zero defaults; array
// item shapes that the (currently empty) Bridge does not expose are left empty rather than
// fabricated.
export async function liveAdapted<T>(
  path: BridgeJsonPath,
  schema: z.ZodType<T>,
  adapt: (bridgeData: unknown) => unknown,
  request: BridgeJsonRequest = {},
): Promise<{ data: T; meta?: ResponseMeta }> {
  const payload = await bridgeFetch(path, request);
  const envelope = z
    .object({ data: z.unknown(), meta: z.unknown().optional() })
    .parse(payload);
  const data = schema.parse(adapt(envelope.data));
  const meta = PaginationMetaSchema.partial().safeParse(envelope.meta);

  return {
    data,
    meta: meta.success
      ? { ...meta.data, data_source: LIVE_DATA_SOURCE }
      : { data_source: LIVE_DATA_SOURCE },
  };
}
