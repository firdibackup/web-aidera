"use client";

import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Rows3, Search } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StateBlock } from "@/components/ui/state";
import {
  approvalBadgeLabel,
  approvalBadgeTone,
  priorityTone,
  stageLabels,
} from "@/components/ui/vocabulary";
import {
  CONTENT_STAGES,
  type ContentListItem,
  type ContentSort,
  type ContentStage,
} from "@/lib/api/contracts";
import { formatInJakarta } from "@/lib/dates/jakarta";
import { contentsQueryOptions } from "@/lib/query/options";
import { cn } from "@/lib/utils/cn";

const sortLabels: Record<ContentSort, string> = {
  updated_desc: "Terbaru diperbarui",
  updated_asc: "Terlama diperbarui",
  scheduled_asc: "Jadwal terdekat",
  priority_desc: "Prioritas tertinggi",
  code_asc: "Kode A–Z",
};

export function ContentLibraryScreen() {
  const searchId = useId();
  const stageId = useId();
  const sortId = useId();
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<ContentStage | "">("");
  const [sort, setSort] = useState<ContentSort>("updated_desc");
  const [view, setView] = useState<"table" | "cards">("table");

  const contents = useQuery({
    ...contentsQueryOptions({
      q: search.trim() === "" ? undefined : search.trim(),
      stage: stage === "" ? undefined : stage,
      sort,
    }),
    placeholderData: (previous) => previous,
  });
  const items = contents.data?.data ?? [];
  const hasResult = contents.data !== undefined && !contents.isError;

  return (
    <>
      <PageHeader
        title="Content Library"
        snippet="Satu tempat untuk ide, referensi, draft, dan paket final."
        meta={contents.data ? <Badge tone="neutral">{items.length} konten</Badge> : null}
        actions={
          <div className="flex items-center gap-1 rounded-[var(--radius-control)] border border-line p-1">
            <Button
              size="sm"
              variant={view === "table" ? "primary" : "ghost"}
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
            >
              <Rows3 aria-hidden className="size-4" />
              Tabel
            </Button>
            <Button
              size="sm"
              variant={view === "cards" ? "primary" : "ghost"}
              aria-pressed={view === "cards"}
              onClick={() => setView("cards")}
            >
              <LayoutGrid aria-hidden className="size-4" />
              Kartu
            </Button>
          </div>
        }
      />

      <section className="panel flex flex-col gap-3 p-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label htmlFor={searchId} className="text-[0.75rem] font-medium text-ink-muted">
            Cari konten
          </label>
          <div className="mt-1.5 flex items-center gap-2 rounded-[var(--radius-control)] border border-line-strong bg-surface px-3">
            <Search aria-hidden className="size-4 text-ink-faint" />
            <input
              id={searchId}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onInput={(event) => setSearch(event.currentTarget.value)}
              placeholder="Kode, judul, atau hook"
              className="min-h-10 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint pointer-coarse:min-h-11"
            />
          </div>
        </div>

        <div className="md:w-56">
          <label htmlFor={stageId} className="text-[0.75rem] font-medium text-ink-muted">
            Tahap
          </label>
          <select
            id={stageId}
            value={stage}
            onChange={(event) => setStage(event.target.value as ContentStage | "")}
            className="mt-1.5 min-h-10 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-3 text-sm text-ink pointer-coarse:min-h-11"
          >
            <option value="">Semua tahap</option>
            {CONTENT_STAGES.map((candidate) => (
              <option key={candidate} value={candidate}>
                {stageLabels[candidate]}
              </option>
            ))}
          </select>
        </div>

        <div className="md:w-56">
          <label htmlFor={sortId} className="text-[0.75rem] font-medium text-ink-muted">
            Urutkan
          </label>
          <select
            id={sortId}
            value={sort}
            onChange={(event) => setSort(event.target.value as ContentSort)}
            className="mt-1.5 min-h-10 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-3 text-sm text-ink pointer-coarse:min-h-11"
          >
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {contents.isPending ? <Skeleton className="h-80 w-full" /> : null}

      {contents.isError ? (
        <StateBlock
          tone="danger"
          title="Katalog tidak dapat dimuat"
          description="Daftar konten gagal diambil dari BFF."
          action={
            <Button size="sm" variant="secondary" onClick={() => void contents.refetch()}>
              Coba lagi
            </Button>
          }
        />
      ) : null}

      {hasResult && items.length === 0 ? (
        <StateBlock
          title="Tidak ada konten yang cocok"
          description="Ubah kata kunci atau pilih tahap lain untuk melihat katalog."
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSearch("");
                setStage("");
              }}
            >
              Bersihkan filter
            </Button>
          }
        />
      ) : null}

      {items.length > 0 && view === "table" ? <ContentTable items={items} /> : null}
      {items.length > 0 && view === "cards" ? <ContentCards items={items} /> : null}
    </>
  );
}

function ContentTable({ items }: { items: ContentListItem[] }) {
  return (
    <div className="panel scroll-x">
      <table className="w-full min-w-[54rem] border-collapse text-left">
        <caption className="sr-only">Daftar konten AIDERA</caption>
        <thead>
          <tr className="border-b border-line text-[0.6875rem] tracking-wide text-ink-muted">
            <th scope="col" className="px-4 py-3 font-semibold">Kode</th>
            <th scope="col" className="px-4 py-3 font-semibold">Judul</th>
            <th scope="col" className="px-4 py-3 font-semibold">Tahap</th>
            <th scope="col" className="px-4 py-3 font-semibold">Prioritas</th>
            <th scope="col" className="px-4 py-3 font-semibold">Approval</th>
            <th scope="col" className="px-4 py-3 font-semibold">Jadwal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-line last:border-b-0">
              <td className="tabular px-4 py-3 text-[0.75rem] text-ink-faint">{item.code}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/content/${item.id}`}
                  className="text-[0.8125rem] font-medium text-ink hover:text-brand-strong"
                >
                  {item.title}
                </Link>
                <p className="mt-0.5 line-clamp-1 text-[0.75rem] text-ink-muted">{item.hook}</p>
              </td>
              <td className="px-4 py-3 text-[0.75rem] text-ink-muted">{stageLabels[item.stage]}</td>
              <td className="px-4 py-3">
                <Badge tone={priorityTone[item.priority]}>{item.priority}</Badge>
              </td>
              <td className="px-4 py-3">
                <Badge tone={approvalBadgeTone[item.approval]}>
                  {approvalBadgeLabel[item.approval]}
                </Badge>
              </td>
              <td className="tabular px-4 py-3 text-[0.75rem] text-ink-muted">
                {item.scheduled_at
                  ? `${formatInJakarta(item.scheduled_at, "d MMM yyyy")} WIB`
                  : "Belum dijadwalkan"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContentCards({ items }: { items: ContentListItem[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/content/${item.id}`}
            className={cn(
              "panel flex h-full flex-col gap-2 p-4 transition-colors duration-150",
              "hover:border-brand/40",
            )}
          >
            <span className="tabular text-[0.6875rem] text-ink-faint">{item.code}</span>
            <span className="text-[0.9375rem] font-semibold text-ink">{item.title}</span>
            <span className="line-clamp-2 text-[0.8125rem] text-ink-muted">{item.hook}</span>
            <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
              <Badge tone="neutral">{stageLabels[item.stage]}</Badge>
              <Badge tone={priorityTone[item.priority]}>{item.priority}</Badge>
              {item.approval !== "not_required" ? (
                <Badge tone={approvalBadgeTone[item.approval]}>
                  {approvalBadgeLabel[item.approval]}
                </Badge>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
