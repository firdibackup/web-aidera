import { DashboardSchema } from "@/lib/api/contracts";
import { adaptDashboard } from "@/lib/api/adapters";
import { liveAdapted } from "@/lib/api/live";
import { jsonData, prototypeMeta, routeError } from "@/lib/api/server";
import { isPrototypeMode } from "@/lib/bridge/env";
import { getPrototypeStore } from "@/lib/prototype/store";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    if (isPrototypeMode()) {
      const store = await getPrototypeStore();
      return jsonData(store.getDashboard(), prototypeMeta());
    }

    const response = await liveAdapted("/api/dashboard", DashboardSchema, adaptDashboard);
    return jsonData(response.data, response.meta);
  } catch (error) {
    return routeError(error);
  }
}
