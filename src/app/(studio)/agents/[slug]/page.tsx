import { notFound } from "next/navigation";

import { AgentWorkspace } from "@/components/agents/agent-workspace";
import { AgentSlugSchema } from "@/lib/api/contracts";

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const parsed = AgentSlugSchema.safeParse(slug);

  if (!parsed.success) {
    notFound();
  }

  return <AgentWorkspace slug={parsed.data} />;
}
