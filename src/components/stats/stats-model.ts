import {
  METRIC_CATALOG,
  METRIC_KEYS,
  aggregate,
  deriveMetrics,
  filterByCompetitions,
  metricValue,
  rowsForPlayer,
  type CompetitionType,
  type MetricAvailability,
  type MetricFormat,
  type MetricKey,
  type PlayerSeasonComp,
} from "@/lib/data";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Pure, server-safe model for the inline COMPREHENSIVE STATS BODY rendered below
 * the arena hook on `/` (Phase 11, p11-2). It only READS the data layer and
 * composes the existing aggregators (`rowsForPlayer` → `filterByCompetitions` →
 * `aggregate` → `deriveMetrics` → `metricValue`). NOTHING is fabricated: every
 * number resolves to a real metric over the real 222 rows.
 *
 * The body is READ-ONLY evidence — it NEVER recomputes the verdict/score (that
 * lives only in the arena hook). Sparse data is surfaced honestly: a player who
 * did not feature in a competition/season is `null` (rendered "—", never 0), and
 * known-missing fields (xG/xA pre-2014, yellow/red cards) come through as `null`
 * so the UI shows «н/д» rather than a fabricated zero (see DATA_REPORT.md).
 */

/** The five competition contexts that re-slice the season table (studio tab set). */
export type StatsContext =
  | "all"
  | "league"
  | "champions_league"
  | "national_team"
  | "cups";

export const STATS_CONTEXTS: readonly StatsContext[] = [
  "all",
  "league",
  "champions_league",
  "national_team",
  "cups",
] as const;

/** Each context → the competition-type set it aggregates (undefined === all). */
const CONTEXT_COMPETITIONS: Record<StatsContext, CompetitionType[] | undefined> = {
  all: undefined,
  league: ["league"],
  champions_league: ["champions_league"],
  national_team: ["national_team"],
  cups: ["domestic_cup", "super_cup", "club_world_cup"],
};

/** Canonical competition-type order for the by-competition cut. */
const TYPE_ORDER: readonly CompetitionType[] = [
  "league",
  "champions_league",
  "domestic_cup",
  "super_cup",
  "club_world_cup",
  "national_team",
];

/**
 * Metrics shown in the always-visible CORE tier of the career grid. Everything
 * else falls into ADVANCED (per-90 / efficiency / xG-xA / discipline / illustrative)
 * and only appears when the Core/Advanced toggle is set to Advanced.
 */
const CORE_METRICS = new Set<MetricKey>([
  "goals",
  "assists",
  "goalContributions",
  "matches",
  "starts",
  "minutes",
  "trophies",
  "ballonDor",
]);

/**
 * Fields the dataset does NOT actually carry (all 0 / 222 rows — see
 * DATA_REPORT). Forced to «н/д» so we never claim the players were never booked.
 */
const FORCED_NA = new Set<MetricKey>(["yellowCards", "redCards"]);

export type Leader = "messi" | "ronaldo" | "tie";

/** One head-to-head row of the career metric grid (read-only). */
export type MetricGridRow = {
  key: MetricKey;
  labelKey: keyof Dictionary;
  tier: "core" | "advanced";
  format: MetricFormat;
  decimals: number;
  /** null = «н/д» (xG/xA pre-2014, missing cards). */
  messi: number | null;
  ronaldo: number | null;
  /** null when either side is «н/д» (no contest). */
  leader: Leader | null;
  availability: MetricAvailability;
  /** true when the value is missing-from-dataset rather than catalog-unavailable. */
  forcedNa: boolean;
};

/** One player's per-season focus totals, or null when they did not feature. */
export type SeasonSide = {
  goals: number;
  assists: number;
  ga: number;
  matches: number;
} | null;

/** A single season row aligned across both players. */
export type SeasonComparativeRow = {
  season: string;
  messi: SeasonSide;
  ronaldo: SeasonSide;
  /** Signed Δ of the focus metric (G+A), Messi − Ronaldo; null if either is null. */
  delta: number | null;
};

export type SideTotals = {
  goals: number;
  assists: number;
  ga: number;
  matches: number;
};

/** The full comparative table for one competition context. */
export type ContextTable = {
  context: StatsContext;
  rows: SeasonComparativeRow[];
  messiTotals: SideTotals;
  ronaldoTotals: SideTotals;
  delta: number;
};

/** A by-club / by-team aggregate for one player. */
export type ClubCut = {
  club: string;
  matches: number;
  goals: number;
  assists: number;
  /** national_team rows are distributed-per-season (illustrative) → flag the team. */
  national: boolean;
};

/** A by-competition-type aggregate aligned across both players. */
export type TypeCut = {
  type: CompetitionType;
  messi: SideTotals;
  ronaldo: SideTotals;
};

export type StatsBodyModel = {
  scope: { rows: number; seasons: number; types: number; clubs: number };
  metricGrid: MetricGridRow[];
  tables: Record<StatsContext, ContextTable>;
  clubs: { messi: ClubCut[]; ronaldo: ClubCut[] };
  byType: TypeCut[];
};

function seasonStartYear(season: string): number {
  return Number.parseInt(season.slice(0, 4), 10);
}

