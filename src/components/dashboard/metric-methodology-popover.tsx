"use client";

import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DataSource } from "@/lib/data/types";
import type { IndicatorMethodology, MetricDefinition } from "@/lib/finance/types";

type MetricMethodologyPopoverProps = {
  metric: MetricDefinition;
  source: DataSource;
  year: number;
};

export function MetricMethodologyPopover({
  metric,
  source,
  year,
}: MetricMethodologyPopoverProps) {
  const methodology = metric.methodology ?? { summary: metric.description };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Methodology for ${metric.label}`}
          />
        }
      >
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <PopoverHeader>
          <PopoverTitle>{metric.label}</PopoverTitle>
          <PopoverDescription>{methodology.summary}</PopoverDescription>
        </PopoverHeader>

        <MethodologyLists methodology={methodology} />

        <div className="space-y-1 border-t border-border/60 pt-2 font-mono text-[11px] text-muted-foreground">
          <p>
            <span className="opacity-70">unit:</span> {metric.unitLabel}
          </p>
          <p>
            <span className="opacity-70">year:</span> {year}
          </p>
          <p>
            <span className="opacity-70">source:</span>{" "}
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline-offset-2 hover:underline"
            >
              {source.name}
            </a>
          </p>
          <p>
            <span className="opacity-70">dataset:</span> {source.dataset}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MethodologyLists({
  methodology,
}: {
  methodology: IndicatorMethodology;
}) {
  return (
    <div className="space-y-2 text-xs text-muted-foreground">
      {methodology.includes?.length ? (
        <div>
          <p className="font-medium text-foreground">Includes</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {methodology.includes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {methodology.excludes?.length ? (
        <div>
          <p className="font-medium text-foreground">Excludes</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {methodology.excludes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {methodology.notes?.length ? (
        <ul className="list-disc space-y-0.5 pl-4">
          {methodology.notes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
