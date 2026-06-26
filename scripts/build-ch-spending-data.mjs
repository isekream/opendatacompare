#!/usr/bin/env node
/**
 * Builds nationwide Gemeinde spending data:
 * - All political municipalities (BFS directory + population)
 * - Harmonized EFV FS/HRM2 operating expenditure where published
 * - Canton OGD supplements calibrated to EFV (Zürich small communes)
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
const BFS_COMMUNE_LEVELS_CSV =
  "https://www.agvchapp.bfs.admin.ch/api/communes/levels?date=01-01-2024&format=csv";
const ZH_OGD_BASE = "https://www.web.statistik.zh.ch/ogd/data";

const TARGET_YEAR = 2023;

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

const CANTON_LABEL_TO_CODE = {
  Zürich: "ZH",
  "Bern / Berne": "BE",
  Luzern: "LU",
  Uri: "UR",
  Schwyz: "SZ",
  Obwalden: "OW",
  Nidwalden: "NW",
  Glarus: "GL",
  Zug: "ZG",
  "Fribourg / Freiburg": "FR",
  Solothurn: "SO",
  "Basel-Stadt": "BS",
  "Basel-Landschaft": "BL",
  Schaffhausen: "SH",
  "Appenzell Ausserrhoden": "AR",
  "Appenzell Innerrhoden": "AI",
  "St. Gallen": "SG",
  "Graubünden / Grigioni / Grischun": "GR",
  Aargau: "AG",
  Thurgau: "TG",
  Ticino: "TI",
  Vaud: "VD",
  "Valais / Wallis": "VS",
  Neuchâtel: "NE",
  Genève: "GE",
  Jura: "JU",
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

const ZH_OGD_COMPONENT_FILES = [
  { id: "administration", file: "KANTON_ZUERICH_420.csv" },
  { id: "public_order", file: "KANTON_ZUERICH_425.csv" },
  { id: "education", file: "KANTON_ZUERICH_421.csv" },
  { id: "social_security", file: "KANTON_ZUERICH_426.csv" },
  { id: "health", file: "KANTON_ZUERICH_423.csv" },
  { id: "transport", file: "KANTON_ZUERICH_428.csv" },
  { id: "environment", file: "KANTON_ZUERICH_427.csv" },
  { id: "culture", file: "KANTON_ZUERICH_424.csv" },
];

const METRIC = {
  id: "operating_expenditure",
  label: "Operating expenditure per resident",
  description:
    "Harmonized current service expenditure (EFV FS/HRM2 account class 3) by municipal function, excluding taxes, fiscal transfers, debt administration, and economic development.",
  format: "currency",
  unit: "CHF",
  unitLabel: "CHF per resident per year",
  methodology: {
    summary:
      "Sum of EFV Finanzierungsrechnung service-area expenditure (function codes 01–79), expressed per resident using the same exclusions nationwide.",
    includes: COMPONENTS.map((c) => c.label),
    excludes: [
      "Finanzen/Steuern (taxes, fiscal equalisation)",
      "Vermögens- und Schuldenverwaltung (debt & asset administration)",
      "Volkswirtschaft (economic development)",
      "Nicht aufgeteilte Posten",
    ],
    notes: [
      "Primary source: EFV Finanzstatistik (federal harmonization on HRM2).",
      "Population: BFS ständige Wohnbevölkerung, 31 December (same year as finances).",
      "Peers are municipalities with similar resident population nationwide.",
      "Where EFV does not publish individual accounts (<5,000 residents in most cantons), canton OGD Nettoaufwand is scaled to EFV using median overlap ratios — comparable in scope, not identical accounting.",
      "Canton task allocation still differs; population-based peers mitigate but do not remove structural differences.",
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
  const header = parseCsvLine(lines[0], ";");
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line, ";");
    return Object.fromEntries(header.map((key, i) => [key, cols[i] ?? ""]));
  });
}

function parseCommaCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0], ",");
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line, ",");
    return Object.fromEntries(header.map((key, i) => [key, cols[i] ?? ""]));
  });
}

function parseCsvLine(line, delimiter) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
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

function median(values) {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
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

function loadBfsCommuneDirectory(csvText) {
  const rows = parseCommaCsv(csvText);
  const byBfs = new Map();

  for (const row of rows) {
    const bfsNumber = Number(row.BfsCode);
    const canton = CANTON_LABEL_TO_CODE[row.Canton];
    const name = row.Name?.trim();

    if (!Number.isFinite(bfsNumber) || !canton || !name) continue;

    byBfs.set(bfsNumber, { bfsNumber, name, canton });
  }

  return byBfs;
}

function createCommuneSkeleton(directoryEntry, populationEntry) {
  return {
    bfsNumber: directoryEntry.bfsNumber,
    name: populationEntry?.name ?? directoryEntry.name,
    canton: directoryEntry.canton,
    year: TARGET_YEAR,
    population: populationEntry?.population ?? 0,
    operatingExpenditure: undefined,
    dataSource: undefined,
  };
}

function applyEfvSpending(communesByBfs, efvRows) {
  const scratch = new Map();

  for (const row of efvRows) {
    if (row.jahr !== String(TARGET_YEAR)) continue;

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
      scratch.get(parsed.bfsNumber) ??
      {
        totalSpend: 0,
        components: {},
        name: row.gemeinde?.trim(),
      };

    commune.name = row.gemeinde?.trim() || commune.name;
    commune.totalSpend += amount;
    commune.components[componentId] =
      (commune.components[componentId] ?? 0) + amount;

    scratch.set(parsed.bfsNumber, commune);
  }

  let applied = 0;

  for (const [bfsNumber, totals] of scratch) {
    const commune = communesByBfs.get(bfsNumber);
    if (!commune || commune.population <= 0 || totals.totalSpend <= 0) continue;

    commune.name = totals.name ?? commune.name;
    commune.operatingExpenditure = {
      value: Math.round(totals.totalSpend / commune.population),
      components: Object.fromEntries(
        Object.entries(totals.components).map(([id, value]) => [
          id,
          Math.round(value / commune.population),
        ]),
      ),
    };
    commune.dataSource = "efv";
    applied += 1;
  }

  return applied;
}

async function loadZhOgdSpendingByBfs() {
  const byBfs = new Map();

  for (const component of ZH_OGD_COMPONENT_FILES) {
    const rows = parseCommaCsv(
      await fetchText(`${ZH_OGD_BASE}/${component.file}`),
    );

    for (const row of rows) {
      if (row.SUBSET_NAME !== "Gemeinde Nettoaufwand") continue;
      if (Number(row.INDIKATOR_JAHR) !== TARGET_YEAR) continue;

      const bfsNumber = Number(row.BFS_NR);
      const value = Number(row.INDIKATOR_VALUE);
      if (!Number.isFinite(bfsNumber) || !Number.isFinite(value)) continue;

      const commune =
        byBfs.get(bfsNumber) ??
        {
          name: row.GEBIET_NAME?.trim(),
          totalPerCapita: 0,
          components: {},
        };

      commune.name = row.GEBIET_NAME?.trim() || commune.name;
      commune.components[component.id] = value;
      commune.totalPerCapita += value;
      byBfs.set(bfsNumber, commune);
    }
  }

  return byBfs;
}

function computeZhCalibrationRatio(communesByBfs, zhOgdByBfs) {
  const ratios = [];

  for (const [bfsNumber, ogd] of zhOgdByBfs) {
    const commune = communesByBfs.get(bfsNumber);
    if (
      !commune?.operatingExpenditure ||
      commune.dataSource !== "efv" ||
      ogd.totalPerCapita <= 0
    ) {
      continue;
    }

    ratios.push(commune.operatingExpenditure.value / ogd.totalPerCapita);
  }

  return median(ratios);
}

function applyCalibratedZhSpending(communesByBfs, zhOgdByBfs, calibrationRatio) {
  if (!calibrationRatio || !Number.isFinite(calibrationRatio)) return 0;

  let applied = 0;

  for (const [bfsNumber, ogd] of zhOgdByBfs) {
    const commune = communesByBfs.get(bfsNumber);
    if (!commune || commune.population <= 0 || ogd.totalPerCapita <= 0) continue;
    if (commune.operatingExpenditure) continue;

    commune.name = ogd.name ?? commune.name;
    commune.operatingExpenditure = {
      value: Math.round(ogd.totalPerCapita * calibrationRatio),
      components: Object.fromEntries(
        Object.entries(ogd.components).map(([id, value]) => [
          id,
          Math.round(value * calibrationRatio),
        ]),
      ),
    };
    commune.dataSource = "efv_calibrated";
    applied += 1;
  }

  return applied;
}

async function main() {
  console.log("Fetching BFS commune directory…");
  const directoryByBfs = loadBfsCommuneDirectory(
    await fetchText(BFS_COMMUNE_LEVELS_CSV),
  );

  console.log(`Fetching BFS population (${TARGET_YEAR})…`);
  const populationByBfs = loadPopulationByBfs(
    await fetchBuffer(BFS_POPULATION_XLSX),
  );

  const communesByBfs = new Map();

  for (const [bfsNumber, directoryEntry] of directoryByBfs) {
    const populationEntry = populationByBfs[String(bfsNumber)];
    communesByBfs.set(
      bfsNumber,
      createCommuneSkeleton(directoryEntry, populationEntry),
    );
  }

  console.log(`Loaded ${communesByBfs.size} municipalities from BFS.`);

  console.log("Fetching EFV Gemeinde finances…");
  const efvRows = parseSemicolonCsv(await fetchText(EFV_GDN_CSV));
  const efvApplied = applyEfvSpending(communesByBfs, efvRows);
  console.log(`Applied EFV spending to ${efvApplied} municipalities.`);

  console.log("Fetching Zürich OGD for calibrated small-commune supplement…");
  const zhOgdByBfs = await loadZhOgdSpendingByBfs();
  const calibrationRatio = computeZhCalibrationRatio(communesByBfs, zhOgdByBfs);
  const zhApplied = applyCalibratedZhSpending(
    communesByBfs,
    zhOgdByBfs,
    calibrationRatio,
  );
  console.log(
    `Applied calibrated ZH OGD spending to ${zhApplied} municipalities (ratio ${calibrationRatio?.toFixed(3) ?? "n/a"}).`,
  );

  const communes = [...communesByBfs.values()]
    .filter((commune) => commune.population > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  const withSpending = communes.filter(
    (commune) => commune.operatingExpenditure !== undefined,
  );

  const payload = {
    schemaVersion: 4,
    year: TARGET_YEAR,
    coverage: {
      level: "commune",
      scope: "All Switzerland political municipalities",
      communeCount: communes.length,
      withSpendingDataCount: withSpending.length,
      efvDirectCount: withSpending.filter((c) => c.dataSource === "efv").length,
      efvCalibratedCount: withSpending.filter(
        (c) => c.dataSource === "efv_calibrated",
      ).length,
    },
    source: {
      name: "Eidgenössische Finanzverwaltung (EFV) + BFS",
      publisher: "EFV Finanzstatistik / BFS",
      url: "https://www.efv.admin.ch/de/fs-daten",
      dataset:
        "gdn_ab_5000-d.csv (EFV direct) + Kanton Zürich OGD Nettoaufwand (calibrated)",
      license: "Open Government Data Switzerland",
      populationIndicator:
        "BFS ständige Wohnbevölkerung in Privathaushalten, 31. Dezember",
      populationUrl:
        "https://www.bfs.admin.ch/bfs/de/home/statistiken/bevoelkerung.html",
      communeDirectoryUrl: "https://www.agvchapp.bfs.admin.ch/",
    },
    metric: METRIC,
    communes,
    builtAt: new Date().toISOString(),
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(
    `Wrote ${communes.length} municipalities (${withSpending.length} with spending) → ${OUT_PATH}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
