"use client";

import { useMemo, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  getIllustrativePositional,
  METRIC_KEYS,
  type MetricKey,
} from "@/lib/data";
import type { CardSlice, CardViewModel } from "@/components/card";
import { statLabel } from "@/components/card/card-labels";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { PlayerSeasonComp } from "@/lib/data";
import { DURATION, EASE, STAGGER } from "@/lib/motion/tokens";
import {
  ComparisonRadar,
  SeasonTrendChart,
  PositionalHeatmap,
  Shotmap,
} from "@/components/charts";
import { Field, NeonSelect, type Option } from "./control-primitives";

/**
 * The Insights section (P6-9) — a read-only, cohesive data-viz storefront that
 * sits below the card-hero stage. It consumes the SAME `CardSlice` single source
 * of truth as the studio, so every chart re-renders in lockstep with the live
 * comparison: the radar follows `slice.metrics`, and the season trend honours the
 * GLOBAL competition context (`slice.messi.competitions` — both sides share it).
 *
 * Motion: each block is a scroll-reveal (transform+opacity only) that staggers in
 * once on enter and is fully collapsed under `prefers-reduced-motion` via
 * `useReducedMotion` — the static, final state is always readable on its own
 * (charts list raw values / carry their own legends).
 *
 * It NEVER touches the card render path: the positional widgets render
 * illustrative placeholder data (their honesty badge is unconditional) and
 * nothing here feeds the PNG / slice-params serialization.
 */

/**
 * One reveal block — a fade+rise that plays on mount. Mirrors the proven `FadeIn`
 * primitive (animate-on-mount), NOT `whileInView`: the section lives below the
 * fold, and a scroll-triggered IntersectionObserver is fragile (it never fires
 * under programmatic/headless scroll and silently leaves the block at opacity:0).
 * `animate` always resolves to the visible state, so the content can never get
 * stuck hidden. Under reduced motion it collapses to a no-op (instant, visible).
 */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slow, ease: EASE.out, delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}


export function Insights({
  slice,
  model,
  rows,
  t,
}: {
  slice: CardSlice;
  model: CardViewModel;
  rows: readonly PlayerSeasonComp[];
  t: Dictionary;
}) {
  // The trend chart plots ONE metric — seed the picker from the active
  // comparison (first selected metric) and fall back to "goals".
  const defaultMetric: MetricKey = slice.metrics[0] ?? "goals";
  const [trendMetric, setTrendMetric] = useState<MetricKey>(defaultMetric);

  // The selectable metric set: the slice's chosen metrics if any, else the full
  // catalog — so the trend can explore any metric, not just the radar's axes.
  const metricKeys = slice.metrics.length > 0 ? slice.metrics : METRIC_KEYS;
  const metricOptions: Option[] = useMemo(
    () => metricKeys.map((key) => ({ value: key, label: statLabel(t, key) })),
    [metricKeys, t],
  );

  // Keep the picker valid if the metric set changes out from under it.
  const activeMetric: MetricKey = metricKeys.includes(trendMetric)
    ? trendMetric
    : defaultMetric;

  // The season trend follows the GLOBAL competition context shared by both sides
  // (the studio writes the same value onto `messi` and `ronaldo`).
  const trendOpts = {
    competitions: slice.messi.competitions,
    competition: slice.messi.competition,
    includePenalties: slice.messi.includePenalties,
  };

  const messiPositional = useMemo(() => getIllustrativePositional("messi"), []);
  const ronaldoPositional = useMemo(() => getIllustrativePositional("ronaldo"), []);

  return (
    <section
      aria-labelledby="insights-title"
      className="flex w-full flex-col gap-8"
    >
      {/* ── Section header (gold display kicker + title), on-brand ── */}
      <Reveal className="relative text-center">
        <span
          className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.4em]"
          style={{ color: "var(--color-gold)", textShadow: "var(--shadow-glow-gold)" }}
        >
          {t.insightsKicker}
        </span>
        <h2
          id="insights-title"
          className="mt-4 font-[family-name:var(--font-display)] text-3xl font-black uppercase tracking-tight sm:text-5xl"
        >
          {t.insightsTitle}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-balance text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
          {t.insightsSubtitle}
        </p>
      </Reveal>

      {/* ── Radar + Season trend, side by side on desktop ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal>
          <ComparisonRadar
            input={model}
            metrics={slice.metrics}
            t={t}
            className="glass-panel h-full p-5 sm:p-6"
          />
        </Reveal>

        <Reveal delay={STAGGER}>
          <div className="glass-panel flex h-full flex-col gap-4 p-5 sm:p-6">
            <div className="max-w-[220px]">
              <Field label={t.chartTrendMetric} htmlFor="insights-trend-metric">
                <NeonSelect
                  id="insights-trend-metric"
                  value={activeMetric}
                  options={metricOptions}
                  onChange={(v) => setTrendMetric(v as MetricKey)}
                  ariaLabel={t.chartTrendMetric}
                />
              </Field>
            </div>
            <SeasonTrendChart
              rows={rows}
              metricKey={activeMetric}
              t={t}
              opts={trendOpts}
            />
          </div>
        </Reveal>
      </div>

      {/* ── Positional block: heatmaps (row) + shotmaps (row), 2×2 grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal>
          <PositionalHeatmap
            player="messi"
            data={messiPositional}
            t={t}
            className="glass-panel h-full p-5 sm:p-6"
          />
        </Reveal>
        <Reveal delay={STAGGER}>
          <PositionalHeatmap
            player="ronaldo"
            data={ronaldoPositional}
            t={t}
            className="glass-panel h-full p-5 sm:p-6"
          />
        </Reveal>
        <Reveal>
          <Shotmap
            player="messi"
            data={messiPositional}
            t={t}
            className="glass-panel h-full p-5 sm:p-6"
          />
        </Reveal>
        <Reveal delay={STAGGER}>
          <Shotmap
            player="ronaldo"
            data={ronaldoPositional}
            t={t}
            className="glass-panel h-full p-5 sm:p-6"
          />
        </Reveal>
      </div>
    </section>
  );
}
