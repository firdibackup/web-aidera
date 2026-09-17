import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-[var(--radius-control)] bg-surface-sunken", className)}
    />
  );
}

export interface StateBlockProps {
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "neutral" | "danger";
  className?: string;
}

export function StateBlock({
  title,
  description,
  action,
  tone = "neutral",
  className,
}: StateBlockProps) {
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className={cn(
        "flex flex-col items-start gap-2 rounded-[var(--radius-panel)] border border-dashed px-5 py-6",
        tone === "danger"
          ? "border-danger/35 bg-danger-soft/50"
          : "border-line-strong bg-surface",
        className,
      )}
    >
      <p className={cn("text-sm font-semibold", tone === "danger" ? "text-danger" : "text-ink")}>
        {title}
      </p>
      <p className="max-w-[60ch] text-[0.8125rem] text-ink-muted">{description}</p>
      {action}
    </div>
  );
}
