import { RunSummarySchema, StartRunInputSchema } from "@/lib/api/contracts";
import { liveData } from "@/lib/api/live";
import {
  getIdempotencyKey,
  jsonData,
  parseJson,
  routeError,
} from "@/lib/api/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const input = await parseJson(request, StartRunInputSchema);
    const idempotencyKey = getIdempotencyKey(request);

    const response = await liveData("/api/runs", RunSummarySchema, {
      method: "POST",
      body: input,
      idempotencyKey,
    });
    return jsonData(response.data, response.meta, 202);
  } catch (error) {
    return routeError(error);
  }
}
