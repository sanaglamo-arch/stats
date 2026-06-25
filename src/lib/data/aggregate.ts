import type {
  CompetitionType,
  PlayerId,
  PlayerSeasonComp,
} from "./types";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Pure aggregation / slicer functions (SPEC §5 & §7).
 *
 * Everything here is derived from the atomic rows — NOTHING is stored. The four
 * slices compose: pick rows for a player → filter by competition → optionally
 * align by age → sum → derive metrics → build the card stat set.
 */

/** Competition filter for the UI: "all" plus each canonical bucket. */
export type CompetitionFilter = "all" | CompetitionType;

/** How a player's seasons are selected for a comparison. */
export type SeasonSelection =
  | { kind: "career" }
  | { kind: "season"; season: string }
  | { kind: "lastNSeasons"; n: number }
  | { kind: "age"; age: number };

export type SliceOptions = {
  player: PlayerId;
  selection: SeasonSelection;
  /**
   * Single-competition filter (slice 2). "all" passes everything through.
   * Kept for backward compatibility; `competitions` (below) takes precedence
   * when present and non-empty.
   */
  competition: CompetitionFilter;
  /**
   * OPTIONAL stacking competition filter (P6-3). When present and non-empty,
   * rows are kept if their `competitionType` is in this set (combinations of
   * league / CL / national / cups). When absent or empty, the single
   * `competition` field is used instead. Additive — old callers are unaffected.
   */
  competitions?: CompetitionType[];
  /** When false, penalty goals are subtracted from goal totals. */
  includePenalties: boolean;
};

/** ---- Slice 1+2+3: row selection ---- */

/** Compare season labels by start year, then descending recency. */
function seasonStartYear(season: string): number {
  return Number.parseInt(season.slice(0, 4), 10);
}

/** Rows for one player, sorted oldest→newest. */
export function rowsForPlayer(
  rows: readonly PlayerSeasonComp[],
  player: PlayerId,
): PlayerSeasonComp[] {
  return rows
    .filter((r) => r.player === player)
    .sort((a, b) => seasonStartYear(a.season) - seasonStartYear(b.season));
}

/** Slice 2: competition filter. "all" passes everything through. */
export function filterByCompetition(
  rows: readonly PlayerSeasonComp[],
  competition: CompetitionFilter,
): PlayerSeasonComp[] {
  if (competition === "all") return [...rows];
  return rows.filter((r) => r.competitionType === competition);
}

/**
 * Slice 2 (stacking, P6-3): keep rows whose competitionType is in the given set.
 * An empty set passes everything through (so it behaves like "all" / no filter).
 */
export function filterByCompetitions(
  rows: readonly PlayerSeasonComp[],
  competitions: readonly CompetitionType[],
): PlayerSeasonComp[] {
  if (competitions.length === 0) return [...rows];
  const set = new Set(competitions);
  return rows.filter((r) => set.has(r.competitionType));
}

/** Slices 1 & 3: select rows by season / career / last-N / age alignment. */
export function selectSeasons(
  rows: readonly PlayerSeasonComp[],
  selection: SeasonSelection,
): PlayerSeasonComp[] {
  switch (selection.kind) {
    case "career":
      return [...rows];
    case "season":
      return rows.filter((r) => r.season === selection.season);
    case "age":
      return rows.filter((r) => r.ageDuringSeason === selection.age);
    case "lastNSeasons": {
      const seasons = [...new Set(rows.map((r) => r.season))].sort(
        (a, b) => seasonStartYear(b) - seasonStartYear(a),
      );
      const keep = new Set(seasons.slice(0, selection.n));
      return rows.filter((r) => keep.has(r.season));
    }
  }
}

/** Apply player + season selection + competition filter (slices 1–3). */
export function sliceRows(
  rows: readonly PlayerSeasonComp[],
  opts: SliceOptions,
): PlayerSeasonComp[] {
  const byPlayer = rowsForPlayer(rows, opts.player);
  // Stacking set takes precedence when provided & non-empty; otherwise fall back
  // to the single-competition filter (backward compatible).
  const byComp =
    opts.competitions && opts.competitions.length > 0
      ? filterByCompetitions(byPlayer, opts.competitions)
      : filterByCompetition(byPlayer, opts.competition);
  return selectSeasons(byComp, opts.selection);
}

