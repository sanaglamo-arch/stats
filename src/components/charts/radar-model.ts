import { METRIC_CATALOG, type MetricKey } from "@/lib/data";
import type { CardViewModel } from "@/components/card";
import { normalizePair } from "./chart-util";

/**
 * Pure view-model builder for the comparison radar (P6-5). DOM-free and
 * deterministic so it can be unit-tested without rendering.
 *
 * Each axis is one metric. The two raw values are normalized into [0,1]
 * "outward-is-better" fractions via `normalizePair` (mirrors the card bar logic;
 * lower-is-better metrics are inverted so the better value reaches the rim).
 * The raw values are kept so the component can show exact numbers (a11y: never
 * rely on the polygon shape alone).
 */

/** One radar spoke. `messi`/`ronaldo` are normalized [0,1]; raws are exact. */
export type RadarAxis = {
  key: MetricKey;
  messi: number;
  ronaldo: number;
  messiRaw: number;
  ronaldoRaw: number;
  /** Number of decimals to format the raw values with. */
  decimals: number;
};

export type RadarModel = {
  axes: RadarAxis[];
};

/** A minimal stat shape the builder can consume directly (besides a CardViewModel). */
export type RadarStat = {
  key: MetricKey;
  messiValue: number;
  ronaldoValue: number;
};

function isCardViewModel(input: CardViewModel | readonly RadarStat[]): input is CardViewModel {
  return !Array.isArray(input);
}

/**
 * Build the radar model from either a CardViewModel (uses its already-resolved
 * `rows`) or a raw stat array. Only metrics present in `metrics` AND available
 * in the source (both sides have a value) become axes, preserving the order of
 * `metrics`. Metrics missing from the source are skipped (e.g. xG pre-2014 rows
 * never make it into a CardViewModel), so the radar never shows an empty spoke.
 */
export function buildRadarModel(
  input: CardViewModel | readonly RadarStat[],
  metrics: readonly MetricKey[],
): RadarModel {
  const byKey = new Map<MetricKey, RadarStat>();
  if (isCardViewModel(input)) {
    for (const r of input.rows) {
      byKey.set(r.key, { key: r.key, messiValue: r.messiValue, ronaldoValue: r.ronaldoValue });
    }
  } else {
    for (const s of input) byKey.set(s.key, s);
  }

  const axes: RadarAxis[] = [];
  for (const key of metrics) {
    const stat = byKey.get(key);
    if (!stat) continue; // unavailable for this slice → no spoke
    const def = METRIC_CATALOG[key];
    const frac = normalizePair(stat.messiValue, stat.ronaldoValue, def.higherIsBetter);
    axes.push({
      key,
      messi: frac.messi,
      ronaldo: frac.ronaldo,
      messiRaw: stat.messiValue,
      ronaldoRaw: stat.ronaldoValue,
      decimals: def.decimals,
    });
  }
  return { axes };
}
