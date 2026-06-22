import type {
  AdapterId,
  CompetitionType,
  PlayerId,
  PlayerSeasonComp,
} from "./types";
import { hasAdvancedMetrics } from "./seed";

/**
 * Normalization layer: raw source records → canonical `PlayerSeasonComp`.
 *
 * This is the REAL parse/normalize logic exercised by unit tests on fixtures.
 * Adapters call these helpers when a live source responds; on any failure they
 * skip this path and fall back to the seed dataset instead.
 */

/** Loosely-typed record from a season-stats source (Wikidata/FBref-style). */
export type RawSeasonRecord = {
  player: PlayerId;
  season: string; // accepts "2011/12", "2011-12", "2011/2012"
  age: number | string;
  club: string;
  competitionName: string;
  matches?: number | string;
  starts?: number | string;
  minutes?: number | string;
  goals?: number | string;
  penaltyGoals?: number | string;
  freekickGoals?: number | string;
  assists?: number | string;
  shots?: number | string;
  shotsOnTarget?: number | string;
  yellowCards?: number | string;
  redCards?: number | string;
  trophies?: string[];
  individualAwards?: string[];
};

/**
 * xG/xA payload keyed by player+season (Understat-style). Understat's per-season
 * totals are LEAGUE-competition data, so the overlay attaches by player+season to
 * the league row regardless of the league's name (La Liga / Serie A / EPL / ...).
 */
export type RawAdvancedRecord = {
  player: PlayerId;
  season: string;
  xg: number | string;
  xa: number | string;
};

const COMPETITION_KEYWORDS: ReadonlyArray<readonly [RegExp, CompetitionType]> = [
  [/champions\s*league|ucl/i, "champions_league"],
  [/club\s*world\s*cup|mundial\s*de\s*clubes/i, "club_world_cup"],
  [/super\s*cup|supercopa|supercup/i, "super_cup"],
  [/copa\s*del\s*rey|fa\s*cup|coppa\s*italia|cup$/i, "domestic_cup"],
  [
    /la\s*liga|premier\s*league|serie\s*a|ligue\s*1|primeira\s*liga|major\s*league\s*soccer|saudi\s*pro\s*league|bundesliga/i,
    "league",
  ],
  [/national|argentina|portugal|seleç|seleccion|world\s*cup|copa\s*am|euro|nations\s*league/i, "national_team"],
];

/** Map a free-text competition name to a canonical bucket. */
export function classifyCompetition(name: string): CompetitionType {
  for (const [pattern, type] of COMPETITION_KEYWORDS) {
    if (pattern.test(name)) return type;
  }
  // Unknown competition names default to league rather than dropping the row.
  return "league";
}

/** Normalize a season label to the canonical "YYYY/YY" form. */
export function normalizeSeasonLabel(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{4})\s*[/-]\s*(\d{2,4})$/);
  if (!match) return trimmed;
  const start = match[1];
  const endRaw = match[2];
  const end = endRaw.length === 4 ? endRaw.slice(2) : endRaw.padStart(2, "0");
  return `${start}/${end}`;
}

