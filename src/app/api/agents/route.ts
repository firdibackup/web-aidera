import { z } from "zod";

import { AgentListItemSchema } from "@/lib/api/contracts";
import { liveData } from "@/lib/api/live";
import { jsonData, prototypeMeta, routeError } from "@/lib/api/server";
import { isPrototypeMode } from "@/lib/bridge/env";
import { getPrototypeStore } from "@/lib/prototype/store";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    if (isPrototypeMode()) {
      const store = await getPrototypeStore();
      const data = store.listAgents();
      return jsonData(data, prototypeMeta({ total: data.length, limit: data.length, offset: 0 }));
    }

    const response = await liveData("/api/agents", z.array(AgentListItemSchema));
    return jsonData(response.data, response.meta);
  } catch (error) {
    return routeError(error);
  }
}
