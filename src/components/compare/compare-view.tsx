"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { MetricKey, PlayerSeasonComp } from "@/lib/data";
import { useI18n } from "@/lib/i18n/provider";
import { PLAYER_META } from "@/components/card";
import { statLabel } from "@/components/card/card-labels";
import {
  CompetitionTabs,
  type CompetitionContext,
} from "@/components/studio/competition-tabs";
import {
  Field,
  NeonSelect,
  SegmentedControl,
  FOCUS_RING,
} from "@/components/studio/control-primitives";
import { Reveal, TabTransition } from "@/components/motion";
import {
  COMPARE_COLUMNS,
  DEFAULT_FOCUS,
  FOCUS_METRICS,
  buildAgeTrend,
  buildCompareCareer,
  buildCompareScope,
  buildCompareTable,
  competitionNameOptions,
  isContext,
  type CompareView as CompareViewKind,
} from "./compare-model";
import { CompareTable } from "./compare-table";
import { CareerGrid } from "./career-grid";
import { AgeCurveChart } from "./age-curve-chart";

/**
 * The DEEP HEAD-TO-HEAD at `/compare` (Phase 11 p11-4). Server passes the raw
 * 222 rows + the deep-link params; this client component owns the controls
 * (alignment view, Core/Advanced, competition type tabs, the 34-name granular
 * drill, focus metric) and recomputes the read-only model on demand.
 *
 * READ-ONLY: NO verdict/score is ever shown — only totals, per-row Δ and LOCAL
 * who-leads markers. Deep-linkable via `?comp= ?view= ?metric=` (kept in sync
 * shallowly, no navigation). `?cats=` is handled by the server (→ `/?cats=`).
 */

const ACCENT = "var(--color-gold)";
const VIEWS: readonly CompareViewKind[] = ["season", "career", "age"];

