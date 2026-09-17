"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StateBlock } from "@/components/ui/state";
import type { AgentStatus } from "@/lib/api/contracts";
import { formatInJakarta } from "@/lib/dates/jakarta";
import { agentsQueryOptions } from "@/lib/query/options";

export const agentStatusTone: Record<AgentStatus, BadgeTone> = {
  idle: "neutral",
  working: "info",
  offline: "warning",
  disabled: "danger",
};

export const agentStatusLabel: Record<AgentStatus, string> = {
  idle: "Siap",
  working: "Bekerja",
  offline: "Offline",
  disabled: "Nonaktif",
};

export function AgentsScreen() {
  const agents = useQuery(agentsQueryOptions());

  return (
    <>
      <PageHeader
        title="Agents"
        snippet="Hubungi spesialis yang tepat tanpa menjalankan seluruh pipeline."
      />

      {agents.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>
      ) : null}

      {agents.isError ? (
        <StateBlock
          tone="danger"
          title="Daftar agent tidak tersedia"
          description="Permintaan agent gagal diproses oleh BFF."
          action={
            <Button size="sm" variant="secondary" onClick={() => void agents.refetch()}>
              Coba lagi
            </Button>
          }
        />
      ) : null}

      {agents.data ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {agents.data.data.map((agent) => (
            <li key={agent.slug}>
              <Link
                href={`/agents/${agent.slug}` as Route}
                className="group flex h-full flex-col gap-3 rounded-[var(--radius-panel)] border border-line bg-surface p-5 transition-colors duration-150 ease-[var(--ease-out-quint)] hover:border-brand/45"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-1.5 text-base font-semibold text-ink">
                      {agent.name}
                      <ArrowUpRight
                        aria-hidden
                        className="size-4 text-ink-faint transition-transform duration-150 group-hover:-translate-y-0.5"
                      />
                    </h2>
                    <p className="mt-1 max-w-[34ch] text-[0.8125rem] text-ink-muted">{agent.role}</p>
                  </div>
                  <Badge tone={agentStatusTone[agent.status]}>
                    {agentStatusLabel[agent.status]}
                  </Badge>
                </div>

                <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-line pt-3 text-[0.6875rem]">
                  <div>
                    <dt className="text-ink-faint">Run aktif</dt>
                    <dd className="tabular text-sm font-semibold text-ink">
                      {agent.counts.active_runs}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-faint">Task</dt>
                    <dd className="tabular text-sm font-semibold text-ink">
                      {agent.counts.pending_tasks}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-faint">Selesai</dt>
                    <dd className="tabular text-sm font-semibold text-ink">
                      {agent.counts.completed_runs}
                    </dd>
                  </div>
                </dl>

                <p className="text-[0.6875rem] text-ink-faint">
                  {agent.last_activity
                    ? `Aktivitas ${formatInJakarta(agent.last_activity, "d MMM HH:mm")}`
                    : "Belum ada aktivitas"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
