import { NextResponse } from "next/server";

import {
  formatChf,
  getSpendingDataset,
  searchGemeinden,
} from "@/lib/spending/zh-spending";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  const dataset = getSpendingDataset();

  if (!query.trim()) {
    return NextResponse.json({
      year: dataset.year,
      coverage: dataset.coverage,
      communes: dataset.communes.map((commune) => ({
        bfsNumber: commune.bfsNumber,
        name: commune.name,
        canton: commune.canton,
        population: commune.population,
        value: commune.operatingExpenditure.value,
      })),
    });
  }

  return NextResponse.json({
    results: searchGemeinden(query).map((commune) => ({
      bfsNumber: commune.bfsNumber,
      name: commune.name,
      canton: commune.canton,
      year: commune.year,
      population: commune.population,
      value: commune.operatingExpenditure.value,
      valueLabel: formatChf(commune.operatingExpenditure.value),
    })),
  });
}
