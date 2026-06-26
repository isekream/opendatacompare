#!/usr/bin/env node
/**
 * Builds Gemeinde-level finance indicators for Canton Zürich.
 * Source: Statistisches Amt Kanton Zürich OGD (HRM2, consolidated Gemeinde).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../data/ch/zh-gemeinde-finances.json");

const BASE_URL = "https://www.web.statistik.zh.ch/ogd/data";

/** Service-area Nettoaufwand files (excludes Finanzen/Steuern & Volkswirtschaft offsets). */
const OPERATING_COMPONENT_FILES = [
  { id: "administration", label: "General administration", file: "KANTON_ZUERICH_420.csv" },
  { id: "public_order", label: "Public order & security", file: "KANTON_ZUERICH_425.csv" },
  { id: "education", label: "Education", file: "KANTON_ZUERICH_421.csv" },
  { id: "social_security", label: "Social security", file: "KANTON_ZUERICH_426.csv" },
  { id: "health", label: "Health", file: "KANTON_ZUERICH_423.csv" },
  { id: "transport", label: "Transport & telecom", file: "KANTON_ZUERICH_428.csv" },
  { id: "environment", label: "Environment & spatial planning", file: "KANTON_ZUERICH_427.csv" },
  { id: "culture", label: "Culture, sport & leisure", file: "KANTON_ZUERICH_424.csv" },
];

/** Single-value Gemeindekennziffern indicators (same CSV shape). */
const SIMPLE_INDICATOR_FILES = [
  {
    id: "equity_per_capita",
    label: "Equity per resident",
    description: "Municipal equity (Eigenkapital) per resident.",
    file: "KANTON_ZUERICH_414.csv",
    format: "currency",
    unit: "CHF",
    unitLabel: "CHF per resident",
    methodology: {
      summary: "Municipal equity (Eigenkapital) divided by resident population.",
      notes: ["Source: Gemeindekennziffern indicator 414, Kanton Zürich OGD."],
    },
  },
  {
    id: "debt_per_capita",
    label: "Debt per resident",
    description: "Municipal debt (Fremdkapital) per resident.",
    file: "KANTON_ZUERICH_416.csv",
    format: "currency",
    unit: "CHF",
    unitLabel: "CHF per resident",
    methodology: {
      summary: "Municipal debt (Fremdkapital) divided by resident population.",
      notes: ["Source: Gemeindekennziffern indicator 416, Kanton Zürich OGD."],
    },
  },
  {
    id: "gross_debt_ratio",
    label: "Gross debt ratio",
    description:
      "Debt as a share of total municipal assets (Bruttoverschuldungsanteil).",
    file: "KANTON_ZUERICH_413.csv",
    format: "percent",
    unit: "%",
    unitLabel: "percent of assets",
    methodology: {
      summary:
        "Debt as a percentage of total municipal assets (Bruttoverschuldungsanteil).",
      notes: [
        "Useful for comparing leverage independent of commune size.",
        "Source: Gemeindekennziffern indicator 413, Kanton Zürich OGD.",
      ],
    },
  },
  {
    id: "investment_share",
    label: "Investment share of spending",
    description:
      "Share of municipal expenditure used for investments (Investitionsanteil).",
    file: "KANTON_ZUERICH_418.csv",
    format: "percent",
    unit: "%",
    unitLabel: "percent of expenditure",
    methodology: {
      summary:
        "Share of municipal expenditure allocated to investments (Investitionsanteil).",
      notes: [
        "Complements per-capita operating spend by showing capital allocation.",
        "Source: Gemeindekennziffern indicator 418, Kanton Zürich OGD.",
      ],
    },
  },
];

const OPERATING_METRIC = {
  id: "operating_expenditure",
  label: "Operating expenditure per resident",
  description:
    "Sum of municipal Nettoaufwand across core service areas (administration, education, health, social security, transport, environment, culture, public order). Excludes Finanzen/Steuern and Volkswirtschaft, which are mainly fiscal transfers rather than service spending.",
  format: "currency",
  unit: "CHF",
  unitLabel: "CHF per resident per year",
  methodology: {
    summary:
      "Total Nettoaufwand for eight core municipal service areas, expressed per resident.",
    includes: [
      "Administration, public order, education, social security",
      "Health, transport, environment, culture & leisure",
    ],
    excludes: [
      "Finanzen/Steuern (fiscal transfers & tax administration)",
      "Volkswirtschaft (economic development offsets)",
    ],
    notes: [
      "Source subset: Gemeinde Nettoaufwand from Kanton Zürich OGD CSVs.",
      "Higher values mean more service spending per resident, not total budget size alone.",
    ],
  },
};

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result;
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    return Object.fromEntries(header.map((key, i) => [key, cols[i] ?? ""]));
  });
}

