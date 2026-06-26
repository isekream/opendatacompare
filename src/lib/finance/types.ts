export type ExpenditureComponentId =
  | "administration"
  | "public_order"
  | "education"
  | "social_security"
  | "health"
  | "transport"
  | "environment"
  | "culture";

export type FinanceMetricId =
  | "operating_expenditure"
  | "equity_per_capita"
  | "debt_per_capita"
  | "gross_debt_ratio"
  | "investment_share";

export type MetricFormat = "currency" | "percent";

export type MetricDefinition = {
  id: FinanceMetricId;
  label: string;
  description: string;
  format: MetricFormat;
  unit: string;
  unitLabel: string;
  components?: { id: ExpenditureComponentId; label: string }[];
};

export type CommuneMetricValue = {
  value: number;
  components?: Partial<Record<ExpenditureComponentId, number>>;
};

export type CommuneFinance = {
  bfsNumber: number;
  name: string;
  canton: string;
  year: number;
  metrics: Partial<Record<FinanceMetricId, CommuneMetricValue>>;
};

export type FinanceDataset = {
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
  };
  metrics: MetricDefinition[];
  communes: CommuneFinance[];
  builtAt: string;
};

/** @deprecated Use CommuneFinance */
export type CommuneExpenditure = CommuneFinance & {
  totalPerCapita: number;
  components: Partial<Record<ExpenditureComponentId, number>>;
};

/** @deprecated Use FinanceDataset */
export type ExpenditureDataset = FinanceDataset & {
  metricId: string;
  label: string;
  description: string;
  unit: string;
  unitLabel: string;
  components: { id: ExpenditureComponentId; label: string }[];
};
