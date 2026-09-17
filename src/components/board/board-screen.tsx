"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertOctagon, FileStack, GripVertical } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StateBlock } from "@/components/ui/state";
import {
  CONTENT_STAGES,
  ContentStageSchema,
  type Board,
  type ContentCard,
  type ContentStage,
} from "@/lib/api/contracts";
import { formatInJakarta } from "@/lib/dates/jakarta";
import { boardQueryOptions, moveContentStageMutationOptions } from "@/lib/query/options";
import { cn } from "@/lib/utils/cn";

const approvalTone: Record<ContentCard["approval"], BadgeTone> = {
  not_required: "neutral",
  pending: "warning",
  approved: "success",
  rejected: "danger",
  revision_requested: "info",
};

const approvalLabel: Record<ContentCard["approval"], string> = {
  not_required: "Tanpa gate",
  pending: "Menunggu ACC",
  approved: "Disetujui",
  rejected: "Ditolak",
  revision_requested: "Revisi",
};

const priorityTone: Record<ContentCard["priority"], BadgeTone> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

export function BoardScreen() {
  const queryClient = useQueryClient();
  const board = useQuery(boardQueryOptions());
  const moveStage = useMutation(moveContentStageMutationOptions(queryClient));
  const [activeCard, setActiveCard] = useState<ContentCard | null>(null);
  const [detail, setDetail] = useState<ContentCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const card = event.active.data.current?.card;
    setActiveCard((card as ContentCard | undefined) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);

    const card = event.active.data.current?.card as ContentCard | undefined;
    const target = ContentStageSchema.safeParse(event.over?.id);

    if (!card || !target.success || card.stage === target.data) {
      return;
    }

    moveStage.mutate(
      { id: card.id, input: { stage: target.data, version: card.version } },
      {
        onSuccess: () => {
          toast.success("Tahap tersimpan", {
            description: `${card.code} dipindahkan ke ${stageLabel(target.data)}.`,
          });
        },
        onError: () => {
          toast.error("Perpindahan dibatalkan", {
            description: "Server menolak perubahan. Posisi kartu dikembalikan.",
          });
        },
      },
    );
  };

  return (
    <>
      <PageHeader
        title="Board"
        snippet="Geser konten antar tahap; setiap perpindahan disimpan dan diaudit."
        meta={
          board.data ? (
            <Badge tone="neutral">
              {board.data.data.columns.reduce((total, column) => total + column.count, 0)} kartu
            </Badge>
          ) : null
        }
      />

      {board.isPending ? <Skeleton className="h-[28rem] w-full" /> : null}

      {board.isError ? (
        <StateBlock
          tone="danger"
          title="Board tidak dapat dimuat"
          description="Data papan produksi gagal diambil dari BFF."
          action={
            <Button size="sm" variant="secondary" onClick={() => void board.refetch()}>
              Coba lagi
            </Button>
          }
        />
      ) : null}

      {board.data ? (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveCard(null)}
        >
          <BoardColumns board={board.data.data} onOpenDetail={setDetail} />
          <DragOverlay>
            {activeCard ? (
              <div className="w-[17rem] rotate-1">
                <CardBody card={activeCard} dragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : null}

      <Drawer
        open={detail !== null}
        title={detail?.title ?? "Detail konten"}
        subtitle={detail ? `${detail.code} · ${stageLabel(detail.stage)}` : undefined}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <div className="flex flex-col gap-4">
            <p className="text-[0.8125rem] text-ink">{detail.hook}</p>

            <dl className="grid grid-cols-2 gap-3 text-[0.8125rem]">
              <DetailRow label="Format" value={detail.format} />
              <DetailRow label="Pillar" value={detail.pillar} />
              <DetailRow label="Prioritas" value={detail.priority} />
              <DetailRow label="Owner" value={detail.owner ?? "Belum ditugaskan"} />
              <DetailRow
                label="Jadwal"
                value={
                  detail.scheduled_at
                    ? `${formatInJakarta(detail.scheduled_at, "d MMM yyyy HH:mm")} WIB`
                    : "Belum dijadwalkan"
                }
              />
              <DetailRow label="Artifact" value={String(detail.artifact_count)} />
            </dl>

            <div className="flex flex-wrap gap-2">
              <Badge tone={approvalTone[detail.approval]}>{approvalLabel[detail.approval]}</Badge>
              {detail.revision_requested ? <Badge tone="info">Revisi diminta</Badge> : null}
              {detail.blocker ? <Badge tone="danger">{detail.blocker}</Badge> : null}
              {detail.active_run_status ? (
                <Badge tone="info">Run {detail.active_run_status}</Badge>
              ) : null}
            </div>

            <Link
              href={`/content/${detail.id}` as Route}
              className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-control)] bg-brand px-4 text-sm font-medium text-brand-ink hover:bg-brand-strong pointer-coarse:min-h-11"
            >
              Buka detail lengkap
            </Link>
          </div>
        ) : null}
      </Drawer>
    </>
  );
}

