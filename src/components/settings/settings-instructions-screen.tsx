"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { DiffView } from "@/components/ui/diff-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StateBlock } from "@/components/ui/state";
import { instructionStatusLabel, instructionStatusTone } from "@/components/ui/vocabulary";
import type { Instruction, InstructionStatus } from "@/lib/api/contracts";
import { formatInJakarta } from "@/lib/dates/jakarta";
import {
  decideInstructionMutationOptions,
  instructionsQueryOptions,
  type InstructionDecision,
} from "@/lib/query/options";
import { cn } from "@/lib/utils/cn";

const statusFilters: Array<{ value: InstructionStatus | ""; label: string }> = [
  { value: "", label: "Semua" },
  { value: "proposed", label: "Diusulkan" },
  { value: "active", label: "Aktif" },
  { value: "superseded", label: "Versi lama" },
  { value: "rejected", label: "Ditolak" },
];

export function SettingsInstructionsScreen() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<InstructionStatus | "">("");
  const instructions = useQuery(
    instructionsQueryOptions({ status: status === "" ? undefined : status }),
  );
  const decide = useMutation(decideInstructionMutationOptions(queryClient));
  const items = instructions.data?.data ?? [];

  const submit = (instruction: Instruction, decision: InstructionDecision) => {
    decide.mutate(
      { id: instruction.id, decision },
      {
        onSuccess: () =>
          toast.success("Versi instruksi diperbarui", {
            description:
              decision === "approve"
                ? "Instruksi aktif baru akan dipakai pada prompt berikutnya."
                : decision === "rollback"
                  ? "Versi sebelumnya diaktifkan kembali."
                  : "Usulan instruksi ditolak.",
          }),
        onError: () =>
          toast.error("Perubahan gagal disimpan", {
            description: "Server menolak permintaan. Versi aktif tidak berubah.",
          }),
      },
    );
  };

  return (
    <>
      <PageHeader
        title="Instructions"
        snippet="Simpan aturan yang berulang sebagai versi yang dapat di-rollback."
        meta={
          instructions.data ? (
            <Badge tone="neutral">
              {items.filter((item) => item.status === "active").length} aktif
            </Badge>
          ) : null
        }
      />

      <div role="group" aria-label="Filter status" className="flex flex-wrap items-center gap-2">
        {statusFilters.map((option) => {
          const selected = option.value === status;

          return (
            <button
              key={option.value || "all"}
              type="button"
              aria-pressed={selected}
              onClick={() => setStatus(option.value)}
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

      {instructions.isPending ? <Skeleton className="h-80 w-full" /> : null}

      {instructions.isError ? (
        <StateBlock
          tone="danger"
          title="Instruksi tidak dapat dimuat"
          description="Riwayat versi gagal diambil dari BFF."
          action={
            <Button size="sm" variant="secondary" onClick={() => void instructions.refetch()}>
              Coba lagi
            </Button>
          }
        />
      ) : null}

      {instructions.data && items.length === 0 ? (
        <StateBlock
          title="Belum ada instruksi pada filter ini"
          description="Instruksi permanen hanya dibuat melalui proposal dan approval."
        />
      ) : null}

      {items.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {items.map((instruction) => (
            <li key={instruction.id} className="panel p-5">
              <header className="flex flex-wrap items-start justify-between gap-2">
                <span className="flex min-w-0 flex-col gap-1">
                  <h2 className="text-[0.9375rem] font-semibold text-ink">{instruction.title}</h2>
                  <span className="text-[0.75rem] text-ink-faint">
                    {instruction.agent ?? "workflow"} · scope {instruction.scope} · versi{" "}
                    {instruction.version}
                  </span>
                </span>
                <Badge tone={instructionStatusTone[instruction.status]}>
                  {instructionStatusLabel[instruction.status]}
                </Badge>
              </header>

              <p className="mt-2 max-w-[70ch] text-[0.8125rem] text-ink">{instruction.text}</p>
              <p className="mt-1 text-[0.75rem] text-ink-muted">Alasan: {instruction.reason}</p>

              <div className="mt-3">
                <DiffView lines={instruction.diff} label={`Perubahan ${instruction.title}`} />
              </div>

              <p className="tabular mt-3 text-[0.75rem] text-ink-faint">
                Diusulkan {instruction.proposed_by} ·{" "}
                {formatInJakarta(instruction.proposed_at, "d MMM yyyy HH:mm")} WIB
                {instruction.decided_at
                  ? ` · diputuskan ${formatInJakarta(instruction.decided_at, "d MMM yyyy HH:mm")} WIB`
                  : ""}
              </p>

              {instruction.decision_note ? (
                <p className="mt-1 text-[0.75rem] text-ink-muted">{instruction.decision_note}</p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                {instruction.status === "proposed" ? (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={decide.isPending}
                      onClick={() => submit(instruction, "approve")}
                    >
                      Setujui &amp; simpan
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={decide.isPending}
                      onClick={() => submit(instruction, "reject")}
                    >
                      Tolak
                    </Button>
                  </>
                ) : null}
                {instruction.status === "superseded" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={decide.isPending}
                    onClick={() => submit(instruction, "rollback")}
                  >
                    Rollback ke versi ini
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
