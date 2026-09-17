import { ContentCardSchema, ScheduleContentInputSchema } from "@/lib/api/contracts";
import { liveData } from "@/lib/api/live";
import {
  getIdempotencyKey,
  jsonData,
  parseJson,
  parsePositiveInteger,
  prototypeMeta,
  routeError,
  type RouteContext,
} from "@/lib/api/server";
import { isPrototypeMode } from "@/lib/bridge/env";
import { getPrototypeStore } from "@/lib/prototype/store";

export const dynamic = "force-dynamic";

type ScheduleRouteContext = RouteContext<{ id: string }>;

export async function POST(
  request: Request,
  context: ScheduleRouteContext,
): Promise<Response> {
  try {
    const { id } = await context.params;
    const contentId = parsePositiveInteger(id, "id");
    const input = await parseJson(request, ScheduleContentInputSchema);
    const idempotencyKey = getIdempotencyKey(request);

    if (isPrototypeMode()) {
      const store = await getPrototypeStore();
      const data = store.scheduleContent(contentId, input, idempotencyKey);
      return jsonData(data, prototypeMeta());
    }

    const response = await liveData(`/api/contents/${contentId}/schedule`, ContentCardSchema, {
      method: "POST",
      body: input,
      idempotencyKey,
    });
    return jsonData(response.data, response.meta);
  } catch (error) {
    return routeError(error);
  }
}
