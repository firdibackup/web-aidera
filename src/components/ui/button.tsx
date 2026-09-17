import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-ink hover:bg-brand-strong disabled:bg-line-strong disabled:text-ink-faint",
  secondary: "bg-surface text-ink border border-line-strong hover:border-ink-faint disabled:text-ink-faint",
  ghost: "text-ink-muted hover:bg-surface-sunken hover:text-ink disabled:text-ink-faint",
  destructive: "bg-danger text-brand-ink hover:brightness-95 disabled:bg-line-strong disabled:text-ink-faint",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-[0.8125rem] pointer-coarse:min-h-11",
  md: "min-h-10 px-4 text-sm pointer-coarse:min-h-11",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium transition-colors duration-150 ease-[var(--ease-out-quint)] disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
