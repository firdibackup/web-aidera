import type { DiffLine } from "@/lib/api/contracts";
import { cn } from "@/lib/utils/cn";

const lineTone: Record<DiffLine["kind"], string> = {
  context: "text-ink-muted",
  added: "bg-success-soft text-success",
  removed: "bg-danger-soft text-danger",
};

export function DiffView({ lines, label }: { lines: DiffLine[]; label: string }) {
  if (lines.length === 0) {
    return <p className="text-[0.8125rem] text-ink-faint">Tidak ada perbedaan tercatat.</p>;
  }

  return (
    <div
      role="group"
      aria-label={label}
      className="overflow-hidden rounded-[var(--radius-control)] border border-line"
    >
      {lines.map((line, index) => (
        <p
          key={`${line.kind}-${index}`}
          className={cn(
            "px-3 py-1.5 font-mono text-[0.75rem] leading-relaxed",
            lineTone[line.kind],
          )}
        >
          <span className="sr-only">
            {line.kind === "added"
              ? "Ditambahkan: "
              : line.kind === "removed"
                ? "Dihapus: "
                : "Konteks: "}
          </span>
          {line.text}
        </p>
      ))}
    </div>
  );
}
