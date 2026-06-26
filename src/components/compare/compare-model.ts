import {
  METRIC_CATALOG,
  METRIC_KEYS,
  aggregate,
  deriveMetrics,
  filterByCompetitions,
  metricValue,
  rowsForPlayer,
  type AggregateTotals,
  type CompetitionType,
  type DerivedMetrics,
  type MetricAvailability,
  type MetricFormat,
  type MetricKey,
  type PlayerId,
  type PlayerSeasonComp,
} from "@/lib/data";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Pure, server-safe model for the DEEP HEAD-TO-HEAD at `/compare` (Phase 11,
 * p11-4). It only READS the data layer and composes the existing aggregators
 * (`rowsForPlayer` → competition filter → `aggregate` → `deriveMetrics` →
 * `metricValue`). NOTHING is fabricated.
 *
 * READ-ONLY evidence — it NEVER recomputes a verdict/score. Per-row Δ and a
 * LOCAL "who-leads" marker are local evidence only, tallied into nothing. Sparse
 * data is honest: a player who did not feature in a season/age/competition is
 * `null` (rendered "—", never 0); known-missing fields (xG/xA pre-2014, the
 * forced-`н/д` cards) come through as `null` (rendered «н/д»), never a fake 0.
 *
 * The functions are intentionally cheap and called from the client `CompareView`
 * inside `useMemo` so any comp × view × focus combination recomputes from the raw
 * 222 rows without precomputing the whole (large) cross-product on the server.
 */

export type Leader = "messi" | "ronaldo" | "tie";

/** The three alignment views (re-key rows by season / single career / age). */
export type CompareView = "season" | "career" | "age";

/** A column key — either a catalog metric or raw shot volume (off totals). */
export type CompareColKey = MetricKey | "shots" | "shotsOnTarget";

/** Column metadata for the aligned dual table + career grid. */
export type CompareColumn = {
  key: CompareColKey;
  labelKey: keyof Dictionary;
  tier: "core" | "advanced";
  format: MetricFormat;
  decimals: number;
  higherIsBetter: boolean;
  availability: MetricAvailability;
  /** true = forced «н/д» (cards: 0/222 in the dataset — never claim 0). */
  forcedNa: boolean;
};

/** Always-visible CORE columns (mirrors the inline body's core tier). */
const CORE_KEYS: readonly CompareColKey[] = [
  "matches",
  "starts",
  "minutes",
  "goals",
  "assists",
  "goalContributions",
];

/** Fields the dataset does not actually carry (0/222) → forced «н/д». */
const FORCED_NA = new Set<CompareColKey>(["yellowCards", "redCards"]);

/** Raw shot-volume columns (NOT catalog metrics — read off `AggregateTotals`). */
const RAW_COLUMNS: readonly CompareColumn[] = [
  { key: "shots", labelKey: "statShots", tier: "advanced", format: "number", decimals: 0, higherIsBetter: true, availability: "always", forcedNa: false },
  { key: "shotsOnTarget", labelKey: "statShotsOnTarget", tier: "advanced", format: "number", decimals: 0, higherIsBetter: true, availability: "always", forcedNa: false },
];

/**
 * The full ordered column set: the 6 CORE catalog metrics first, then every
 * remaining catalog metric in catalog order, then the 2 raw shot-volume columns.
 * 24 catalog keys + 2 raw = the complete inventory surfaced behind Core/Advanced.
 */
export const COMPARE_COLUMNS: readonly CompareColumn[] = buildColumns();

function buildColumns(): CompareColumn[] {
  const cols: CompareColumn[] = [];
  const coreSet = new Set(CORE_KEYS);
  for (const key of CORE_KEYS) {
    const def = METRIC_CATALOG[key as MetricKey];
    cols.push(fromCatalog(def.key, "core"));
  }
  for (const key of METRIC_KEYS) {
    if (coreSet.has(key)) continue;
    cols.push(fromCatalog(key, "advanced"));
  }
  cols.push(...RAW_COLUMNS.map((c) => ({ ...c })));
  return cols;
}

