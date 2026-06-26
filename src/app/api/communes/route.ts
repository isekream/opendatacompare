import { NextResponse } from "next/server";
import {
  getCommuneMetricValue,
  getZhFinanceDataset,
  searchZhCommunes,
} from "@/lib/finance/zh-finance";
import type { FinanceMetricId } from "@/lib/finance/types";

const METRIC_IDS: FinanceMetricId[] = [
  "operating_expenditure",
  "equity_per_capita",
  "debt_per_capita",
  "gross_debt_ratio",
  "investment_share",
];

function isMetricId(value: string): value is FinanceMetricId {
  return METRIC_IDS.includes(value as FinanceMetricId);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const metricParam = searchParams.get("metric") ?? "operating_expenditure";
  const metricId = isMetricId(metricParam)
    ? metricParam
    : "operating_expenditure";

  const dataset = getZhFinanceDataset();

  if (!query.trim()) {
    return NextResponse.json({
      year: dataset.year,
      coverage: dataset.coverage,
      metrics: dataset.metrics,
      communes: dataset.communes.map((commune) => ({
        bfsNumber: commune.bfsNumber,
        name: commune.name,
        canton: commune.canton,
        value: getCommuneMetricValue(commune, metricId),
      })),
    });
  }

  return NextResponse.json({
    results: searchZhCommunes(query).map((commune) => ({
      bfsNumber: commune.bfsNumber,
      name: commune.name,
      canton: commune.canton,
      year: commune.year,
      value: getCommuneMetricValue(commune, metricId),
    })),
  });
}
