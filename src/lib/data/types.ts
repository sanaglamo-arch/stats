/**
 * Canonical data model for FootyCompare (SPEC §6 — load-bearing wall).
 *
 * The atomic unit is ONE row per (player × season × competition).
 * Every slice (season pick / competition filter / same-age / penalties on-off)
 * is computed by summing & filtering these rows. We never store career totals.
 */

export type PlayerId = "messi" | "ronaldo";

/**
 * Competition buckets. Kept as a closed union so the slicer can switch over
 * them exhaustively (no string typos leaking into aggregation).
 */
export type CompetitionType =
  | "league"
  | "champions_league"
  | "domestic_cup"
  | "super_cup"
  | "club_world_cup"
  | "national_team";

/**
 * Provenance for a single row. `fetched` means a live source returned it this
 * ingestion run; `seed` means we fell back to the hand-built plausible dataset
 * (recorded in DATA_REPORT.md). `adapter` is the adapter that produced the row.
 */
export type RowProvenance = {
  adapter: AdapterId;
  origin: "fetched" | "seed";
  /** Adapters that contributed/enriched fields onto this row (e.g. Understat xG). */
  enrichedBy: AdapterId[];
};

export type AdapterId = "wikidata" | "understat" | "fbref" | "transfermarkt";

/**
 * One canonical comparison row. EXACTLY the shape mandated by SPEC §6, plus
 * `verified` (always false until owner sign-off) and `source` provenance.
 */
export type PlayerSeasonComp = {
  player: PlayerId;
  /** Season label, e.g. "2011/12". */
  season: string;
  /** Player age during this season — drives the same-age alignment slice. */
  ageDuringSeason: number;
  /** Club for this season (or national team name for national_team rows). */
  club: string;
  competitionType: CompetitionType;
  /** Human competition name, e.g. "La Liga", "UEFA Champions League". */
  competitionName: string;

  // playing time
  matches: number;
  starts: number;
  minutes: number;

  // goals (broken out so the penalties on/off slice can subtract them)
  goals: number;
  penaltyGoals: number;
  freekickGoals: number;

  // creation
  assists: number;

  // shooting
  shots: number;
  shotsOnTarget: number;

  // advanced — ONLY meaningful for ~2014+ seasons, otherwise null (honesty line)
  xg: number | null;
  xa: number | null;

  // discipline
  yellowCards: number;
  redCards: number;

  // season achievements
  trophies: string[];
  individualAwards: string[];

  /** Never trust blindly: false until the owner verifies before launch. */
  verified: boolean;
  /** Where this row came from this ingestion run. */
  source: RowProvenance;
};

/**
 * Swappable data layer. The frontend reads rows ONLY through this interface so
 * sources can be replaced (live API → cached JSON → another provider) without
 * touching any UI. The default implementation reads the committed dataset JSON.
 */
export interface DataSource {
  /** Returns every canonical row in the dataset. */
  getAllRows(): readonly PlayerSeasonComp[];
  /** Returns rows for a single player. */
  getPlayerRows(player: PlayerId): readonly PlayerSeasonComp[];
}

/**
 * An ingestion adapter. Each external source (Wikidata, Understat, FBref,
 * Transfermarkt) implements this. `fetchRows` attempts a live fetch and MUST
 * degrade gracefully to seed data on any failure, recording the degradation.
 */
export interface IngestionAdapter {
  readonly id: AdapterId;
  /**
   * Produce canonical rows. Implementations attempt live fetch first and fall
   * back to seed; the returned result reports which path was taken.
   */
  fetchRows(): Promise<AdapterResult>;
}

export type AdapterResult = {
  adapter: AdapterId;
  /** Whether the live source was reached this run. */
  liveFetchSucceeded: boolean;
  /** Human note for DATA_REPORT.md (why it degraded, what it covers). */
  note: string;
  rows: PlayerSeasonComp[];
};
