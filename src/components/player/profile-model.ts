import {
  aggregate,
  deriveMetrics,
  filterByCompetition,
  filterByCompetitions,
  rowsForPlayer,
  type AggregateTotals,
  type CompetitionType,
  type DerivedMetrics,
  type PlayerId,
  type PlayerSeasonComp,
} from "@/lib/data";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { COMPARE_COLUMNS, colValue, type ColMap } from "@/components/compare/compare-model";

/**
 * Pure builder that shapes ONE player's personal profile from the canonical rows
 * (P7-5, expanded in Phase 11 p11-5). It only READS the data layer and composes
 * the existing aggregators (`rowsForPlayer` → competition filter → `aggregate` →
 * `deriveMetrics`, plus `colValue`/`COMPARE_COLUMNS` for the full metric set).
 * No new statistics are invented; xG/xA/xG-performance stay `null` pre-2014 and
 * the forced-`н/д` cards (0/222) come through as `null`, never a fabricated 0.
 *
 * READ-ONLY evidence — nothing here recomputes the verdict (that lives only on
 * the arena). Every number resolves to a real metric over the player's real rows.
 */

/** One season's roll-up for the LEGACY thin season table (kept for reference). */
export type SeasonRow = {
  season: string;
  club: string;
  competitions: CompetitionType[];
  totals: AggregateTotals;
};

/** One competition bucket's roll-up for the by-competition breakdown. */
export type CompetitionRow = {
  competition: CompetitionType;
  totals: AggregateTotals;
  derived: DerivedMetrics;
};

/** ---- Full season × competition stat table (p11-5) ---- */

/** The five competition contexts that re-slice the full season table. */
export type ProfileContext =
  | "all"
  | "league"
  | "champions_league"
  | "national_team"
  | "cups";

export const PROFILE_CONTEXTS: readonly ProfileContext[] = [
  "all",
  "league",
  "champions_league",
  "national_team",
  "cups",
] as const;

/** Each context → the competition-type set it aggregates (undefined === all). */
const CONTEXT_SETS: Record<ProfileContext, CompetitionType[] | undefined> = {
  all: undefined,
  league: ["league"],
  champions_league: ["champions_league"],
  national_team: ["national_team"],
  cups: ["domestic_cup", "super_cup", "club_world_cup"],
};

/** Canonical competition-type order (granular rows + per-type subtotals). */
const TYPE_ORDER: readonly CompetitionType[] = [
  "league",
  "champions_league",
  "domestic_cup",
  "super_cup",
  "club_world_cup",
  "national_team",
];

/** Read EVERY catalog metric + raw shot volume for a slice (null = «н/д»). */
function colMapOf(rows: readonly PlayerSeasonComp[]): ColMap {
  const totals = aggregate(rows, true);
  const derived = deriveMetrics(totals);
  const out: ColMap = {};
  for (const col of COMPARE_COLUMNS) out[col.key] = colValue(col, totals, derived);
  return out;
}

/** One of a season's individual `competitionName` rows (the 34-comp drill). */
export type GranularRow = {
  /** Raw competition name, e.g. "La Liga", "Copa del Rey" (mixed labels kept). */
  competitionName: string;
  competitionType: CompetitionType;
  /** national_team rows carry the "распределено / distributed" treatment. */
  national: boolean;
  cells: ColMap;
};

/** A single aggregated season row, expandable to its `competitionName` rows. */
export type SeasonStatRow = {
  season: string;
  club: string;
  age: number;
  hasNational: boolean;
  cells: ColMap;
  granular: GranularRow[];
};

/** A per-competition-type subtotal row (only surfaced in the "All" context). */
export type ProfileTypeTotal = { type: CompetitionType; cells: ColMap };

/** The full season × competition table for one competition context. */
export type SeasonStatTable = {
  context: ProfileContext;
  rows: SeasonStatRow[];
  /** Per-competition-type subtotals (only when context === "all"); else empty. */
  perType: ProfileTypeTotal[];
  total: ColMap;
};

function seasonStartYear(season: string): number {
  return Number.parseInt(season.slice(0, 4), 10);
}