function BoardColumns({
  board,
  onOpenDetail,
}: {
  board: Board;
  onOpenDetail: (card: ContentCard) => void;
}) {
  return (
    <div className="scroll-x -mx-4 px-4 pb-2 md:-mx-8 md:px-8">
      <div className="flex min-w-max gap-3">
        {board.columns.map((column) => (
          <BoardColumn
            key={column.stage}
            stage={column.stage}
            label={column.label}
            count={column.count}
            wipLimit={column.wip_limit}
            cards={column.cards}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </div>
    </div>
  );
}

function BoardColumn({
  stage,
  label,
  count,
  wipLimit,
  cards,
  onOpenDetail,
}: {
  stage: ContentStage;
  label: string;
  count: number;
  wipLimit: number | null;
  cards: ContentCard[];
  onOpenDetail: (card: ContentCard) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const overLimit = wipLimit !== null && count > wipLimit;

  return (
    <section
      ref={setNodeRef}
      aria-label={label}
      className={cn(
        "flex w-[17.5rem] shrink-0 flex-col rounded-[var(--radius-panel)] border bg-surface-sunken/70 transition-colors duration-150",
        isOver ? "border-brand bg-brand-soft/50" : "border-line",
      )}
    >
      <header className="flex items-center justify-between gap-2 px-3 py-2.5">
        <h2 className="text-[0.8125rem] font-semibold text-ink">{label}</h2>
        <span className="flex items-center gap-1.5">
          {overLimit ? <Badge tone="warning">WIP</Badge> : null}
          <span className="tabular text-[0.75rem] text-ink-muted">
            {count}
            {wipLimit !== null ? `/${wipLimit}` : ""}
          </span>
        </span>
      </header>

      <div className="flex min-h-[6rem] flex-col gap-2 px-2 pb-3">
        {cards.length === 0 ? (
          <p className="px-1 py-3 text-[0.75rem] text-ink-faint">Belum ada kartu.</p>
        ) : null}
        {cards.map((card) => (
          <DraggableCard key={card.id} card={card} onOpenDetail={onOpenDetail} />
        ))}
      </div>
    </section>
  );
}

function DraggableCard({
  card,
  onOpenDetail,
}: {
  card: ContentCard;
  onOpenDetail: (card: ContentCard) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });

  return (
    <div ref={setNodeRef} className={cn(isDragging && "opacity-40")}>
      <CardBody
        card={card}
        onOpenDetail={onOpenDetail}
        handleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function CardBody({
  card,
  dragging = false,
  onOpenDetail,
  handleProps,
}: {
  card: ContentCard;
  dragging?: boolean;
  onOpenDetail?: (card: ContentCard) => void;
  handleProps?: Record<string, unknown>;
}) {
  return (
    <article
      className={cn(
        "rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2.5",
        dragging && "shadow-[0_12px_28px_rgba(0,0,0,0.12)]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpenDetail?.(card)}
          className="min-w-0 flex-1 text-left"
        >
          <span className="tabular block text-[0.6875rem] text-ink-faint">{card.code}</span>
          <span className="mt-0.5 block text-[0.8125rem] font-medium text-ink">{card.title}</span>
          <span className="mt-1 block line-clamp-2 text-[0.75rem] text-ink-muted">{card.hook}</span>
        </button>
        <button
          type="button"
          aria-label={`Pindahkan ${card.code}`}
          className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[8px] text-ink-faint hover:bg-surface-sunken pointer-coarse:size-11"
          {...handleProps}
        >
          <GripVertical aria-hidden className="size-4" />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge tone={priorityTone[card.priority]}>{card.priority}</Badge>
        <Badge tone="neutral">{card.format}</Badge>
        {card.approval !== "not_required" ? (
          <Badge tone={approvalTone[card.approval]}>{approvalLabel[card.approval]}</Badge>
        ) : null}
        {card.blocker ? (
          <Badge tone="danger" icon={<AlertOctagon aria-hidden className="size-3" />}>
            Blocked
          </Badge>
        ) : null}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-[0.6875rem] text-ink-faint">
        <span className="inline-flex items-center gap-1">
          <FileStack aria-hidden className="size-3" />
          {card.artifact_count}
        </span>
        {card.scheduled_at ? (
          <time className="tabular" dateTime={card.scheduled_at}>
            {formatInJakarta(card.scheduled_at, "d MMM HH:mm")}
          </time>
        ) : (
          <span>Tanpa jadwal</span>
        )}
      </div>
    </article>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-muted">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  );
}

function stageLabel(stage: ContentStage): string {
  const index = CONTENT_STAGES.indexOf(stage);
  return index >= 0 ? stage.replaceAll("_", " ") : stage;
}
