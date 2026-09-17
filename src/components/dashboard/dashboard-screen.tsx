"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CircleDot,
  RefreshCw,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StateBlock } from "@/components/ui/state";
import { ConnectionIndicator } from "@/components/shell/navigation";
import type { Activity, Dashboard } from "@/lib/api/contracts";
import { formatInJakarta } from "@/lib/dates/jakarta";
import { activitiesQueryOptions, dashboardQueryOptions } from "@/lib/query/options";

const decisionLabels: Record<Dashboard["needs_decision"][number]["type"], string> = {
  plan: "Plan",
  copy: "Copy",
  final: "Final package",
  instruction: "Instruction",
};

const quickActions: { href: Route; label: string }[] = [
  { href: "/agents/ceo" as Route, label: "Chat CEO" },
  { href: "/content", label: "Buat Konten" },
  { href: "/plans", label: "Weekly Plan" },
  { href: "/approvals", label: "Buka Approval" },
];

export function DashboardScreen() {
  const dashboard = useQuery(dashboardQueryOptions());
  const activities = useQuery(activitiesQueryOptions(8));

  return (
    <>
      <PageHeader
        title="Ikhtisar"
        snippet="Apa yang bergerak, apa yang tertahan, dan apa yang membutuhkan keputusanmu."
        meta={<ConnectionIndicator />}
        actions={quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 hover:border-ink-faint pointer-coarse:min-h-11"
          >
            {action.label}
          </Link>
        ))}
      />

      {dashboard.isPending ? <DashboardSkeleton /> : null}

      {dashboard.isError ? (
        <StateBlock
          tone="danger"
          title="Ikhtisar tidak dapat dimuat"
          description="Permintaan ke BFF gagal. Periksa koneksi lalu coba lagi."
          action={
            <Button size="sm" variant="secondary" onClick={() => void dashboard.refetch()}>
              <RefreshCw aria-hidden className="size-4" />
              Coba lagi
            </Button>
          }
        />
      ) : null}

      {dashboard.data ? <DashboardContent data={dashboard.data.data} /> : null}

      <section aria-labelledby="activity-heading" className="panel p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="activity-heading" className="text-sm font-semibold text-ink">
            Aktivitas terbaru
          </h2>
          <span className="text-[0.6875rem] text-ink-faint">Hanya kejadian nyata</span>
        </div>
        {activities.isPending ? (
          <div className="mt-4 flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-4/5" />
          </div>
        ) : null}
        {activities.isError ? (
          <StateBlock
            className="mt-4"
            tone="danger"
            title="Aktivitas gagal dimuat"
            description="Timeline tidak dapat ditampilkan saat ini."
            action={
              <Button size="sm" variant="secondary" onClick={() => void activities.refetch()}>
                Muat ulang
              </Button>
            }
          />
        ) : null}
        {activities.data ? <ActivityList items={activities.data.data} /> : null}
      </section>
    </>
  );
}

