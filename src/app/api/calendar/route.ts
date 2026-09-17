import { CalendarDataSchema, CalendarQuerySchema } from "@/lib/api/contracts";
import { adaptCalendar } from "@/lib/api/adapters";
import { liveAdapted } from "@/lib/api/live";
import { jsonData, prototypeMeta, routeError } from "@/lib/api/server";
import { isPrototypeMode } from "@/lib/bridge/env";
import { getPrototypeStore } from "@/lib/prototype/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const query = CalendarQuerySchema.parse(Object.fromEntries(url.searchParams));

    if (isPrototypeMode()) {
      const store = await getPrototypeStore();
      return jsonData(store.getCalendar(query), prototypeMeta());
    }

    const params = new URLSearchParams({ view: query.view });

    if (query.start) {
      params.set("start", query.start);
    }

    if (query.end) {
      params.set("end", query.end);
    }

    const response = await liveAdapted("/api/calendar", CalendarDataSchema, adaptCalendar, {
      query: params,
    });
    return jsonData(response.data, response.meta);
  } catch (error) {
    return routeError(error);
  }
}
