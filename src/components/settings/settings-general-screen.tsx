"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StateBlock } from "@/components/ui/state";
import { settingsQueryOptions, updateSettingsMutationOptions } from "@/lib/query/options";
import { formatInJakarta } from "@/lib/dates/jakarta";

export function SettingsGeneralScreen() {
  const queryClient = useQueryClient();
  const settings = useQuery(settingsQueryOptions());
  const update = useMutation(updateSettingsMutationOptions(queryClient));

  if (settings.isPending) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (settings.isError || !settings.data) {
    return (
      <StateBlock
        tone="danger"
        title="Pengaturan tidak dapat dimuat"
        description="Konfigurasi gagal diambil dari BFF."
        action={
          <Button size="sm" variant="secondary" onClick={() => void settings.refetch()}>
            Coba lagi
          </Button>
        }
      />
    );
  }

  const data = settings.data.data;

  return (
    <>
      <PageHeader
        title="Pengaturan"
        snippet="Atur gate, automation, model, retry, Telegram, dan branding."
        meta={
          <>
            <Badge tone={data.automation_enabled ? "info" : "neutral"}>
              Automation {data.automation_enabled ? "aktif" : "nonaktif"}
            </Badge>
            <Badge tone="success">Auto-publish nonaktif</Badge>
            <Badge tone="neutral">Retry maksimum {data.retry_limit}</Badge>
          </>
        }
      />

      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-ink">Approval gates</h2>
        <p className="mt-1 text-[0.8125rem] text-ink-muted">
          Gate wajib tidak dapat dinonaktifkan; server menolak permintaan yang melewatinya.
        </p>

        <ul className="mt-3 flex flex-col gap-2">
          {data.gates.map((gate) => (
            <li
              key={gate.key}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-line px-3 py-3"
            >
              <span className="flex min-w-0 flex-col">
                <span className="text-[0.8125rem] font-medium text-ink">{gate.label}</span>
                <span className="text-[0.75rem] text-ink-muted">{gate.description}</span>
              </span>
              <span className="flex items-center gap-2">
                <Badge tone={gate.enabled ? "success" : "neutral"}>
                  {gate.enabled ? "Aktif" : "Nonaktif"}
                </Badge>
                {gate.required ? <Badge tone="warning">Wajib</Badge> : null}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-ink">Automation pipeline</h2>
        <p className="mt-1 max-w-[70ch] text-[0.8125rem] text-ink-muted">
          Manual-first. Ketika aktif, pipeline tetap berhenti pada setiap approval gate dan tidak
          pernah mempublikasikan konten secara otomatis.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={data.automation_enabled ? "secondary" : "primary"}
            disabled={update.isPending}
            onClick={() =>
              update.mutate(
                { automation_enabled: !data.automation_enabled },
                {
                  onSuccess: () =>
                    toast.success("Pengaturan tersimpan", {
                      description: data.automation_enabled
                        ? "Automation dinonaktifkan."
                        : "Automation diaktifkan; gate approval tetap berlaku.",
                    }),
                  onError: () =>
                    toast.error("Pengaturan gagal disimpan", {
                      description: "Server menolak perubahan.",
                    }),
                },
              )
            }
          >
            {data.automation_enabled ? "Nonaktifkan automation" : "Aktifkan automation"}
          </Button>
          <span className="tabular text-[0.75rem] text-ink-faint">
            Terakhir diperbarui {formatInJakarta(data.updated_at, "d MMM yyyy HH:mm")} WIB
          </span>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-ink">Branding</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Handle" value={data.branding.handle} />
          <Field label="Tagline" value={data.branding.tagline} />
          <Field label="Canvas" value={`${data.branding.canvas} px`} />
          <Field label="Rasio" value={data.branding.aspect_ratio} />
          <Field label="Margin aman" value={`${data.branding.safe_margin_px} px`} />
        </dl>
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
