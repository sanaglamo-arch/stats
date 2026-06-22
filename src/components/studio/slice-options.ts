import { rowsForPlayer, type PlayerId, type PlayerSeasonComp } from "@/lib/data";

/**
 * Valid selector domains for one player, derived from the dataset (never
 * hardcoded — SPEC §6). Seasons are newest-first (so the default-open option is
 * the most recent), ages ascending. The studio uses these to populate the
 * per-player season / age value pickers (NeonSelect, Radix-based).
 */
export type PlayerSliceOptions = {
  /** Season labels available for this player, newest first. */
  seasons: string[];
  /** Distinct ages the player played at, ascending. */
  ages: number[];
};

export function playerSliceOptions(
  rows: readonly PlayerSeasonComp[],
  player: PlayerId,
): PlayerSliceOptions {
  const playerRows = rowsForPlayer(rows, player);
  const seasons = [...new Set(playerRows.map((r) => r.season))].sort((a, b) =>
    b.localeCompare(a),
  );
  const ages = [...new Set(playerRows.map((r) => r.ageDuringSeason))].sort((a, b) => a - b);
  return { seasons, ages };
}

/** Ages both players share — the valid domain for the "same age" convenience. */
export function commonAges(
  rows: readonly PlayerSeasonComp[],
): number[] {
  const messi = new Set(playerSliceOptions(rows, "messi").ages);
  const ronaldo = playerSliceOptions(rows, "ronaldo").ages;
  return ronaldo.filter((age) => messi.has(age)).sort((a, b) => a - b);
}
