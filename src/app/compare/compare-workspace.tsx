"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { ComparisonBarChart } from "@/components/charts/comparison-bar-chart";
import { SpendingBreakdownChart } from "@/components/charts/spending-breakdown-chart";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MetricMethodologyPopover } from "@/components/dashboard/metric-methodology-popover";
import { MetricSegmentedControl } from "@/components/dashboard/metric-segmented-control";
import { PanelCard } from "@/components/dashboard/panel-card";
import { SectionLabel } from "@/components/dashboard/section-label";
import { ShareCompareLinkButton } from "@/components/dashboard/share-compare-link-button";
import { StatCard } from "@/components/dashboard/stat-card";
import { Input } from "@/components/ui/input";
import { buildCompareQuery, parseCompareState } from "@/lib/compare/url-state";
import { communeSeriesColor } from "@/lib/dashboard/series-colors";
import {
  compareZhCommunes,
  formatMetricValue,
  getCantonMedianForMetric,
  getCommuneMetricValue,
  getMetricDefinition,
  getZhFinanceDataset,
  percentileForCommune,
} from "@/lib/finance/zh-finance";
import type { FinanceMetricId } from "@/lib/finance/types";

const dataset = getZhFinanceDataset();
const validBfsNumbers = new Set(dataset.communes.map((c) => c.bfsNumber));

const SHORT_LABELS: Record<FinanceMetricId, string> = {
  operating_expenditure: "Operating",
  equity_per_capita: "Equity",
  debt_per_capita: "Debt",
  gross_debt_ratio: "Debt ratio",
  investment_share: "Investment",
};

