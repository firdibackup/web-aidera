"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { toast } from "sonner";

import { DiffView } from "@/components/ui/diff-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StateBlock } from "@/components/ui/state";
import {
  approvalStatusLabel,
  approvalStatusTone,
  approvalTypeLabel,
} from "@/components/ui/vocabulary";
import { formatInJakarta } from "@/lib/dates/jakarta";
import {
  approvalQueryOptions,
  decideApprovalMutationOptions,
  type ApprovalDecision,
} from "@/lib/query/options";

const historyLabel: Record<string, string> = {
  requested: "Diajukan",
  approved: "Disetujui",
  rejected: "Ditolak",
  revision_requested: "Revisi diminta",
};

export function ApprovalDetailScreen({ approvalId }: { approvalId: number }) {
  const noteId = useId();
  const queryClient = useQueryClient();
  const approval = useQuery(approvalQueryOptions(approvalId));
  const decide = useMutation(decideApprovalMutationOptions(queryClient));
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState<ApprovalDecision | null>(null);

  if (approval.isPending) {
    return (
      <>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  if (approval.isError || !approval.data) {
    return (
      <StateBlock
        tone="danger"
        title="Approval tidak dapat dimuat"
        description="Detail keputusan gagal diambil dari BFF."
        action={
          <Button size="sm" variant="secondary" onClick={() => void approval.refetch()}>
            Coba lagi
          </Button>
        }
      />
    );
  }

  const detail = approval.data.data;
  const pending = detail.status === "pending";
  const submitting = decide.isPending;

  const submit = (decision: ApprovalDecision) => {
    if (decision !== "approve" && note.trim() === "") {
      toast.error("Catatan wajib diisi", {
        description: "Penolakan dan permintaan revisi memerlukan alasan tertulis.",
      });
      return;
    }

    decide.mutate(
      { id: detail.id, decision, note: note.trim() === "" ? undefined : note.trim() },
      {
        onSuccess: () => {
          setNote("");
          setConfirming(null);
          toast.success("Keputusan tersimpan", {
            description:
              decision === "approve"
                ? "Approval disetujui dan tercatat pada riwayat."
                : decision === "reject"
                  ? "Approval ditolak dan tercatat pada riwayat."
                  : "Permintaan revisi tercatat pada riwayat.",
          });
        },
        onError: () => {
          setConfirming(null);
          toast.error("Keputusan gagal disimpan", {
            description: "Server menolak permintaan. Status tidak berubah.",
          });
        },
      },
    );
  };

  return (
    <>
      <PageHeader
        title={detail.title}
        snippet={detail.reason}
        meta={
          <>
            <Badge tone="neutral">{approvalTypeLabel[detail.type]}</Badge>
            <Badge tone={approvalStatusTone[detail.status]}>
              {approvalStatusLabel[detail.status]}
            </Badge>
            <Badge tone="neutral">Versi target {detail.target_version}</Badge>
          </>
        }
        actions={
          <Link
            href="/approvals"
            className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-control)] border border-line-strong px-3 text-[0.8125rem] font-medium text-ink hover:border-ink-faint pointer-coarse:min-h-11"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Kembali
          </Link>
        }
      />

      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-ink">Dampak keputusan</h2>
        <p className="mt-2 max-w-[70ch] text-[0.875rem] text-ink-muted">{detail.impact}</p>
        <p className="tabular mt-3 text-[0.75rem] text-ink-faint">
          Diajukan oleh {detail.requester} ·{" "}
          {formatInJakarta(detail.requested_at, "d MMM yyyy HH:mm")} WIB
        </p>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <article className="panel p-5">
          <h2 className="text-sm font-semibold text-ink">Sebelum</h2>
          <p className="mt-2 text-[0.8125rem] text-ink-muted">
            {detail.before ?? "Tidak ada versi sebelumnya."}
          </p>
        </article>
        <article className="panel p-5">
          <h2 className="text-sm font-semibold text-ink">Sesudah</h2>
          <p className="mt-2 text-[0.8125rem] text-ink-muted">
            {detail.after ?? "Tidak ada usulan perubahan."}
          </p>
        </article>
      </section>

      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-ink">Perubahan</h2>
        <div className="mt-3">
          <DiffView lines={detail.diff} label="Perbandingan sebelum dan sesudah" />
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-ink">Keputusan</h2>

        {pending ? (
          <>
            <label htmlFor={noteId} className="mt-3 block text-[0.75rem] font-medium text-ink-muted">
              Catatan keputusan
            </label>
            <textarea
              id={noteId}
              value={note}
              rows={3}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Wajib untuk penolakan dan permintaan revisi."
              className="mt-1.5 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-3 py-2 text-[0.875rem] text-ink outline-none placeholder:text-ink-faint"
            />

            {confirming ? (
              <div
                role="alertdialog"
                aria-label="Konfirmasi keputusan"
                className="mt-3 rounded-[var(--radius-control)] border border-danger/35 bg-danger-soft/50 px-4 py-3"
              >
                <p className="text-[0.8125rem] font-medium text-ink">
                  {confirming === "approve"
                    ? "Setujui approval ini?"
                    : confirming === "reject"
                      ? "Tolak approval ini?"
                      : "Minta revisi untuk approval ini?"}
                </p>
                <p className="mt-1 text-[0.75rem] text-ink-muted">
                  Keputusan tercatat permanen pada riwayat dan tidak dapat dibatalkan diam-diam.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={confirming === "approve" ? "primary" : "destructive"}
                    disabled={submitting}
                    onClick={() => submit(confirming)}
                  >
                    {submitting ? "Menyimpan…" : "Ya, lanjutkan"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="primary" onClick={() => setConfirming("approve")}>
                  Setujui
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setConfirming("revise")}>
                  Minta revisi
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setConfirming("reject")}>
                  Tolak
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-3">
            <Badge tone={approvalStatusTone[detail.status]}>
              {approvalStatusLabel[detail.status]}
            </Badge>
            {detail.decision_note ? (
              <p className="mt-2 text-[0.8125rem] text-ink-muted">{detail.decision_note}</p>
            ) : null}
            {detail.decided_at ? (
              <p className="tabular mt-1 text-[0.75rem] text-ink-faint">
                Diputuskan {formatInJakarta(detail.decided_at, "d MMM yyyy HH:mm")} WIB
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-ink">Riwayat</h2>
        <ol className="mt-3 flex flex-col">
          {detail.history.map((entry) => (
            <li
              key={entry.id}
              className="border-b border-line py-3 first:pt-0 last:border-b-0 last:pb-0"
            >
              <p className="text-[0.8125rem] font-medium text-ink">
                {historyLabel[entry.action] ?? entry.action}
              </p>
              {entry.note ? (
                <p className="mt-0.5 text-[0.8125rem] text-ink-muted">{entry.note}</p>
              ) : null}
              <p className="tabular mt-1 text-[0.75rem] text-ink-faint">
                {entry.actor} · {formatInJakarta(entry.created_at, "d MMM yyyy HH:mm")} WIB
              </p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
