"use client";

import {
  AlertTriangle,
  CheckSquare,
  Code2,
  FileText,
  GitCompare,
  Lightbulb,
  Quote,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import type {
  AgentResponseV1,
  KnownStructuredBlock,
  StructuredBlock,
} from "@/lib/api/contracts";

const severityTone: Record<NonNullable<KnownStructuredBlock["severity"]>, BadgeTone> = {
  info: "info",
  success: "success",
  warning: "warning",
  critical: "danger",
};

const blockIcons: Record<KnownStructuredBlock["type"], ComponentType<{ className?: string }>> = {
  recommendation: Lightbulb,
  warning: AlertTriangle,
  checklist: CheckSquare,
  comparison: GitCompare,
  plan_item: FileText,
  metric: TrendingUp,
  quote: Quote,
  code: Code2,
  prompt: Sparkles,
};

export function StructuredMessage({ result }: { result: AgentResponseV1 }) {
  return (
    <article className="flex flex-col gap-3">
      {result.message ? (
        <p className="max-w-[68ch] text-sm leading-relaxed text-ink">{result.message}</p>
      ) : null}

      {result.unstructured ? (
        <Badge tone="warning">Respons tidak terstruktur</Badge>
      ) : null}

      {result.summary ? (
        <section className="rounded-[var(--radius-panel)] border border-brand/20 bg-brand-soft/60 px-4 py-3">
          <h4 className="text-[0.8125rem] font-semibold text-brand-strong">
            {result.summary.title}
          </h4>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-[0.8125rem] text-ink">
            {result.summary.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.blocks.map((block, index) => (
        <BlockRenderer key={`${block.type}-${index}`} block={block} />
      ))}

      {result.artifacts.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h4 className="text-[0.6875rem] font-semibold tracking-wide text-ink-muted">Artifacts</h4>
          <ul className="grid gap-2 sm:grid-cols-2">
            {result.artifacts.map((artifact) => (
              <li
                key={`${artifact.type}-${artifact.version}-${artifact.path}`}
                className="rounded-[var(--radius-control)] border border-line bg-surface px-3 py-2"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[0.8125rem] font-medium text-ink">
                    {artifact.title}
                  </span>
                  <Badge tone="neutral">v{artifact.version}</Badge>
                </span>
                <span className="mt-1 block truncate text-[0.6875rem] text-ink-faint">
                  {artifact.type}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.proposedInstructions && result.proposedInstructions.length > 0 ? (
        <section className="rounded-[var(--radius-panel)] border border-warning/35 bg-warning-soft/60 px-4 py-3">
          <h4 className="text-[0.8125rem] font-semibold text-prototype">
            Usulan instruksi permanen
          </h4>
          <ul className="mt-2 flex flex-col gap-2">
            {result.proposedInstructions.map((instruction) => (
              <li key={instruction.text} className="text-[0.8125rem] text-ink">
                <span className="font-medium">{instruction.scope}</span>: {instruction.text}
                <span className="mt-0.5 block text-[0.75rem] text-ink-muted">
                  {instruction.reason}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[0.6875rem] text-prototype">
            Perlu approval manusia sebelum menjadi versi aktif.
          </p>
        </section>
      ) : null}

      {result.actions.length > 0 ? (
        <section className="flex flex-wrap gap-2 border-t border-line pt-3">
          {result.actions.map((action) => (
            <Badge key={`${action.type}-${action.label}`} tone="brand">
              {action.label}
            </Badge>
          ))}
        </section>
      ) : null}
    </article>
  );
}

function BlockRenderer({ block }: { block: StructuredBlock }) {
  if (block.type === "unknown") {
    return (
      <BlockShell
        title={block.title}
        badge={<Badge tone="warning">Tipe {block.original_type}</Badge>}
      >
        <p className="text-[0.8125rem] text-ink-muted">
          Blok ini belum didukung renderer. Payload asli dipertahankan tanpa merusak halaman.
        </p>
      </BlockShell>
    );
  }

  const Icon = blockIcons[block.type];
  const tone = block.severity ? severityTone[block.severity] : "neutral";

  if (block.type === "comparison") {
    return (
      <BlockShell title={block.title} icon={<Icon aria-hidden className="size-4" />}>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-[10px] bg-danger-soft/50 px-3 py-2">
            <p className="text-[0.6875rem] font-semibold text-danger">Sebelum</p>
            <p className="mt-1 text-[0.8125rem] text-ink">{block.before}</p>
          </div>
          <div className="rounded-[10px] bg-success-soft/60 px-3 py-2">
            <p className="text-[0.6875rem] font-semibold text-success">Sesudah</p>
            <p className="mt-1 text-[0.8125rem] text-ink">{block.after}</p>
          </div>
        </div>
      </BlockShell>
    );
  }

  if (block.type === "checklist" && block.items) {
    return (
      <BlockShell title={block.title} icon={<Icon aria-hidden className="size-4" />}>
        <ul className="flex flex-col gap-1.5">
          {block.items.map((item) => (
            <li key={item.id ?? item.label} className="flex items-start gap-2 text-[0.8125rem]">
              <span
                aria-hidden
                className={
                  item.checked
                    ? "mt-1 size-3 rounded-[4px] border border-success bg-success"
                    : "mt-1 size-3 rounded-[4px] border border-line-strong"
                }
              />
              <span className={item.checked ? "text-ink-muted line-through" : "text-ink"}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </BlockShell>
    );
  }

  if (block.type === "code" || block.type === "prompt") {
    return (
      <BlockShell title={block.title} icon={<Icon aria-hidden className="size-4" />}>
        <pre className="overflow-x-auto rounded-[10px] bg-surface-sunken px-3 py-2.5 text-[0.75rem] leading-relaxed text-ink">
          <code>{block.content}</code>
        </pre>
      </BlockShell>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote className="rounded-[var(--radius-panel)] bg-surface-sunken px-4 py-3">
        <p className="text-[0.8125rem] italic text-ink">{block.content}</p>
        <footer className="mt-1.5 text-[0.6875rem] text-ink-faint">{block.title}</footer>
      </blockquote>
    );
  }

  return (
    <BlockShell
      title={block.title}
      icon={<Icon aria-hidden className="size-4" />}
      badge={block.severity ? <Badge tone={tone}>{block.severity}</Badge> : undefined}
    >
      {block.content ? (
        <p className="text-[0.8125rem] leading-relaxed text-ink">{block.content}</p>
      ) : null}
    </BlockShell>
  );
}

function BlockShell({
  title,
  icon,
  badge,
  children,
}: {
  title: string;
  icon?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-panel)] border border-line bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-[0.8125rem] font-semibold text-ink">
          {icon}
          {title}
        </h4>
        {badge}
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}
