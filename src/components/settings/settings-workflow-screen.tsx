"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StateBlock } from "@/components/ui/state";
import { stageLabels } from "@/components/ui/vocabulary";
import { workflowQueryOptions } from "@/lib/query/options";

export function SettingsWorkflowScreen() {
  const workflow = useQuery(workflowQueryOptions());

  if (workflow.isPending) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (workflow.isError || !workflow.data) {
    return (
      <StateBlock
        tone="danger"
        title="Workflow tidak dapat dimuat"
        description="Graf tahap gagal diambil dari BFF."
        action={
          <Button size="sm" variant="secondary" onClick={() => void workflow.refetch()}>
            Coba lagi
          </Button>
        }
      />
    );
  }

  const data = workflow.data.data;

  return (
    <>
      <PageHeader
        title="Workflow"
        snippet="Graf tahap, posisi gate, dan status automation."
        meta={
          <Badge tone={data.automation_enabled ? "info" : "neutral"}>
            Automation {data.automation_enabled ? "aktif" : "nonaktif"}
          </Badge>
        }
      />

      <ol className="flex flex-col gap-2">
        {data.stages.map((stage) => (
          <li
            key={stage.stage}
            className="panel flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between"
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[0.875rem] font-semibold text-ink">{stage.label}</span>
                {stage.gate ? (
                  <Badge tone="warning" icon={<ShieldCheck aria-hidden className="size-3" />}>
                    Gate {stage.gate}
                  </Badge>
                ) : null}
                {stage.agent ? <Badge tone="neutral">{stage.agent}</Badge> : null}
              </span>
              <span className="flex flex-wrap items-center gap-1.5 text-[0.75rem] text-ink-muted">
                <ArrowRight aria-hidden className="size-3" />
                {stage.next.map((next) => stageLabels[next]).join(" · ")}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}
