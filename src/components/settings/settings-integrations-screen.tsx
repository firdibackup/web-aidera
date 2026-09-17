"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton, StateBlock } from "@/components/ui/state";
import { settingsQueryOptions } from "@/lib/query/options";

const notifyLabels: Record<string, string> = {
  approval_requested: "Approval diminta",
  run_failed: "Run gagal",
  content_blocked: "Konten tertahan",
};

export function SettingsIntegrationsScreen() {
  const settings = useQuery(settingsQueryOptions());

  if (settings.isPending) {
    return <Skeleton className="h-80 w-full" />;
  }

  if (settings.isError || !settings.data) {
    return (
      <StateBlock
        tone="danger"
        title="Integrasi tidak dapat dimuat"
        description="Konfigurasi integrasi gagal diambil dari BFF."
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
        title="Integrasi"
        snippet="Notifikasi dan koneksi eksternal yang dipakai studio."
        meta={
          <Badge tone={data.telegram.enabled ? "success" : "neutral"}>
            Telegram {data.telegram.enabled ? "aktif" : "nonaktif"}
          </Badge>
        }
      />

      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-ink">Telegram</h2>
        <p className="mt-1 max-w-[70ch] text-[0.8125rem] text-ink-muted">
          Notifikasi dikirim oleh Bridge di server. Kredensial tidak pernah disimpan atau
          ditampilkan di browser.
        </p>

        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[0.75rem] text-ink-muted">Status</dt>
            <dd className="mt-0.5 text-[0.8125rem] font-medium text-ink">
              {data.telegram.enabled ? "Aktif" : "Nonaktif"}
            </dd>
          </div>
          <div>
            <dt className="text-[0.75rem] text-ink-muted">Chat ID</dt>
            <dd className="mt-0.5 text-[0.8125rem] font-medium text-ink">
              {data.telegram.chat_id_configured ? "Terkonfigurasi di server" : "Belum dikonfigurasi"}
            </dd>
          </div>
        </dl>

        <h3 className="mt-4 text-[0.8125rem] font-semibold text-ink">Kejadian yang dinotifikasi</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {data.telegram.notify_on.map((event) => (
            <li key={event}>
              <Badge tone="neutral">{notifyLabels[event] ?? event}</Badge>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-ink">Instagram</h2>
        <p className="mt-1 max-w-[70ch] text-[0.8125rem] text-ink-muted">
          Publikasi otomatis tidak tersedia. Konten yang disetujui tetap menunggu tindakan manual.
        </p>
        <div className="mt-3">
          <Badge tone="success">Auto-publish nonaktif permanen</Badge>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="text-sm font-semibold text-ink">AIDERA Bridge</h2>
        <p className="mt-1 max-w-[70ch] text-[0.8125rem] text-ink-muted">
          Browser hanya memanggil rute same-origin. Token Bridge disimpan di server dan tidak pernah
          dikirim ke klien.
        </p>
      </section>
    </>
  );
}
