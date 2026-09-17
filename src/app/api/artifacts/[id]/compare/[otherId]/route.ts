import { ArtifactComparisonSchema } from "@/lib/api/contracts";
import { liveData } from "@/lib/api/live";
import {
  jsonData,
  parsePositiveInteger,
  prototypeMeta,
  routeError,
  type RouteContext,
} from "@/lib/api/server";
import { isPrototypeMode } from "@/lib/bridge/env";
import { getPrototypeStore } from "@/lib/prototype/store";

export const dynamic = "force-dynamic";

type CompareRouteContext = RouteContext<{ id: string; otherId: string }>;

export async function GET(_request: Request, context: CompareRouteContext): Promise<Response> {
  try {
    const { id, otherId } = await context.params;
    const baseId = parsePositiveInteger(id, "id");
    const targetId = parsePositiveInteger(otherId, "otherId");

    if (isPrototypeMode()) {
      const store = await getPrototypeStore();
      return jsonData(store.compareArtifacts(baseId, targetId), prototypeMeta());
    }

    const response = await liveData(
      `/api/artifacts/${baseId}/compare/${targetId}`,
      ArtifactComparisonSchema,
    );
    return jsonData(response.data, response.meta);
  } catch (error) {
    return routeError(error);
  }
}
