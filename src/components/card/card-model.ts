import {
  compare,
  dataSource,
  sliceRows,
  type CardStatKey,
  type CategoryWinner,
  type ComparisonResult,
  type PlayerSeasonComp,
  type SliceOptions,
} from "@/lib/data";

/**
 * Builds the view-model the card component renders from. Pure & deterministic:
 * given the dataset rows + the two players' slice options it produces the exact
 * structure the UI draws (header context, stat rows with normalized bar widths,
 * the mechanical score). No React, no DOM — so it is unit-testable and reused by
 * the live preview and the PNG render route alike.
 */

/** Slice options for one side (player is fixed by the side, so it's omitted). */
export type SideOptions = Omit<SliceOptions, "player">;

export type CardSlice = {
  messi: SideOptions;
  ronaldo: SideOptions;
};

/** Default matchup used by the render route when no params are given. */
export const DEFAULT_SLICE: CardSlice = {
  messi: { selection: { kind: "season", season: "2011/12" }, competition: "all", includePenalties: true },
  ronaldo: { selection: { kind: "season", season: "2014/15" }, competition: "all", includePenalties: true },
};

/** One rendered stat row: both values + normalized bar fractions (0..1). */
export type CardStatRow = {
  key: CardStatKey;
  messiValue: number;
  ronaldoValue: number;
  /** Bar fill fraction relative to the larger of the two values (0..1). */
  messiFraction: number;
  ronaldoFraction: number;
  /** Who holds the better value for this stat (mechanical). */
  winner: CategoryWinner;
  /** Decimals to format both values with. */
  decimals: number;
  /** Lower-is-better stats (cards) render with an inverted hint. */
  higherIsBetter: boolean;
};

export type CardSideContext = {
  /** Club label for the slice ("Career", a single club, or "Various"). */
  club: string;
  trophies: number;
};

export type CardViewModel = {
  messi: CardSideContext;
  ronaldo: CardSideContext;
  rows: CardStatRow[];
  score: { messi: number; ronaldo: number };
  /** Total contested categories (= rows that produced a verdict). */
  contested: number;
};

/**
 * Club label for a slice. National-team rows carry the country in `club`, so we
 * derive the label from CLUB rows only — a single-club season filtered to "all
 * competitions" must read "Barcelona", not "Various" just because the national
 * team is also included. Multiple distinct clubs (a real multi-club / career
 * slice) → "Various". If the slice is national-team-only, show the country.
 */
function clubLabel(rows: readonly PlayerSeasonComp[]): string {
  if (rows.length === 0) return "—";
  const clubRows = rows.filter((r) => r.competitionType !== "national_team");
  const clubs = [...new Set(clubRows.map((r) => r.club))];
  if (clubs.length === 1) return clubs[0];
  if (clubs.length > 1) return "Various";
  // No club rows → national-team-only slice; fall back to the country.
  return rows[0].club;
}

function fraction(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(1, value / max));
}

/**
 * Run the comparison and shape it for the card. Stats where either side is
 * `null` (e.g. xG pre-2014) are dropped entirely — the card never shows a blank
 * bar (honesty line, SPEC §6).
 */
export function buildCardViewModel(
  rows: readonly PlayerSeasonComp[],
  slice: CardSlice,
): CardViewModel {
  const result: ComparisonResult = compare(rows, slice.messi, slice.ronaldo);

  const ronaldoByKey = new Map(result.ronaldo.stats.map((s) => [s.key, s]));
  const winnerByKey = new Map(result.perCategory.map((c) => [c.key, c.winner]));

  const statRows: CardStatRow[] = [];
  for (const ms of result.messi.stats) {
    const rs = ronaldoByKey.get(ms.key);
    if (!rs) continue;
    if (ms.value === null || rs.value === null) continue; // hidden stat

    const max = Math.max(ms.value, rs.value);
    statRows.push({
      key: ms.key,
      messiValue: ms.value,
      ronaldoValue: rs.value,
      messiFraction: fraction(ms.value, max),
      ronaldoFraction: fraction(rs.value, max),
      winner: winnerByKey.get(ms.key) ?? "tie",
      decimals: ms.decimals,
      higherIsBetter: ms.higherIsBetter,
    });
  }

  return {
    messi: {
      club: clubLabel(sliceRows(rows, { ...slice.messi, player: "messi" })),
      trophies: result.messi.totals.trophies.length,
    },
    ronaldo: {
      club: clubLabel(sliceRows(rows, { ...slice.ronaldo, player: "ronaldo" })),
      trophies: result.ronaldo.totals.trophies.length,
    },
    rows: statRows,
    score: result.score,
    contested: statRows.length,
  };
}

/** Convenience: build straight from the default committed data source. */
export function buildDefaultCardViewModel(slice: CardSlice): CardViewModel {
  return buildCardViewModel(dataSource.getAllRows(), slice);
}
