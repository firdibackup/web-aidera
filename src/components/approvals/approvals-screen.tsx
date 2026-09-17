"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StateBlock } from "@/components/ui/state";
import {
  approvalStatusLabel,
  approvalStatusTone,
  approvalTypeLabel,
} from "@/components/ui/vocabulary";
import type { ApprovalStatus, ApprovalType } from "@/lib/api/contracts";
import { formatInJakarta } from "@/lib/dates/jakarta";
import { approvalsQueryOptions } from "@/lib/query/options";
import { cn } from "@/lib/utils/cn";

const typeFilters: Array<{ value: ApprovalType | ""; label: string }> = [
  { value: "", label: "Semua" },
  { value: "plan", label: "Rencana" },
  { value: "copy", label: "Copy" },
  { value: "final", label: "Paket final" },
  { value: "instruction", label: "Instruksi" },
];

const statusFilters: Array<{ value: ApprovalStatus | ""; label: string }> = [
  { value: "pending", label: "Menunggu" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
  { value: "", label: "Semua status" },
];

export function ApprovalsScreen() {
  const [type, setType] = useState<ApprovalType | "">("");
  const [status, setStatus] = useState<ApprovalStatus | "">("pending");

  const approvals = useQuery(
    approvalsQueryOptions({
      type: type === "" ? undefined : type,
      status: status === "" ? undefined : status,
    }),
  );
  const items = approvals.data?.data ?? [];
  const pendingCount = items.filter((item) => item.status === "pending").length;

  return (
    <>
      <PageHeader
        title="Approvals"
        snippet="Tidak ada keputusan strategis yang dilewati otomatis."
        meta={
          approvals.data ? (
            <Badge tone={pendingCount > 0 ? "warning" : "neutral"}>
              {pendingCount} menunggu keputusan
            </Badge>
          ) : null
        }
      />

      <div className="flex flex-col gap-3">
        <FilterRow
          label="Jenis"
          options={typeFilters}
          value={type}
          onChange={(value) => setType(value as ApprovalType | "")}
        />
        <FilterRow
          label="Status"
          options={statusFilters}
          value={status}
          onChange={(value) => setStatus(value as ApprovalStatus | "")}
        />
      </div>

      {approvals.isPending ? <Skeleton className="h-64 w-full" /> : null}

      {approvals.isError ? (
        <StateBlock
          tone="danger"
          title="Approval tidak dapat dimuat"
          description="Daftar keputusan gagal diambil dari BFF."
          action={
            <Button size="sm" variant="secondary" onClick={() => void approvals.refetch()}>
              Coba lagi
            </Button>
          }
        />
      ) : null}

      {approvals.data && items.length === 0 ? (
        <StateBlock
          title="Tidak ada approval pada filter ini"
          description="Pilih status lain untuk melihat riwayat keputusan."
          action={
            <Button size="sm" variant="secondary" onClick={() => setStatus("")}>
              Lihat semua status
            </Button>
          }
        />
      ) : null}

      {items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {items.map((approval) => (
            <li key={approval.id}>
              <Link
                href={`/approvals/${approval.id}`}
                className="panel flex flex-col gap-2 p-4 transition-colors duration-150 hover:border-brand/40 md:flex-row md:items-center md:justify-between"
              >
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">{approvalTypeLabel[approval.type]}</Badge>
                    <span className="text-[0.9375rem] font-semibold text-ink">{approval.title}</span>
                  </span>
                  <span className="text-[0.8125rem] text-ink-muted">{approval.reason}</span>
                  <span className="tabular text-[0.75rem] text-ink-faint">
                    {approval.requester} · diajukan{" "}
                    {formatInJakarta(approval.requested_at, "d MMM yyyy HH:mm")} WIB
                  </span>
                </span>
                <Badge tone={approvalStatusTone[approval.status]}>
                  {approvalStatusLabel[approval.status]}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="text-[0.75rem] font-medium text-ink-muted">{label}</span>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value || "all"}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-9 rounded-full border px-3 text-[0.75rem] font-medium transition-colors duration-150 pointer-coarse:min-h-11",
              selected
                ? "border-brand bg-brand-soft text-brand-strong"
                : "border-line text-ink-muted hover:border-ink-faint hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
