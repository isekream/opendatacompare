import { NextResponse } from "next/server";

import {
  formatChf,
  getSpendingDataset,
  hasSpendingData,
  searchGemeinden,
} from "@/lib/spending/ch-spending";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  const dataset = getSpendingDataset();

  if (!query.trim()) {
    return NextResponse.json({
      year: dataset.year,
      coverage: dataset.coverage,
      communes: dataset.communes
        .filter(hasSpendingData)
        .map((commune) => ({
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
      hasSpendingData: hasSpendingData(commune),
      value: commune.operatingExpenditure?.value,
      valueLabel: commune.operatingExpenditure
        ? formatChf(commune.operatingExpenditure.value)
        : undefined,
    })),
  });
}
