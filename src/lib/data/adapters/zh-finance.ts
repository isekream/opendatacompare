import type { FinanceDataset } from "@/lib/finance/types";
import type { ComparisonDataset } from "../types";
import { COMPARISON_SCHEMA_VERSION } from "../types";

const SHORT_LABELS: Record<string, string> = {
  operating_expenditure: "Operating",
  equity_per_capita: "Equity",
  debt_per_capita: "Debt",
  gross_debt_ratio: "Debt ratio",
  investment_share: "Investment",
};

export function toComparisonDataset(dataset: FinanceDataset): ComparisonDataset {
  return {
    schemaVersion: COMPARISON_SCHEMA_VERSION,
    year: dataset.year,
    builtAt: dataset.builtAt,
    coverage: {
      level: dataset.coverage.level,
      region: dataset.coverage.canton,
      jurisdictionCount: dataset.coverage.communeCount,
    },
    source: dataset.source,
    indicators: dataset.metrics.map((metric) => ({
      id: metric.id,
      label: metric.label,
      shortLabel: SHORT_LABELS[metric.id] ?? metric.label,
      description: metric.description,
      format: metric.format,
      unit: metric.unit,
      unitLabel: metric.unitLabel,
      methodology: metric.methodology ?? {
        summary: metric.description,
      },
      components: metric.components?.map((component) => ({
        id: component.id,
        label: component.label,
      })),
    })),
    jurisdictions: dataset.communes.map((commune) => ({
      id: `ch-zh-${commune.bfsNumber}`,
      externalId: commune.bfsNumber,
      name: commune.name,
      region: commune.canton,
      year: commune.year,
      values: Object.fromEntries(
        Object.entries(commune.metrics).map(([indicatorId, metricValue]) => [
          indicatorId,
          {
            value: metricValue.value,
            components: metricValue.components,
          },
        ]),
      ),
    })),
  };
}
