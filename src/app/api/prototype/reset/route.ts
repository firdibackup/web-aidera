import { jsonData, prototypeMeta, routeError } from "@/lib/api/server";
import { isPrototypeMode } from "@/lib/bridge/env";
import { resetPrototypeStore } from "@/lib/prototype/store";

export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
  try {
    if (!isPrototypeMode()) {
      return Response.json(
        {
          error: {
            code: "not_available",
            message: "Prototype reset is available only in prototype mode",
            details: {},
          },
        },
        { status: 404 },
      );
    }

    await resetPrototypeStore();
    return jsonData({ reset: true }, prototypeMeta());
  } catch (error) {
    return routeError(error);
  }
}
