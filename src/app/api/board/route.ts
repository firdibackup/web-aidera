import { BoardSchema, LIVE_DATA_SOURCE } from "@/lib/api/contracts";
import { emptyBoard } from "@/lib/api/adapters";
import { liveData } from "@/lib/api/live";
import { jsonData, prototypeMeta, routeError } from "@/lib/api/server";
import { isPrototypeMode } from "@/lib/bridge/env";
import { BridgeError } from "@/lib/bridge/json";
import { getPrototypeStore } from "@/lib/prototype/store";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    if (isPrototypeMode()) {
      const store = await getPrototypeStore();
      return jsonData(store.getBoard(), prototypeMeta());
    }

    try {
      const response = await liveData("/api/board", BoardSchema);
      return jsonData(response.data, response.meta);
    } catch (error) {
      // The deployed Bridge does not implement /api/board yet. Return an honest empty
      // board (all stages, no cards) so the Kanban screen renders instead of crashing.
      if (error instanceof BridgeError && error.status === 404) {
        return jsonData(BoardSchema.parse(emptyBoard()), { data_source: LIVE_DATA_SOURCE });
      }

      throw error;
    }
  } catch (error) {
    return routeError(error);
  }
}