function fromCatalog(key: MetricKey, tier: "core" | "advanced"): CompareColumn {
  const def = METRIC_CATALOG[key];
  return {
    key,
    labelKey: def.labelKey,
    tier,
    format: def.format,
    decimals: def.decimals,
    higherIsBetter: def.higherIsBetter,
    availability: def.availability,
    forcedNa: FORCED_NA.has(key),
  };
}

/** Read a single column's value off a slice's totals/derived (null = «н/д»). */
export function colValue(
  col: CompareColumn,
  totals: AggregateTotals,
  derived: DerivedMetrics,
): number | null {
  if (col.forcedNa) return null;
  if (col.key === "shots") return totals.shots;
  if (col.key === "shotsOnTarget") return totals.shotsOnTarget;
  return metricValue(col.key, totals, derived);
}

/** Higher-is-better catalog metrics offered as the focus / age-curve metric. */
export const FOCUS_METRICS: readonly MetricKey[] = METRIC_KEYS.filter((k) => {
  const def = METRIC_CATALOG[k];
  return def.higherIsBetter && def.availability !== "illustrative" && !FORCED_NA.has(k);
});

export const DEFAULT_FOCUS: MetricKey = "goals";

/** ---- Competition resolution (5 type contexts + 34 granular names) ---- */

export const COMPARE_CONTEXTS = [
  "all",
  "league",
  "champions_league",
  "national_team",
  "cups",
] as const;
export type CompareContext = (typeof COMPARE_CONTEXTS)[number];

const CONTEXT_SETS: Record<CompareContext, CompetitionType[] | undefined> = {
  all: undefined,
  league: ["league"],
  champions_league: ["champions_league"],
  national_team: ["national_team"],
  cups: ["domestic_cup", "super_cup", "club_world_cup"],
};

/** Canonical competition-type order for the per-competition `<tfoot>` totals. */
const TYPE_ORDER: readonly CompetitionType[] = [
  "league",
  "champions_league",
  "domestic_cup",
  "super_cup",
  "club_world_cup",
  "national_team",
];

/** Whether a `comp` token is one of the 5 type contexts (vs a granular name). */
export function isContext(comp: string): comp is CompareContext {
  return (COMPARE_CONTEXTS as readonly string[]).includes(comp);
}

/**
 * Resolve a `comp` token to a row filter. A context token uses the type set; any
 * other token is treated as a granular `competitionName` (the 34-name drill,
 * tolerating mixed labels like "Domestic Cup (mixed)").
 */
export function filterForComp(
  playerRows: readonly PlayerSeasonComp[],
  comp: string,
): PlayerSeasonComp[] {
  if (isContext(comp)) {
    const set = CONTEXT_SETS[comp];
    return set ? filterByCompetitions(playerRows, set) : [...playerRows];
  }
  return playerRows.filter((r) => r.competitionName === comp);
}

/** The granular competitionName options (every distinct name), alpha-sorted. */
export function competitionNameOptions(
  rows: readonly PlayerSeasonComp[],
): { value: string; label: string }[] {
  const names = [...new Set(rows.map((r) => r.competitionName))].sort((a, b) =>
    a.localeCompare(b),
  );
  return names.map((n) => ({ value: n, label: n }));
}

/** ---- Shared helpers ---- */

type Side = { totals: AggregateTotals; derived: DerivedMetrics };

