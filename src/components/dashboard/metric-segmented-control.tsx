"use client";

import { cn } from "@/lib/utils";

type MetricSegmentedControlProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; shortLabel?: string }[];
  className?: string;
};

export function MetricSegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
}: MetricSegmentedControlProps<T>) {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div
        className="relative inline-grid min-w-full gap-1 rounded-lg bg-muted/50 p-1 ring-1 ring-foreground/[0.04]"
        style={{
          gridTemplateColumns: `repeat(${options.length}, minmax(7.5rem, 1fr))`,
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute top-1 bottom-1 rounded-md bg-background shadow-sm ring-1 ring-foreground/[0.06] transition-[left] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            width: `calc((100% - 8px) / ${options.length})`,
            left: `calc(4px + ${activeIndex} * ((100% - 8px) / ${options.length}))`,
          }}
        />
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "relative z-10 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:text-xs",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80",
              )}
            >
              <span className="hidden truncate sm:inline">{option.label}</span>
              <span className="truncate sm:hidden">
                {option.shortLabel ?? option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
