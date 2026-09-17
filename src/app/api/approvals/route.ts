import { z } from "zod";

import { ApprovalQuerySchema, ApprovalSchema } from "@/lib/api/contracts";
import { liveData } from "@/lib/api/live";
import { jsonData, prototypeMeta, routeError } from "@/lib/api/server";
import { isPrototypeMode } from "@/lib/bridge/env";
import { getPrototypeStore } from "@/lib/prototype/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const query = ApprovalQuerySchema.parse(Object.fromEntries(url.searchParams));

    if (isPrototypeMode()) {
      const store = await getPrototypeStore();
      const data = store.listApprovals(query);
      return jsonData(data, prototypeMeta({ total: data.length, limit: data.length || 1, offset: 0 }));
    }

    const response = await liveData("/api/approvals", z.array(ApprovalSchema), {
      query: url.searchParams,
    });
    return jsonData(response.data, response.meta);
  } catch (error) {
    return routeError(error);
  }
}
