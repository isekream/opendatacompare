"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  compareZhCommunes,
  formatMetricValue,
  getCommuneMetricValue,
  getMetricDefinition,
  getZhFinanceDataset,
  percentileForCommune,
} from "@/lib/finance/zh-finance";
import type {
  CommuneFinance,
  ExpenditureComponentId,
  FinanceMetricId,
} from "@/lib/finance/types";

const dataset = getZhFinanceDataset();
const defaultSelection = [261, 230, 198];
const defaultMetric: FinanceMetricId = "operating_expenditure";

const COMPONENT_COLORS: Record<ExpenditureComponentId, string> = {
  administration: "bg-blue-500",
  public_order: "bg-indigo-500",
  education: "bg-violet-500",
  social_security: "bg-purple-500",
  health: "bg-fuchsia-500",
  transport: "bg-pink-500",
  environment: "bg-rose-500",
  culture: "bg-orange-500",
};

function ComparisonBars({
  communes,
  metricId,
}: {
  communes: CommuneFinance[];
  metricId: FinanceMetricId;
}) {
  const metric = getMetricDefinition(metricId);
  const values = communes.map(
    (commune) => getCommuneMetricValue(commune, metricId) ?? 0,
  );
  const max = Math.max(...values, 1);

  return (
    <div className="space-y-4">
      {communes.map((commune) => {
        const value = getCommuneMetricValue(commune, metricId) ?? 0;
        return (
          <div key={commune.bfsNumber}>
            <div className="mb-1 flex items-baseline justify-between gap-4 text-sm">
              <span className="font-medium">{commune.name}</span>
              <span className="tabular-nums text-muted">
                {metric ? formatMetricValue(value, metric.format) : value}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              Higher than {percentileForCommune(commune, metricId)}% of ZH
              communes
            </p>
          </div>
        );
      })}
    </div>
  );
}

