import { z } from "zod";

import { MessageSchema, PaginationQuerySchema } from "@/lib/api/contracts";
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

type MessagesRouteContext = RouteContext<{ id: string }>;

export async function GET(
  request: Request,
  context: MessagesRouteContext,
): Promise<Response> {
  try {
    const { id } = await context.params;
    const threadId = parsePositiveInteger(id, "id");
    const url = new URL(request.url);
    const query = PaginationQuerySchema.parse(Object.fromEntries(url.searchParams));

    if (isPrototypeMode()) {
      const store = await getPrototypeStore();
      const data = store.listMessages(threadId, query.limit, query.offset);
      return jsonData(
        data,
        prototypeMeta({ total: store.countMessages(threadId), limit: query.limit, offset: query.offset }),
      );
    }

    const params = new URLSearchParams({
      limit: String(query.limit),
      offset: String(query.offset),
    });
    const response = await liveData(`/api/threads/${threadId}/messages`, z.array(MessageSchema), {
      query: params,
    });
    return jsonData(response.data, response.meta);
  } catch (error) {
    return routeError(error);
  }
}