/** Order a season's competitionName groups by type, then name (wireframe B). */
function granularOrder(a: GranularRow, b: GranularRow): number {
  const ta = TYPE_ORDER.indexOf(a.competitionType);
  const tb = TYPE_ORDER.indexOf(b.competitionType);
  if (ta !== tb) return ta - tb;
  return a.competitionName.localeCompare(b.competitionName);
}

/**
 * Build the full season × competition table for one player in one competition
 * context. Each season row carries the full metric set AND its individual
 * `competitionName` rows (revealed on demand), plus a career `<tfoot>` total and
 * — in the "All" context — per-competition-type subtotals. Pure & deterministic.
 */
export function buildSeasonStatTable(
  rows: readonly PlayerSeasonComp[],
  id: PlayerId,
  context: ProfileContext,
): SeasonStatTable {
  const playerRows = rowsForPlayer(rows, id);
  const set = CONTEXT_SETS[context];
  const ctxRows = set ? filterByCompetitions(playerRows, set) : playerRows;

  const seasons = [...new Set(ctxRows.map((r) => r.season))].sort(
    (a, b) => seasonStartYear(a) - seasonStartYear(b),
  );

  const seasonRows: SeasonStatRow[] = seasons.map((season) => {
    const sRows = ctxRows.filter((r) => r.season === season);
    const names = [...new Set(sRows.map((r) => r.competitionName))];
    const granular: GranularRow[] = names
      .map((name) => {
        const gRows = sRows.filter((r) => r.competitionName === name);
        return {
          competitionName: name,
          competitionType: gRows[0].competitionType,
          national: gRows[0].competitionType === "national_team",
          cells: colMapOf(gRows),
        };
      })
      .sort(granularOrder);
    return {
      season,
      club: clubForSeason(sRows),
      age: sRows[0]?.ageDuringSeason ?? 0,
      hasNational: sRows.some((r) => r.competitionType === "national_team"),
      cells: colMapOf(sRows),
      granular,
    };
  });

  const perType: ProfileTypeTotal[] =
    context === "all"
      ? TYPE_ORDER.flatMap((type) => {
          const typeRows = filterByCompetitions(ctxRows, [type]);
          if (typeRows.length === 0) return [];
          return [{ type, cells: colMapOf(typeRows) }];
        })
      : [];

  return { context, rows: seasonRows, perType, total: colMapOf(ctxRows) };
}

/** ---- Age progression (G / G+A by `ageDuringSeason`) ---- */

export type AgePoint = { age: number; goals: number; ga: number };

function buildAgeProgression(playerRows: readonly PlayerSeasonComp[]): AgePoint[] {
  const ages = [...new Set(playerRows.map((r) => r.ageDuringSeason))].sort((a, b) => a - b);
  return ages.map((age) => {
    const totals = aggregate(
      playerRows.filter((r) => r.ageDuringSeason === age),
      true,
    );
    return { age, goals: totals.goals, ga: totals.goals + totals.assists };
  });
}

/** ---- By-league strip (real leagues only; mixed labels collapse) ---- */

export type LeagueRow = {
  labelKey: keyof Dictionary;
  matches: number;
  goals: number;
  assists: number;
};

/**
 * Map a raw league `competitionName` to its display label key (mirrors the
 * arena's `mapLeagueLabel`, scoped here so the profile owns no arena imports).
 * Non-league names return null and are excluded from the strip.
 */
const LEAGUE_LABEL: Record<string, keyof Dictionary> = {
  "Premier League": "arenaLeaguePremierLeague",
  "La Liga": "arenaLeagueLaLiga",
  "Serie A": "arenaLeagueSerieA",
  "Ligue 1": "arenaLeagueLigue1",
  "Primeira Liga": "arenaLeaguePrimeiraLiga",
  "Saudi Pro League": "arenaLeagueSaudiProLeague",
  "Saudi Pro League / Premier League": "arenaLeagueSaudiProLeague",
  "Major League Soccer": "arenaLeagueMls",
  "MLS Cup Playoffs": "arenaLeagueMls",
};

