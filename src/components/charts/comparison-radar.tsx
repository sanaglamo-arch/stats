"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Fragment, useId, type CSSProperties } from "react";
import type { MetricKey } from "@/lib/data";
import type { CardViewModel } from "@/components/card";
import { statLabel } from "@/components/card/card-labels";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { DURATION, EASE } from "@/lib/motion/tokens";
import { CHART_COLORS } from "./chart-util";
import { buildRadarModel, type RadarStat } from "./radar-model";
import { ChartLegend } from "./chart-legend";

/**
 * Comparison radar (P6-5) — two overlaid polygons (Messi pink, Ronaldo blue)
 * over a normalized 0..1 multi-metric web. Hand-rolled SVG for full brand
 * control; no chart dependency.
 *
 * Self-contained & prop-driven: feed it a `CardViewModel` (or a raw stat array)
 * plus the metric set and the active dictionary. The enter animation is guarded
 * by `useReducedMotion`, and the FINAL static state is fully readable on its own
 * (no motion required to read it). Exact raw values are listed beneath the web
 * so meaning never depends on the polygon shape alone (a11y `color-not-only`).
 */

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 118;
const RINGS = 4;

type Point = { x: number; y: number };

function polar(angle: number, r: number): Point {
  return { x: CENTER + Math.cos(angle) * r, y: CENTER + Math.sin(angle) * r };
}

function polygonPath(points: Point[]): string {
  return (
    points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ") +
    " Z"
  );
}

export function ComparisonRadar({
  input,
  metrics,
  t,
  className,
  style,
}: {
  input: CardViewModel | readonly RadarStat[];
  metrics: readonly MetricKey[];
  t: Dictionary;
  className?: string;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/[:]/g, "");
  const { axes } = buildRadarModel(input, metrics);

  if (axes.length < 3) {
    // A radar needs ≥3 spokes to read as an area; degrade gracefully.
    return (
      <div className={className} style={style}>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {t.chartNoData}
        </p>
      </div>
    );
  }

  const n = axes.length;
  // Start at the top (−90°) and go clockwise.
  const angleAt = (i: number): number => -Math.PI / 2 + (i * 2 * Math.PI) / n;

  const messiPoints = axes.map((a, i) => polar(angleAt(i), a.messi * RADIUS));
  const ronaldoPoints = axes.map((a, i) => polar(angleAt(i), a.ronaldo * RADIUS));

  const polygonAnim = reduce
    ? undefined
    : {
        initial: { opacity: 0, scale: 0.85 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: DURATION.base, ease: EASE.out },
        style: { transformOrigin: `${CENTER}px ${CENTER}px` },
      };

  return (
    <figure className={className} style={style}>
      <figcaption className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
          {t.chartRadarTitle}
        </h3>
        <ChartLegend />
      </figcaption>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto block h-auto w-full max-w-[340px]"
        role="img"
        aria-label={`${t.chartRadarTitle}. ${t.chartRadarHint}`}
      >
        <defs>
          <radialGradient id={`messiFill-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={CHART_COLORS.messiBright} stopOpacity="0.42" />
            <stop offset="100%" stopColor={CHART_COLORS.messi} stopOpacity="0.20" />
          </radialGradient>
          <radialGradient id={`ronaldoFill-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={CHART_COLORS.ronaldoBright} stopOpacity="0.42" />
            <stop offset="100%" stopColor={CHART_COLORS.ronaldo} stopOpacity="0.20" />
          </radialGradient>
        </defs>

        {/* Concentric grid rings */}
        {Array.from({ length: RINGS }, (_, ring) => {
          const r = (RADIUS * (ring + 1)) / RINGS;
          const pts = axes.map((_, i) => polar(angleAt(i), r));
          return (
            <path
              key={`ring-${ring}`}
              d={polygonPath(pts)}
              fill="none"
              stroke={ring === RINGS - 1 ? CHART_COLORS.gridStrong : CHART_COLORS.grid}
              strokeWidth="1"
            />
          );
        })}

        {/* Spokes + axis labels */}
        {axes.map((a, i) => {
          const angle = angleAt(i);
          const end = polar(angle, RADIUS);
          const label = polar(angle, RADIUS + 16);
          const anchor =
            Math.abs(label.x - CENTER) < 8 ? "middle" : label.x > CENTER ? "start" : "end";
          return (
            <Fragment key={`spoke-${a.key}`}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={end.x}
                y2={end.y}
                stroke={CHART_COLORS.grid}
                strokeWidth="1"
              />
              <text
                x={label.x}
                y={label.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize="9"
                fill={CHART_COLORS.axisText}
                style={{ fontWeight: 600 }}
              >
                {statLabel(t, a.key)}
              </text>
            </Fragment>
          );
        })}

        {/* Ronaldo polygon first (underneath), then Messi */}
        <motion.path
          {...polygonAnim}
          d={polygonPath(ronaldoPoints)}
          fill={`url(#ronaldoFill-${uid})`}
          stroke={CHART_COLORS.ronaldo}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <motion.path
          {...polygonAnim}
          d={polygonPath(messiPoints)}
          fill={`url(#messiFill-${uid})`}
          stroke={CHART_COLORS.messi}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Vertices */}
        {ronaldoPoints.map((p, i) => (
          <circle key={`rv-${i}`} cx={p.x} cy={p.y} r="2.5" fill={CHART_COLORS.ronaldoBright} />
        ))}
        {messiPoints.map((p, i) => (
          <circle key={`mv-${i}`} cx={p.x} cy={p.y} r="2.5" fill={CHART_COLORS.messiBright} />
        ))}
      </svg>

      <p className="mt-1 text-center text-[11px]" style={{ color: "var(--color-text-muted)" }}>
        {t.chartRadarHint}
      </p>
    </figure>
  );
}