/** ---- Aggregation ---- */

/** Summed totals over a set of rows. xG/xA are null unless any row carries them. */
export type AggregateTotals = {
  matches: number;
  starts: number;
  minutes: number;
  goals: number; // already penalty-adjusted per options (slice 4)
  /** RAW goals (penalty-inclusive) scored only in rows that carry xG (2014+), so
   * xG-performance compares goals and xG over the SAME slice — never all-time
   * goals − modern-only xG. 0 when the slice has no xG rows. */
  modernGoals: number;
  penaltyGoals: number;
  freekickGoals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  xg: number | null;
  xa: number | null;
  yellowCards: number;
  redCards: number;
  /** ILLUSTRATIVE total hat-tricks across the selected rows (not real data). */
  hatTricks: number;
  /** Distinct trophy names across the selected rows (for display/listing). */
  trophies: string[];
  /** Total trophies WON = distinct (season + trophy) entries (e.g. 10× La Liga = 10). */
  trophyCount: number;
  /** Distinct individual award names across the selected rows (for display/listing). */
  individualAwards: string[];
  /** Ballon d'Or wins = number of distinct seasons carrying a Ballon d'Or in this slice. */
  ballonDor: number;
};

function uniq(values: string[]): string[] {
  return [...new Set(values)];
}