/** Per-season focus totals for one player over a competition slice. */
function seasonSides(
  playerRows: readonly PlayerSeasonComp[],
  comps: CompetitionType[] | undefined,
): Map<string, NonNullable<SeasonSide>> {
  const filtered = comps ? filterByCompetitions(playerRows, comps) : [...playerRows];
  const map = new Map<string, NonNullable<SeasonSide>>();
  for (const season of new Set(filtered.map((r) => r.season))) {
    const totals = aggregate(
      filtered.filter((r) => r.season === season),
      true,
    );
    map.set(season, {
      goals: totals.goals,
      assists: totals.assists,
      ga: totals.goals + totals.assists,
      matches: totals.matches,
    });
  }
  return map;
}

function sideTotals(
  playerRows: readonly PlayerSeasonComp[],
  comps: CompetitionType[] | undefined,
): SideTotals {
  const filtered = comps ? filterByCompetitions(playerRows, comps) : [...playerRows];
  const totals = aggregate(filtered, true);
  return {
    goals: totals.goals,
    assists: totals.assists,
    ga: totals.goals + totals.assists,
    matches: totals.matches,
  };
}

function buildContextTable(
  messiRows: readonly PlayerSeasonComp[],
  ronaldoRows: readonly PlayerSeasonComp[],
  context: StatsContext,
): ContextTable {
  const comps = CONTEXT_COMPETITIONS[context];
  const messiMap = seasonSides(messiRows, comps);
  const ronaldoMap = seasonSides(ronaldoRows, comps);

  const seasons = [...new Set([...messiMap.keys(), ...ronaldoMap.keys()])].sort(
    (a, b) => seasonStartYear(a) - seasonStartYear(b),
  );

  const rows: SeasonComparativeRow[] = seasons.map((season) => {
    const messi = messiMap.get(season) ?? null;
    const ronaldo = ronaldoMap.get(season) ?? null;
    const delta = messi && ronaldo ? messi.ga - ronaldo.ga : null;
    return { season, messi, ronaldo, delta };
  });

  const messiTotals = sideTotals(messiRows, comps);
  const ronaldoTotals = sideTotals(ronaldoRows, comps);

  return {
    context,
    rows,
    messiTotals,
    ronaldoTotals,
    delta: messiTotals.ga - ronaldoTotals.ga,
  };
}

function clubCuts(playerRows: readonly PlayerSeasonComp[]): ClubCut[] {
  const map = new Map<string, ClubCut>();
  for (const r of playerRows) {
    const cut = map.get(r.club) ?? {
      club: r.club,
      matches: 0,
      goals: 0,
      assists: 0,
      national: r.competitionType === "national_team",
    };
    cut.matches += r.matches;
    cut.goals += r.goals;
    cut.assists += r.assists;
    if (r.competitionType === "national_team") cut.national = true;
    map.set(r.club, cut);
  }
  return [...map.values()].sort((a, b) => b.goals - a.goals);
}

/** Build the full comprehensive-stats body model. Pure & deterministic. */
export function buildStatsBodyModel(rows: readonly PlayerSeasonComp[]): StatsBodyModel {
  const messiRows = rowsForPlayer(rows, "messi");
  const ronaldoRows = rowsForPlayer(rows, "ronaldo");

  // ── Career head-to-head metric grid ──────────────────────────────────────
  const careerTotals = {
    messi: aggregate(messiRows, true),
    ronaldo: aggregate(ronaldoRows, true),
  };
  const careerDerived = {
    messi: deriveMetrics(careerTotals.messi),
    ronaldo: deriveMetrics(careerTotals.ronaldo),
  };

  const metricGrid: MetricGridRow[] = METRIC_KEYS.map((key) => {
    const def = METRIC_CATALOG[key];
    const forcedNa = FORCED_NA.has(key);
    const messi = forcedNa ? null : metricValue(key, careerTotals.messi, careerDerived.messi);
    const ronaldo = forcedNa ? null : metricValue(key, careerTotals.ronaldo, careerDerived.ronaldo);

    let leader: Leader | null = null;
    if (messi !== null && ronaldo !== null) {
      if (messi === ronaldo) leader = "tie";
      else leader = (def.higherIsBetter ? messi > ronaldo : messi < ronaldo) ? "messi" : "ronaldo";
    }

    return {
      key,
      labelKey: def.labelKey,
      tier: CORE_METRICS.has(key) ? "core" : "advanced",
      format: def.format,
      decimals: def.decimals,
      messi,
      ronaldo,
      leader,
      availability: def.availability,
      forcedNa,
    };
  });

  // ── Season-by-season comparative tables (one per context) ────────────────
  const tables = {} as Record<StatsContext, ContextTable>;
  for (const context of STATS_CONTEXTS) {
    tables[context] = buildContextTable(messiRows, ronaldoRows, context);
  }

  // ── By-competition-type cut ──────────────────────────────────────────────
  const byType: TypeCut[] = TYPE_ORDER.map((type) => ({
    type,
    messi: sideTotals(messiRows, [type]),
    ronaldo: sideTotals(ronaldoRows, [type]),
  }));

  // ── Scope (computed, not hard-coded) ─────────────────────────────────────
  const scope = {
    rows: rows.length,
    seasons: new Set(rows.map((r) => r.season)).size,
    types: new Set(rows.map((r) => r.competitionType)).size,
    clubs: new Set(rows.map((r) => r.club)).size,
  };

  return {
    scope,
    metricGrid,
    tables,
    clubs: { messi: clubCuts(messiRows), ronaldo: clubCuts(ronaldoRows) },
    byType,
  };
}
