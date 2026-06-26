#!/usr/bin/env node
/**
 * Builds nationwide Gemeinde operating expenditure (EFV Finanzstatistik)
 * for municipalities with ≥5,000 residents, with BFS population.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../data/ch/ch-gemeinde-spending.json");
const POPULATION_PARSER = join(__dirname, "parse-bfs-population.py");

const EFV_GDN_CSV =
  "https://www.data.finance.admin.ch/static/assets/datasets/fs_dashboard/gdn_ab_5000-d.csv";
const BFS_POPULATION_XLSX =
  "https://dam-api.bfs.admin.ch/hub/api/dam/assets/32408793/master";

const EXCLUDED_FUNCTIONS = new Set(["91", "93", "96", "99"]);
const EXCLUDED_FUNCTION_PREFIXES = ["8", "9"];

const CANTON_BY_CODE = {
  "01": "ZH",
  "02": "BE",
  "03": "LU",
  "04": "UR",
  "05": "SZ",
  "06": "OW",
  "07": "NW",
  "08": "GL",
  "09": "ZG",
  "10": "FR",
  "11": "SO",
  "12": "BS",
  "13": "BL",
  "14": "SH",
  "15": "AR",
  "16": "AI",
  "17": "SG",
  "18": "GR",
  "19": "AG",
  "20": "TG",
  "21": "TI",
  "22": "VD",
  "23": "VS",
  "24": "NE",
  "25": "GE",
  "26": "JU",
};

const COMPONENTS = [
  { id: "administration", label: "General administration" },
  { id: "public_order", label: "Public order & security" },
  { id: "education", label: "Education" },
  { id: "social_security", label: "Social security" },
  { id: "health", label: "Health" },
  { id: "transport", label: "Transport & telecom" },
  { id: "environment", label: "Environment & spatial planning" },
  { id: "culture", label: "Culture, sport & leisure" },
];

const FUNK_TO_COMPONENT = {
  "01": "administration",
  "02": "administration",
  "03": "administration",
  "08": "administration",
  "11": "public_order",
  "12": "public_order",
  "13": "public_order",
  "14": "public_order",
  "15": "public_order",
  "16": "public_order",
  "18": "public_order",
  "21": "education",
  "22": "education",
  "23": "education",
  "25": "education",
  "26": "education",
  "27": "education",
  "28": "education",
  "29": "education",
  "51": "social_security",
  "52": "social_security",
  "53": "social_security",
  "54": "social_security",
  "55": "social_security",
  "56": "social_security",
  "57": "social_security",
  "58": "social_security",
  "59": "social_security",
  "41": "health",
  "42": "health",
  "43": "health",
  "48": "health",
  "49": "health",
  "61": "transport",
  "62": "transport",
  "63": "transport",
  "64": "transport",
  "68": "transport",
  "71": "environment",
  "72": "environment",
  "73": "environment",
  "74": "environment",
  "75": "environment",
  "76": "environment",
  "77": "environment",
  "78": "environment",
  "79": "environment",
  "31": "culture",
  "32": "culture",
  "33": "culture",
  "34": "culture",
  "35": "culture",
  "38": "culture",
};

const METRIC = {
  id: "operating_expenditure",
  label: "Operating expenditure per resident",
  description:
    "Current service expenditure (FS/HRM2 account class 3) by municipal function, excluding taxes, fiscal transfers, debt administration, and economic development.",
  format: "currency",
  unit: "CHF",
  unitLabel: "CHF per resident per year",
  methodology: {
    summary:
      "Sum of EFV Finanzierungsrechnung service-area expenditure (function codes 01–79), expressed per resident.",
    includes: COMPONENTS.map((c) => c.label),
    excludes: [
      "Finanzen/Steuern (taxes, fiscal equalisation)",
      "Vermögens- und Schuldenverwaltung (debt & asset administration)",
      "Volkswirtschaft (economic development)",
      "Nicht aufgeteilte Posten",
    ],
    notes: [
      "Source: EFV Finanzstatistik gdn_ab_5000 (municipalities ≥5,000 residents).",
      "Population: BFS ständige Wohnbevölkerung, 31 December (household statistics).",
      "Peers are municipalities with similar resident population nationwide.",
      "EFV uses gross current expenditure; canton OGD Nettoaufwand figures may differ.",
    ],
  },
  components: COMPONENTS,
};

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "OpenDataCompare/0.1 (opendatacompare.com)" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.text();
}

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "OpenDataCompare/0.1 (opendatacompare.com)" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function parseSemicolonCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    return Object.fromEntries(header.map((key, i) => [key, cols[i] ?? ""]));
  });
}

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
    if (char === ";" && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result;
}

function parseEfvNr(nr) {
  const digits = nr.replace(/\D/g, "");
  if (digits.length < 5) return undefined;

  const cantonCode = digits.slice(0, 2);
  const bfsNumber = Number(digits.slice(-4));
  const canton = CANTON_BY_CODE[cantonCode];

  if (!canton || !Number.isFinite(bfsNumber)) return undefined;
  return { bfsNumber, canton };
}

function isServiceFunction(funk) {
  if (!funk) return false;
  if (EXCLUDED_FUNCTIONS.has(funk)) return false;
  return !EXCLUDED_FUNCTION_PREFIXES.some((prefix) => funk.startsWith(prefix));
}

function loadPopulationByBfs(xlsxBuffer) {
  const tempDir = mkdtempSync(join(tmpdir(), "odc-bfs-"));
  const xlsxPath = join(tempDir, "population.xlsx");

  try {
    writeFileSync(xlsxPath, xlsxBuffer);
    const json = execFileSync("python3", [POPULATION_PARSER, xlsxPath], {
      encoding: "utf8",
    });
    return JSON.parse(json);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function mainFromRows(rows, populationByBfs, targetYear) {
  const byCommune = new Map();

  for (const row of rows) {
    if (row.jahr !== String(targetYear)) continue;

    const parsed = parseEfvNr(row.nr);
    if (!parsed) continue;

    const funk = row.funktion?.trim();
    const konto = row.konto?.trim();
    if (!funk || !konto?.startsWith("3") || !isServiceFunction(funk)) continue;

    const componentId = FUNK_TO_COMPONENT[funk];
    if (!componentId) continue;

    const amount = Number(row.betrag);
    if (!Number.isFinite(amount)) continue;

    const commune =
      byCommune.get(parsed.bfsNumber) ??
      {
        bfsNumber: parsed.bfsNumber,
        name: row.gemeinde?.trim() || `Gemeinde ${parsed.bfsNumber}`,
        canton: parsed.canton,
        year: targetYear,
        population: 0,
        totalSpend: 0,
        components: {},
      };

    commune.name = row.gemeinde?.trim() || commune.name;
    commune.canton = parsed.canton;
    commune.totalSpend += amount;
    commune.components[componentId] =
      (commune.components[componentId] ?? 0) + amount;

    byCommune.set(parsed.bfsNumber, commune);
  }

  const communes = [...byCommune.values()]
    .map((commune) => {
      const population = populationByBfs[String(commune.bfsNumber)];
      if (!population || commune.totalSpend <= 0) return undefined;

      const perCapita = Math.round(commune.totalSpend / population);
      const components = Object.fromEntries(
        Object.entries(commune.components).map(([id, value]) => [
          id,
          Math.round(value / population),
        ]),
      );

      return {
        bfsNumber: commune.bfsNumber,
        name: commune.name,
        canton: commune.canton,
        year: commune.year,
        population,
        operatingExpenditure: {
          value: perCapita,
          components,
        },
      };
    })
    .filter((commune) => commune !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  return communes;
}

async function main() {
  console.log("Fetching EFV Gemeinde finances…");
  const efvRows = parseSemicolonCsv(await fetchText(EFV_GDN_CSV));

  const targetYear = efvRows.reduce((max, row) => {
    const year = Number(row.jahr);
    return Number.isFinite(year) && year > max ? year : max;
  }, 0);

  console.log(`Fetching BFS population (${targetYear})…`);
  const populationByBfs = loadPopulationByBfs(await fetchBuffer(BFS_POPULATION_XLSX));

  const communes = mainFromRows(efvRows, populationByBfs, targetYear);

  const payload = {
    schemaVersion: 3,
    year: targetYear,
    coverage: {
      level: "commune",
      scope: "Switzerland · municipalities ≥5,000 residents",
      communeCount: communes.length,
    },
    source: {
      name: "Eidgenössische Finanzverwaltung (EFV)",
      publisher: "EFV Finanzstatistik",
      url: "https://www.efv.admin.ch/de/fs-daten",
      dataset: "gdn_ab_5000-d.csv (FS/HRM2)",
      license: "Open Government Data Switzerland",
      populationIndicator:
        "BFS ständige Wohnbevölkerung in Privathaushalten, 31. Dezember",
      populationUrl: "https://www.bfs.admin.ch/bfs/de/home/statistiken/bevoelkerung.html",
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