async function loadCsv(file) {
  const res = await fetch(`${BASE_URL}/${file}`, {
    headers: { "User-Agent": "OpenDataCompare/0.1 (opendatacompare.com)" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${file}: ${res.status}`);
  }
  return parseCsv(await res.text());
}

function latestYear(rows) {
  return rows.reduce((max, row) => {
    const year = Number(row.INDIKATOR_JAHR);
    return Number.isFinite(year) && year > max ? year : max;
  }, 0);
}

function communeKey(bfsNumber) {
  return Number(bfsNumber);
}

function ensureCommune(byCommune, row, year) {
  const bfsNumber = communeKey(row.BFS_NR);
  if (!Number.isFinite(bfsNumber)) return undefined;

  const existing = byCommune.get(bfsNumber) ?? {
    bfsNumber,
    name: row.GEBIET_NAME,
    canton: "ZH",
    year,
    metrics: {},
  };

  existing.name = row.GEBIET_NAME;
  byCommune.set(bfsNumber, existing);
  return existing;
}

async function main() {
  const operatingRows = await Promise.all(
    OPERATING_COMPONENT_FILES.map(async (component) => ({
      ...component,
      rows: await loadCsv(component.file),
    })),
  );

  const simpleRows = await Promise.all(
    SIMPLE_INDICATOR_FILES.map(async (indicator) => ({
      ...indicator,
      rows: await loadCsv(indicator.file),
    })),
  );

  const targetYear = Math.min(
    ...operatingRows.map((c) => latestYear(c.rows)),
    ...simpleRows.map((c) => latestYear(c.rows)),
  );

  const byCommune = new Map();

  for (const component of operatingRows) {
    for (const row of component.rows) {
      if (Number(row.INDIKATOR_JAHR) !== targetYear) continue;
      if (row.SUBSET_NAME !== "Gemeinde Nettoaufwand") continue;
      if (!row.INDIKATOR_VALUE) continue;

      const value = Number(row.INDIKATOR_VALUE);
      if (!Number.isFinite(value)) continue;

      const commune = ensureCommune(byCommune, row, targetYear);
      if (!commune) continue;

      const operating = commune.metrics.operating_expenditure ?? {
        value: 0,
        components: {},
      };
      operating.components[component.id] = value;
      operating.value = Object.values(operating.components).reduce(
        (sum, v) => sum + v,
        0,
      );
      commune.metrics.operating_expenditure = operating;
    }
  }

  for (const indicator of simpleRows) {
    for (const row of indicator.rows) {
      if (Number(row.INDIKATOR_JAHR) !== targetYear) continue;
      if (row.SUBSET_NAME !== "Gemeindekennziffern") continue;
      if (!row.INDIKATOR_VALUE) continue;

      const value = Number(row.INDIKATOR_VALUE);
      if (!Number.isFinite(value)) continue;

      const commune = ensureCommune(byCommune, row, targetYear);
      if (!commune) continue;

      commune.metrics[indicator.id] = { value };
    }
  }

  const communes = [...byCommune.values()]
    .filter((commune) => commune.metrics.operating_expenditure?.value)
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  const metrics = [
    {
      ...OPERATING_METRIC,
      components: OPERATING_COMPONENT_FILES.map(({ id, label }) => ({ id, label })),
    },
    ...SIMPLE_INDICATOR_FILES.map(
      ({ id, label, description, format, unit, unitLabel, methodology }) => ({
        id,
        label,
        description,
        format,
        unit,
        unitLabel,
        methodology,
      }),
    ),
  ];

  const payload = {
    schemaVersion: 1,
    year: targetYear,
    coverage: {
      level: "commune",
      canton: "ZH",
      communeCount: communes.length,
    },
    source: {
      name: "Statistisches Amt des Kantons Zürich",
      publisher: "Kanton Zürich",
      url: "https://www.zh.ch/de/politik-staat/gemeinden/gemeindeportraet.html",
      dataset: "Gemeindefinanzen (OGD)",
      license: "NonCommercialAllowed-CommercialAllowed-ReferenceRequired",
    },
    metrics,
    communes,
    builtAt: new Date().toISOString(),
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(
    `Wrote ${communes.length} communes, ${metrics.length} metrics for ${targetYear} → ${OUT_PATH}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
