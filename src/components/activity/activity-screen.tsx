"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StateBlock } from "@/components/ui/state";
import type { Activity } from "@/lib/api/contracts";
import { formatInJakarta } from "@/lib/dates/jakarta";
import { activitiesQueryOptions } from "@/lib/query/options";

const eventLabel: Record<Activity["event_type"], string> = {
  task_created: "Task dibuat",
  run_queued: "Run masuk antrean",
  run_started: "Run dimulai",
  run_completed: "Run selesai",
  run_failed: "Run gagal",
  run_cancelled: "Run dibatalkan",
  artifact_saved: "Artifact disimpan",
  handoff: "Handoff",
  approval_requested: "Approval diminta",
  approval_decided: "Approval diputuskan",
  retry: "Percobaan ulang",
  stage_moved: "Tahap dipindahkan",
  instruction_version_changed: "Versi instruksi berubah",
};

const eventTone = (type: Activity["event_type"]) => {
  if (type === "run_failed") {
    return "danger" as const;
  }

  if (type === "approval_requested" || type === "retry") {
    return "warning" as const;
  }

  if (type === "run_completed" || type === "approval_decided") {
    return "success" as const;
  }

  return "neutral" as const;
};

export function ActivityScreen() {
  const activities = useQuery(activitiesQueryOptions(50));
  const items = activities.data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Aktivitas"
        snippet="Timeline kejadian nyata—bukan simulasi agent bekerja."
        meta={activities.data ? <Badge tone="neutral">{items.length} kejadian</Badge> : null}
      />

      {activities.isPending ? <Skeleton className="h-80 w-full" /> : null}

      {activities.isError ? (
        <StateBlock
          tone="danger"
          title="Aktivitas tidak dapat dimuat"
          description="Timeline gagal diambil dari BFF."
          action={
            <Button size="sm" variant="secondary" onClick={() => void activities.refetch()}>
              Coba lagi
            </Button>
          }
        />
      ) : null}

      {activities.data && items.length === 0 ? (
        <StateBlock
          title="Belum ada kejadian"
          description="Aktivitas akan muncul setelah Bridge mencatat event nyata."
        />
      ) : null}

      {items.length > 0 ? (
        <ol className="panel flex flex-col p-5">
          {items.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-col gap-1.5 border-b border-line py-3.5 first:pt-0 last:border-b-0 last:pb-0 md:flex-row md:items-start md:justify-between md:gap-4"
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <Badge tone={eventTone(entry.event_type)}>{eventLabel[entry.event_type]}</Badge>
                  <span className="tabular text-[0.75rem] text-ink-faint">
                    {entry.target_type} #{entry.target_id}
                  </span>
                </span>
                <span className="text-[0.8125rem] text-ink">{entry.message}</span>
                <span className="text-[0.75rem] text-ink-faint">{entry.actor}</span>
              </span>
              <time
                className="tabular shrink-0 text-[0.75rem] text-ink-faint"
                dateTime={entry.created_at}
              >
                {formatInJakarta(entry.created_at, "d MMM yyyy HH:mm")} WIB
              </time>
            </li>
          ))}
        </ol>
      ) : null}
    </>
  );
}