export function CompareWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number[]>(() =>
    parseCompareState(searchParams, validBfsNumbers).selected,
  );
  const [metricId, setMetricId] = useState<FinanceMetricId>(
    () => parseCompareState(searchParams, validBfsNumbers).metricId,
  );

  const activeMetric = getMetricDefinition(metricId);

  const shareHref = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${pathname}?${buildCompareQuery(selected, metricId)}`;
  }, [pathname, selected, metricId]);

  useEffect(() => {
    const nextQuery = buildCompareQuery(selected, metricId);
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) return;
    router.replace(`${pathname}?${nextQuery}`, { scroll: false });
  }, [selected, metricId, pathname, router, searchParams]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const normalized = query.toLowerCase();
    return dataset.communes
      .filter((commune) => commune.name.toLowerCase().includes(normalized))
      .slice(0, 8);
  }, [query]);

  const compared = compareZhCommunes(selected, metricId);
  const ranked = [...compared].sort(
    (a, b) =>
      (getCommuneMetricValue(b, metricId) ?? 0) -
      (getCommuneMetricValue(a, metricId) ?? 0),
  );
  const median = getCantonMedianForMetric(metricId);

  function addCommune(bfsNumber: number) {
    setSelected((current) => {
      if (current.includes(bfsNumber) || current.length >= 3) return current;
      return [...current, bfsNumber];
    });
    setQuery("");
  }

  function removeCommune(bfsNumber: number) {
    setSelected((current) => current.filter((id) => id !== bfsNumber));
  }

  const metricOptions = dataset.metrics.map((metric) => ({
    value: metric.id,
    label: metric.label,
    shortLabel: SHORT_LABELS[metric.id],
  }));

  return (
    <DashboardShell
      title="Gemeinde finance compare"
      description="Select up to three communes and switch indicators to compare municipal finances side by side."
      meta={[
        { label: "source", value: dataset.source.name },
        { label: "dataset", value: dataset.source.dataset },
        { label: "year", value: String(dataset.year) },
        { label: "schema", value: `v${dataset.schemaVersion ?? 1}` },
        { label: "communes", value: String(dataset.coverage.communeCount) },
      ]}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <SectionLabel className="w-14 shrink-0">Metric</SectionLabel>
              <MetricSegmentedControl
                value={metricId}
                onChange={setMetricId}
                options={metricOptions}
                className="min-w-0 flex-1"
              />
              {activeMetric ? (
                <MetricMethodologyPopover
                  metric={activeMetric}
                  source={dataset.source}
                  year={dataset.year}
                />
              ) : null}
            </div>
            {activeMetric ? (
              <p className="text-xs text-muted-foreground sm:pl-[4.75rem]">
                {activeMetric.description}
              </p>
            ) : null}
          </div>
          {shareHref ? <ShareCompareLinkButton href={shareHref} /> : null}
        </div>

        <PanelCard
          title="Filters"
          description="Search and pin up to 3 Gemeinden"
        >
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Gemeinde…"
                className="bg-background/80 pl-8 font-mono text-sm"
              />
            </div>

            {suggestions.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-border/60 bg-background/50">
                {suggestions.map((commune) => {
                  const value =
                    getCommuneMetricValue(commune, metricId) ??
                    getCommuneMetricValue(commune, "operating_expenditure");
                  return (
                    <button
                      key={commune.bfsNumber}
                      type="button"
                      onClick={() => addCommune(commune.bfsNumber)}
                      disabled={
                        selected.includes(commune.bfsNumber) ||
                        selected.length >= 3
                      }
                      className="flex w-full items-center justify-between border-b border-border/40 px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span>{commune.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {value !== undefined && activeMetric
                          ? formatMetricValue(value, activeMetric.format)
                          : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {selected.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selected.map((bfsNumber, index) => {
                  const commune = dataset.communes.find(
                    (item) => item.bfsNumber === bfsNumber,
                  );
                  if (!commune) return null;
                  return (
                    <button
                      key={bfsNumber}
                      type="button"
                      onClick={() => removeCommune(bfsNumber)}
                      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface px-3 py-1 text-xs font-medium"
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: communeSeriesColor(index) }}
                      />
                      {commune.name}
                      <X className="size-3 opacity-60" />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </PanelCard>

        {compared.length > 0 && activeMetric ? (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              {ranked.map((commune, index) => {
                const value = getCommuneMetricValue(commune, metricId) ?? 0;
                return (
                  <StatCard
                    key={commune.bfsNumber}
                    label={activeMetric.label}
                    title={commune.name}
                    value={formatMetricValue(value, activeMetric.format)}
                    hint={`P${percentileForCommune(commune, metricId)} canton percentile · median ${formatMetricValue(median, activeMetric.format)}`}
                    accentColor={communeSeriesColor(index)}
                  />
                );
              })}
            </div>

            <div className="grid gap-6 xl:grid-cols-5">
              <PanelCard
                title="Distribution"
                description={`${activeMetric.label} · ${dataset.year}`}
                className="xl:col-span-3"
              >
                <ComparisonBarChart
                  communes={ranked}
                  metricId={metricId}
                  format={activeMetric.format}
                  median={median}
                />
              </PanelCard>

              <PanelCard
                title="Ranking"
                description="Selected communes"
                className="xl:col-span-2"
              >
                <div className="overflow-hidden rounded-lg border border-border/50">
                  <div className="grid grid-cols-[2.5rem_1fr_auto] gap-2 border-b border-border/50 bg-muted/30 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span>#</span>
                    <span>Gemeinde</span>
                    <span>Value</span>
                  </div>
                  {ranked.map((commune, index) => {
                    const value = getCommuneMetricValue(commune, metricId) ?? 0;
                    return (
                      <div
                        key={commune.bfsNumber}
                        className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-2 border-b border-border/30 px-3 py-2.5 text-sm last:border-b-0"
                      >
                        <span className="font-mono text-xs text-muted-foreground">
                          {index + 1}
                        </span>
                        <span className="flex items-center gap-2 truncate">
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: communeSeriesColor(index) }}
                          />
                          {commune.name}
                        </span>
                        <span className="font-mono text-xs tabular-nums">
                          {formatMetricValue(value, activeMetric.format)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </PanelCard>
            </div>

            {metricId === "operating_expenditure" ? (
              <PanelCard
                title="Spending composition"
                description="Operating expenditure by service area (stacked)"
              >
                <SpendingBreakdownChart communes={ranked} />
              </PanelCard>
            ) : null}
          </>
        ) : null}
      </div>
    </DashboardShell>
  );
}