function sideOf(rows: readonly PlayerSeasonComp[]): Side {
  const totals = aggregate(rows, true);
  return { totals, derived: deriveMetrics(totals) };
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

function seasonStartYear(season: string): number {
  return Number.parseInt(season.slice(0, 4), 10);
}

/** Per-column values for one slice, keyed by column key (null = «н/д»). */
export type ColMap = Record<string, number | null>;

function buildColMap(rows: readonly PlayerSeasonComp[]): ColMap {
  const { totals, derived } = sideOf(rows);
  const out: ColMap = {};
  for (const col of COMPARE_COLUMNS) out[col.key] = colValue(col, totals, derived);
  return out;
}

function focusVerdict(
  messi: ColMap | null,
  ronaldo: ColMap | null,
  focus: MetricKey,
): { delta: number | null; leader: Leader | null } {
  const def = METRIC_CATALOG[focus];
  const m = messi ? messi[focus] : null;
  const r = ronaldo ? ronaldo[focus] : null;
  if (m === null || m === undefined || r === null || r === undefined) {
    return { delta: null, leader: null };
  }
  const delta = round(m - r, def.decimals);
  let leader: Leader = "tie";
  if (m !== r) leader = (def.higherIsBetter ? m > r : m < r) ? "messi" : "ronaldo";
  return { delta, leader };
}

/** ---- By-season / same-age aligned dual table ---- */

export type CompareTableRow = {
  /** Display label: a season ("2011/12") or an age ("24"). */
  key: string;
  /** null = the player did not feature for this key (render "—"). */
  messi: ColMap | null;
  ronaldo: ColMap | null;
  /** Focus-metric Δ (Messi − Ronaldo); null when either side is «н/д». */
  delta: number | null;
  leader: Leader | null;
};

export type CompareTableTotal = {
  messi: ColMap;
  ronaldo: ColMap;
  delta: number | null;
  leader: Leader | null;
};

export type CompareTypeTotal = {
  type: CompetitionType;
  messi: ColMap;
  ronaldo: ColMap;
};

export type CompareTableModel = {
  rowHeaderKey: "season" | "age";
  rows: CompareTableRow[];
  total: CompareTableTotal;
  /** Per-competition-type subtotals (only when comp === "all"); else empty. */
  perType: CompareTypeTotal[];
};

function groupByKey(
  rows: readonly PlayerSeasonComp[],
  keyOf: (r: PlayerSeasonComp) => string,
): Map<string, PlayerSeasonComp[]> {
  const map = new Map<string, PlayerSeasonComp[]>();
  for (const r of rows) {
    const k = keyOf(r);
    const bucket = map.get(k);
    if (bucket) bucket.push(r);
    else map.set(k, [r]);
  }
  return map;
}

export function buildCompareTable(
  rows: readonly PlayerSeasonComp[],
  comp: string,
  view: "season" | "age",
  focus: MetricKey,
): CompareTableModel {
  const messiRows = filterForComp(rowsForPlayer(rows, "messi"), comp);
  const ronaldoRows = filterForComp(rowsForPlayer(rows, "ronaldo"), comp);

  const keyOf =
    view === "age"
      ? (r: PlayerSeasonComp) => String(r.ageDuringSeason)
      : (r: PlayerSeasonComp) => r.season;

  const messiGroups = groupByKey(messiRows, keyOf);
  const ronaldoGroups = groupByKey(ronaldoRows, keyOf);

  const allKeys = [...new Set([...messiGroups.keys(), ...ronaldoGroups.keys()])];
  allKeys.sort((a, b) =>
    view === "age" ? Number(a) - Number(b) : seasonStartYear(a) - seasonStartYear(b),
  );

  const tableRows: CompareTableRow[] = allKeys.map((key) => {
    const mr = messiGroups.get(key);
    const rr = ronaldoGroups.get(key);
    const messi = mr ? buildColMap(mr) : null;
    const ronaldo = rr ? buildColMap(rr) : null;
    const { delta, leader } = focusVerdict(messi, ronaldo, focus);
    return { key, messi, ronaldo, delta, leader };
  });

  const messiTotal = buildColMap(messiRows);
  const ronaldoTotal = buildColMap(ronaldoRows);
  const totalVerdict = focusVerdict(messiTotal, ronaldoTotal, focus);

  const perType: CompareTypeTotal[] =
    comp === "all"
      ? TYPE_ORDER.map((type) => ({
          type,
          messi: buildColMap(filterByCompetitions(messiRows, [type])),
          ronaldo: buildColMap(filterByCompetitions(ronaldoRows, [type])),
        }))
      : [];

  return {
    rowHeaderKey: view === "age" ? "age" : "season",
    rows: tableRows,
    total: { messi: messiTotal, ronaldo: ronaldoTotal, ...totalVerdict },
    perType,
  };
}

/** ---- Career view: every metric as a row (Messi · Δ/leader · Ronaldo) ---- */

export type CompareCareerRow = {
  col: CompareColumn;
  messi: number | null;
  ronaldo: number | null;
  delta: number | null;
  leader: Leader | null;
};

export function buildCompareCareer(
  rows: readonly PlayerSeasonComp[],
  comp: string,
): CompareCareerRow[] {
  const mSide = sideOf(filterForComp(rowsForPlayer(rows, "messi"), comp));
  const rSide = sideOf(filterForComp(rowsForPlayer(rows, "ronaldo"), comp));

  return COMPARE_COLUMNS.map((col) => {
    const messi = colValue(col, mSide.totals, mSide.derived);
    const ronaldo = colValue(col, rSide.totals, rSide.derived);
    let leader: Leader | null = null;
    let delta: number | null = null;
    if (messi !== null && ronaldo !== null) {
      leader = messi === ronaldo ? "tie" : (col.higherIsBetter ? messi > ronaldo : messi < ronaldo) ? "messi" : "ronaldo";
      delta = round(messi - ronaldo, col.decimals);
    }
    return { col, messi, ronaldo, delta, leader };
  });
}

/** ---- Same-age overlay curve (seasonTrend re-keyed by age) ---- */

export type AgeTrendModel = {
  ages: number[];
  /** Per-age focus value aligned to `ages`; null = gap (break the line). */
  messi: (number | null)[];
  ronaldo: (number | null)[];
  yMin: number;
  yMax: number;
  hasData: boolean;
};

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return round(step * pow, 6);
}