/** Coerce a possibly-string numeric field to a finite number (default 0). */
export function toNumber(value: number | string | undefined): number {
  if (value === undefined || value === null) return 0;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Turn one raw season record into a canonical row. xG/xA start as null and are
 * filled later by the advanced adapter (Understat). Pre-2014 seasons keep null.
 */
export function normalizeSeasonRecord(
  raw: RawSeasonRecord,
  adapter: AdapterId,
): PlayerSeasonComp {
  const season = normalizeSeasonLabel(raw.season);
  return {
    player: raw.player,
    season,
    ageDuringSeason: toNumber(raw.age),
    club: raw.club.trim(),
    competitionType: classifyCompetition(raw.competitionName),
    competitionName: raw.competitionName.trim(),
    matches: toNumber(raw.matches),
    starts: toNumber(raw.starts),
    minutes: toNumber(raw.minutes),
    goals: toNumber(raw.goals),
    penaltyGoals: toNumber(raw.penaltyGoals),
    freekickGoals: toNumber(raw.freekickGoals),
    assists: toNumber(raw.assists),
    shots: toNumber(raw.shots),
    shotsOnTarget: toNumber(raw.shotsOnTarget),
    xg: null,
    xa: null,
    yellowCards: toNumber(raw.yellowCards),
    redCards: toNumber(raw.redCards),
    trophies: raw.trophies ?? [],
    individualAwards: raw.individualAwards ?? [],
    verified: false,
    source: { adapter, origin: "fetched", enrichedBy: [] },
  };
}

/** Shot/discipline payload keyed by player+season+competition (FBref-style). */
export type RawShotRecord = {
  player: PlayerId;
  season: string;
  competitionName: string;
  shots: number;
  shotsOnTarget: number;
  yellowCards: number;
  redCards: number;
};

/** Append an adapter to a row's `enrichedBy` provenance, de-duplicated. */
function withEnricher(
  source: PlayerSeasonComp["source"],
  adapter: AdapterId,
): PlayerSeasonComp["source"] {
  return {
    ...source,
    enrichedBy: source.enrichedBy.includes(adapter)
      ? source.enrichedBy
      : [...source.enrichedBy, adapter],
  };
}

/**
 * Generic overlay: merge enrichment records onto base rows. ONE place owns the
 * match-by-key + apply-fields + provenance-append logic; both the Understat
 * (xG/xA) and FBref (shots/discipline) overlays route through it.
 *
 * - `keyOf` builds the lookup key for both a base row and an overlay record.
 * - `apply` returns the field patch to merge onto a matched row, or `null` to
 *   skip (e.g. honesty line: pre-2014 seasons get no xG/xA).
 *
 * Returns a NEW array (does not mutate input rows).
 */
export function enrichWith<R>(
  rows: readonly PlayerSeasonComp[],
  records: readonly R[],
  adapter: AdapterId,
  keyOf: (row: PlayerSeasonComp) => string,
  recordKeyOf: (record: R) => string,
  apply: (record: R, row: PlayerSeasonComp) => Partial<PlayerSeasonComp> | null,
): PlayerSeasonComp[] {
  const byKey = new Map<string, R>();
  for (const r of records) byKey.set(recordKeyOf(r), r);
  return rows.map((row) => {
    const match = byKey.get(keyOf(row));
    if (match === undefined) return row;
    const patch = apply(match, row);
    if (patch === null) return row;
    return { ...row, ...patch, source: withEnricher(row.source, adapter) };
  });
}

/**
 * Merge advanced (xG/xA) records onto base rows by (player, season, LEAGUE row).
 * Understat xG/xA is league-competition data, so it attaches to each player-
 * season's `competitionType === "league"` row regardless of the league's name.
 * Respects the honesty line: pre-2014 seasons stay null even if a value arrives.
 * Returns a NEW array (does not mutate input rows).
 */
export function enrichWithAdvanced(
  rows: readonly PlayerSeasonComp[],
  advanced: readonly RawAdvancedRecord[],
  adapter: AdapterId,
): PlayerSeasonComp[] {
  const leagueKey = (player: PlayerId, season: string): string =>
    `${player}::${season}::league`;
  return enrichWith(
    rows,
    advanced,
    adapter,
    (row) =>
      row.competitionType === "league"
        ? leagueKey(row.player, row.season)
        : // Non-league rows can never match a league overlay key.
          `${row.player}::${row.season}::${row.competitionType}`,
    (rec) => leagueKey(rec.player, normalizeSeasonLabel(rec.season)),
    (rec, row) =>
      hasAdvancedMetrics(row.season)
        ? { xg: toNumber(rec.xg), xa: toNumber(rec.xa) }
        : null,
  );
}

/**
 * Merge FBref/Transfermarkt shot & discipline records onto base rows by
 * (player, season, competition name). Only overwrites a field when the overlay
 * carries a non-zero value (keeps seed values otherwise).
 * Returns a NEW array (does not mutate input rows).
 */
export function enrichWithShots(
  rows: readonly PlayerSeasonComp[],
  records: readonly RawShotRecord[],
  adapter: AdapterId,
): PlayerSeasonComp[] {
  const key = (player: PlayerId, season: string, competitionName: string): string =>
    `${player}::${season}::${competitionName.toLowerCase()}`;
  return enrichWith(
    rows,
    records,
    adapter,
    (row) => key(row.player, row.season, row.competitionName),
    (rec) => key(rec.player, normalizeSeasonLabel(rec.season), rec.competitionName),
    (rec, row) => ({
      shots: rec.shots || row.shots,
      shotsOnTarget: rec.shotsOnTarget || row.shotsOnTarget,
      yellowCards: rec.yellowCards || row.yellowCards,
      redCards: rec.redCards || row.redCards,
    }),
  );
}
