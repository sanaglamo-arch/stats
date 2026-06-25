"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { DURATION, EASE } from "@/lib/motion/tokens";
import { PLAYER_META } from "@/components/card/player-meta";
import { statLabel, competitionLabel } from "@/components/card/card-labels";
import {
  CompetitionTabs,
  type CompetitionContext,
} from "@/components/studio/competition-tabs";
import { SegmentedControl, FOCUS_RING } from "@/components/studio/control-primitives";
import { StatTable } from "./stat-table";
import type {
  ClubCut,
  MetricGridRow,
  StatsBodyModel,
  TypeCut,
} from "./stats-model";

/**
 * The inline COMPREHENSIVE STATS BODY rendered below the arena hook on `/`
 * (Phase 11, p11-2). Server-derived `model` (see stats-model.ts), client only for
 * the tab/toggle interactivity. READ-ONLY — it never recomputes the verdict.
 *
 * Top to bottom: section header + scope · career head-to-head metric grid
 * (Core/Advanced toggle) · season-by-season comparative table (competitionType
 * tabs + by-season/club/competition/totals cuts) · prominent entries to the deep
 * head-to-head and the two player profiles. Sparse rows show «—», missing/early
 * fields show «н/д» — never a fabricated zero.
 */

const MESSI_BRIGHT = "var(--color-messi-bright)";
const RONALDO_BRIGHT = "var(--color-ronaldo-bright)";

type Cut = "seasons" | "clubs" | "types" | "totals";

/** On-mount staggered reveal (transform+opacity only; no-op under reduced motion). */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: DURATION.morph, ease: EASE.out, delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}

