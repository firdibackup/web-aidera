import { notFound } from "next/navigation";

import { ContentDetailScreen } from "@/components/content/content-detail-screen";

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  return <ContentDetailScreen contentId={Number(id)} />;
}