const LEAGUE_ORDER: readonly (keyof Dictionary)[] = [
  "arenaLeaguePremierLeague",
  "arenaLeagueLaLiga",
  "arenaLeagueSerieA",
  "arenaLeagueLigue1",
  "arenaLeaguePrimeiraLiga",
  "arenaLeagueSaudiProLeague",
  "arenaLeagueMls",
];

function buildByLeague(playerRows: readonly PlayerSeasonComp[]): LeagueRow[] {
  const groups = new Map<keyof Dictionary, PlayerSeasonComp[]>();
  for (const r of playerRows) {
    if (r.competitionType !== "league") continue;
    const label = LEAGUE_LABEL[r.competitionName];
    if (!label) continue;
    const bucket = groups.get(label);
    if (bucket) bucket.push(r);
    else groups.set(label, [r]);
  }
  const out: LeagueRow[] = [];
  for (const labelKey of LEAGUE_ORDER) {
    const bucket = groups.get(labelKey);
    if (!bucket || bucket.length === 0) continue;
    const totals = aggregate(bucket, true);
    out.push({ labelKey, matches: totals.matches, goals: totals.goals, assists: totals.assists });
  }
  return out;
}

/** ---- Profile assembly ---- */

export type PlayerProfile = {
  id: PlayerId;
  firstSeason: string;
  lastSeason: string;
  /** Career totals over ALL the player's rows (penalties included). */
  totals: AggregateTotals;
  derived: DerivedMetrics;
  /** Oldest→newest (legacy thin season list, retained). */
  seasons: SeasonRow[];
  /** Only competition buckets the player actually appeared in. */
  byCompetition: CompetitionRow[];
  /** G / G+A by age, oldest→newest age. */
  ageProgression: AgePoint[];
  /** Real-league splits, in UX.md order, leagues the player actually played. */
  byLeague: LeagueRow[];
};

const COMPETITION_ORDER: readonly CompetitionType[] = [
  "league",
  "champions_league",
  "domestic_cup",
  "super_cup",
  "club_world_cup",
  "national_team",
];

/** Club label for a season: club rows only (a season is a single club here). */
function clubForSeason(rows: readonly PlayerSeasonComp[]): string {
  const clubRows = rows.filter((r) => r.competitionType !== "national_team");
  const clubs = [...new Set(clubRows.map((r) => r.club))];
  if (clubs.length === 1) return clubs[0];
  if (clubs.length > 1) return clubs.join(" / ");
  return rows[0]?.club ?? "—";
}

/**
 * Build the full personal profile for one player. Career totals/derived include
 * penalties (the player's real output). Seasons are oldest→newest; competition
 * buckets only include those the player actually played in.
 */
export function buildPlayerProfile(
  rows: readonly PlayerSeasonComp[],
  id: PlayerId,
): PlayerProfile {
  const playerRows = rowsForPlayer(rows, id); // already sorted oldest→newest

  const totals = aggregate(playerRows, true);
  const derived = deriveMetrics(totals);

  const seasonLabels = [...new Set(playerRows.map((r) => r.season))].sort(
    (a, b) => seasonStartYear(a) - seasonStartYear(b),
  );
  const seasons: SeasonRow[] = seasonLabels.map((season) => {
    const seasonRows = playerRows.filter((r) => r.season === season);
    return {
      season,
      club: clubForSeason(seasonRows),
      competitions: [...new Set(seasonRows.map((r) => r.competitionType))],
      totals: aggregate(seasonRows, true),
    };
  });

  const byCompetition: CompetitionRow[] = COMPETITION_ORDER.flatMap((competition) => {
    const compRows = filterByCompetition(playerRows, competition);
    if (compRows.length === 0) return [];
    const compTotals = aggregate(compRows, true);
    return [{ competition, totals: compTotals, derived: deriveMetrics(compTotals) }];
  });

  return {
    id,
    firstSeason: seasonLabels[0] ?? "—",
    lastSeason: seasonLabels[seasonLabels.length - 1] ?? "—",
    totals,
    derived,
    seasons,
    byCompetition,
    ageProgression: buildAgeProgression(playerRows),
    byLeague: buildByLeague(playerRows),
  };
}
