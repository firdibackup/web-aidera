import { z } from "zod";

import {
  ActivitySchema,
  PaginationQuerySchema,
} from "@/lib/api/contracts";
import { liveData } from "@/lib/api/live";
import { jsonData, prototypeMeta, routeError } from "@/lib/api/server";
import { isPrototypeMode } from "@/lib/bridge/env";
import { getPrototypeStore } from "@/lib/prototype/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const query = PaginationQuerySchema.parse(Object.fromEntries(url.searchParams));

    if (isPrototypeMode()) {
      const store = await getPrototypeStore();
      const data = store.listActivities(query.limit, query.offset);
      return jsonData(
        data,
        prototypeMeta({ total: store.countActivities(), limit: query.limit, offset: query.offset }),
      );
    }

    const params = new URLSearchParams({
      limit: String(query.limit),
      offset: String(query.offset),
    });
    const response = await liveData("/api/activities", z.array(ActivitySchema), { query: params });
    return jsonData(response.data, response.meta);
  } catch (error) {
    return routeError(error);
  }
}
