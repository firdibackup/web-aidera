import { SettingsSchema, UpdateSettingsInputSchema } from "@/lib/api/contracts";
import { liveData } from "@/lib/api/live";
import {
  getIdempotencyKey,
  jsonData,
  parseJson,
  prototypeMeta,
  routeError,
} from "@/lib/api/server";
import { isPrototypeMode } from "@/lib/bridge/env";
import { getPrototypeStore } from "@/lib/prototype/store";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    if (isPrototypeMode()) {
      const store = await getPrototypeStore();
      return jsonData(store.getSettings(), prototypeMeta());
    }

    const response = await liveData("/api/settings", SettingsSchema);
    return jsonData(response.data, response.meta);
  } catch (error) {
    return routeError(error);
  }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const input = await parseJson(request, UpdateSettingsInputSchema);
    const idempotencyKey = getIdempotencyKey(request);

    if (isPrototypeMode()) {
      const store = await getPrototypeStore();
      return jsonData(store.updateSettings(input), prototypeMeta());
    }

    const response = await liveData("/api/settings", SettingsSchema, {
      method: "PUT",
      body: input,
      idempotencyKey,
    });
    return jsonData(response.data, response.meta);
  } catch (error) {
    return routeError(error);
  }
}
