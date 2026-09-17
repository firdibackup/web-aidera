import { DashboardSchema } from "@/lib/api/contracts";
import { liveData } from "@/lib/api/live";
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

    const response = await liveData("/api/dashboard", DashboardSchema);
    return jsonData(response.data, response.meta);
  } catch (error) {
    return routeError(error);
  }
}