export function CompareView({
  rows,
  initialComp,
  initialView,
  initialMetric,
}: {
  rows: PlayerSeasonComp[];
  initialComp: string;
  initialView: string;
  initialMetric: string;
}) {
  const { t, locale } = useI18n();
  const messiName = PLAYER_META.messi.name;
  const ronaldoName = PLAYER_META.ronaldo.name;

  const nameOptions = useMemo(() => competitionNameOptions(rows), [rows]);
  const validComp = useMemo(
    () => initialComp === "all" || isContext(initialComp) || nameOptions.some((o) => o.value === initialComp),
    [initialComp, nameOptions],
  );

  const [comp, setComp] = useState<string>(validComp ? initialComp : "all");
  const [view, setView] = useState<CompareViewKind>(
    (VIEWS as readonly string[]).includes(initialView) ? (initialView as CompareViewKind) : "season",
  );
  const [focus, setFocus] = useState<MetricKey>(
    (FOCUS_METRICS as readonly string[]).includes(initialMetric) ? (initialMetric as MetricKey) : DEFAULT_FOCUS,
  );
  const [tier, setTier] = useState<"core" | "advanced">("core");

  // Keep ?comp= ?view= ?metric= in sync (shallow, no navigation), mirroring the
  // arena's deep-link discipline. Defaults are omitted to keep links clean.
  const hydrated = useRef(false);
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    const url = new URL(window.location.href);
    const set = (k: string, v: string, dflt: string) =>
      v === dflt ? url.searchParams.delete(k) : url.searchParams.set(k, v);
    set("comp", comp, "all");
    set("view", view, "season");
    set("metric", focus, DEFAULT_FOCUS);
    window.history.replaceState(null, "", url.toString());
  }, [comp, view, focus]);

  const scope = useMemo(() => buildCompareScope(rows), [rows]);
  const seasonModel = useMemo(() => buildCompareTable(rows, comp, "season", focus), [rows, comp, focus]);
  const ageModel = useMemo(() => buildCompareTable(rows, comp, "age", focus), [rows, comp, focus]);
  const careerRows = useMemo(() => buildCompareCareer(rows, comp), [rows, comp]);
  const ageTrend = useMemo(() => buildAgeTrend(rows, comp, focus), [rows, comp, focus]);

  const visibleColumns = useMemo(
    () => (tier === "advanced" ? COMPARE_COLUMNS : COMPARE_COLUMNS.filter((c) => c.tier === "core")),
    [tier],
  );
  const visibleCareerRows = useMemo(
    () => (tier === "advanced" ? careerRows : careerRows.filter((r) => r.col.tier === "core")),
    [tier, careerRows],
  );

  const tabContext: CompetitionContext = isContext(comp) ? (comp as CompetitionContext) : "all";
  const granularValue = isContext(comp) ? "all" : comp;

  const compOptions = useMemo(
    () => [{ value: "all", label: t.cmpCompAll }, ...nameOptions],
    [nameOptions, t.cmpCompAll],
  );
  const focusOptions = useMemo(
    () => FOCUS_METRICS.map((k) => ({ value: k, label: statLabel(t, k) })),
    [t],
  );

  const scopeText = t.cmpScope
    .replace("{rows}", String(scope.rows))
    .replace("{seasons}", String(scope.seasons))
    .replace("{comps}", String(scope.comps))
    .replace("{minAge}", String(scope.minAge))
    .replace("{maxAge}", String(scope.maxAge));

  return (
    <section aria-label={t.cmpTitle} className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Reveal>
        <Link
          href="/"
          className={`inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)] ${FOCUS_RING}`}
        >
          <ArrowLeft size={16} aria-hidden />
          {t.cmpBack}
        </Link>
        <div className="gold-hairline-top mt-6 flex flex-col gap-2 border-t border-[var(--color-border-glass)] pt-8 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-black uppercase tracking-tight sm:text-5xl">
            {t.cmpTitle}
          </h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">{scopeText}</p>
        </div>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{t.cmpSubtitle}</p>
      </Reveal>

      {/* ── Controls ────────────────────────────────────────────────────── */}
      <Reveal delay={0.05}>
        <div className="glass-panel mt-6 flex flex-col gap-4 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label={t.cmpViewLabel} htmlFor="cmp-view">
              <SegmentedControl
                id="cmp-view"
                ariaLabel={t.cmpViewLabel}
                value={view}
                accent={ACCENT}
                onChange={setView}
                items={[
                  { value: "season", label: t.cmpViewSeason },
                  { value: "career", label: t.cmpViewCareer },
                  { value: "age", label: t.cmpViewAge },
                ]}
              />
            </Field>
            <Field label={t.statsTierLabel} htmlFor="cmp-tier">
              <SegmentedControl
                id="cmp-tier"
                ariaLabel={t.statsTierLabel}
                value={tier}
                accent={ACCENT}
                onChange={setTier}
                items={[
                  { value: "core", label: t.statsTierCore },
                  { value: "advanced", label: t.statsTierAdvanced },
                ]}
              />
            </Field>
            <Field label={t.cmpCompLabel} htmlFor="cmp-comp">
              <NeonSelect
                id="cmp-comp"
                ariaLabel={t.cmpCompLabel}
                value={granularValue}
                options={compOptions}
                onChange={setComp}
              />
            </Field>
            {view !== "career" && (
              <Field label={t.cmpFocusLabel} htmlFor="cmp-focus">
                <NeonSelect
                  id="cmp-focus"
                  ariaLabel={t.cmpFocusLabel}
                  value={focus}
                  options={focusOptions}
                  onChange={(v) => setFocus(v as MetricKey)}
                />
              </Field>
            )}
          </div>
          <CompetitionTabs value={tabContext} t={t} onChange={(next) => setComp(next)} />
        </div>
      </Reveal>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <Reveal delay={0.08}>
        <div className="mt-6">
          <TabTransition id={`${view}:${tier}:${comp}:${focus}`}>
            {view === "season" && (
              <CompareTable
                model={seasonModel}
                columns={visibleColumns}
                focusKey={focus}
                t={t}
                locale={locale}
                messiName={messiName}
                ronaldoName={ronaldoName}
              />
            )}

            {view === "career" && (
              <div className="glass-panel p-6 sm:p-7">
                <p className="mb-5 text-sm text-[var(--color-text-muted)]">{t.cmpCareerHint}</p>
                <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-[0.66rem] font-bold uppercase tracking-[0.1em]">
                  <span className="text-right text-[var(--color-messi-bright)]">{messiName}</span>
                  <span className="text-[var(--color-text-muted)]">{t.statsColDelta}</span>
                  <span className="text-left text-[var(--color-ronaldo-bright)]">{ronaldoName}</span>
                </div>
                <CareerGrid rows={visibleCareerRows} t={t} locale={locale} />
              </div>
            )}

            {view === "age" && (
              <div className="flex flex-col gap-6">
                <div className="glass-panel p-5 sm:p-6">
                  <AgeCurveChart model={ageTrend} metricKey={focus} t={t} />
                </div>
                <CompareTable
                  model={ageModel}
                  columns={visibleColumns}
                  focusKey={focus}
                  t={t}
                  locale={locale}
                  messiName={messiName}
                  ronaldoName={ronaldoName}
                />
              </div>
            )}
          </TabTransition>
        </div>
      </Reveal>

      <p className="mt-8 text-center text-xs text-[var(--color-text-muted)]">{t.cmpReadOnly}</p>
    </section>
  );
}
