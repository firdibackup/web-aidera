import { ContentDetailSchema } from "@/lib/api/contracts";
import { adaptContentDetail } from "@/lib/api/adapters";
import { liveAdapted } from "@/lib/api/live";
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

type ContentRouteContext = RouteContext<{ id: string }>;

export async function GET(_request: Request, context: ContentRouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    const contentId = parsePositiveInteger(id, "id");

    if (isPrototypeMode()) {
      const store = await getPrototypeStore();
      return jsonData(store.getContent(contentId), prototypeMeta());
    }

    const response = await liveAdapted(
      `/api/contents/${contentId}`,
      ContentDetailSchema,
      adaptContentDetail,
    );
    return jsonData(response.data, response.meta);
  } catch (error) {
    return routeError(error);
  }
}
