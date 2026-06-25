import {
  aggregate,
  deriveMetrics,
  filterByCompetition,
  metricValue,
  rowsForPlayer,
  type AggregateTotals,
  type CompetitionFilter,
  type DerivedMetrics,
  type MetricKey,
  type PlayerId,
  type PlayerSeasonComp,
} from "@/lib/data";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Pure, server-safe model for the HOME ARENA (P9-2). It only READS the data layer
 * and composes the existing aggregators (`rowsForPlayer` → `filterByCompetition`
 * → `aggregate` → `deriveMetrics` → `metricValue`). NOTHING is fabricated:
 * every number resolves to a real metric over the real rows. Career scope =
 * club + country across all competitions, penalties included (the player's real
 * output, matching the personal-profile model).
 *
 * Each category tab is a set of comparison rows. A row reads ONE metric out of a
 * named competition bucket (all / league / Champions League / national team) so
 * "League goals", "UCL goals" and "International goals" reuse the same machinery
 * as career totals — no new statistics, no hardcoded figures.
 */

export type ArenaPlayer = PlayerId;
export type RowWinner = ArenaPlayer | "tie";

/** Which competition slice a row reads its metric from. */
type Bucket = CompetitionFilter;

/** A virtual "seasons played" metric (distinct season labels) the catalog lacks. */
type RowMetric = MetricKey | "seasonsPlayed";

/** One comparison row inside a category. */
type RowSpec = {
  /** Dictionary key for the row label (added to en+ru). */
  labelKey: keyof Dictionary;
  /** Competition bucket the metric is read from. */
  bucket: Bucket;
  metric: RowMetric;
  /** Decimals to render; defaults sensibly per metric below. */
  decimals: number;
  /** percent → render value*100 with a % suffix. */
  format: "number" | "percent" | "count";
  /** Higher value wins the row (false = lower is better, e.g. minutes/goal). */
  higherIsBetter: boolean;
};

export type CategoryKey =
  | "goals"
  | "assists"
  | "trophies"
  | "ballonDor"
  | "championsLeague"
  | "worldCup"
  | "playmaking"
  | "longevity";

type CategorySpec = {
  key: CategoryKey;
  /** Dictionary key for the tab label. */
  labelKey: keyof Dictionary;
  /** Icon key resolved in the Arena view's icon table. */
  icon: CategoryKey;
  rows: RowSpec[];
};

/**
 * The eight categories from the ref, each mapped to 3–5 real metric rows.
 * Goals → Career / International / League / UCL goals + conversion %.
 */