const BALLON_DOR = /ballon\s*d['’]or/i;

/**
 * Sum rows into totals. Slice 4 (penalties on/off): when `includePenalties` is
 * false, penalty goals are subtracted from the goal total. xG/xA are summed
 * only across rows that have them (pre-2014 nulls excluded); if NO row has a
 * value the field stays null so the UI can hide it (honesty line).
 */
export function aggregate(
  rows: readonly PlayerSeasonComp[],
  includePenalties: boolean,
): AggregateTotals {
  const totals: AggregateTotals = {
    matches: 0,
    starts: 0,
    minutes: 0,
    goals: 0,
    modernGoals: 0,
    penaltyGoals: 0,
    freekickGoals: 0,
    assists: 0,
    shots: 0,
    shotsOnTarget: 0,
    xg: null,
    xa: null,
    yellowCards: 0,
    redCards: 0,
    hatTricks: 0,
    trophies: [],
    trophyCount: 0,
    individualAwards: [],
    ballonDor: 0,
  };
  let xgSum = 0;
  let xaSum = 0;
  let xgCount = 0;
  let xaCount = 0;
  const trophyNames: string[] = [];
  const awardNames: string[] = [];
  // Count trophies as distinct (season + name) so repeat wins (e.g. La Liga
  // across seasons) each count; count Ballon d'Or as distinct seasons won.
  const trophyKeys = new Set<string>();
  const ballonSeasons = new Set<string>();

  for (const r of rows) {
    totals.matches += r.matches;
    totals.starts += r.starts;
    totals.minutes += r.minutes;
    totals.goals += includePenalties ? r.goals : r.goals - r.penaltyGoals;
    totals.penaltyGoals += r.penaltyGoals;
    totals.freekickGoals += r.freekickGoals;
    totals.assists += r.assists;
    totals.shots += r.shots;
    totals.shotsOnTarget += r.shotsOnTarget;
    totals.yellowCards += r.yellowCards;
    totals.redCards += r.redCards;
    totals.hatTricks += r.hatTricks;
    if (r.xg !== null) {
      xgSum += r.xg;
      xgCount += 1;
      totals.modernGoals += r.goals; // same (modern) slice as xG, penalty-inclusive
    }
    if (r.xa !== null) {
      xaSum += r.xa;
      xaCount += 1;
    }
    for (const t of r.trophies) {
      trophyNames.push(t);
      trophyKeys.add(`${r.season}::${t}`);
    }
    for (const a of r.individualAwards) {
      awardNames.push(a);
      if (BALLON_DOR.test(a)) ballonSeasons.add(r.season);
    }
  }

  totals.xg = xgCount > 0 ? round1(xgSum) : null;
  totals.xa = xaCount > 0 ? round1(xaSum) : null;
  totals.trophies = uniq(trophyNames);
  totals.trophyCount = trophyKeys.size;
  totals.individualAwards = uniq(awardNames);
  totals.ballonDor = ballonSeasons.size;
  return totals;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** ---- Derived metrics (computed, never stored) ---- */

export type DerivedMetrics = {
  /** Goals + assists (direct goal contributions). */
  goalContributions: number;
  goalsPer90: number;
  assistsPer90: number;
  goalContributionsPer90: number;
  /** Goals / shots, as a fraction (0..1); 0 when no shots. */
  shotConversion: number;
  /** Shots on target / shots, as a fraction (0..1); 0 when no shots. */
  shotsOnTargetPct: number;
  /** Shots per 90 minutes. */
  shotsPer90: number;
  /** Minutes per goal (lower is better); 0 when no goals. */
  minutesPerGoal: number;
  /** Null when xG is unavailable for the selection (pre-2014). */
  xgPer90: number | null;
  xaPer90: number | null;
  /**
   * Goals minus xG (finishing over-/under-performance). MODERN ONLY: null when
   * xG is unavailable (pre-2014) so the UI shows «н/д», never a fake number.
   */
  xgPerformance: number | null;
  /** Penalty goals / goals, as a fraction (0..1); 0 when no goals. */
  penaltyPct: number;
  /** Starts / matches, as a fraction (0..1); 0 when no matches. */
  startShare: number;
};

export function deriveMetrics(totals: AggregateTotals): DerivedMetrics {
  const per90 = (value: number): number =>
    totals.minutes > 0 ? round2((value * 90) / totals.minutes) : 0;
  const goalContributions = totals.goals + totals.assists;
  return {
    goalContributions,
    goalsPer90: per90(totals.goals),
    assistsPer90: per90(totals.assists),
    goalContributionsPer90: per90(goalContributions),
    shotConversion: totals.shots > 0 ? round2(totals.goals / totals.shots) : 0,
    shotsOnTargetPct: totals.shots > 0 ? round2(totals.shotsOnTarget / totals.shots) : 0,
    shotsPer90: per90(totals.shots),
    minutesPerGoal: totals.goals > 0 ? round1(totals.minutes / totals.goals) : 0,
    xgPer90: totals.xg !== null ? per90(totals.xg) : null,
    xaPer90: totals.xa !== null ? per90(totals.xa) : null,
    xgPerformance: totals.xg !== null ? round1(totals.modernGoals - totals.xg) : null,
    penaltyPct: totals.goals > 0 ? round2(totals.penaltyGoals / totals.goals) : 0,
    startShare: totals.matches > 0 ? round2(totals.starts / totals.matches) : 0,
  };
}

/** ---- Metric registry (P6-1) ---- */

/** Grouping used by UI presets (attack / creation / efficiency / ...). */
export type MetricGroup =
  | "attack"
  | "creation"
  | "efficiency"
  | "discipline"
  | "trophies";

/** How a metric value is rendered. */
export type MetricFormat = "number" | "percent" | "count";

/**
 * Data-availability of a metric:
 *  - "always"       — derivable for any slice from the canonical schema.
 *  - "modern"       — xG/xA family: null for pre-2014 seasons (honesty line).
 *  - "illustrative" — NOT real data (e.g. hat-tricks placeholder).
 */
export type MetricAvailability = "always" | "modern" | "illustrative";

/**
 * Every metric the card/charts can show. SUPERSET of the original 12 card stats.
 * Each is genuinely derivable from `PlayerSeasonComp` (except `hatTricks`, which
 * is an illustrative placeholder field).
 */
export type MetricKey =
  | "goals"
  | "assists"
  | "goalContributions"
  | "matches"
  | "starts"
  | "minutes"
  | "goalsPer90"
  | "assistsPer90"
  | "goalContributionsPer90"
  | "shotConversion"
  | "shotsOnTargetPct"
  | "shotsPer90"
  | "minutesPerGoal"
  | "freekickGoals"
  | "penaltyGoals"
  | "xg"
  | "xa"
  | "xgPer90"
  | "xaPer90"
  | "xgPerformance"
  | "penaltyPct"
  | "startShare"
  | "trophies"
  | "ballonDor"
  | "hatTricks"
  | "yellowCards"
  | "redCards";

/**
 * Definition of a single metric. `icon` is a STRING key resolved against the
 * icon table in `card-labels` (the data layer stays React/lucide-free); by
 * convention it equals the metric key. `labelKey` points at a dictionary entry.
 */
export type MetricDef = {
  key: MetricKey;
  group: MetricGroup;
  labelKey: keyof Dictionary;
  /** String key resolvable in card-labels' STAT_ICONS (defaults to `key`). */
  icon: MetricKey;
  decimals: number;
  higherIsBetter: boolean;
  format: MetricFormat;
  /** One-line human definition (single canonical meaning, SPEC §7). */
  definition: string;
  availability: MetricAvailability;
};

/** The full registry. Every MetricKey has exactly one definition. */
export const METRIC_CATALOG: Record<MetricKey, MetricDef> = {
  goals: { key: "goals", group: "attack", labelKey: "statGoals", icon: "goals", decimals: 0, higherIsBetter: true, format: "number", definition: "Total goals scored in the slice (penalty-adjusted per the penalties toggle).", availability: "always" },
  assists: { key: "assists", group: "creation", labelKey: "statAssists", icon: "assists", decimals: 0, higherIsBetter: true, format: "number", definition: "Total assists in the slice.", availability: "always" },
  goalContributions: { key: "goalContributions", group: "attack", labelKey: "statGoalContributions", icon: "goalContributions", decimals: 0, higherIsBetter: true, format: "number", definition: "Goals plus assists (direct goal contributions).", availability: "always" },
  matches: { key: "matches", group: "efficiency", labelKey: "statMatches", icon: "matches", decimals: 0, higherIsBetter: true, format: "number", definition: "Appearances in the slice.", availability: "always" },
  starts: { key: "starts", group: "efficiency", labelKey: "statStarts", icon: "starts", decimals: 0, higherIsBetter: true, format: "number", definition: "Matches started in the slice.", availability: "always" },
  minutes: { key: "minutes", group: "efficiency", labelKey: "statMinutes", icon: "minutes", decimals: 0, higherIsBetter: true, format: "number", definition: "Total minutes played in the slice.", availability: "always" },
  goalsPer90: { key: "goalsPer90", group: "attack", labelKey: "statGoalsPer90", icon: "goalsPer90", decimals: 2, higherIsBetter: true, format: "number", definition: "Goals per 90 minutes played.", availability: "always" },
  assistsPer90: { key: "assistsPer90", group: "creation", labelKey: "statAssistsPer90", icon: "assistsPer90", decimals: 2, higherIsBetter: true, format: "number", definition: "Assists per 90 minutes played.", availability: "always" },
  goalContributionsPer90: { key: "goalContributionsPer90", group: "attack", labelKey: "statGoalContributionsPer90", icon: "goalContributionsPer90", decimals: 2, higherIsBetter: true, format: "number", definition: "Goals plus assists per 90 minutes played.", availability: "always" },
  shotConversion: { key: "shotConversion", group: "efficiency", labelKey: "statShotConversion", icon: "shotConversion", decimals: 2, higherIsBetter: true, format: "percent", definition: "Goals divided by total shots.", availability: "always" },
  shotsOnTargetPct: { key: "shotsOnTargetPct", group: "efficiency", labelKey: "statShotsOnTargetPct", icon: "shotsOnTargetPct", decimals: 2, higherIsBetter: true, format: "percent", definition: "Shots on target divided by total shots.", availability: "always" },
  shotsPer90: { key: "shotsPer90", group: "attack", labelKey: "statShotsPer90", icon: "shotsPer90", decimals: 2, higherIsBetter: true, format: "number", definition: "Shots per 90 minutes played.", availability: "always" },
  minutesPerGoal: { key: "minutesPerGoal", group: "efficiency", labelKey: "statMinutesPerGoal", icon: "minutesPerGoal", decimals: 0, higherIsBetter: false, format: "number", definition: "Minutes played per goal scored (lower is better).", availability: "always" },
  freekickGoals: { key: "freekickGoals", group: "attack", labelKey: "statFreekickGoals", icon: "freekickGoals", decimals: 0, higherIsBetter: true, format: "number", definition: "Goals scored directly from free kicks.", availability: "always" },
  penaltyGoals: { key: "penaltyGoals", group: "attack", labelKey: "statPenaltyGoals", icon: "penaltyGoals", decimals: 0, higherIsBetter: true, format: "number", definition: "Goals scored from penalties.", availability: "always" },
  xg: { key: "xg", group: "attack", labelKey: "statXg", icon: "xg", decimals: 1, higherIsBetter: true, format: "number", definition: "Expected goals (xG); available for 2014+ seasons only.", availability: "modern" },
  xa: { key: "xa", group: "creation", labelKey: "statXa", icon: "xa", decimals: 1, higherIsBetter: true, format: "number", definition: "Expected assists (xA); available for 2014+ seasons only.", availability: "modern" },
  xgPer90: { key: "xgPer90", group: "attack", labelKey: "statXgPer90", icon: "xgPer90", decimals: 2, higherIsBetter: true, format: "number", definition: "Expected goals per 90 minutes; 2014+ seasons only.", availability: "modern" },
  xaPer90: { key: "xaPer90", group: "creation", labelKey: "statXaPer90", icon: "xaPer90", decimals: 2, higherIsBetter: true, format: "number", definition: "Expected assists per 90 minutes; 2014+ seasons only.", availability: "modern" },
  xgPerformance: { key: "xgPerformance", group: "attack", labelKey: "statXgPerformance", icon: "xgPerformance", decimals: 1, higherIsBetter: true, format: "number", definition: "Goals minus expected goals (finishing over-/under-performance); 2014+ seasons only.", availability: "modern" },
  penaltyPct: { key: "penaltyPct", group: "attack", labelKey: "statPenaltyPct", icon: "penaltyPct", decimals: 0, higherIsBetter: true, format: "percent", definition: "Share of goals scored from penalties (neutral indicator).", availability: "always" },
  startShare: { key: "startShare", group: "efficiency", labelKey: "statStartShare", icon: "startShare", decimals: 0, higherIsBetter: true, format: "percent", definition: "Share of appearances that were starts (starts divided by matches).", availability: "always" },
  trophies: { key: "trophies", group: "trophies", labelKey: "statTrophies", icon: "trophies", decimals: 0, higherIsBetter: true, format: "count", definition: "Team trophies won in the slice (each season+trophy counts once).", availability: "always" },
  ballonDor: { key: "ballonDor", group: "trophies", labelKey: "statBallonDor", icon: "ballonDor", decimals: 0, higherIsBetter: true, format: "count", definition: "Ballon d'Or wins in the slice (distinct seasons).", availability: "always" },
  hatTricks: { key: "hatTricks", group: "attack", labelKey: "statHatTricks", icon: "hatTricks", decimals: 0, higherIsBetter: true, format: "count", definition: "Hat-tricks. ILLUSTRATIVE placeholder — not real data.", availability: "illustrative" },
  yellowCards: { key: "yellowCards", group: "discipline", labelKey: "statYellowCards", icon: "yellowCards", decimals: 0, higherIsBetter: false, format: "number", definition: "Yellow cards received (lower is better).", availability: "always" },
  redCards: { key: "redCards", group: "discipline", labelKey: "statRedCards", icon: "redCards", decimals: 0, higherIsBetter: false, format: "number", definition: "Red cards received (lower is better).", availability: "always" },
};

/** All metric keys in catalog order (stable). */
export const METRIC_KEYS: MetricKey[] = Object.keys(METRIC_CATALOG) as MetricKey[];

/**
 * The DEFAULT card metric set, in the EXACT order the card has always rendered.
 * Keeping this identical guarantees the default card stays byte-identical.
 */
export const DEFAULT_METRICS: MetricKey[] = [
  "goals",
  "assists",
  "matches",
  "minutes",
  "goalsPer90",
  "shotConversion",
  "xg",
  "xa",
  "trophies",
  "ballonDor",
  "yellowCards",
  "redCards",
];

/** ---- Card stat set (SPEC §7) ---- */

/**
 * `CardStatKey` is now an alias of `MetricKey` — the card can render ANY metric.
 * (Kept as a named export so existing imports continue to work.)
 */
export type CardStatKey = MetricKey;

/** A single comparable stat for the card. `value` null means "hide this stat". */
export type CardStat = {
  key: CardStatKey;
  /** null = unavailable for this slice (e.g. xG pre-2014) → hidden in UI. */
  value: number | null;
  /** true = higher is better (drives the category-winner score). */
  higherIsBetter: boolean;
  /** Decimals to render with (UI uses tabular-nums). */
  decimals: number;
};

/**
 * Extract the raw value for ANY metric from the computed totals + derived set.
 * Returns null when the metric is unavailable for the slice (xG/xA family
 * pre-2014). Pure lookup — no formatting.
 */
export function metricValue(
  key: MetricKey,
  totals: AggregateTotals,
  derived: DerivedMetrics,
): number | null {
  switch (key) {
    case "goals":
      return totals.goals;
    case "assists":
      return totals.assists;
    case "goalContributions":
      return derived.goalContributions;
    case "matches":
      return totals.matches;
    case "starts":
      return totals.starts;
    case "minutes":
      return totals.minutes;
    case "goalsPer90":
      return derived.goalsPer90;
    case "assistsPer90":
      return derived.assistsPer90;
    case "goalContributionsPer90":
      return derived.goalContributionsPer90;
    case "shotConversion":
      return derived.shotConversion;
    case "shotsOnTargetPct":
      return derived.shotsOnTargetPct;
    case "shotsPer90":
      return derived.shotsPer90;
    case "minutesPerGoal":
      return derived.minutesPerGoal;
    case "freekickGoals":
      return totals.freekickGoals;
    case "penaltyGoals":
      return totals.penaltyGoals;
    case "xg":
      return totals.xg;
    case "xa":
      return totals.xa;
    case "xgPer90":
      return derived.xgPer90;
    case "xaPer90":
      return derived.xaPer90;
    case "xgPerformance":
      return derived.xgPerformance;
    case "penaltyPct":
      return derived.penaltyPct;
    case "startShare":
      return derived.startShare;
    case "trophies":
      return totals.trophyCount;
    case "ballonDor":
      return totals.ballonDor;
    case "hatTricks":
      return totals.hatTricks;
    case "yellowCards":
      return totals.yellowCards;
    case "redCards":
      return totals.redCards;
  }
}

/** Build a single CardStat for a catalog metric (value may be null). */
export function buildCardStat(
  key: MetricKey,
  totals: AggregateTotals,
  derived: DerivedMetrics,
): CardStat {
  const def = METRIC_CATALOG[key];
  return {
    key,
    value: metricValue(key, totals, derived),
    higherIsBetter: def.higherIsBetter,
    decimals: def.decimals,
  };
}

/**
 * Build the stat set for one player's slice over the SELECTED metrics, in the
 * selected order. Defaults to DEFAULT_METRICS → byte-identical to the original
 * fixed 12-stat card. xG/xA come through as null pre-2014 so the card hides them.
 */
export function buildCardStats(
  totals: AggregateTotals,
  derived: DerivedMetrics,
  metrics: readonly MetricKey[] = DEFAULT_METRICS,
): CardStat[] {
  return metrics.map((key) => buildCardStat(key, totals, derived));
}

/** ---- Head-to-head verdict (the viral hook: "MESSI 6 : 3 RONALDO") ---- */

export type CategoryWinner = "messi" | "ronaldo" | "tie";

export type ComparisonResult = {
  messi: { totals: AggregateTotals; derived: DerivedMetrics; stats: CardStat[] };
  ronaldo: { totals: AggregateTotals; derived: DerivedMetrics; stats: CardStat[] };
  /** Per-stat winner, only for stats where BOTH players have a value. */
  perCategory: Array<{ key: CardStatKey; winner: CategoryWinner }>;
  score: { messi: number; ronaldo: number };
};

/**
 * Run the full comparison for two slice option sets (one per player). This is
 * the top-level function the UI/card layer calls. The "score by categories" and
 * the displayed stat rows are computed ONLY over `metrics`, in that order
 * (defaults to DEFAULT_METRICS → original behavior). Stats where either side is
 * null (e.g. xG pre-2014) are excluded from the category score.
 */
export function compare(
  rows: readonly PlayerSeasonComp[],
  messiOpts: Omit<SliceOptions, "player">,
  ronaldoOpts: Omit<SliceOptions, "player">,
  metrics: readonly MetricKey[] = DEFAULT_METRICS,
): ComparisonResult {
  const messiSide = computeSide(rows, { ...messiOpts, player: "messi" }, metrics);
  const ronaldoSide = computeSide(rows, { ...ronaldoOpts, player: "ronaldo" }, metrics);

  const perCategory: ComparisonResult["perCategory"] = [];
  let messiScore = 0;
  let ronaldoScore = 0;

  // Pair stats by `key` (not positional index) so a future reordering on one
  // side can't silently mis-compare categories.
  const ronaldoByKey = new Map(ronaldoSide.stats.map((s) => [s.key, s]));

  for (const ms of messiSide.stats) {
    const rs = ronaldoByKey.get(ms.key);
    if (rs === undefined) {
      throw new Error(`compare: no Ronaldo stat for key "${ms.key}"`);
    }
    if (ms.value === null || rs.value === null) continue; // hidden stat → no contest
    let winner: CategoryWinner = "tie";
    if (ms.value !== rs.value) {
      const messiBetter = ms.higherIsBetter ? ms.value > rs.value : ms.value < rs.value;
      winner = messiBetter ? "messi" : "ronaldo";
      if (messiBetter) messiScore += 1;
      else ronaldoScore += 1;
    }
    perCategory.push({ key: ms.key, winner });
  }

  return {
    messi: messiSide,
    ronaldo: ronaldoSide,
    perCategory,
    score: { messi: messiScore, ronaldo: ronaldoScore },
  };
}

function computeSide(
  rows: readonly PlayerSeasonComp[],
  opts: SliceOptions,
  metrics: readonly MetricKey[],
): ComparisonResult["messi"] {
  const sliced = sliceRows(rows, opts);
  const totals = aggregate(sliced, opts.includePenalties);
  const derived = deriveMetrics(totals);
  const stats = buildCardStats(totals, derived, metrics);
  return { totals, derived, stats };
}

/** ---- Visualization data providers (P6-4) ---- */

/** One point on a season trend line. `value` null = unavailable that season. */
export type SeasonTrendPoint = { season: string; value: number | null };

/** Options for `seasonTrend` (all optional, additive). */
export type SeasonTrendOptions = {
  /** Restrict to a competition set (stacking). Empty/omitted = all. */
  competitions?: CompetitionType[];
  /** Single-competition filter (used only if `competitions` is empty/omitted). */
  competition?: CompetitionFilter;
  /** Penalties on/off for goal-derived metrics. Default true. */
  includePenalties?: boolean;
};

/**
 * REAL per-season trend of a metric for one player, oldest→newest. Each season's
 * value is computed by aggregating that season's rows (respecting the optional
 * competition filter + penalties) and reading the metric. `value` is null when
 * the metric is unavailable that season (e.g. xG pre-2014). Pure & deterministic.
 */
export function seasonTrend(
  rows: readonly PlayerSeasonComp[],
  player: PlayerId,
  metricKey: MetricKey,
  opts: SeasonTrendOptions = {},
): SeasonTrendPoint[] {
  const includePenalties = opts.includePenalties ?? true;
  const byPlayer = rowsForPlayer(rows, player);
  const filtered =
    opts.competitions && opts.competitions.length > 0
      ? filterByCompetitions(byPlayer, opts.competitions)
      : filterByCompetition(byPlayer, opts.competition ?? "all");

  // Distinct seasons in chronological order.
  const seasons = [...new Set(filtered.map((r) => r.season))].sort(
    (a, b) => seasonStartYear(a) - seasonStartYear(b),
  );

  return seasons.map((season) => {
    const seasonRows = filtered.filter((r) => r.season === season);
    const totals = aggregate(seasonRows, includePenalties);
    const derived = deriveMetrics(totals);
    return { season, value: metricValue(metricKey, totals, derived) };
  });
}
