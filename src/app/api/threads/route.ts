import { z } from "zod";

import { AgentSlugSchema, ThreadSchema } from "@/lib/api/contracts";
import { liveData } from "@/lib/api/live";
import { jsonData, prototypeMeta, routeError } from "@/lib/api/server";
import { isPrototypeMode } from "@/lib/bridge/env";
import { getPrototypeStore } from "@/lib/prototype/store";

export const dynamic = "force-dynamic";

const ThreadQuerySchema = z
  .object({
    agent: AgentSlugSchema.optional(),
  })
  .strict();

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const query = ThreadQuerySchema.parse(Object.fromEntries(url.searchParams));

    if (isPrototypeMode()) {
      const store = await getPrototypeStore();
      const data = store.listThreads(query.agent);
      return jsonData(data, prototypeMeta({ total: data.length, limit: data.length || 1, offset: 0 }));
    }

    const params = new URLSearchParams();

    if (query.agent) {
      params.set("agent", query.agent);
    }

    const response = await liveData("/api/threads", z.array(ThreadSchema), { query: params });
    return jsonData(response.data, response.meta);
  } catch (error) {
    return routeError(error);
  }
}
