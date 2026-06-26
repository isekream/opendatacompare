export const COMMUNE_SERIES_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#ef4444",
] as const;

export function communeSeriesColor(index: number): string {
  return COMMUNE_SERIES_COLORS[index % COMMUNE_SERIES_COLORS.length];
}
