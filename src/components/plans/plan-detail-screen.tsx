"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StateBlock } from "@/components/ui/state";
import type { Plan, PlanItem } from "@/lib/api/contracts";
import { formatInJakarta } from "@/lib/dates/jakarta";
import { approvePlanMutationOptions, plansQueryOptions } from "@/lib/query/options";

const itemStatusTone: Record<PlanItem["approval_status"], BadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  revision_requested: "info",
};

const itemStatusLabel: Record<PlanItem["approval_status"], string> = {
  pending: "Menunggu ACC",
  approved: "Disetujui",
  rejected: "Ditolak",
  revision_requested: "Revisi",
};

const planStatusTone: Record<Plan["status"], BadgeTone> = {
  draft: "neutral",
  pending_approval: "warning",
  partially_approved: "info",
  approved: "success",
  rejected: "danger",
  archived: "neutral",
};

export function PlanDetailScreen({ planId }: { planId: number }) {
  const queryClient = useQueryClient();
  const plans = useQuery(plansQueryOptions());
  const approve = useMutation(approvePlanMutationOptions(queryClient));
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  if (plans.isPending) {
    return (
      <>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  if (plans.isError) {
    return (
      <StateBlock
        tone="danger"
        title="Plan tidak dapat dimuat"
        description="Data rencana gagal diambil dari BFF."
        action={
          <Button size="sm" variant="secondary" onClick={() => void plans.refetch()}>
            Coba lagi
          </Button>
        }
      />
    );
  }

  const plan = plans.data?.data.find((candidate) => candidate.id === planId);

  if (!plan) {
    return (
      <StateBlock
        title="Rencana tidak ditemukan"
        description="Plan dengan ID tersebut tidak tersedia."
        action={
          <Link
            href="/plans"
            className="inline-flex min-h-10 items-center rounded-[var(--radius-control)] border border-line-strong px-3 text-[0.8125rem] font-medium text-ink"
          >
            Kembali ke daftar
          </Link>
        }
      />
    );
  }

  const pendingItems = plan.items.filter((item) => item.approval_status === "pending");

  const submit = (itemIds?: number[]) => {
    approve.mutate(
      { id: plan.id, input: itemIds && itemIds.length > 0 ? { item_ids: itemIds } : {} },
      {
        onSuccess: () => {
          setSelectedIds([]);
          toast.success("Approval tersimpan", {
            description: itemIds?.length
              ? `${itemIds.length} item disetujui.`
              : "Seluruh item rencana disetujui.",
          });
        },
        onError: () =>
          toast.error("Approval gagal", {
            description: "Server menolak permintaan. Status item tidak berubah.",
          }),
      },
    );
  };

  return (
    <>
      <PageHeader
        title={`Rencana ${plan.cadence === "weekly" ? "mingguan" : "bulanan"}`}
        snippet={plan.goal}
        meta={
          <>
            <Badge tone={planStatusTone[plan.status]}>{plan.status.replaceAll("_", " ")}</Badge>
            <Badge tone="neutral">
              {formatInJakarta(`${plan.period_start}T00:00:00+07:00`, "d MMM")} –{" "}
              {formatInJakarta(`${plan.period_end}T00:00:00+07:00`, "d MMM yyyy")}
            </Badge>
            <Badge tone="neutral">{plan.items.length} item</Badge>
          </>
        }
        actions={
          <Link
            href="/plans"
            className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-control)] border border-line-strong px-3 text-[0.8125rem] font-medium text-ink hover:border-ink-faint pointer-coarse:min-h-11"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Kembali
          </Link>
        }
      />

      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-ink">Konteks rencana</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Target audience" value={plan.target_audience} />
          <Field label="Frekuensi" value={plan.frequency} />
          <Field label="Pillars" value={plan.content_pillars.join(", ")} />
          <Field label="Referensi" value={plan.references.join(", ") || "Tidak ada"} />
          <Field label="Performa sebelumnya" value={plan.previous_performance ?? "Tidak ada"} />
          <Field label="Catatan" value={plan.notes ?? "Tidak ada"} />
        </dl>
      </section>

      <section className="panel p-5">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Item rencana</h2>
          <span className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={selectedIds.length === 0 || approve.isPending}
              onClick={() => submit(selectedIds)}
            >
              Setujui terpilih ({selectedIds.length})
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={pendingItems.length === 0 || approve.isPending}
              onClick={() => submit()}
            >
              Setujui semua
            </Button>
          </span>
        </header>

        <ul className="mt-3 flex flex-col gap-2">
          {plan.items.map((item) => {
            const checked = selectedIds.includes(item.id);

            return (
              <li key={item.id} className="rounded-[var(--radius-control)] border border-line p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={item.approval_status !== "pending"}
                    onChange={() =>
                      setSelectedIds((current) =>
                        current.includes(item.id)
                          ? current.filter((value) => value !== item.id)
                          : [...current, item.id],
                      )
                    }
                    aria-label={`Pilih ${item.title}`}
                    className="mt-1 size-4 accent-[var(--color-brand)]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-[0.875rem] font-semibold text-ink">{item.title}</h3>
                      <Badge tone={itemStatusTone[item.approval_status]}>
                        {itemStatusLabel[item.approval_status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[0.8125rem] text-ink-muted">{item.hook}</p>
                    <p className="mt-1 text-[0.8125rem] text-ink-muted">{item.summary}</p>
                    <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.75rem] text-ink-faint">
                      <span>Format: {item.format}</span>
                      <span>Pillar: {item.pillar}</span>
                      <span>Objective: {item.objective}</span>
                      <span>
                        Rencana: {formatInJakarta(`${item.planned_date}T00:00:00+07:00`, "d MMM yyyy")}
                      </span>
                    </dl>
                    <p className="mt-1 text-[0.75rem] text-ink-faint">CTA: {item.cta_concept}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.75rem] text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-[0.8125rem] font-medium text-ink">{value}</dd>
    </div>
  );
}
