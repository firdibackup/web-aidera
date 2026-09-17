"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StateBlock } from "@/components/ui/state";
import type { Plan, PlanCadence, PlanItem } from "@/lib/api/contracts";
import { formatInJakarta } from "@/lib/dates/jakarta";
import { approvePlanMutationOptions, plansQueryOptions } from "@/lib/query/options";
import { cn } from "@/lib/utils/cn";

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

type PlanTab = PlanCadence | "archived";

const planTabs: { id: PlanTab; label: string }[] = [
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "archived", label: "Archived" },
];

export function PlansScreen() {
  const queryClient = useQueryClient();
  const plans = useQuery(plansQueryOptions());
  const approve = useMutation(approvePlanMutationOptions(queryClient));
  const [tab, setTab] = useState<PlanTab>("weekly");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [reviewPlan, setReviewPlan] = useState<Plan | null>(null);

  const allPlans = plans.data?.data ?? [];
  const visiblePlans = allPlans.filter((plan) =>
    tab === "archived" ? plan.status === "archived" : plan.cadence === tab && plan.status !== "archived",
  );

  const toggleItem = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  };

  const submitApproval = (plan: Plan, itemIds?: number[]) => {
    approve.mutate(
      { id: plan.id, input: itemIds && itemIds.length > 0 ? { item_ids: itemIds } : {} },
      {
        onSuccess: () => {
          toast.success("Approval tersimpan", {
            description: itemIds?.length
              ? `${itemIds.length} item disetujui.`
              : "Seluruh item plan disetujui.",
          });
          setSelectedIds([]);
          setReviewPlan(null);
        },
        onError: () => {
          toast.error("Approval gagal", {
            description: "Keputusan tidak diterapkan. Status tetap menunggu.",
          });
        },
      },
    );
  };

  return (
    <>
      <PageHeader
        title="CEO Plans"
        snippet="Rencana adalah proposal. Produksi dimulai setelah kamu menyetujuinya."
      />

      <div role="tablist" aria-label="Kategori plan" className="flex gap-1 self-start rounded-[var(--radius-control)] bg-surface-sunken p-1">
        {planTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "min-h-10 rounded-[9px] px-4 text-[0.8125rem] font-medium transition-colors pointer-coarse:min-h-11",
              tab === item.id ? "bg-surface text-ink shadow-sm" : "text-ink-muted",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {plans.isPending ? <Skeleton className="h-64 w-full" /> : null}

      {plans.isError ? (
        <StateBlock
          tone="danger"
          title="Plans tidak dapat dimuat"
          description="Daftar rencana gagal diambil dari BFF."
          action={
            <Button size="sm" variant="secondary" onClick={() => void plans.refetch()}>
              Coba lagi
            </Button>
          }
        />
      ) : null}

      {plans.data && visiblePlans.length === 0 ? (
        <StateBlock
          title="Belum ada rencana di tab ini"
          description="Minta CEO menyusun proposal mingguan, lalu setujui item yang ingin diproduksi."
        />
      ) : null}

      <div className="flex flex-col gap-5">
        {visiblePlans.map((plan) => {
          const pendingItems = plan.items.filter((item) => item.approval_status === "pending");
          const selectedForPlan = selectedIds.filter((id) =>
            plan.items.some((item) => item.id === id),
          );

          return (
            <section key={plan.id} className="panel p-5">
              <header className="flex flex-col gap-3 border-b border-line pb-4 md:flex-row md:items-start md:justify-between">
                <div className="max-w-[60ch]">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-ink">{plan.goal}</h2>
                    <Badge tone={planStatusTone[plan.status]}>{plan.status}</Badge>
                  </div>
                  <p className="mt-1.5 text-[0.8125rem] text-ink-muted">
                    {formatInJakarta(`${plan.period_start}T00:00:00+07:00`, "d MMM")} –{" "}
                    {formatInJakarta(`${plan.period_end}T00:00:00+07:00`, "d MMM yyyy")} ·{" "}
                    {plan.frequency}
                  </p>
                  <p className="mt-1 text-[0.8125rem] text-ink-muted">{plan.target_audience}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {plan.content_pillars.map((pillar) => (
                      <Badge key={pillar} tone="neutral">
                        {pillar}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setReviewPlan(plan)}>
                    Detail
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={approve.isPending || selectedForPlan.length === 0}
                    onClick={() => submitApproval(plan, selectedForPlan)}
                  >
                    Setujui terpilih ({selectedForPlan.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={approve.isPending || pendingItems.length === 0}
                    onClick={() => submitApproval(plan)}
                  >
                    Setujui semua
                  </Button>
                </div>
              </header>

              <ul className="mt-4 flex flex-col gap-2.5">
                {plan.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-2 rounded-[var(--radius-control)] border border-line px-4 py-3 md:flex-row md:items-start md:justify-between"
                  >
                    <label className="flex min-w-0 items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        disabled={item.approval_status !== "pending"}
                        onChange={() => toggleItem(item.id)}
                        className="mt-1 size-4 accent-[oklch(66%_0.19_44)]"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">{item.title}</span>
                        <span className="mt-0.5 block text-[0.8125rem] text-ink-muted">
                          {item.hook}
                        </span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Badge tone="neutral">{item.format}</Badge>
                          <Badge tone="neutral">{item.pillar}</Badge>
                          <time className="tabular text-[0.6875rem] text-ink-faint" dateTime={item.planned_date}>
                            {formatInJakarta(`${item.planned_date}T00:00:00+07:00`, "d MMM yyyy")}
                          </time>
                        </span>
                      </span>
                    </label>
                    <Badge tone={itemStatusTone[item.approval_status]}>
                      {itemStatusLabel[item.approval_status]}
                    </Badge>
                  </li>
                ))}
              </ul>

              {approve.isPending ? (
                <p className="mt-3 text-[0.75rem] text-ink-muted">
                  Menunggu konfirmasi server sebelum status berubah…
                </p>
              ) : null}
            </section>
          );
        })}
      </div>

      <Drawer
        open={reviewPlan !== null}
        title={reviewPlan?.goal ?? "Detail plan"}
        subtitle="Ringkasan proposal CEO"
        onClose={() => setReviewPlan(null)}
      >
        {reviewPlan ? (
          <dl className="flex flex-col gap-3 text-[0.8125rem]">
            <div>
              <dt className="text-ink-muted">Audience</dt>
              <dd className="mt-0.5 text-ink">{reviewPlan.target_audience}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Frekuensi</dt>
              <dd className="mt-0.5 text-ink">{reviewPlan.frequency}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Referensi</dt>
              <dd className="mt-0.5 flex flex-col gap-1 text-ink">
                {reviewPlan.references.map((reference) => (
                  <span key={reference}>{reference}</span>
                ))}
              </dd>
            </div>
            {reviewPlan.previous_performance ? (
              <div>
                <dt className="text-ink-muted">Performa sebelumnya</dt>
                <dd className="mt-0.5 text-ink">{reviewPlan.previous_performance}</dd>
              </div>
            ) : null}
            {reviewPlan.notes ? (
              <div>
                <dt className="text-ink-muted">Catatan</dt>
                <dd className="mt-0.5 text-ink">{reviewPlan.notes}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </Drawer>
    </>
  );
}
