import { z } from "zod";

import {
  ContentListItemSchema,
  ContentQuerySchema,
  CreateContentInputSchema,
  CreatedContentSchema,
} from "@/lib/api/contracts";
import { adaptContentList } from "@/lib/api/adapters";
import { liveAdapted, liveData } from "@/lib/api/live";
import {
  getIdempotencyKey,
  jsonData,
  parseJson,
  prototypeMeta,
  routeError,
} from "@/lib/api/server";
import { isPrototypeMode } from "@/lib/bridge/env";
import { getPrototypeStore } from "@/lib/prototype/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const query = ContentQuerySchema.parse(Object.fromEntries(url.searchParams));

    if (isPrototypeMode()) {
      const store = await getPrototypeStore();
      const data = store.listContents(query);
      return jsonData(data, prototypeMeta({ total: data.length, limit: data.length || 1, offset: 0 }));
    }

    const response = await liveAdapted(
      "/api/contents",
      z.array(ContentListItemSchema),
      adaptContentList,
      { query: url.searchParams },
    );
    return jsonData(response.data, response.meta);
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const input = await parseJson(request, CreateContentInputSchema);
    const idempotencyKey = getIdempotencyKey(request);

    if (isPrototypeMode()) {
      return Response.json(
        {
          error: {
            code: "live_mode_required",
            message: "Pembuatan konten memerlukan Bridge live",
            details: {},
          },
        },
        { status: 501 },
      );
    }

    const response = await liveData("/api/contents", CreatedContentSchema, {
      method: "POST",
      body: input,
      idempotencyKey,
    });
    return jsonData(response.data, response.meta, 201);
  } catch (error) {
    return routeError(error);
  }
}
