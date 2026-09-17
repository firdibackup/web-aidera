"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileStack } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { DiffView } from "@/components/ui/diff-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StateBlock } from "@/components/ui/state";
import {
  approvalBadgeLabel,
  approvalBadgeTone,
  approvalStatusLabel,
  approvalStatusTone,
  approvalTypeLabel,
  priorityTone,
  stageLabels,
} from "@/components/ui/vocabulary";
import type { Artifact, ContentDetail } from "@/lib/api/contracts";
import { formatInJakarta } from "@/lib/dates/jakarta";
import { artifactComparisonQueryOptions, contentQueryOptions } from "@/lib/query/options";
import { cn } from "@/lib/utils/cn";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "research", label: "Research" },
  { id: "copy", label: "Copy" },
  { id: "validation", label: "Validation" },
  { id: "growth", label: "Growth" },
  { id: "design_brief", label: "Design Brief" },
  { id: "qa", label: "QA" },
  { id: "files", label: "Files" },
  { id: "activity", label: "Activity" },
  { id: "performance", label: "Performance" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const tabArtifactType: Partial<Record<TabId, Artifact["type"]>> = {
  research: "research",
  copy: "draft",
  validation: "validation",
  growth: "growth",
  design_brief: "design_brief",
  qa: "qa",
};

export function ContentDetailScreen({ contentId }: { contentId: number }) {
  const content = useQuery(contentQueryOptions(contentId));
  const [tab, setTab] = useState<TabId>("overview");
  const [comparison, setComparison] = useState<{ base: number; other: number } | null>(null);

  if (content.isPending) {
    return (
      <>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-[26rem] w-full" />
      </>
    );
  }

  if (content.isError || !content.data) {
    return (
      <StateBlock
        tone="danger"
        title="Konten tidak dapat dimuat"
        description="Detail konten gagal diambil dari BFF."
        action={
          <Button size="sm" variant="secondary" onClick={() => void content.refetch()}>
            Coba lagi
          </Button>
        }
      />
    );
  }

  const detail = content.data.data;

  return (
    <>
      <PageHeader
        title={detail.title}
        snippet={detail.hook}
        meta={
          <>
            <Badge tone="neutral">{detail.code}</Badge>
            <Badge tone="neutral">{stageLabels[detail.stage]}</Badge>
            <Badge tone={priorityTone[detail.priority]}>{detail.priority}</Badge>
            <Badge tone={approvalBadgeTone[detail.approval]}>
              {approvalBadgeLabel[detail.approval]}
            </Badge>
            {detail.revision_requested ? <Badge tone="info">Revisi diminta</Badge> : null}
            {detail.blocker ? <Badge tone="danger">Blocked</Badge> : null}
          </>
        }
        actions={
          <Link
            href="/content"
            className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-control)] border border-line-strong px-3 text-[0.8125rem] font-medium text-ink hover:border-ink-faint pointer-coarse:min-h-11"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Kembali ke katalog
          </Link>
        }
      />

      <div className="scroll-x -mx-4 px-4 md:mx-0 md:px-0">
        <div role="tablist" aria-label="Tab konten" className="flex min-w-max gap-1 border-b border-line">
          {tabs.map((candidate) => {
            const selected = tab === candidate.id;

            return (
              <button
                key={candidate.id}
                type="button"
                role="tab"
                id={`tab-${candidate.id}`}
                aria-selected={selected}
                aria-controls={`panel-${candidate.id}`}
                onClick={() => setTab(candidate.id)}
                className={cn(
                  "min-h-10 whitespace-nowrap border-b-2 px-3 text-[0.8125rem] font-medium transition-colors duration-150 pointer-coarse:min-h-11",
                  selected
                    ? "border-brand text-brand-strong"
                    : "border-transparent text-ink-muted hover:text-ink",
                )}
              >
                {candidate.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="flex flex-col gap-4"
      >
        {tab === "overview" ? <OverviewPanel detail={detail} /> : null}
        {tab === "files" ? (
          <FilesPanel detail={detail} onCompare={(base, other) => setComparison({ base, other })} />
        ) : null}
        {tab === "activity" ? <ActivityPanel detail={detail} /> : null}
        {tab === "performance" ? <PerformancePanel detail={detail} /> : null}
        {tabArtifactType[tab] ? (
          <StageArtifactPanel detail={detail} type={tabArtifactType[tab]!} label={tab} />
        ) : null}
      </div>

      <ComparisonDrawer comparison={comparison} onClose={() => setComparison(null)} />
    </>
  );
}

function OverviewPanel({ detail }: { detail: ContentDetail }) {
  return (
    <>
      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-ink">Ringkasan</h2>
        <p className="mt-2 max-w-[70ch] text-[0.875rem] text-ink-muted">{detail.summary}</p>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Format" value={detail.format} />
          <Field label="Pillar" value={detail.pillar} />
          <Field label="Objective" value={detail.objective} />
          <Field label="CTA" value={detail.cta_concept} />
          <Field label="Owner" value={detail.owner ?? "Belum ditugaskan"} />
          <Field
            label="Jadwal"
            value={
              detail.scheduled_at
                ? `${formatInJakarta(detail.scheduled_at, "d MMM yyyy HH:mm")} WIB`
                : "Belum dijadwalkan"
            }
          />
          <Field label="Versi" value={String(detail.version)} />
          <Field label="Artifact" value={String(detail.artifact_count)} />
          <Field
            label="Diperbarui"
            value={`${formatInJakarta(detail.updated_at, "d MMM yyyy HH:mm")} WIB`}
          />
        </dl>
      </section>

      {detail.blocker ? (
        <StateBlock tone="danger" title="Konten tertahan" description={detail.blocker} />
      ) : null}

      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-ink">Approval terkait</h2>
        {detail.approvals.length === 0 ? (
          <p className="mt-2 text-[0.8125rem] text-ink-faint">
            Belum ada permintaan approval untuk konten ini.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {detail.approvals.map((approval) => (
              <li
                key={approval.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-line px-3 py-2.5"
              >
                <span className="flex flex-col">
                  <Link
                    href={`/approvals/${approval.id}`}
                    className="text-[0.8125rem] font-medium text-ink hover:text-brand-strong"
                  >
                    {approval.title}
                  </Link>
                  <span className="text-[0.75rem] text-ink-faint">
                    {approvalTypeLabel[approval.type]} · diajukan{" "}
                    {formatInJakarta(approval.requested_at, "d MMM HH:mm")} WIB
                  </span>
                </span>
                <Badge tone={approvalStatusTone[approval.status]}>
                  {approvalStatusLabel[approval.status]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-ink">Task tahap</h2>
        {detail.tasks.length === 0 ? (
          <p className="mt-2 text-[0.8125rem] text-ink-faint">
            Tidak ada task agent pada tahap ini.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {detail.tasks.map((task) => (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-line px-3 py-2.5"
              >
                <span className="flex flex-col">
                  <span className="text-[0.8125rem] font-medium text-ink">
                    {stageLabels[task.stage]} · {task.agent}
                  </span>
                  <span className="tabular text-[0.75rem] text-ink-faint">
                    Percobaan {task.attempts}/{task.max_attempts}
                  </span>
                </span>
                <Badge tone={task.status === "blocked" ? "danger" : "neutral"}>{task.status}</Badge>
                {task.error_summary ? (
                  <p className="w-full text-[0.75rem] text-danger">{task.error_summary}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function StageArtifactPanel({
  detail,
  type,
  label,
}: {
  detail: ContentDetail;
  type: Artifact["type"];
  label: string;
}) {
  const artifacts = detail.artifacts.filter((artifact) => artifact.type === type);

  if (artifacts.length === 0) {
    return (
      <StateBlock
        title="Belum ada artifact pada tahap ini"
        description={`Artifact ${label} akan muncul setelah agent terkait menyimpan hasil kerja nyata.`}
      />
    );
  }

  return (
    <>
      {artifacts.map((artifact) => (
        <article key={artifact.id} className="panel p-5">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink">{artifact.title}</h2>
            <Badge tone="neutral">v{artifact.version}</Badge>
          </header>
          <p className="mt-2 text-[0.8125rem] text-ink-muted">{artifact.summary}</p>
          <pre className="mt-3 overflow-x-auto rounded-[var(--radius-control)] border border-line bg-surface-sunken px-3 py-3 font-mono text-[0.75rem] leading-relaxed text-ink">
            {artifact.body}
          </pre>
        </article>
      ))}
    </>
  );
}

function FilesPanel({
  detail,
  onCompare,
}: {
  detail: ContentDetail;
  onCompare: (base: number, other: number) => void;
}) {
  if (detail.artifacts.length === 0) {
    return (
      <StateBlock
        title="Belum ada artifact"
        description="Artifact terversi akan muncul setelah agent menyimpan hasil kerja."
      />
    );
  }

  return (
    <section className="panel p-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Artifact terversi</h2>
        <Badge tone="neutral" icon={<FileStack aria-hidden className="size-3" />}>
          {detail.artifacts.length}
        </Badge>
      </header>

      <ul className="mt-3 flex flex-col gap-2">
        {detail.artifacts.map((artifact, index) => {
          const previous = detail.artifacts[index - 1];

          return (
            <li
              key={artifact.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-line px-3 py-2.5"
            >
              <span className="flex min-w-0 flex-col">
                <span className="text-[0.8125rem] font-medium text-ink">{artifact.title}</span>
                <span className="tabular truncate text-[0.75rem] text-ink-faint">
                  {artifact.path}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <Badge tone="neutral">v{artifact.version}</Badge>
                {previous ? (
                  <Button size="sm" variant="secondary" onClick={() => onCompare(previous.id, artifact.id)}>
                    Bandingkan
                  </Button>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>

      {detail.final_package_artifact_id === null ? (
        <p className="mt-3 text-[0.75rem] text-ink-faint">
          Paket final belum dirakit untuk konten ini.
        </p>
      ) : null}
    </section>
  );
}

function ActivityPanel({ detail }: { detail: ContentDetail }) {
  if (detail.activity.length === 0) {
    return (
      <StateBlock
        title="Belum ada aktivitas"
        description="Timeline hanya menampilkan kejadian nyata dari Bridge."
      />
    );
  }

  return (
    <ol className="panel flex flex-col p-5">
      {detail.activity.map((entry) => (
        <li key={entry.id} className="border-b border-line py-3 first:pt-0 last:border-b-0 last:pb-0">
          <p className="text-[0.8125rem] text-ink">{entry.message}</p>
          <p className="tabular mt-1 text-[0.75rem] text-ink-faint">
            {entry.actor} · {formatInJakarta(entry.created_at, "d MMM yyyy HH:mm")} WIB
          </p>
        </li>
      ))}
    </ol>
  );
}

function PerformancePanel({ detail }: { detail: ContentDetail }) {
  if (!detail.metrics) {
    return (
      <StateBlock
        title="Metrik belum tersedia"
        description="Angka performa hanya ditampilkan setelah dicatat melalui Bridge. Tidak ada metrik contoh."
      />
    );
  }

  const entries = [
    ["Views", detail.metrics.views],
    ["Reach", detail.metrics.reach],
    ["Likes", detail.metrics.likes],
    ["Comments", detail.metrics.comments],
    ["Shares", detail.metrics.shares],
    ["Saves", detail.metrics.saves],
    ["Follows", detail.metrics.follows],
  ] as const;

  return (
    <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {entries.map(([label, value]) => (
        <div key={label} className="panel p-4">
          <dt className="text-[0.75rem] text-ink-muted">{label}</dt>
          <dd className="tabular mt-1 text-xl font-semibold text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ComparisonDrawer({
  comparison,
  onClose,
}: {
  comparison: { base: number; other: number } | null;
  onClose: () => void;
}) {
  const query = useQuery({
    ...artifactComparisonQueryOptions(comparison?.base ?? 0, comparison?.other ?? 0),
    enabled: comparison !== null,
  });

  return (
    <Drawer
      open={comparison !== null}
      title="Perbandingan artifact"
      subtitle={query.data ? `${query.data.data.base.title} → ${query.data.data.other.title}` : undefined}
      onClose={onClose}
    >
      {query.isPending ? <Skeleton className="h-48 w-full" /> : null}
      {query.isError ? (
        <StateBlock
          tone="danger"
          title="Perbandingan gagal"
          description="Diff artifact tidak dapat dimuat."
        />
      ) : null}
      {query.data ? <DiffView lines={query.data.data.diff} label="Perbandingan artifact" /> : null}
    </Drawer>
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
