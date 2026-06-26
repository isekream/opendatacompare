import dataset from "../../../data/ch/ch-gemeinde-spending.json";
import type {
  GemeindeSpending,
  PeerBand,
  SpendingDataset,
  SpendingInterpretation,
  SpendingReport,
} from "./types";

const spendingDataset = dataset as SpendingDataset;

const PEER_COUNT = 8;

export function getSpendingDataset(): SpendingDataset {
  return spendingDataset;
}

export function searchGemeinden(query: string, limit = 10): GemeindeSpending[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return spendingDataset.communes
    .filter((commune) => commune.name.toLowerCase().includes(normalized))
    .slice(0, limit);
}

export function getGemeindeByBfs(bfsNumber: number): GemeindeSpending | undefined {
  return spendingDataset.communes.find(
    (commune) => commune.bfsNumber === bfsNumber,
  );
}

export function formatChf(value: number): string {
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPopulation(value: number): string {
  return new Intl.NumberFormat("de-CH").format(value);
}

function populationDistance(a: GemeindeSpending, b: GemeindeSpending): number {
  return Math.abs(Math.log(a.population) - Math.log(b.population));
}

export function findPeerGemeinden(
  commune: GemeindeSpending,
  count = PEER_COUNT,
): GemeindeSpending[] {
  return spendingDataset.communes
    .filter((candidate) => candidate.bfsNumber !== commune.bfsNumber)
    .map((candidate) => ({
      commune: candidate,
      distance: populationDistance(commune, candidate),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map((entry) => entry.commune);
}

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const index = (sortedValues.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];

  const weight = index - lower;
  return Math.round(
    sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight,
  );
}

export function peerBandForCommunes(communes: GemeindeSpending[]): PeerBand {
  const values = communes
    .map((commune) => commune.operatingExpenditure.value)
    .sort((a, b) => a - b);

  return {
    p25: percentile(values, 0.25),
    median: percentile(values, 0.5),
    p75: percentile(values, 0.75),
  };
}

function interpretSpending(
  commune: GemeindeSpending,
  band: PeerBand,
): SpendingInterpretation {
  const value = commune.operatingExpenditure.value;
  const deltaFromMedian = value - band.median;
  const deltaPercent =
    band.median > 0 ? Math.round((deltaFromMedian / band.median) * 100) : 0;
  const absPercent = Math.abs(deltaPercent);

  if (value > band.p75) {
    return {
      level: "higher",
      headline: `${commune.name} spends more per resident than similar municipalities`,
      detail: `At ${formatChf(value)} per resident, ${commune.name} is above the typical range for municipalities of similar size (${formatChf(band.p25)}–${formatChf(band.p75)}). That is about ${absPercent}% above the peer median of ${formatChf(band.median)}.`,
      deltaFromMedian,
      deltaPercent,
    };
  }

  if (value < band.p25) {
    return {
      level: "lower",
      headline: `${commune.name} spends less per resident than similar municipalities`,
      detail: `At ${formatChf(value)} per resident, ${commune.name} is below the typical range for municipalities of similar size (${formatChf(band.p25)}–${formatChf(band.p75)}). That is about ${absPercent}% below the peer median of ${formatChf(band.median)}.`,
      deltaFromMedian,
      deltaPercent,
    };
  }

  return {
    level: "typical",
    headline: `${commune.name} is in line with similar municipalities`,
    detail: `At ${formatChf(value)} per resident, ${commune.name} sits within the typical range for municipalities of similar size (${formatChf(band.p25)}–${formatChf(band.p75)}). The peer median is ${formatChf(band.median)}.`,
    deltaFromMedian,
    deltaPercent,
  };
}

export function buildSpendingReport(bfsNumber: number): SpendingReport | undefined {
  const commune = getGemeindeByBfs(bfsNumber);
  if (!commune) return undefined;

  const peers = findPeerGemeinden(commune);
  const peerBand = peerBandForCommunes(peers);
  const interpretation = interpretSpending(commune, peerBand);

  return {
    commune,
    peers,
    peerBand,
    interpretation,
  };
}

export function getAllGemeindeBfsNumbers(): number[] {
  return spendingDataset.communes.map((commune) => commune.bfsNumber);
}
