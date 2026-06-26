export type ExpenditureComponentId =
  | "administration"
  | "public_order"
  | "education"
  | "social_security"
  | "health"
  | "transport"
  | "environment"
  | "culture";

export type IndicatorMethodology = {
  summary: string;
  includes?: string[];
  excludes?: string[];
  notes?: string[];
};

export type SpendingMetric = {
  id: "operating_expenditure";
  label: string;
  description: string;
  format: "currency";
  unit: string;
  unitLabel: string;
  methodology: IndicatorMethodology;
  components: { id: ExpenditureComponentId; label: string }[];
};

export type GemeindeSpending = {
  bfsNumber: number;
  name: string;
  canton: string;
  year: number;
  population: number;
  operatingExpenditure: {
    value: number;
    components: Partial<Record<ExpenditureComponentId, number>>;
  };
};

export type SpendingDataset = {
  schemaVersion: number;
  year: number;
  coverage: {
    level: string;
    canton: string;
    communeCount: number;
  };
  source: {
    name: string;
    publisher: string;
    url: string;
    dataset: string;
    license: string;
    populationIndicator: string;
  };
  metric: SpendingMetric;
  communes: GemeindeSpending[];
  builtAt: string;
};

export type PeerBand = {
  p25: number;
  median: number;
  p75: number;
};

export type SpendingInterpretation = {
  level: "higher" | "lower" | "typical";
  headline: string;
  detail: string;
  deltaFromMedian: number;
  deltaPercent: number;
};

export type SpendingReport = {
  commune: GemeindeSpending;
  peers: GemeindeSpending[];
  peerBand: PeerBand;
  interpretation: SpendingInterpretation;
};