function ageValues(
  rows: readonly PlayerSeasonComp[],
  player: PlayerId,
  comp: string,
  focus: MetricKey,
): Map<number, number | null> {
  const prows = filterForComp(rowsForPlayer(rows, player), comp);
  const map = new Map<number, number | null>();
  for (const age of new Set(prows.map((r) => r.ageDuringSeason))) {
    const { totals, derived } = sideOf(prows.filter((r) => r.ageDuringSeason === age));
    map.set(age, metricValue(focus, totals, derived));
  }
  return map;
}

export function buildAgeTrend(
  rows: readonly PlayerSeasonComp[],
  comp: string,
  focus: MetricKey,
): AgeTrendModel {
  const mMap = ageValues(rows, "messi", comp, focus);
  const rMap = ageValues(rows, "ronaldo", comp, focus);
  const ages = [...new Set([...mMap.keys(), ...rMap.keys()])].sort((a, b) => a - b);
  const messi = ages.map((a) => mMap.get(a) ?? null);
  const ronaldo = ages.map((a) => rMap.get(a) ?? null);
  const values = [...messi, ...ronaldo].filter((v): v is number => v !== null);
  const hasData = values.length > 0;
  const rawMax = hasData ? Math.max(...values) : 1;
  const rawMin = hasData ? Math.min(...values) : 0;
  return {
    ages,
    messi,
    ronaldo,
    yMin: Math.min(0, rawMin),
    yMax: niceCeil(rawMax),
    hasData,
  };
}

/** ---- Scope line (computed, not hard-coded) ---- */

export type CompareScope = {
  rows: number;
  seasons: number;
  comps: number;
  minAge: number;
  maxAge: number;
};

export function buildCompareScope(rows: readonly PlayerSeasonComp[]): CompareScope {
  const ages = rows.map((r) => r.ageDuringSeason);
  return {
    rows: rows.length,
    seasons: new Set(rows.map((r) => r.season)).size,
    comps: new Set(rows.map((r) => r.competitionName)).size,
    minAge: Math.min(...ages),
    maxAge: Math.max(...ages),
  };
}