function ComponentBreakdown({ communes }: { communes: CommuneFinance[] }) {
  const operatingMetric = getMetricDefinition("operating_expenditure");
  const components = operatingMetric?.components;
  if (!components) return null;

  return (
    <div className="space-y-6">
      {communes.map((commune) => {
        const operating = commune.metrics.operating_expenditure;
        if (!operating?.components) return null;
        const total = operating.value;

        return (
          <div key={commune.bfsNumber}>
            <h3 className="text-sm font-medium">{commune.name}</h3>
            <div className="mt-2 flex h-4 overflow-hidden rounded-full">
              {components.map((component) => {
                const value = operating.components?.[component.id] ?? 0;
                if (value <= 0) return null;
                return (
                  <div
                    key={component.id}
                    className={COMPONENT_COLORS[component.id]}
                    style={{ width: `${(value / total) * 100}%` }}
                    title={`${component.label}: ${formatMetricValue(value, "currency")}`}
                  />
                );
              })}
            </div>
            <ul className="mt-3 grid gap-1 sm:grid-cols-2">
              {components.map((component) => {
                const value = operating.components?.[component.id];
                if (value === undefined) return null;
                return (
                  <li
                    key={component.id}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="flex items-center gap-2 text-muted">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${COMPONENT_COLORS[component.id]}`}
                      />
                      {component.label}
                    </span>
                    <span className="tabular-nums text-foreground">
                      {formatMetricValue(value, "currency")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default function ComparePage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number[]>(defaultSelection);
  const [metricId, setMetricId] =
    useState<FinanceMetricId>(defaultMetric);

  const activeMetric = getMetricDefinition(metricId);

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

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm text-white"
            >
              OD
            </span>
            OpenDataCompare
          </Link>
          <span className="text-sm text-muted">Switzerland · Public finances</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          Gemeinde finances
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Compare municipal finances
        </h1>
        <p className="mt-4 max-w-3xl text-muted">
          Compare spending, debt, and equity per resident using official{" "}
          <a
            href={dataset.source.url}
            className="text-accent underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Kanton Zürich open data
          </a>
          . Data year {dataset.year}; {dataset.coverage.communeCount} communes
          in Canton Zürich.
        </p>

        <section className="mt-8">
          <p className="text-sm font-medium">Indicator</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {dataset.metrics.map((metric) => (
              <button
                key={metric.id}
                type="button"
                onClick={() => setMetricId(metric.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  metricId === metric.id
                    ? "border-accent bg-accent text-white"
                    : "border-border bg-card text-muted hover:border-accent/50"
                }`}
              >
                {metric.label}
              </button>
            ))}
          </div>
          {activeMetric && (
            <p className="mt-3 text-sm text-muted">{activeMetric.description}</p>
          )}
        </section>

        <section className="mt-8 rounded-xl border border-border bg-card p-5">
          <label htmlFor="gemeinde-search" className="text-sm font-medium">
            Add a Gemeinde (up to 3)
          </label>
          <input
            id="gemeinde-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search e.g. Zürich, Winterthur, Uster…"
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
          />
          {suggestions.length > 0 && (
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
              {suggestions.map((commune) => {
                const value =
                  getCommuneMetricValue(commune, metricId) ??
                  getCommuneMetricValue(commune, "operating_expenditure");
                return (
                  <li key={commune.bfsNumber}>
                    <button
                      type="button"
                      onClick={() => addCommune(commune.bfsNumber)}
                      disabled={
                        selected.includes(commune.bfsNumber) ||
                        selected.length >= 3
                      }
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span>{commune.name}</span>
                      <span className="tabular-nums text-muted">
                        {value !== undefined && activeMetric
                          ? formatMetricValue(value, activeMetric.format)
                          : "—"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {selected.map((bfsNumber) => {
              const commune = dataset.communes.find(
                (item) => item.bfsNumber === bfsNumber,
              );
              if (!commune) return null;
              return (
                <button
                  key={bfsNumber}
                  type="button"
                  onClick={() => removeCommune(bfsNumber)}
                  className="rounded-full border border-border bg-accent-soft px-3 py-1 text-xs font-medium text-accent"
                  title="Remove"
                >
                  {commune.name} ×
                </button>
              );
            })}
          </div>
        </section>

        {compared.length > 0 && (
          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">Comparison</h2>
              <p className="mt-1 text-sm text-muted">
                {activeMetric?.label} ({dataset.year})
              </p>
              <div className="mt-6">
                <ComparisonBars communes={ranked} metricId={metricId} />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">Ranking</h2>
              <ol className="mt-4 space-y-3">
                {ranked.map((commune, index) => {
                  const value = getCommuneMetricValue(commune, metricId) ?? 0;
                  return (
                    <li
                      key={commune.bfsNumber}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>
                        <span className="mr-2 text-muted">{index + 1}.</span>
                        {commune.name}
                      </span>
                      <span className="font-medium tabular-nums">
                        {activeMetric
                          ? formatMetricValue(value, activeMetric.format)
                          : value}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>
        )}

        {compared.length > 0 && metricId === "operating_expenditure" && (
          <section className="mt-8 rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Spending breakdown</h2>
            <p className="mt-1 text-sm text-muted">
              Share of operating expenditure by service area
            </p>
            <div className="mt-6">
              <ComponentBreakdown communes={ranked} />
            </div>
          </section>
        )}

        <section className="mt-8 rounded-xl border border-dashed border-border p-5 text-sm text-muted">
          <h2 className="font-medium text-foreground">Methodology</h2>
          <p className="mt-2">
            Operating expenditure sums Nettoaufwand across eight core service
            areas and excludes Finanzen/Steuern and Volkswirtschaft (mainly
            fiscal transfers). Debt, equity, and investment-share indicators
            come from the same Kanton Zürich Gemeindefinanzen series.
          </p>
          <p className="mt-2">
            Nationwide Gemeinde coverage from the{" "}
            <a
              href="https://www.efv.admin.ch/de/fs-daten"
              className="text-accent underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              EFV Finanzstatistik
            </a>{" "}
            is planned next; EFV currently publishes full Gemeinde comparisons
            mainly for municipalities with 5,000+ residents.
          </p>
        </section>
      </main>
    </div>
  );
}
