import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PanelCard } from "@/components/dashboard/panel-card";
import { SectionLabel } from "@/components/dashboard/section-label";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { communeSeriesColor } from "@/lib/dashboard/series-colors";
import {
  formatMetricValue,
  getCommuneMetricValue,
  getMetricDefinition,
  getZhFinanceDataset,
  percentileForCommune,
} from "@/lib/finance/zh-finance";

const dataset = getZhFinanceDataset();
const featuredBfs = [261, 230, 198] as const;
const operatingMetric = getMetricDefinition("operating_expenditure");

const featuredCommunes = featuredBfs
  .map((bfs) => dataset.communes.find((c) => c.bfsNumber === bfs))
  .filter((c): c is NonNullable<typeof c> => c !== undefined);

export default function Home() {
  return (
    <DashboardShell
      title="Municipal finance overview"
      description="Official Gemeinde indicators for Canton Zürich — operating spend, debt, equity, and investment share per resident."
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Coverage"
            title="Canton Zürich"
            value={`${dataset.coverage.communeCount}`}
            hint="communes indexed"
          />
          <StatCard
            label="Indicators"
            title="Finance metrics"
            value={`${dataset.metrics.length}`}
            hint="per resident / ratio"
          />
          <StatCard
            label="Reference year"
            title="Latest release"
            value={`${dataset.year}`}
            hint="ZH Gemeindefinanzen"
          />
          <StatCard
            label="Primary metric"
            title="Operating spend"
            value={
              operatingMetric
                ? formatMetricValue(
                    getCommuneMetricValue(featuredCommunes[0], "operating_expenditure") ?? 0,
                    operatingMetric.format,
                  )
                : "—"
            }
            hint="Zürich · CHF/Einw."
            accentColor={communeSeriesColor(0)}
          />
        </div>

        <PanelCard
          title="Featured comparison"
          description="Operating expenditure per resident — Zürich, Winterthur, Uster"
          action={
            <Button
              render={<Link href="/compare" />}
              variant="outline"
              size="sm"
            >
              Open compare
              <ArrowRight />
            </Button>
          }
        >
          <div className="grid gap-3 lg:grid-cols-3">
            {featuredCommunes.map((commune, index) => {
              const value =
                getCommuneMetricValue(commune, "operating_expenditure") ?? 0;
              return (
                <StatCard
                  key={commune.bfsNumber}
                  label="Operating expenditure"
                  title={commune.name}
                  value={formatMetricValue(value, "currency")}
                  hint={`P${percentileForCommune(commune, "operating_expenditure")} canton percentile`}
                  accentColor={communeSeriesColor(index)}
                />
              );
            })}
          </div>
        </PanelCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <PanelCard
            title="Available indicators"
            description="Switch between metrics in the compare workspace"
          >
            <ul className="space-y-2">
              {dataset.metrics.map((metric) => (
                <li
                  key={metric.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-border/50 bg-surface px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{metric.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {metric.description}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {metric.unitLabel}
                  </span>
                </li>
              ))}
            </ul>
          </PanelCard>

          <PanelCard
            title="Roadmap"
            description="Expanding beyond Canton Zürich"
          >
            <div className="space-y-3">
              {[
                "EFV Finanzstatistik — nationwide Gemeinden ≥5k",
                "Additional cantons via OGD portals",
                "Tax rates & multi-year trend panels",
                "Shareable comparison URLs",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-border/50 bg-surface px-3 py-2.5 text-sm"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <SectionLabel>Get started</SectionLabel>
              <Button render={<Link href="/compare" />} className="mt-2">
                Compare Gemeinde finances
                <ArrowRight />
              </Button>
            </div>
          </PanelCard>
        </div>
      </div>
    </DashboardShell>
  );
}
