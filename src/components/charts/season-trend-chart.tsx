"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import type { MetricKey, PlayerSeasonComp, SeasonTrendOptions } from "@/lib/data";
import { statLabel, formatStatValue } from "@/components/card/card-labels";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { DURATION, EASE } from "@/lib/motion/tokens";
import { CHART_COLORS } from "./chart-util";
import { buildTrendModel, type TrendModel } from "./trend-model";
import { ChartLegend } from "./chart-legend";

/**
 * Season-trend chart (P6-6) — a metric across seasons for BOTH players. Real
 * data via `seasonTrend`; honest gaps where a value is null (e.g. xG pre-2014)
 * — the line BREAKS, never interpolated (SPEC §6). Hand-rolled SVG, subtle grid.
 *
 * Self-contained & prop-driven. Reduced-motion guarded; the static final state
 * is fully readable. Series differ by COLOR and LINE STYLE (Ronaldo dashed) so
 * they're distinguishable without color alone (a11y `color-not-only`).
 */

const W = 520;
const H = 260;
const PAD = { top: 16, right: 16, bottom: 34, left: 38 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

type XY = { x: number; y: number };

/** Map a value column to plot coordinates; null columns are skipped. */
function projectSeries(values: (number | null)[], model: TrendModel): (XY | null)[] {
  const n = values.length;
  const span = model.yMax - model.yMin || 1;
  const stepX = n > 1 ? PLOT_W / (n - 1) : 0;
  return values.map((v, i) => {
    if (v === null) return null;
    const x = PAD.left + (n > 1 ? i * stepX : PLOT_W / 2);
    const y = PAD.top + PLOT_H - ((v - model.yMin) / span) * PLOT_H;
    return { x, y };
  });
}

/**
 * Build SVG path "d" for a series, breaking the line at null gaps (each
 * contiguous run of points is its own move-to subpath) — honesty line.
 */
function linePath(points: (XY | null)[]): string {
  let d = "";
  let penDown = false;
  for (const p of points) {
    if (p === null) {
      penDown = false;
      continue;
    }
    d += `${penDown ? "L" : "M"}${p.x.toFixed(2)},${p.y.toFixed(2)} `;
    penDown = true;
  }
  return d.trim();
}

export function SeasonTrendChart({
  rows,
  metricKey,
  t,
  opts,
  className,
  style,
}: {
  rows: readonly PlayerSeasonComp[];
  metricKey: MetricKey;
  t: Dictionary;
  opts?: SeasonTrendOptions;
  className?: string;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  const model = buildTrendModel(rows, metricKey, opts);

  const messi = projectSeries(model.messi, model);
  const ronaldo = projectSeries(model.ronaldo, model);

  // y-axis ticks (4 evenly spaced including bounds).
  const ticks = Array.from({ length: 5 }, (_, i) => {
    const v = model.yMin + ((model.yMax - model.yMin) * i) / 4;
    const y = PAD.top + PLOT_H - (i / 4) * PLOT_H;
    return { v, y };
  });

  // Thin the x labels on long axes so they never collide.
  const labelEvery = Math.ceil(model.seasons.length / 8);

  const drawAnim = reduce
    ? undefined
    : {
        initial: { pathLength: 0, opacity: 0 },
        animate: { pathLength: 1, opacity: 1 },
        transition: { duration: DURATION.slow, ease: EASE.out },
      };

  return (
    <figure className={className} style={style}>
      <figcaption className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
          {t.chartTrendTitle}
          <span className="ml-2 font-normal" style={{ color: "var(--color-text-secondary)" }}>
            · {statLabel(t, metricKey)}
          </span>
        </h3>
        <ChartLegend dashed />
      </figcaption>

      {!model.hasData ? (
        <p className="py-10 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {t.chartNoData}
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`${t.chartTrendTitle} — ${statLabel(t, metricKey)}`}
        >
          {/* Horizontal gridlines + y tick labels */}
          {ticks.map((tk, i) => (
            <g key={`yt-${i}`}>
              <line
                x1={PAD.left}
                y1={tk.y}
                x2={W - PAD.right}
                y2={tk.y}
                stroke={CHART_COLORS.grid}
                strokeWidth="1"
              />
              <text
                x={PAD.left - 6}
                y={tk.y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="9"
                fill={CHART_COLORS.axisText}
              >
                {formatStatValue(metricKey, tk.v, model.yMax < 10 ? 1 : 0)}
              </text>
            </g>
          ))}

          {/* x season labels */}
          {model.seasons.map((s, i) => {
            if (i % labelEvery !== 0 && i !== model.seasons.length - 1) return null;
            const n = model.seasons.length;
            const x = PAD.left + (n > 1 ? (i * PLOT_W) / (n - 1) : PLOT_W / 2);
            return (
              <text
                key={`xt-${s}`}
                x={x}
                y={H - PAD.bottom + 16}
                textAnchor="middle"
                fontSize="9"
                fill={CHART_COLORS.axisText}
              >
                {s.slice(2)}
              </text>
            );
          })}

          {/* Ronaldo (dashed) then Messi (solid) */}
          <motion.path
            {...drawAnim}
            d={linePath(ronaldo)}
            fill="none"
            stroke={CHART_COLORS.ronaldo}
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 5"
            style={{ filter: `drop-shadow(0 0 4px ${CHART_COLORS.ronaldo})` }}
          />
          <motion.path
            {...drawAnim}
            d={linePath(messi)}
            fill="none"
            stroke={CHART_COLORS.messi}
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 4px ${CHART_COLORS.messi})` }}
          />

          {/* Vertices (only on real points) */}
          {ronaldo.map((p, i) =>
            p ? (
              <circle key={`rp-${i}`} cx={p.x} cy={p.y} r="2.5" fill={CHART_COLORS.ronaldoBright} />
            ) : null,
          )}
          {messi.map((p, i) =>
            p ? (
              <circle key={`mp-${i}`} cx={p.x} cy={p.y} r="2.5" fill={CHART_COLORS.messiBright} />
            ) : null,
          )}
        </svg>
      )}
    </figure>
  );
}
