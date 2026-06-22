import {
  seasonTrend,
  type MetricKey,
  type PlayerSeasonComp,
  type SeasonTrendOptions,
} from "@/lib/data";
import { roundTo } from "./chart-util";

/**
 * Pure view-model builder for the season-trend chart (P6-6). DOM-free and
 * deterministic. Calls the REAL `seasonTrend` provider for both players, unions
 * their seasons onto one chronological x-axis, and computes the shared y-scale.
 *
 * Honesty: a season where the metric is unavailable (e.g. xG pre-2014, or a
 * player simply has no row that season) stays `null` — the line breaks there,
 * we never interpolate or fake a value (SPEC §6).
 */

export type TrendModel = {
  metricKey: MetricKey;
  /** Union of both players' seasons, oldest → newest. */
  seasons: string[];
  /** Per-season value aligned to `seasons`; null = gap (break the line). */
  messi: (number | null)[];
  ronaldo: (number | null)[];
  /** y-axis domain. `min` is 0 unless data goes negative; `max` ≥ all values. */
  yMin: number;
  yMax: number;
  /** True when at least one player has at least one real value. */
  hasData: boolean;
};

function seasonStartYear(season: string): number {
  return Number.parseInt(season.slice(0, 4), 10);
}

/** "Nice" upper bound so the top gridline sits on a round number. */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return roundTo(step * pow, 6);
}

export function buildTrendModel(
  rows: readonly PlayerSeasonComp[],
  metricKey: MetricKey,
  opts: SeasonTrendOptions = {},
): TrendModel {
  const messiPoints = seasonTrend(rows, "messi", metricKey, opts);
  const ronaldoPoints = seasonTrend(rows, "ronaldo", metricKey, opts);

  const messiBySeason = new Map(messiPoints.map((p) => [p.season, p.value]));
  const ronaldoBySeason = new Map(ronaldoPoints.map((p) => [p.season, p.value]));

  // Union of seasons, sorted chronologically by start year.
  const seasons = [...new Set([...messiBySeason.keys(), ...ronaldoBySeason.keys()])].sort(
    (a, b) => seasonStartYear(a) - seasonStartYear(b),
  );

  const messi = seasons.map((s) => messiBySeason.get(s) ?? null);
  const ronaldo = seasons.map((s) => ronaldoBySeason.get(s) ?? null);

  const values = [...messi, ...ronaldo].filter((v): v is number => v !== null);
  const hasData = values.length > 0;
  const rawMax = hasData ? Math.max(...values) : 1;
  const rawMin = hasData ? Math.min(...values) : 0;

  return {
    metricKey,
    seasons,
    messi,
    ronaldo,
    yMin: Math.min(0, rawMin),
    yMax: niceCeil(rawMax),
    hasData,
  };
}
