import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "prototype";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-sunken text-ink-muted border-line",
  brand: "bg-brand-soft text-brand-strong border-brand/25",
  success: "bg-success-soft text-success border-success/25",
  warning: "bg-warning-soft text-prototype border-warning/30",
  danger: "bg-danger-soft text-danger border-danger/25",
  info: "bg-info-soft text-info border-info/25",
  prototype: "bg-prototype-soft text-prototype border-prototype/30",
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, icon, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