function DashboardContent({ data }: { data: Dashboard }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-5">
        <section aria-labelledby="decisions-heading" className="panel p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="decisions-heading" className="text-sm font-semibold text-ink">
              Butuh keputusan
            </h2>
            <span className="tabular text-2xl font-semibold text-ink">
              {data.needs_decision.length}
            </span>
          </div>

          {data.needs_decision.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              Tidak ada approval tertahan. Pipeline dapat berjalan sampai gate berikutnya.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col divide-y divide-line">
              {data.needs_decision.map((item) => (
                <li key={`${item.type}-${item.id}`} className="flex flex-col gap-1.5 py-3 first:pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="warning">{decisionLabels[item.type]}</Badge>
                    <Link
                      href={`/approvals/${item.id}` as Route}
                      className="text-sm font-medium text-ink hover:text-brand-strong"
                    >
                      {item.title}
                    </Link>
                  </div>
                  <p className="text-[0.8125rem] text-ink-muted">{item.reason}</p>
                  <time className="text-[0.6875rem] text-ink-faint" dateTime={item.requested_at}>
                    Diminta {formatInJakarta(item.requested_at, "d MMM yyyy HH:mm")} WIB
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="upcoming-heading" className="panel p-5">
          <h2 id="upcoming-heading" className="text-sm font-semibold text-ink">
            Terjadwal 7 hari
          </h2>
          {data.upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              Belum ada konten terjadwal. Atur tanggal dari kalender.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2.5">
              {data.upcoming.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] bg-surface-sunken px-3 py-2.5"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-ink">{item.title}</span>
                    <span className="tabular text-[0.6875rem] text-ink-faint">{item.code}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {item.ready ? (
                      <Badge tone="success">Siap</Badge>
                    ) : (
                      <Badge tone="warning">Belum siap</Badge>
                    )}
                    <time
                      dateTime={item.scheduled_at}
                      className="tabular text-[0.75rem] text-ink-muted"
                    >
                      {formatInJakarta(item.scheduled_at, "d MMM HH:mm")}
                    </time>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="flex flex-col gap-5">
        <section aria-labelledby="pipeline-heading" className="panel p-5">
          <h2 id="pipeline-heading" className="text-sm font-semibold text-ink">
            Kesehatan pipeline
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <HealthStat label="Queued" value={data.pipeline_health.queued} />
            <HealthStat label="Working" value={data.pipeline_health.working} tone="info" />
            <HealthStat label="Failed" value={data.pipeline_health.failed} tone="danger" />
            <HealthStat label="Blocked" value={data.pipeline_health.blocked} tone="warning" />
          </dl>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4 text-[0.75rem] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock aria-hidden className="size-3.5" />
              Overdue {data.overdue_count}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle aria-hidden className="size-3.5" />
              Belum siap {data.not_ready_count}
            </span>
          </div>
        </section>

        <section aria-labelledby="agents-heading" className="panel p-5">
          <h2 id="agents-heading" className="text-sm font-semibold text-ink">
            Agent bekerja
          </h2>
          {data.active_agents.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              Tidak ada run aktif. Status hanya muncul dari event Bridge.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2.5">
              {data.active_agents.map((agent) => (
                <li key={agent.run_id} className="flex items-center justify-between gap-3">
                  <Link
                    href={`/agents/${agent.slug}` as Route}
                    className="group flex items-center gap-2 text-sm font-medium text-ink"
                  >
                    <CircleDot aria-hidden className="size-3.5 text-info" />
                    {agent.name}
                    <ArrowUpRight
                      aria-hidden
                      className="size-3.5 text-ink-faint transition-transform duration-150 group-hover:-translate-y-0.5"
                    />
                  </Link>
                  <time className="tabular text-[0.6875rem] text-ink-faint" dateTime={agent.started_at}>
                    {formatInJakarta(agent.started_at, "HH:mm")}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="rollup-heading" className="panel p-5">
          <h2 id="rollup-heading" className="text-sm font-semibold text-ink">
            Rollup biaya
          </h2>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <RollupRow label="Token" value={data.rollup.token_estimate?.toLocaleString("id-ID")} />
            <RollupRow
              label="Biaya"
              value={
                data.rollup.cost_estimate_usd === null
                  ? undefined
                  : `$${data.rollup.cost_estimate_usd.toFixed(2)}`
              }
            />
            <RollupRow
              label="Durasi"
              value={
                data.rollup.duration_seconds === null
                  ? undefined
                  : `${Math.round(data.rollup.duration_seconds / 60)} menit`
              }
            />
          </dl>
        </section>
      </div>
    </div>
  );
}

function HealthStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "info" | "danger" | "warning";
}) {
  const toneClass =
    tone === "danger"
      ? "text-danger"
      : tone === "warning"
        ? "text-prototype"
        : tone === "info"
          ? "text-info"
          : "text-ink";

  return (
    <div className="rounded-[var(--radius-control)] bg-surface-sunken px-3 py-2.5">
      <dt className="text-[0.6875rem] font-medium text-ink-muted">{label}</dt>
      <dd className={`tabular mt-0.5 text-xl font-semibold ${toneClass}`}>{value}</dd>
    </div>
  );
}

function RollupRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="tabular font-medium text-ink">{value ?? "Tidak tersedia"}</dd>
    </div>
  );
}

function ActivityList({ items }: { items: Activity[] }) {
  if (items.length === 0) {
    return (
      <p className="mt-3 text-sm text-ink-muted">
        Belum ada aktivitas tercatat.
      </p>
    );
  }

  return (
    <ol className="mt-4 flex flex-col divide-y divide-line">
      {items.map((activity) => (
        <li key={activity.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5 first:pt-0">
          <time className="tabular text-[0.6875rem] text-ink-faint" dateTime={activity.created_at}>
            {formatInJakarta(activity.created_at, "d MMM HH:mm")}
          </time>
          <span className="text-[0.8125rem] text-ink">{activity.message}</span>
          <span className="text-[0.6875rem] text-ink-faint">{activity.actor}</span>
        </li>
      ))}
    </ol>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-5">
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-44 w-full" />
      </div>
      <div className="flex flex-col gap-5">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    </div>
  );
}
