import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  snippet: string;
  actions?: ReactNode;
  meta?: ReactNode;
}

export function PageHeader({ title, snippet, actions, meta }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-[62ch]">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink md:text-[1.75rem]">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted">{snippet}</p>
        {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
