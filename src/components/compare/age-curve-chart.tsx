"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import type { MetricKey } from "@/lib/data";
import { statLabel, formatStatValue } from "@/components/card/card-labels";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { DURATION, EASE } from "@/lib/motion/tokens";
import { CHART_COLORS } from "@/components/charts/chart-util";
import { ChartLegend } from "@/components/charts/chart-legend";
import type { AgeTrendModel } from "./compare-model";

/**
 * Same-age overlay curve for `/compare` (Phase 11 §4.4-A). Two lines, Messi
 * (blue, solid) vs Ronaldo (red, dashed), of the focus metric re-keyed by
 * `ageDuringSeason`. Real data only — a gap where one side has no row at an age
 * BREAKS the line (never interpolated, never faked), per DATA_REPORT honesty.
 *
 * Self-contained, prop-driven, reduced-motion safe (the static final state is
 * fully readable). Series differ by COLOR and LINE STYLE so they're
 * distinguishable without color alone (a11y `color-not-only`).
 */

const W = 560;
const H = 280;
const PAD = { top: 16, right: 16, bottom: 36, left: 42 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

type XY = { x: number; y: number };

function projectSeries(values: (number | null)[], model: AgeTrendModel): (XY | null)[] {
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

/** SVG path, breaking the line at null gaps (honesty line — no interpolation). */
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

export function AgeCurveChart({
  model,
  metricKey,
  t,
  className,
  style,
}: {
  model: AgeTrendModel;
  metricKey: MetricKey;
  t: Dictionary;
  className?: string;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();

  const messi = projectSeries(model.messi, model);
  const ronaldo = projectSeries(model.ronaldo, model);

  const ticks = Array.from({ length: 5 }, (_, i) => {
    const v = model.yMin + ((model.yMax - model.yMin) * i) / 4;
    const y = PAD.top + PLOT_H - (i / 4) * PLOT_H;
    return { v, y };
  });

  const labelEvery = Math.max(1, Math.ceil(model.ages.length / 10));

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
          {t.cmpAgeTitle}
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
          aria-label={`${t.cmpAgeTitle} — ${statLabel(t, metricKey)}`}
        >
          {ticks.map((tk, i) => (
            <g key={`yt-${i}`}>
              <line x1={PAD.left} y1={tk.y} x2={W - PAD.right} y2={tk.y} stroke={CHART_COLORS.grid} strokeWidth="1" />
              <text x={PAD.left - 6} y={tk.y} textAnchor="end" dominantBaseline="middle" fontSize="9" fill={CHART_COLORS.axisText}>
                {formatStatValue(metricKey, tk.v, model.yMax < 10 ? 1 : 0)}
              </text>
            </g>
          ))}

          {model.ages.map((age, i) => {
            if (i % labelEvery !== 0 && i !== model.ages.length - 1) return null;
            const n = model.ages.length;
            const x = PAD.left + (n > 1 ? (i * PLOT_W) / (n - 1) : PLOT_W / 2);
            return (
              <text key={`xt-${age}`} x={x} y={H - PAD.bottom + 16} textAnchor="middle" fontSize="9" fill={CHART_COLORS.axisText}>
                {age}
              </text>
            );
          })}

          {/* x-axis caption */}
          <text x={PAD.left + PLOT_W / 2} y={H - 4} textAnchor="middle" fontSize="9" fill={CHART_COLORS.axisText}>
            {t.cmpAgeAxis}
          </text>

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

          {ronaldo.map((p, i) =>
            p ? <circle key={`rp-${i}`} cx={p.x} cy={p.y} r="2.5" fill={CHART_COLORS.ronaldoBright} /> : null,
          )}
          {messi.map((p, i) =>
            p ? <circle key={`mp-${i}`} cx={p.x} cy={p.y} r="2.5" fill={CHART_COLORS.messiBright} /> : null,
          )}
        </svg>
      )}
      <p className="mt-2 text-xs text-[var(--color-text-muted)]">{t.cmpAgeNote}</p>
    </figure>
  );
}
