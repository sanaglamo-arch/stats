import {
  aggregate,
  deriveMetrics,
  filterByCompetition,
  rowsForPlayer,
  type AggregateTotals,
  type CompetitionType,
  type DerivedMetrics,
  type PlayerId,
  type PlayerSeasonComp,
} from "@/lib/data";

/**
 * Pure builder that shapes ONE player's personal profile from the canonical rows
 * (P7-5). It only READS the data layer — it composes the existing aggregators
 * (`rowsForPlayer` → `aggregate` → `deriveMetrics`, plus `filterByCompetition`).
 * No new statistics are invented; xG/xA stay null pre-2014 via `aggregate`.
 */

/** One season's roll-up for the season-by-season table (rendered tabular-nums). */
export type SeasonRow = {
  season: string;
  /** Club label for the season — club rows only; "national_team" rows excluded. */
  club: string;
  /** Distinct competition types covered that season (for a coverage summary). */
  competitions: CompetitionType[];
  totals: AggregateTotals;
};

/** One competition bucket's roll-up for the by-competition breakdown. */
export type CompetitionRow = {
  competition: CompetitionType;
  totals: AggregateTotals;
  derived: DerivedMetrics;
};

export type PlayerProfile = {
  id: PlayerId;
  /** Career span derived from the rows, oldest→newest season label. */
  firstSeason: string;
  lastSeason: string;
  /** Career totals over ALL the player's rows (penalties included). */
  totals: AggregateTotals;
  derived: DerivedMetrics;
  /** Oldest→newest. */
  seasons: SeasonRow[];
  /** Only competition buckets the player actually appeared in, canonical order. */
  byCompetition: CompetitionRow[];
};

/** Canonical bucket order for the by-competition breakdown. */
const COMPETITION_ORDER: readonly CompetitionType[] = [
  "league",
  "champions_league",
  "domestic_cup",
  "super_cup",
  "club_world_cup",
  "national_team",
];

function seasonStartYear(season: string): number {
  return Number.parseInt(season.slice(0, 4), 10);
}

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

  // --- Season-by-season ---
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

  // --- By competition (only buckets present in the data) ---
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
  };
}
