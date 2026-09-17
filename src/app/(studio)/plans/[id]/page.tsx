import { notFound } from "next/navigation";

import { PlanDetailScreen } from "@/components/plans/plan-detail-screen";

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  return <PlanDetailScreen planId={Number(id)} />;
}
