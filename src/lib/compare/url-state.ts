import type { FinanceMetricId } from "@/lib/finance/types";

const METRIC_IDS: FinanceMetricId[] = [
  "operating_expenditure",
  "equity_per_capita",
  "debt_per_capita",
  "gross_debt_ratio",
  "investment_share",
];

const DEFAULT_SELECTION: number[] = [261, 230, 198];
const DEFAULT_METRIC: FinanceMetricId = "operating_expenditure";
const MAX_GEMEINDEN = 3;

export function isFinanceMetricId(value: string): value is FinanceMetricId {
  return METRIC_IDS.includes(value as FinanceMetricId);
}

export function parseCompareState(
  searchParams: URLSearchParams,
  validBfsNumbers: Set<number>,
): { selected: number[]; metricId: FinanceMetricId } {
  const metricParam = searchParams.get("metric");
  const metricId: FinanceMetricId =
    metricParam && isFinanceMetricId(metricParam) ? metricParam : DEFAULT_METRIC;

  const gemeindenParam = searchParams.get("gemeinden");
  if (!gemeindenParam) {
    return { selected: DEFAULT_SELECTION, metricId };
  }

  const selected = gemeindenParam
    .split(",")
    .map((part) => Number(part.trim()))
    .filter(
      (bfsNumber) =>
        Number.isFinite(bfsNumber) &&
        validBfsNumbers.has(bfsNumber) &&
        bfsNumber > 0,
    )
    .slice(0, MAX_GEMEINDEN);

  return {
    selected: selected.length > 0 ? selected : DEFAULT_SELECTION,
    metricId,
  };
}

export function buildCompareQuery(
  selected: number[],
  metricId: FinanceMetricId,
): string {
  const params = new URLSearchParams();
  params.set("gemeinden", selected.join(","));
  params.set("metric", metricId);
  return params.toString();
}