const CATEGORIES: CategorySpec[] = [
  {
    key: "goals",
    labelKey: "arenaCatGoals",
    icon: "goals",
    rows: [
      { labelKey: "arenaRowCareerGoals", bucket: "all", metric: "goals", decimals: 0, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowIntlGoals", bucket: "national_team", metric: "goals", decimals: 0, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowLeagueGoals", bucket: "league", metric: "goals", decimals: 0, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowUclGoals", bucket: "champions_league", metric: "goals", decimals: 0, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowConversion", bucket: "all", metric: "shotConversion", decimals: 1, format: "percent", higherIsBetter: true },
    ],
  },
  {
    key: "assists",
    labelKey: "arenaCatAssists",
    icon: "assists",
    rows: [
      { labelKey: "arenaRowCareerAssists", bucket: "all", metric: "assists", decimals: 0, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowLeagueAssists", bucket: "league", metric: "assists", decimals: 0, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowIntlAssists", bucket: "national_team", metric: "assists", decimals: 0, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowAssistsPer90", bucket: "all", metric: "assistsPer90", decimals: 2, format: "number", higherIsBetter: true },
    ],
  },
  {
    key: "trophies",
    labelKey: "arenaCatTrophies",
    icon: "trophies",
    rows: [
      { labelKey: "arenaRowTotalTrophies", bucket: "all", metric: "trophies", decimals: 0, format: "count", higherIsBetter: true },
      { labelKey: "arenaRowLeagueTitles", bucket: "league", metric: "trophies", decimals: 0, format: "count", higherIsBetter: true },
      { labelKey: "arenaRowUclTitles", bucket: "champions_league", metric: "trophies", decimals: 0, format: "count", higherIsBetter: true },
      { labelKey: "arenaRowIntlTrophies", bucket: "national_team", metric: "trophies", decimals: 0, format: "count", higherIsBetter: true },
    ],
  },
  {
    key: "ballonDor",
    labelKey: "arenaCatBallonDor",
    icon: "ballonDor",
    rows: [
      { labelKey: "arenaRowBallonDor", bucket: "all", metric: "ballonDor", decimals: 0, format: "count", higherIsBetter: true },
    ],
  },
  {
    key: "championsLeague",
    labelKey: "arenaCatChampionsLeague",
    icon: "championsLeague",
    rows: [
      { labelKey: "arenaRowUclGoals", bucket: "champions_league", metric: "goals", decimals: 0, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowUclAssists", bucket: "champions_league", metric: "assists", decimals: 0, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowUclMatches", bucket: "champions_league", metric: "matches", decimals: 0, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowUclTitles", bucket: "champions_league", metric: "trophies", decimals: 0, format: "count", higherIsBetter: true },
    ],
  },
  {
    key: "worldCup",
    labelKey: "arenaCatWorldCup",
    icon: "worldCup",
    rows: [
      { labelKey: "arenaRowIntlGoals", bucket: "national_team", metric: "goals", decimals: 0, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowIntlAssists", bucket: "national_team", metric: "assists", decimals: 0, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowCaps", bucket: "national_team", metric: "matches", decimals: 0, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowIntlTrophies", bucket: "national_team", metric: "trophies", decimals: 0, format: "count", higherIsBetter: true },
    ],
  },
  {
    key: "playmaking",
    labelKey: "arenaCatPlaymaking",
    icon: "playmaking",
    rows: [
      { labelKey: "arenaRowGoalContributions", bucket: "all", metric: "goalContributions", decimals: 0, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowCareerAssists", bucket: "all", metric: "assists", decimals: 0, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowGAPer90", bucket: "all", metric: "goalContributionsPer90", decimals: 2, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowAssistsPer90", bucket: "all", metric: "assistsPer90", decimals: 2, format: "number", higherIsBetter: true },
    ],
  },
  {
    key: "longevity",
    labelKey: "arenaCatLongevity",
    icon: "longevity",
    rows: [
      { labelKey: "arenaRowSeasons", bucket: "all", metric: "seasonsPlayed", decimals: 0, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowMatches", bucket: "all", metric: "matches", decimals: 0, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowMinutes", bucket: "all", metric: "minutes", decimals: 0, format: "number", higherIsBetter: true },
      { labelKey: "arenaRowCareerGoals", bucket: "all", metric: "goals", decimals: 0, format: "number", higherIsBetter: true },
    ],
  },
];

/**
 * One named-league row inside a category's "By league" group (P10-5). Same
 * shape as an {@link ArenaRow} (both values + a LOCAL per-league leader marker)
 * but its `winner` is read-only evidence: it is NOT tallied into the category
 * winner, the score, or the verdict.
 */
export type LeagueSplitRow = {
  /** Dictionary key for the user-facing league label (mapped from competitionName). */
  labelKey: keyof Dictionary;
  ronaldo: number;
  messi: number;
  /** LOCAL "who did more in THIS league" marker. Tallied into nothing. */
  winner: RowWinner;
  ronaldoFill: number;
  messiFill: number;
};

/** A single resolved comparison row, both values + winner. */
export type ArenaRow = {
  labelKey: keyof Dictionary;
  format: "number" | "percent" | "count";
  decimals: number;
  higherIsBetter: boolean;
  ronaldo: number;
  messi: number;
  winner: RowWinner;
  /** 0..1 share of the larger value, per side, for the divergent bar fill. */
  ronaldoFill: number;
  messiFill: number;
  /**
   * When present, this row is the aggregate "League" sub-metric and carries a
   * per-named-league breakdown. The breakdown UI REPLACES this single row with a
   * labelled "By league" group. Read-only evidence — never affects the verdict.
   */
  leagueSplit?: LeagueSplitRow[];
};

export type ArenaCategory = {
  key: CategoryKey;
  labelKey: keyof Dictionary;
  icon: CategoryKey;
  rows: ArenaRow[];
  /** Category winner = whoever wins more rows (tie if equal). */
  winner: RowWinner;
};

/* ── BY-LEAGUE SPLIT (P10-5) ────────────────────────────────────────────────
 * Read-only evidence: the single aggregate "League" sub-metric row (League Goals
 * / League Assists / League Titles) is REPLACED in the UI by a labelled
 * "By league" group of the NAMED leagues. The per-league leader marker is LOCAL
 * and is tallied into NOTHING — it must not change the category winner, the
 * score, the verdict or `?cats=`. This is pure presentation over data that
 * already exists: each `competitionType:"league"` row carries a real
 * `competitionName`; we group BOTH players' rows by a mapped league label (by
 * name, not club — Real + Barça → La Liga) and reuse the same
 * aggregate→metricValue machinery as every other metric. Cups are excluded so
 * "by league" stays literally true.
 */

/** A user-facing league a "by league" group fans out to (UX.md mapping table). */
type LeagueLabelKey =
  | "arenaLeaguePremierLeague"
  | "arenaLeagueLaLiga"
  | "arenaLeagueSerieA"
  | "arenaLeagueLigue1"
  | "arenaLeaguePrimeiraLiga"
  | "arenaLeagueSaudiProLeague"
  | "arenaLeagueMls";

/**
 * Map a raw `competitionName` (only ever consulted for `competitionType:"league"`
 * rows) to a user-facing league label key, per the UX.md table. Returns null for
 * names that are not a real league (cups/playoffs typed as league are excluded so
 * "by league" means league). Mixed-season labels collapse to their league.
 */
function mapLeagueLabel(competitionName: string): LeagueLabelKey | null {
  switch (competitionName) {
    case "Premier League":
      return "arenaLeaguePremierLeague";
    case "La Liga":
      return "arenaLeagueLaLiga";
    case "Serie A":
      return "arenaLeagueSerieA";
    case "Ligue 1":
      return "arenaLeagueLigue1";
    case "Primeira Liga":
      return "arenaLeaguePrimeiraLiga";
    case "Saudi Pro League":
    case "Saudi Pro League / Premier League": // mixed-season label → its league
      return "arenaLeagueSaudiProLeague";
    case "Major League Soccer":
    case "MLS Cup Playoffs": // MLS post-season, grouped under MLS
      return "arenaLeagueMls";
    default:
      return null; // not a league (cups, etc.) — excluded from the strip
  }
}

/** UX.md display order for the by-league group (stable, deterministic). */
const LEAGUE_ORDER: readonly LeagueLabelKey[] = [
  "arenaLeaguePremierLeague",
  "arenaLeagueLaLiga",
  "arenaLeagueSerieA",
  "arenaLeagueLigue1",
  "arenaLeaguePrimeiraLiga",
  "arenaLeagueSaudiProLeague",
  "arenaLeagueMls",
];

/** Metrics that exist per league → the only sub-metric rows that get a split. */
type LeagueSplitMetric = "goals" | "assists" | "trophies";

/** Row labelKey → the metric its by-league group reads (the aggregate rows we upgrade). */
const LEAGUE_SPLIT_ROWS: Partial<Record<keyof Dictionary, LeagueSplitMetric>> = {
  arenaRowLeagueGoals: "goals",
  arenaRowLeagueAssists: "assists",
  arenaRowLeagueTitles: "trophies",
};

/** All league-bucket rows for a player, grouped by mapped league label. */
type LeagueGroups = Map<LeagueLabelKey, PlayerSeasonComp[]>;

function groupLeagueRows(playerRows: readonly PlayerSeasonComp[]): LeagueGroups {
  const groups: LeagueGroups = new Map();
  for (const r of playerRows) {
    if (r.competitionType !== "league") continue;
    const label = mapLeagueLabel(r.competitionName);
    if (!label) continue;
    const bucket = groups.get(label);
    if (bucket) bucket.push(r);
    else groups.set(label, [r]);
  }
  return groups;
}

/** Read one metric over a set of league rows, reusing the canonical aggregator. */
function leagueMetric(rows: readonly PlayerSeasonComp[], metric: LeagueSplitMetric): number {
  const totals = aggregate(rows, true);
  return metricValue(metric, totals, deriveMetrics(totals)) ?? 0;
}

/**
 * Pure selector: given both players' raw rows and a per-league metric, return the
 * named-league rows (mapped label, both values, a LOCAL per-league leader marker
 * and bar fills), in UX.md order, restricted to leagues where at least one player
 * has a non-zero value. Sole consumer of the by-league grouping; reused by tests.
 *
 * NB: the `winner` here is local evidence only — it is never summed into the
 * category/score/verdict.
 */
export function selectLeagueSplit(
  rows: readonly PlayerSeasonComp[],
  metric: LeagueSplitMetric,
): LeagueSplitRow[] {
  const ronaldoGroups = groupLeagueRows(rowsForPlayer(rows, "ronaldo"));
  const messiGroups = groupLeagueRows(rowsForPlayer(rows, "messi"));

  const out: LeagueSplitRow[] = [];
  for (const label of LEAGUE_ORDER) {
    const rVal = leagueMetric(ronaldoGroups.get(label) ?? [], metric);
    const mVal = leagueMetric(messiGroups.get(label) ?? [], metric);
    if (rVal === 0 && mVal === 0) continue; // neither played/scored here — omit
    const max = Math.max(rVal, mVal);
    out.push({
      labelKey: label,
      ronaldo: rVal,
      messi: mVal,
      winner: rowWinner(rVal, mVal, true),
      ronaldoFill: fill(rVal, max),
      messiFill: fill(mVal, max),
    });
  }
  return out;
}

/** A player's identity facts for the glass card (numbers from the dataset). */
export type ArenaIdentity = {
  id: PlayerId;
  caps: number;
};

export type ArenaVerdict = {
  /** Overall winner across categories (tie if equal categories won). */
  winner: RowWinner;
  categoriesWon: { ronaldo: number; messi: number; tied: number };
};

export type ArenaModel = {
  categories: ArenaCategory[];
  identity: Record<PlayerId, ArenaIdentity>;
  verdict: ArenaVerdict;
};

/** Per-player, per-bucket cached aggregate so each metric read is O(1). */
type PlayerBuckets = {
  rows: PlayerSeasonComp[];
  buckets: Record<Bucket, { totals: AggregateTotals; derived: DerivedMetrics }>;
  seasonsPlayed: number;
};

const BUCKETS: Bucket[] = ["all", "league", "champions_league", "national_team"];

function buildPlayerBuckets(
  rows: readonly PlayerSeasonComp[],
  id: PlayerId,
): PlayerBuckets {
  const playerRows = rowsForPlayer(rows, id);
  const buckets = {} as PlayerBuckets["buckets"];
  for (const b of BUCKETS) {
    const filtered = filterByCompetition(playerRows, b);
    const totals = aggregate(filtered, true);
    buckets[b] = { totals, derived: deriveMetrics(totals) };
  }
  const seasonsPlayed = new Set(playerRows.map((r) => r.season)).size;
  return { rows: playerRows, buckets, seasonsPlayed };
}

function readMetric(pb: PlayerBuckets, bucket: Bucket, metric: RowMetric): number {
  if (metric === "seasonsPlayed") return pb.seasonsPlayed;
  const { totals, derived } = pb.buckets[bucket];
  return metricValue(metric, totals, derived) ?? 0;
}

function rowWinner(ronaldo: number, messi: number, higherIsBetter: boolean): RowWinner {
  if (ronaldo === messi) return "tie";
  const ronaldoBetter = higherIsBetter ? ronaldo > messi : ronaldo < messi;
  return ronaldoBetter ? "ronaldo" : "messi";
}

/** Bar fill share: each side's value over the max of the two (0..1, >=0.06 floor
 * so a non-zero loser still reads as a sliver). Zero stays zero. */
function fill(value: number, max: number): number {
  if (max <= 0) return 0;
  const share = Math.min(1, Math.max(0, value / max));
  return value > 0 ? Math.max(0.06, share) : 0;
}

/**
 * Build the full Arena model from the canonical rows. Pure & deterministic.
 */
export function buildArenaModel(rows: readonly PlayerSeasonComp[]): ArenaModel {
  const ronaldo = buildPlayerBuckets(rows, "ronaldo");
  const messi = buildPlayerBuckets(rows, "messi");

  let ronaldoCats = 0;
  let messiCats = 0;
  let tiedCats = 0;

  const categories: ArenaCategory[] = CATEGORIES.map((cat) => {
    let ronaldoRowWins = 0;
    let messiRowWins = 0;

    const resolvedRows: ArenaRow[] = cat.rows.map((row) => {
      const rVal = readMetric(ronaldo, row.bucket, row.metric);
      const mVal = readMetric(messi, row.bucket, row.metric);
      const winner = rowWinner(rVal, mVal, row.higherIsBetter);
      if (winner === "ronaldo") ronaldoRowWins += 1;
      else if (winner === "messi") messiRowWins += 1;
      const max = Math.max(rVal, mVal);
      // P10-5: only the aggregate "League" sub-metric rows (League Goals /
      // Assists / Titles) carry a by-league fan-out — read-only evidence, never
      // tallied. Every other row is unchanged.
      const splitMetric = LEAGUE_SPLIT_ROWS[row.labelKey];
      const leagueSplit = splitMetric ? selectLeagueSplit(rows, splitMetric) : undefined;
      return {
        labelKey: row.labelKey,
        format: row.format,
        decimals: row.decimals,
        higherIsBetter: row.higherIsBetter,
        ronaldo: rVal,
        messi: mVal,
        winner,
        ronaldoFill: fill(rVal, max),
        messiFill: fill(mVal, max),
        ...(leagueSplit && leagueSplit.length > 0 ? { leagueSplit } : {}),
      };
    });

    const catWinner: RowWinner =
      ronaldoRowWins === messiRowWins
        ? "tie"
        : ronaldoRowWins > messiRowWins
          ? "ronaldo"
          : "messi";
    if (catWinner === "ronaldo") ronaldoCats += 1;
    else if (catWinner === "messi") messiCats += 1;
    else tiedCats += 1;

    return { key: cat.key, labelKey: cat.labelKey, icon: cat.icon, rows: resolvedRows, winner: catWinner };
  });

  const verdictWinner: RowWinner =
    ronaldoCats === messiCats ? "tie" : ronaldoCats > messiCats ? "ronaldo" : "messi";

  return {
    categories,
    identity: {
      ronaldo: { id: "ronaldo", caps: ronaldo.buckets.national_team.totals.matches },
      messi: { id: "messi", caps: messi.buckets.national_team.totals.matches },
    },
    verdict: {
      winner: verdictWinner,
      categoriesWon: { ronaldo: ronaldoCats, messi: messiCats, tied: tiedCats },
    },
  };
}

/** The canonical, ordered list of category keys (single source for the flow). */
export const CATEGORY_KEYS: readonly CategoryKey[] = CATEGORIES.map((c) => c.key);

/** Minimum number of categories a comparison must include. */
export const MIN_CATEGORIES = 3;

/** Type guard: is `value` a known category key? */
export function isCategoryKey(value: string): value is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(value);
}

/**
 * Parse a `?cats=` value (comma-separated keys) into a validated, de-duplicated,
 * canonically-ordered list of category keys. Unknown keys are dropped. Falls back
 * to ALL categories when the result would be empty or below {@link MIN_CATEGORIES}.
 */
export function parseCategoryParam(raw: string | null | undefined): CategoryKey[] {
  if (!raw) return [...CATEGORY_KEYS];
  const requested = new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(isCategoryKey),
  );
  const selected = CATEGORY_KEYS.filter((k) => requested.has(k));
  return selected.length >= MIN_CATEGORIES ? selected : [...CATEGORY_KEYS];
}

/** Serialise a selection back into a stable, round-trippable `?cats=` value. */
export function serializeCategoryParam(keys: readonly CategoryKey[]): string {
  return CATEGORY_KEYS.filter((k) => keys.includes(k)).join(",");
}

/**
 * Recompute the overall verdict over a SUBSET of the model's categories (the
 * keys the user kept in `/compare`). Reuses the already-resolved per-category
 * winners — no new statistics. Returns the filtered categories plus a verdict
 * tallied only over them, so the `/verdict` score reflects exactly the selection.
 */
export function selectVerdict(
  model: ArenaModel,
  keys: readonly CategoryKey[],
): { categories: ArenaCategory[]; verdict: ArenaVerdict } {
  const wanted = new Set(keys);
  const categories = model.categories.filter((c) => wanted.has(c.key));

  let ronaldo = 0;
  let messi = 0;
  let tied = 0;
  for (const cat of categories) {
    if (cat.winner === "ronaldo") ronaldo += 1;
    else if (cat.winner === "messi") messi += 1;
    else tied += 1;
  }

  const winner: RowWinner = ronaldo === messi ? "tie" : ronaldo > messi ? "ronaldo" : "messi";

  return { categories, verdict: { winner, categoriesWon: { ronaldo, messi, tied } } };
}

/**
 * Format ONE side's value of a row for display. Percent metrics (a 0..1 ratio)
 * render as a percentage; large counts (minutes) get thousands grouping.
 */
export function formatArenaValue(row: ArenaRow, value: number): string {
  if (row.format === "percent") {
    return `${(value * 100).toFixed(row.decimals)}%`;
  }
  if (value >= 1000) {
    return new Intl.NumberFormat("en-US").format(Math.round(value));
  }
  return value.toFixed(row.decimals);
}
