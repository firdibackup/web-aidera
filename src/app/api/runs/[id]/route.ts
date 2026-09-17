import { RunDetailSchema } from "@/lib/api/contracts";
import { adaptRun } from "@/lib/api/adapters";
import { liveAdapted } from "@/lib/api/live";
import {
  jsonData,
  parsePositiveInteger,
  routeError,
  type RouteContext,
} from "@/lib/api/server";

export const dynamic = "force-dynamic";

type RunRouteContext = RouteContext<{ id: string }>;

export async function GET(_request: Request, context: RunRouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    const runId = parsePositiveInteger(id, "id");

    const response = await liveAdapted(`/api/runs/${runId}`, RunDetailSchema, adaptRun);
    return jsonData(response.data, response.meta);
  } catch (error) {
    return routeError(error);
  }
}
