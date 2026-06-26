import dataset from "../../../data/ch/zh-gemeinde-finances.json";
import type {
  CommuneFinance,
  FinanceDataset,
  FinanceMetricId,
  MetricDefinition,
  MetricFormat,
} from "./types";

const financeDataset = dataset as FinanceDataset;

export function getZhFinanceDataset(): FinanceDataset {
  return financeDataset;
}

export function getMetricDefinition(
  metricId: FinanceMetricId,
): MetricDefinition | undefined {
  return financeDataset.metrics.find((metric) => metric.id === metricId);
}

export function getCommuneMetricValue(
  commune: CommuneFinance,
  metricId: FinanceMetricId,
): number | undefined {
  return commune.metrics[metricId]?.value;
}

export function searchZhCommunes(query: string, limit = 12): CommuneFinance[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return financeDataset.communes
    .filter((commune) => commune.name.toLowerCase().includes(normalized))
    .slice(0, limit);
}

export function getZhCommuneByBfsNumber(
  bfsNumber: number,
): CommuneFinance | undefined {
  return financeDataset.communes.find(
    (commune) => commune.bfsNumber === bfsNumber,
  );
}

export function compareZhCommunes(
  bfsNumbers: number[],
  metricId: FinanceMetricId = "operating_expenditure",
): CommuneFinance[] {
  return bfsNumbers
    .map((bfsNumber) => getZhCommuneByBfsNumber(bfsNumber))
    .filter((commune): commune is CommuneFinance => commune !== undefined)
    .filter((commune) => getCommuneMetricValue(commune, metricId) !== undefined);
}

export function rankCommunesByMetric(
  metricId: FinanceMetricId,
): CommuneFinance[] {
  return [...financeDataset.communes]
    .filter((commune) => getCommuneMetricValue(commune, metricId) !== undefined)
    .sort(
      (a, b) =>
        (getCommuneMetricValue(b, metricId) ?? 0) -
        (getCommuneMetricValue(a, metricId) ?? 0),
    );
}

export function percentileForCommune(
  commune: CommuneFinance,
  metricId: FinanceMetricId,
): number {
  const ranked = rankCommunesByMetric(metricId);
  const index = ranked.findIndex((item) => item.bfsNumber === commune.bfsNumber);
  if (index < 0 || ranked.length <= 1) return 0;
  return Math.round(((ranked.length - 1 - index) / (ranked.length - 1)) * 100);
}

export function formatMetricValue(value: number, format: MetricFormat): string {
  if (format === "percent") {
    return `${new Intl.NumberFormat("de-CH", {
      maximumFractionDigits: 1,
    }).format(value)}%`;
  }

  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatChfPerCapita(value: number): string {
  return formatMetricValue(value, "currency");
}
