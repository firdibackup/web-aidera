import { AgentSchema, AgentSlugSchema } from "@/lib/api/contracts";
import { adaptAgent } from "@/lib/api/adapters";
import { liveAdapted } from "@/lib/api/live";
import { jsonData, prototypeMeta, routeError, type RouteContext } from "@/lib/api/server";
import { isPrototypeMode } from "@/lib/bridge/env";
import { getPrototypeStore } from "@/lib/prototype/store";

export const dynamic = "force-dynamic";

type AgentRouteContext = RouteContext<{ slug: string }>;

export async function GET(
  _request: Request,
  context: AgentRouteContext,
): Promise<Response> {
  try {
    const { slug } = await context.params;
    const agentSlug = AgentSlugSchema.parse(slug);

    if (isPrototypeMode()) {
      const store = await getPrototypeStore();
      return jsonData(store.getAgent(agentSlug), prototypeMeta());
    }

    const response = await liveAdapted(`/api/agents/${agentSlug}`, AgentSchema, adaptAgent);
    return jsonData(response.data, response.meta);
  } catch (error) {
    return routeError(error);
  }
}
