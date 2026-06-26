export const COMPARISON_SCHEMA_VERSION = 1 as const;

export type ValueFormat = "currency" | "percent" | "number";

export type DataSource = {
  name: string;
  publisher: string;
  url: string;
  dataset: string;
  license: string;
};

export type IndicatorMethodology = {
  summary: string;
  includes?: string[];
  excludes?: string[];
  notes?: string[];
};

export type IndicatorComponent = {
  id: string;
  label: string;
};

export type IndicatorDefinition = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  format: ValueFormat;
  unit: string;
  unitLabel: string;
  methodology: IndicatorMethodology;
  components?: IndicatorComponent[];
};

export type JurisdictionValue = {
  value: number;
  components?: Record<string, number>;
};

export type JurisdictionRecord = {
  id: string;
  externalId: number;
  name: string;
  region: string;
  year: number;
  values: Record<string, JurisdictionValue>;
};

export type ComparisonDataset = {
  schemaVersion: typeof COMPARISON_SCHEMA_VERSION;
  year: number;
  builtAt: string;
  coverage: {
    level: string;
    region: string;
    jurisdictionCount: number;
  };
  source: DataSource;
  indicators: IndicatorDefinition[];
  jurisdictions: JurisdictionRecord[];
};
