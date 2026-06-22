import type {
  CompetitionType,
  PlayerId,
  PlayerSeasonComp,
} from "./types";

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
  competition: CompetitionFilter;
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
  const byComp = filterByCompetition(byPlayer, opts.competition);
  return selectSeasons(byComp, opts.selection);
}

/** ---- Aggregation ---- */

/** Summed totals over a set of rows. xG/xA are null unless any row carries them. */
export type AggregateTotals = {
  matches: number;
  starts: number;
  minutes: number;
  goals: number; // already penalty-adjusted per options (slice 4)
  penaltyGoals: number;
  freekickGoals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  xg: number | null;
  xa: number | null;
  yellowCards: number;
  redCards: number;
  /** Distinct trophies across the selected rows. */
  trophies: string[];
  /** Distinct individual awards across the selected rows. */
  individualAwards: string[];
};

function uniq(values: string[]): string[] {
  return [...new Set(values)];
}

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
    penaltyGoals: 0,
    freekickGoals: 0,
    assists: 0,
    shots: 0,
    shotsOnTarget: 0,
    xg: null,
    xa: null,
    yellowCards: 0,
    redCards: 0,
    trophies: [],
    individualAwards: [],
  };
  let xgSum = 0;
  let xaSum = 0;
  let xgCount = 0;
  let xaCount = 0;
  const trophies: string[] = [];
  const awards: string[] = [];

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
    if (r.xg !== null) {
      xgSum += r.xg;
      xgCount += 1;
    }
    if (r.xa !== null) {
      xaSum += r.xa;
      xaCount += 1;
    }
    trophies.push(...r.trophies);
    awards.push(...r.individualAwards);
  }

  totals.xg = xgCount > 0 ? round1(xgSum) : null;
  totals.xa = xaCount > 0 ? round1(xaSum) : null;
  totals.trophies = uniq(trophies);
  totals.individualAwards = uniq(awards);
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
  goalsPer90: number;
  assistsPer90: number;
  /** Goals / shots, as a fraction (0..1); 0 when no shots. */
  shotConversion: number;
  /** Null when xG is unavailable for the selection (pre-2014). */
  xgPer90: number | null;
  xaPer90: number | null;
};

export function deriveMetrics(totals: AggregateTotals): DerivedMetrics {
  const per90 = (value: number): number =>
    totals.minutes > 0 ? round2((value * 90) / totals.minutes) : 0;
  return {
    goalsPer90: per90(totals.goals),
    assistsPer90: per90(totals.assists),
    shotConversion: totals.shots > 0 ? round2(totals.goals / totals.shots) : 0,
    xgPer90: totals.xg !== null ? per90(totals.xg) : null,
    xaPer90: totals.xa !== null ? per90(totals.xa) : null,
  };
}

/** ---- Card stat set (SPEC §7) ---- */

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

export type CardStatKey =
  | "goals"
  | "assists"
  | "matches"
  | "minutes"
  | "goalsPer90"
  | "shotConversion"
  | "xg"
  | "xa"
  | "trophies"
  | "ballonDor"
  | "yellowCards"
  | "redCards";

/** Count Ballon d'Or wins inside the selected awards list. */
function countBallonDor(awards: string[]): number {
  return awards.filter((a) => /ballon\s*d['’]or/i.test(a)).length;
}

/**
 * Build the ~10-12 stat set for one player's slice. Order is the card display
 * order. xG/xA come through as null pre-2014 so the card hides them.
 */
export function buildCardStats(
  totals: AggregateTotals,
  derived: DerivedMetrics,
): CardStat[] {
  return [
    { key: "goals", value: totals.goals, higherIsBetter: true, decimals: 0 },
    { key: "assists", value: totals.assists, higherIsBetter: true, decimals: 0 },
    { key: "matches", value: totals.matches, higherIsBetter: true, decimals: 0 },
    { key: "minutes", value: totals.minutes, higherIsBetter: true, decimals: 0 },
    { key: "goalsPer90", value: derived.goalsPer90, higherIsBetter: true, decimals: 2 },
    { key: "shotConversion", value: derived.shotConversion, higherIsBetter: true, decimals: 2 },
    { key: "xg", value: totals.xg, higherIsBetter: true, decimals: 1 },
    { key: "xa", value: totals.xa, higherIsBetter: true, decimals: 1 },
    { key: "trophies", value: totals.trophies.length, higherIsBetter: true, decimals: 0 },
    { key: "ballonDor", value: countBallonDor(totals.individualAwards), higherIsBetter: true, decimals: 0 },
    { key: "yellowCards", value: totals.yellowCards, higherIsBetter: false, decimals: 0 },
    { key: "redCards", value: totals.redCards, higherIsBetter: false, decimals: 0 },
  ];
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
 * the top-level function the UI/card layer calls. Stats where either side is
 * null (e.g. xG pre-2014) are excluded from the category score.
 */
export function compare(
  rows: readonly PlayerSeasonComp[],
  messiOpts: Omit<SliceOptions, "player">,
  ronaldoOpts: Omit<SliceOptions, "player">,
): ComparisonResult {
  const messiSide = computeSide(rows, { ...messiOpts, player: "messi" });
  const ronaldoSide = computeSide(rows, { ...ronaldoOpts, player: "ronaldo" });

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
): ComparisonResult["messi"] {
  const sliced = sliceRows(rows, opts);
  const totals = aggregate(sliced, opts.includePenalties);
  const derived = deriveMetrics(totals);
  const stats = buildCardStats(totals, derived);
  return { totals, derived, stats };
}
