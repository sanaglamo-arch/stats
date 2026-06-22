import { METRIC_CATALOG, type MetricKey } from "@/lib/data";

/**
 * Tiny shared helpers for the hand-rolled SVG charts (radar / trend / pitch).
 * Pure, DOM-free, framework-free → safe to import from builders and components
 * alike, and trivially unit-testable.
 */

/**
 * Brand chart palette. These mirror the CSS design tokens in `globals.css`
 * (`--color-messi*`, `--color-ronaldo*`, `--color-gold*`). SVG `fill`/`stroke`
 * attributes can't read CSS custom properties reliably across the headless PNG
 * renderer, so the literal brand values live here as the single chart-side
 * source of truth. Keep in lockstep with the tokens.
 */
export const CHART_COLORS = {
  messi: "#e91e8c",
  messiBright: "#ff5fb0",
  ronaldo: "#2ea8ff",
  ronaldoBright: "#6fc8ff",
  gold: "#f5c451",
  grid: "rgba(255, 255, 255, 0.10)",
  gridStrong: "rgba(255, 255, 255, 0.18)",
  axisText: "#94a3b8",
} as const;

export type PlayerSide = "messi" | "ronaldo";

/** The accent (line/border) color for a player side. */
export function sideColor(side: PlayerSide): string {
  return side === "messi" ? CHART_COLORS.messi : CHART_COLORS.ronaldo;
}

/** The bright variant for a player side (used for emphasis / glow). */
export function sideColorBright(side: PlayerSide): string {
  return side === "messi" ? CHART_COLORS.messiBright : CHART_COLORS.ronaldoBright;
}

/** Round to a fixed number of decimals (kills FP noise in SVG path strings). */
export function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/** Clamp into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Normalize one metric value pair into [0,1] "outward-is-better" fractions,
 * mirroring the card bar logic so the radar agrees with the card.
 *
 *  - higher-is-better: fraction = value / max(messi, ronaldo). The larger value
 *    reaches the rim (1); the other is proportionally shorter.
 *  - lower-is-better: fraction = min(messi, ronaldo) / value. The SMALLER (better)
 *    value reaches the rim (1); the larger (worse) value is proportionally
 *    shorter — so "better" always points outward regardless of direction.
 *
 * Edge cases:
 *  - higher-is-better with max <= 0 (both zero) → both 0 (nothing to show).
 *  - lower-is-better with a 0 value: 0 is the best possible (e.g. zero red
 *    cards). The side with 0 maps to 1; the other to min/value = 0/value = 0.
 *    If BOTH are 0 → both map to 1 (a perfect tie at the rim).
 */
export function normalizePair(
  messi: number,
  ronaldo: number,
  higherIsBetter: boolean,
): { messi: number; ronaldo: number } {
  if (higherIsBetter) {
    const max = Math.max(messi, ronaldo);
    if (max <= 0) return { messi: 0, ronaldo: 0 };
    return {
      messi: clamp(messi / max, 0, 1),
      ronaldo: clamp(ronaldo / max, 0, 1),
    };
  }
  // Lower is better: the minimum value defines the rim.
  const min = Math.min(messi, ronaldo);
  if (min <= 0) {
    // Best possible is 0; a 0 side reaches the rim, a positive side collapses.
    return { messi: messi <= 0 ? 1 : 0, ronaldo: ronaldo <= 0 ? 1 : 0 };
  }
  return {
    messi: clamp(min / messi, 0, 1),
    ronaldo: clamp(min / ronaldo, 0, 1),
  };
}

/** Whether a metric is "higher is better" (from the catalog). */
export function higherIsBetter(key: MetricKey): boolean {
  return METRIC_CATALOG[key].higherIsBetter;
}
