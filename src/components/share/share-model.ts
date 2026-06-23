import { dataSource } from "@/lib/data";
import {
  buildArenaModel,
  parseCategoryParam,
  selectVerdict,
  type ArenaCategory,
  type CategoryKey,
  type RowWinner,
} from "@/components/arena/arena-model";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Pure, deterministic model for the SHARE CARD (P9-6). It reads the SAME real
 * Arena model used everywhere else (`buildArenaModel` → `selectVerdict` over the
 * selected `?cats=`) — nothing is fabricated. The share card is generated on
 * demand and rendered to PNG by the headless pipeline, so this stays free of
 * React/DOM/clock/RNG (identical output in the live preview and the screenshot).
 *
 * The `showWinner` flag mirrors the arena's verdict toggle: OFF → a neutral card
 * (matchup + per-category numbers, NO winner/score/crown).
 */

/** One compact line in the share card's category list. */
export type ShareCategoryLine = {
  key: CategoryKey;
  labelKey: keyof Dictionary;
  /** Headline value per side (the first row of the category). */
  ronaldo: string;
  messi: string;
  /** Who won the category (used only when showWinner). */
  winner: RowWinner;
};

export type ShareModel = {
  showWinner: boolean;
  /** Overall winner across the selected categories (null = tie / hidden). */
  winner: "ronaldo" | "messi" | null;
  /** Real categories-won tally. */
  score: { ronaldo: number; messi: number; tied: number };
  /** Top category lines (capped so the card never overflows its band). */
  lines: ShareCategoryLine[];
  /** How many categories were selected in total. */
  totalCategories: number;
};

/** Max category lines on the card before it gets cramped (portrait band). */
const MAX_LINES = 6;

/** Format the headline value of a category's first row (matches the arena). */
function headline(cat: ArenaCategory, side: "ronaldo" | "messi"): string {
  const row = cat.rows[0];
  const value = side === "ronaldo" ? row.ronaldo : row.messi;
  if (row.format === "percent") return `${(value * 100).toFixed(row.decimals)}%`;
  if (value >= 1000) return new Intl.NumberFormat("en-US").format(Math.round(value));
  return value.toFixed(row.decimals);
}

/**
 * Build the share model from a `?cats=` value + the showWinner flag. Reads the
 * canonical dataset, recomputes the verdict over the selection, and shapes the
 * compact category lines. Cannot throw on bad input (the param parser falls back
 * to all categories), so the render route is safe.
 */
export function buildShareModel(catsParam: string | null, showWinner: boolean): ShareModel {
  const keys = parseCategoryParam(catsParam);
  const model = buildArenaModel(dataSource.getAllRows());
  const { categories, verdict } = selectVerdict(model, keys);

  const lines: ShareCategoryLine[] = categories.slice(0, MAX_LINES).map((cat) => ({
    key: cat.key,
    labelKey: cat.labelKey,
    ronaldo: headline(cat, "ronaldo"),
    messi: headline(cat, "messi"),
    winner: cat.winner,
  }));

  const winner = verdict.winner === "tie" ? null : verdict.winner;

  return {
    showWinner,
    winner: showWinner ? winner : null,
    score: {
      ronaldo: verdict.categoriesWon.ronaldo,
      messi: verdict.categoriesWon.messi,
      tied: verdict.categoriesWon.tied,
    },
    lines,
    totalCategories: categories.length,
  };
}
