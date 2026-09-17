"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import listPlugin from "@fullcalendar/react/list";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import themePlugin from "@fullcalendar/react/themes/classic";
import type { EventDropInfo } from "@fullcalendar/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StateBlock } from "@/components/ui/state";
import type { CalendarEvent, CalendarView } from "@/lib/api/contracts";
import { AIDERA_TIME_ZONE, formatInJakarta, toJakartaIso } from "@/lib/dates/jakarta";
import { calendarQueryOptions, scheduleContentMutationOptions } from "@/lib/query/options";
import { cn } from "@/lib/utils/cn";

const viewOptions: { id: CalendarView; label: string; fcView: string }[] = [
  { id: "month", label: "Bulan", fcView: "dayGridMonth" },
  { id: "week", label: "Minggu", fcView: "timeGridWeek" },
  { id: "list", label: "Daftar", fcView: "listWeek" },
];

const priorityTone: Record<CalendarEvent["priority"], BadgeTone> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

export function CalendarScreen() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<CalendarView>("month");
  const [preview, setPreview] = useState<CalendarEvent | null>(null);

  const calendar = useQuery(calendarQueryOptions({ view }));
  const schedule = useMutation(scheduleContentMutationOptions(queryClient));

  const calendarEvents = calendar.data?.data.events;
  const events = useMemo(() => calendarEvents ?? [], [calendarEvents]);
  const scheduled = useMemo(() => events.filter((event) => event.editable), [events]);
  const unscheduled = useMemo(() => events.filter((event) => !event.editable), [events]);

  const fcView = viewOptions.find((option) => option.id === view)?.fcView ?? "dayGridMonth";

  const handleEventDrop = (info: EventDropInfo) => {
    const contentId = Number(info.event.extendedProps.contentId);
    const nextStart = info.event.start;

    if (!Number.isSafeInteger(contentId) || !nextStart) {
      info.revert();
      return;
    }

    schedule.mutate(
      { id: contentId, input: { scheduled_at: toJakartaIso(nextStart) } },
      {
        onSuccess: () => {
          toast.success("Jadwal tersimpan", {
            description: `${info.event.title} → ${formatInJakarta(nextStart, "d MMM yyyy HH:mm")} WIB`,
          });
        },
        onError: () => {
          info.revert();
          toast.error("Jadwal dikembalikan", {
            description: "Server menolak perubahan tanggal.",
          });
        },
      },
    );
  };

  return (
    <>
      <PageHeader
        title="Kalender"
        snippet="Atur ritme publikasi dengan drag-and-drop tanpa fitur kalender berbayar."
        meta={<Badge tone="neutral">Zona {AIDERA_TIME_ZONE}</Badge>}
        actions={
          <div role="tablist" aria-label="Tampilan kalender" className="flex gap-1 rounded-[var(--radius-control)] bg-surface-sunken p-1">
            {viewOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={view === option.id}
                onClick={() => setView(option.id)}
                className={cn(
                  "min-h-10 rounded-[9px] px-3.5 text-[0.8125rem] font-medium transition-colors pointer-coarse:min-h-11",
                  view === option.id ? "bg-surface text-ink shadow-sm" : "text-ink-muted",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      />

      {calendar.isPending ? <Skeleton className="h-[32rem] w-full" /> : null}

      {calendar.isError ? (
        <StateBlock
          tone="danger"
          title="Kalender tidak dapat dimuat"
          description="Jadwal publikasi gagal diambil dari BFF."
          action={
            <Button size="sm" variant="secondary" onClick={() => void calendar.refetch()}>
              Coba lagi
            </Button>
          }
        />
      ) : null}

      {calendar.data ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,17rem)]">
          <section className="panel overflow-hidden p-3 md:p-4">
            <FullCalendar
              key={fcView}
              plugins={[themePlugin, dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView={fcView}
              timeZone={AIDERA_TIME_ZONE}
              locale="id"
              height="auto"
              firstDay={1}
              editable
              eventStartEditable
              eventDurationEditable={false}
              headerToolbar={{ start: "prev,next today", center: "title", end: "" }}
              events={scheduled.map((event) => ({
                id: event.id,
                title: `${event.code} · ${event.title}`,
                start: event.start,
                end: event.end ?? undefined,
                allDay: event.all_day,
                editable: event.editable,
                extendedProps: { contentId: event.content_id, source: event },
              }))}
              eventDrop={handleEventDrop}
              eventClick={(info) => {
                const source = info.event.extendedProps.source as CalendarEvent | undefined;
                if (source) {
                  setPreview(source);
                }
              }}
            />
          </section>

          <aside aria-label="Konten tanpa jadwal" className="panel flex flex-col gap-3 p-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">Belum terjadwal</h2>
              <p className="mt-1 text-[0.6875rem] text-ink-faint">
                Konten tanpa tanggal publikasi.
              </p>
            </div>

            {unscheduled.length === 0 ? (
              <p className="text-[0.8125rem] text-ink-muted">
                Semua konten pada rentang ini sudah memiliki jadwal.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {unscheduled.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => setPreview(event)}
                      className="w-full rounded-[var(--radius-control)] border border-line px-3 py-2.5 text-left transition-colors hover:border-brand/45"
                    >
                      <span className="tabular block text-[0.6875rem] text-ink-faint">
                        {event.code}
                      </span>
                      <span className="mt-0.5 block text-[0.8125rem] font-medium text-ink">
                        {event.title}
                      </span>
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        <Badge tone={priorityTone[event.priority]}>{event.priority}</Badge>
                        {event.not_ready ? <Badge tone="warning">Belum siap</Badge> : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {schedule.isPending ? (
              <p className="text-[0.75rem] text-ink-muted">Menyimpan perubahan jadwal…</p>
            ) : null}
          </aside>
        </div>
      ) : null}

      <Drawer
        open={preview !== null}
        title={preview?.title ?? "Preview konten"}
        subtitle={preview ? `${preview.code} · ${preview.stage.replaceAll("_", " ")}` : undefined}
        onClose={() => setPreview(null)}
      >
        {preview ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone={priorityTone[preview.priority]}>{preview.priority}</Badge>
              <Badge tone="neutral">{preview.format}</Badge>
              <Badge tone="neutral">{preview.pillar}</Badge>
              {preview.overdue ? <Badge tone="danger">Overdue</Badge> : null}
              {preview.not_ready ? <Badge tone="warning">Belum siap</Badge> : null}
            </div>

            <dl className="flex flex-col gap-2 text-[0.8125rem]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Platform</dt>
                <dd className="font-medium text-ink">{preview.platform}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Status</dt>
                <dd className="font-medium text-ink">{preview.status}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Publikasi</dt>
                <dd className="tabular font-medium text-ink">
                  {formatInJakarta(preview.start, "d MMM yyyy HH:mm")} WIB
                </dd>
              </div>
            </dl>

            <StateBlock
              title="Detail konten menyusul"
              description="Halaman detail lengkap tersedia setelah integrasi Bridge aktif."
            />
          </div>
        ) : null}
      </Drawer>
    </>
  );
}
