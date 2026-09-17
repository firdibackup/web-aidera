import { notFound } from "next/navigation";

import { ApprovalDetailScreen } from "@/components/approvals/approval-detail-screen";

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  return <ApprovalDetailScreen approvalId={Number(id)} />;
}
