"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StateBlock } from "@/components/ui/state";
import { settingsQueryOptions } from "@/lib/query/options";

export function SettingsAgentsScreen() {
  const settings = useQuery(settingsQueryOptions());

  if (settings.isPending) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (settings.isError || !settings.data) {
    return (
      <StateBlock
        tone="danger"
        title="Pengaturan agent tidak dapat dimuat"
        description="Konfigurasi model gagal diambil dari BFF."
        action={
          <Button size="sm" variant="secondary" onClick={() => void settings.refetch()}>
            Coba lagi
          </Button>
        }
      />
    );
  }

  const data = settings.data.data;

  return (
    <>
      <PageHeader
        title="Agents"
        snippet="Model aktif dan status tiap spesialis."
        meta={<Badge tone="neutral">{data.agent_models.length} agent</Badge>}
      />

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.agent_models.map((agent) => (
          <li key={agent.agent} className="panel flex flex-col gap-2 p-4">
            <span className="flex items-center justify-between gap-2">
              <span className="text-[0.9375rem] font-semibold text-ink">{agent.name}</span>
              <Badge tone={agent.enabled ? "success" : "neutral"}>
                {agent.enabled ? "Aktif" : "Nonaktif"}
              </Badge>
            </span>
            <span className="tabular text-[0.75rem] text-ink-muted">Model: {agent.model}</span>
            <Link
              href={`/agents/${agent.agent}`}
              className="mt-auto inline-flex min-h-9 items-center text-[0.8125rem] font-medium text-brand-strong hover:underline pointer-coarse:min-h-11"
            >
              Buka workspace
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