export function StatsBody({ model }: { model: StatsBodyModel }) {
  const { t, locale } = useI18n();
  const messiName = PLAYER_META.messi.name;
  const ronaldoName = PLAYER_META.ronaldo.name;

  const [tier, setTier] = useState<"core" | "advanced">("core");
  const [context, setContext] = useState<CompetitionContext>("all");
  const [cut, setCut] = useState<Cut>("seasons");

  const nf = (n: number) => n.toLocaleString(locale === "ru" ? "ru-RU" : "en-US");

  const formatVal = (row: MetricGridRow, value: number | null): string => {
    if (value === null) return t.statsNa;
    if (row.format === "percent") return `${(value * 100).toFixed(row.decimals)}%`;
    if (row.decimals > 0) return value.toFixed(row.decimals);
    return nf(value);
  };

  const visibleMetrics = model.metricGrid.filter(
    (m) => tier === "advanced" || m.tier === "core",
  );

  const table = model.tables[context];

  const scopeText = t.statsScope
    .replace("{rows}", nf(model.scope.rows))
    .replace("{seasons}", String(model.scope.seasons))
    .replace("{types}", String(model.scope.types))
    .replace("{clubs}", String(model.scope.clubs));

  return (
    <section
      aria-label={t.statsTitle}
      className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6"
    >
      {/* ── Section header + scope ─────────────────────────────────────── */}
      <Reveal>
        <div className="gold-hairline-top mb-8 flex flex-col gap-2 border-t border-[var(--color-border-glass)] pt-10 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-black uppercase tracking-tight sm:text-5xl">
            {t.statsTitle}
          </h2>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">{scopeText}</p>
        </div>
      </Reveal>

      {/* ── 1. Career head-to-head metric grid ─────────────────────────── */}
      <Reveal delay={0.05}>
        <div className="glass-panel mb-6 p-6 sm:p-7">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-2xl font-black uppercase tracking-tight">
                {t.statsCareerTitle}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t.statsCareerHint}</p>
            </div>
            <div className="w-full sm:w-64">
              <SegmentedControl
                id="stats-tier"
                ariaLabel={t.statsTierLabel}
                value={tier}
                accent="var(--color-gold)"
                onChange={setTier}
                items={[
                  { value: "core", label: t.statsTierCore },
                  { value: "advanced", label: t.statsTierAdvanced },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-10 gap-y-0 sm:grid-cols-2">
            {visibleMetrics.map((row) => (
              <MetricRow key={row.key} row={row} t={t} formatVal={formatVal} />
            ))}
          </div>
        </div>
      </Reveal>

      {/* ── 2. Season-by-season comparative table + cuts ───────────────── */}
      <Reveal delay={0.08}>
        <div className="glass-panel mb-6 p-6 sm:p-7">
          <h3 className="font-[family-name:var(--font-display)] text-2xl font-black uppercase tracking-tight">
            {t.statsSeasonTitle}
          </h3>
          <p className="mb-4 mt-1 text-sm text-[var(--color-text-muted)]">
            {t.statsSeasonHint.replace("{seasons}", String(model.scope.seasons))}
          </p>

          <div className="mb-3">
            <CompetitionTabs value={context} t={t} onChange={setContext} />
          </div>

          <div
            role="tablist"
            aria-label={t.statsCutsLabel}
            className="mb-4 flex flex-wrap gap-2"
          >
            {(
              [
                ["seasons", t.statsCutSeasons],
                ["clubs", t.statsCutClubs],
                ["types", t.statsCutTypes],
                ["totals", t.statsCutTotals],
              ] as [Cut, string][]
            ).map(([value, label]) => {
              const active = cut === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCut(value)}
                  className={`min-h-[40px] cursor-pointer rounded-[var(--radius-sm)] border px-4 text-xs font-semibold transition-colors duration-200 ${FOCUS_RING} ${
                    active
                      ? "border-[var(--color-border-strong)] bg-[var(--color-surface-strong)] text-[var(--color-text)]"
                      : "border-[var(--color-border-glass)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {cut === "seasons" && (
            <StatTable
              table={table}
              t={t}
              locale={locale}
              messiName={messiName}
              ronaldoName={ronaldoName}
            />
          )}

          {cut === "clubs" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <ClubTable
                title={messiName}
                accent={MESSI_BRIGHT}
                clubs={model.clubs.messi}
                t={t}
                nf={nf}
              />
              <ClubTable
                title={ronaldoName}
                accent={RONALDO_BRIGHT}
                clubs={model.clubs.ronaldo}
                t={t}
                nf={nf}
              />
              <p className="text-xs text-[var(--color-text-muted)] lg:col-span-2">
                {t.statsClubsNote}
              </p>
            </div>
          )}

          {cut === "types" && (
            <TypeTable
              byType={model.byType}
              t={t}
              nf={nf}
              messiName={messiName}
              ronaldoName={ronaldoName}
            />
          )}

          {cut === "totals" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <TotalStat label={t.statGoals} m={table.messiTotals.goals} r={table.ronaldoTotals.goals} nf={nf} />
              <TotalStat label={t.statAssists} m={table.messiTotals.assists} r={table.ronaldoTotals.assists} nf={nf} />
              <TotalStat label={t.statsColGA} m={table.messiTotals.ga} r={table.ronaldoTotals.ga} nf={nf} />
              <TotalStat label={t.profileColMatches} m={table.messiTotals.matches} r={table.ronaldoTotals.matches} nf={nf} />
              <p className="col-span-2 text-xs text-[var(--color-text-muted)] sm:col-span-4">
                {t.statsTotalsNote}
              </p>
            </div>
          )}
        </div>
      </Reveal>

      {/* ── 3. Prominent entries ───────────────────────────────────────── */}
      <Reveal delay={0.1}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/compare"
            className={`group glass-panel flex flex-col justify-between gap-4 p-6 transition-transform duration-200 hover:-translate-y-px sm:col-span-2 ${FOCUS_RING}`}
            style={{
              background:
                "linear-gradient(120deg, color-mix(in srgb, var(--color-messi) 14%, transparent), color-mix(in srgb, var(--color-ronaldo) 14%, transparent))",
            }}
          >
            <div>
              <span className="font-[family-name:var(--font-display)] text-2xl font-black uppercase tracking-tight">
                {t.statsEntryDeepTitle}
              </span>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {t.statsEntryDeepDesc}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-gold)]">
              {t.statsEntryDeepCta}
              <ArrowRight size={16} aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </Link>

          <ProfileEntry id="messi" name={messiName} accent={MESSI_BRIGHT} t={t} />
          <ProfileEntry id="ronaldo" name={ronaldoName} accent={RONALDO_BRIGHT} t={t} />
        </div>
      </Reveal>

      <p className="mt-8 text-center text-xs text-[var(--color-text-muted)]">{t.statsFootnote}</p>
    </section>
  );
}

/** One head-to-head career metric row: Messi (right) · label · Ronaldo (left). */
function MetricRow({
  row,
  t,
  formatVal,
}: {
  row: MetricGridRow;
  t: ReturnType<typeof useI18n>["t"];
  formatVal: (row: MetricGridRow, value: number | null) => string;
}) {
  const messiLeads = row.leader === "messi";
  const ronaldoLeads = row.leader === "ronaldo";
  const badge =
    row.forcedNa
      ? t.statsBadgeMissing
      : row.availability === "modern"
        ? t.statsBadge2014
        : row.availability === "illustrative"
          ? t.illustrative
          : null;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-[var(--color-border-glass)]/50 py-2.5">
      <span
        className="tabular text-right text-lg font-extrabold sm:text-xl"
        style={messiLeads ? { color: MESSI_BRIGHT } : undefined}
      >
        {formatVal(row, row.messi)}
        {messiLeads && <span aria-hidden className="ml-1 align-super text-[0.6em]">▲</span>}
      </span>
      <span className="flex items-center gap-1.5 whitespace-nowrap text-[0.66rem] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
        {statLabel(t, row.key)}
        {badge && (
          <span className="rounded-[4px] border border-[color-mix(in_srgb,var(--color-gold)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_12%,transparent)] px-1.5 py-px text-[0.58rem] font-bold normal-case tracking-normal text-[var(--color-gold)]">
            {badge}
          </span>
        )}
      </span>
      <span
        className="tabular text-left text-lg font-extrabold sm:text-xl"
        style={ronaldoLeads ? { color: RONALDO_BRIGHT } : undefined}
      >
        {ronaldoLeads && <span aria-hidden className="mr-1 align-super text-[0.6em]">▲</span>}
        {formatVal(row, row.ronaldo)}
      </span>
    </div>
  );
}

/** A by-club / by-team table for one player (every club, sorted by goals). */
function ClubTable({
  title,
  accent,
  clubs,
  t,
  nf,
}: {
  title: string;
  accent: string;
  clubs: ClubCut[];
  t: ReturnType<typeof useI18n>["t"];
  nf: (n: number) => string;
}) {
  return (
    <div className="glass-panel overflow-hidden p-0">
      <h4
        className="border-b border-[var(--color-border-glass)] px-4 py-3 font-[family-name:var(--font-display)] text-lg font-black uppercase tracking-[0.04em]"
        style={{ color: accent }}
      >
        {title}
      </h4>
      <table className="tabular w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-[0.62rem] uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            <th scope="col" className="px-4 py-2 font-semibold">{t.statsColClub}</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">{t.profileColMatches}</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">{t.profileColGoals}</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">{t.profileColAssists}</th>
          </tr>
        </thead>
        <tbody>
          {clubs.map((c) => (
            <tr
              key={c.club}
              className="border-t border-[var(--color-border-glass)]/60"
            >
              <th scope="row" className="px-4 py-2 text-left font-semibold">
                <span className="inline-flex items-center gap-2">
                  {c.club}
                  {c.national && (
                    <span className="rounded-[4px] border border-[color-mix(in_srgb,var(--color-gold)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_12%,transparent)] px-1.5 py-px text-[0.55rem] font-bold uppercase tracking-wide text-[var(--color-gold)]">
                      {t.statsDistributed}
                    </span>
                  )}
                </span>
              </th>
              <td className="px-3 py-2 text-right text-[var(--color-text-secondary)]">{nf(c.matches)}</td>
              <td className="px-3 py-2 text-right font-black" style={{ color: accent }}>{nf(c.goals)}</td>
              <td className="px-3 py-2 text-right">{nf(c.assists)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A by-competition-type comparative table aligned across both players. */
function TypeTable({
  byType,
  t,
  nf,
  messiName,
  ronaldoName,
}: {
  byType: TypeCut[];
  t: ReturnType<typeof useI18n>["t"];
  nf: (n: number) => string;
  messiName: string;
  ronaldoName: string;
}) {
  return (
    <div className="glass-panel overflow-x-auto p-0">
      <table className="tabular w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" rowSpan={2} className="px-4 py-2 text-left align-bottom text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
              {t.competition}
            </th>
            <th scope="colgroup" colSpan={3} className="px-3 py-2 text-center font-[family-name:var(--font-display)] text-sm font-black uppercase text-[var(--color-messi-bright)]">
              {messiName}
            </th>
            <th scope="colgroup" colSpan={3} className="px-3 py-2 text-center font-[family-name:var(--font-display)] text-sm font-black uppercase text-[var(--color-ronaldo-bright)]">
              {ronaldoName}
            </th>
          </tr>
          <tr className="text-[0.6rem] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            <th scope="col" className="px-3 py-1.5 text-right font-semibold">{t.profileColMatches}</th>
            <th scope="col" className="px-3 py-1.5 text-right font-semibold">{t.profileColGoals}</th>
            <th scope="col" className="px-3 py-1.5 text-right font-semibold">{t.profileColAssists}</th>
            <th scope="col" className="px-3 py-1.5 text-right font-semibold">{t.profileColMatches}</th>
            <th scope="col" className="px-3 py-1.5 text-right font-semibold">{t.profileColGoals}</th>
            <th scope="col" className="px-3 py-1.5 text-right font-semibold">{t.profileColAssists}</th>
          </tr>
        </thead>
        <tbody>
          {byType.map((row) => (
            <tr key={row.type} className="border-t border-[var(--color-border-glass)]/60">
              <th scope="row" className="px-4 py-2.5 text-left font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.04em]">
                {competitionLabel(t, row.type)}
              </th>
              <td className="px-3 py-2.5 text-right text-[var(--color-text-secondary)]">{nf(row.messi.matches)}</td>
              <td className="px-3 py-2.5 text-right font-black text-[var(--color-messi-bright)]">{nf(row.messi.goals)}</td>
              <td className="px-3 py-2.5 text-right">{nf(row.messi.assists)}</td>
              <td className="px-3 py-2.5 text-right text-[var(--color-text-secondary)]">{nf(row.ronaldo.matches)}</td>
              <td className="px-3 py-2.5 text-right font-black text-[var(--color-ronaldo-bright)]">{nf(row.ronaldo.goals)}</td>
              <td className="px-3 py-2.5 text-right">{nf(row.ronaldo.assists)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One career-total head-to-head stat for the active competition context. */
function TotalStat({
  label,
  m,
  r,
  nf,
}: {
  label: string;
  m: number;
  r: number;
  nf: (n: number) => string;
}) {
  const messiLeads = m > r;
  const ronaldoLeads = r > m;
  return (
    <div className="glass-panel flex flex-col gap-2 p-4">
      <span className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
        {label}
      </span>
      <div className="flex items-baseline justify-between gap-2">
        <span
          className="tabular font-[family-name:var(--font-display)] text-2xl font-black"
          style={{ color: messiLeads ? MESSI_BRIGHT : "var(--color-text-secondary)" }}
        >
          {nf(m)}
        </span>
        <span
          className="tabular font-[family-name:var(--font-display)] text-2xl font-black"
          style={{ color: ronaldoLeads ? RONALDO_BRIGHT : "var(--color-text-secondary)" }}
        >
          {nf(r)}
        </span>
      </div>
    </div>
  );
}

function ProfileEntry({
  id,
  name,
  accent,
  t,
}: {
  id: "messi" | "ronaldo";
  name: string;
  accent: string;
  t: ReturnType<typeof useI18n>["t"];
}) {
  return (
    <Link
      href={`/player/${id}`}
      className={`group glass-panel flex flex-col justify-between gap-4 p-6 transition-transform duration-200 hover:-translate-y-px ${FOCUS_RING}`}
    >
      <span
        className="font-[family-name:var(--font-display)] text-2xl font-black uppercase tracking-tight"
        style={{ color: accent }}
      >
        {name}
      </span>
      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-gold)]">
        {t.statsEntryProfileDesc}
        <ArrowRight size={16} aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
