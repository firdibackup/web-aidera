import { InstructionDecisionInputSchema, InstructionSchema } from "@/lib/api/contracts";
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

type InstructionRouteContext = RouteContext<{ id: string }>;

export async function POST(request: Request, context: InstructionRouteContext): Promise<Response> {
  try {
    const { id } = await context.params;
    const instructionId = parsePositiveInteger(id, "id");
    const input = await parseJson(request, InstructionDecisionInputSchema);
    const idempotencyKey = getIdempotencyKey(request);

    if (isPrototypeMode()) {
      const store = await getPrototypeStore();
      const data = store.decideInstruction(instructionId, "approve", input, idempotencyKey);
      return jsonData(data, prototypeMeta());
    }

    const response = await liveData(`/api/instructions/${instructionId}/approve`, InstructionSchema, {
      method: "POST",
      body: input,
      idempotencyKey,
    });
    return jsonData(response.data, response.meta);
  } catch (error) {
    return routeError(error);
  }
}
