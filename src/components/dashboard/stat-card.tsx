import { cn } from "@/lib/utils";

import { SectionLabel } from "./section-label";

type StatCardProps = {
  label: string;
  title: string;
  value: string;
  hint?: string;
  accentColor?: string;
  className?: string;
};

export function StatCard({
  label,
  title,
  value,
  hint,
  accentColor,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card/40 p-4 ring-1 ring-foreground/[0.04]",
        className,
      )}
    >
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-2 flex items-center gap-2">
        {accentColor ? (
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
        ) : null}
        <p className="truncate text-sm font-medium text-foreground/80">{title}</p>
      </div>
      <p className="mt-2 font-mono text-2xl font-medium tracking-tight tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
