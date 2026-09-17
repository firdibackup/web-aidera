import { ApprovalSchema } from "@/lib/api/contracts";
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

type ApprovalRouteContext = RouteContext<{ id: string }>;

export async function GET(_request: Request, context: ApprovalRouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    const approvalId = parsePositiveInteger(id, "id");

    if (isPrototypeMode()) {
      const store = await getPrototypeStore();
      return jsonData(store.getApproval(approvalId), prototypeMeta());
    }

    const response = await liveData(`/api/approvals/${approvalId}`, ApprovalSchema);
    return jsonData(response.data, response.meta);
  } catch (error) {
    return routeError(error);
  }
}
