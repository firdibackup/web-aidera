import "server-only";

import { z } from "zod";

import {
  LIVE_DATA_SOURCE,
  PaginationMetaSchema,
  type ResponseMeta,
} from "@/lib/api/contracts";
import { bridgeJson, type BridgeJsonPath, type BridgeJsonRequest } from "@/lib/bridge/json";

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
