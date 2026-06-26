#!/usr/bin/env node
/**
 * Builds Gemeinde operating expenditure + population for Canton Zürich.
 * Source: Statistisches Amt Kanton Zürich OGD.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../data/ch/zh-gemeinde-spending.json");

const BASE_URL = "https://www.web.statistik.zh.ch/ogd/data";

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

const POPULATION_FILE = "KANTON_ZUERICH_133.csv";

const METRIC = {
  id: "operating_expenditure",
  label: "Operating expenditure per resident",
  description:
    "Sum of municipal Nettoaufwand across core service areas (administration, education, health, social security, transport, environment, culture, public order). Excludes Finanzen/Steuern and Volkswirtschaft.",
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
      "Source: Gemeinde Nettoaufwand from Kanton Zürich OGD CSVs.",
      "Peers are municipalities with similar resident population, not geographic neighbours.",
    ],
  },
  components: OPERATING_COMPONENT_FILES.map(({ id, label }) => ({ id, label })),
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
    population: 0,
    operatingExpenditure: { value: 0, components: {} },
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

  const populationRows = await loadCsv(POPULATION_FILE);

  const targetYear = Math.min(
    ...operatingRows.map((c) => latestYear(c.rows)),
    latestYear(populationRows),
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

      commune.operatingExpenditure.components[component.id] = value;
      commune.operatingExpenditure.value = Object.values(
        commune.operatingExpenditure.components,
      ).reduce((sum, v) => sum + v, 0);
    }
  }

  for (const row of populationRows) {
    if (Number(row.INDIKATOR_JAHR) !== targetYear) continue;
    if (row.SUBSET_NAME !== "Bevölkerungsbestand") continue;
    if (!row.INDIKATOR_VALUE) continue;

    const value = Number(row.INDIKATOR_VALUE);
    if (!Number.isFinite(value) || value <= 0) continue;

    const commune = ensureCommune(byCommune, row, targetYear);
    if (!commune) continue;

    commune.population = value;
  }

  const communes = [...byCommune.values()]
    .filter(
      (commune) =>
        commune.operatingExpenditure.value > 0 && commune.population > 0,
    )
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  const payload = {
    schemaVersion: 2,
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
      dataset: "Gemeindefinanzen & Bevölkerungsbestand (OGD)",
      license: "NonCommercialAllowed-CommercialAllowed-ReferenceRequired",
      populationIndicator: "Bevölkerung [Pers.] (OGD indicator 133)",
    },
    metric: METRIC,
    communes,
    builtAt: new Date().toISOString(),
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(
    `Wrote ${communes.length} communes for ${targetYear} → ${OUT_PATH}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
