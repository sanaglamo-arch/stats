"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { DURATION, EASE } from "@/lib/motion/tokens";
import { AnimatedDelta } from "@/components/motion/animated-delta";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/dictionaries";
import type { ContextTable, SeasonSide, SideTotals } from "./stats-model";

/**
 * Reusable aligned dual comparative table (Phase 11, p11-2). Messi columns LEFT
 * (blue, faces right per BOSS O1), Ronaldo columns RIGHT (red), with the season
 * label pinned as the sticky first column and a centre Δ column. The header is
 * sticky-top and the season column sticky-left, both backed by a solid surface so
 * scrolled rows never bleed through. Career totals live in a pinned `<tfoot>`.
 *
 * READ-ONLY: it renders deltas + a LOCAL per-row "who leads" tint and never tallies
 * anything into a verdict/score. Sparse seasons (a player did not feature) render
 * an honest "—" span, never a fabricated 0.
 */

const HL_MESSI = "text-[var(--color-messi-bright)]";
const HL_RONALDO = "text-[var(--color-ronaldo-bright)]";

function fmt(n: number, locale: Locale): string {
  return n.toLocaleString(locale === "ru" ? "ru-RU" : "en-US");
}

/**
 * Season rows fade-cascade into view (opacity-only — NEVER a transform, which
 * would re-base the sticky season-label cell and break horizontal sticky). The
 * stagger is driven by the `<tbody>` container variants.
 */
const ROW_STAGGER = 0.035;
const tbodyVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: ROW_STAGGER } } };
const rowVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.base, ease: EASE.out } },
};

export function StatTable({
  table,
  t,
  locale,
  messiName,
  ronaldoName,
}: {
  table: ContextTable;
  t: Dictionary;
  locale: Locale;
  messiName: string;
  ronaldoName: string;
}) {
  const reduce = useReducedMotion();
  const totalsRow = (totals: SideTotals) => (
    <>
      <td className="tabular px-3 py-3 text-center">{totals.goals}</td>
      <td className="tabular px-3 py-3 text-center">{totals.assists}</td>
      <td className="tabular px-3 py-3 text-center font-black">{totals.ga}</td>
      <td className="tabular px-3 py-3 text-center text-[var(--color-text-secondary)]">
        {fmt(totals.matches, locale)}
      </td>
    </>
  );

  return (
    <div className="glass-panel overflow-x-auto p-0">
      <table className="tabular w-full min-w-[660px] border-collapse text-sm">
        <caption className="sr-only">{t.statsSeasonTitle}</caption>
        <thead>
          {/* Group header — player names over their column block. */}
          <tr className="sticky top-0 z-30">
            <th
              scope="col"
              rowSpan={2}
              className="sticky left-0 z-40 bg-[var(--color-bg-elevated)] px-3 py-2.5 text-left align-bottom text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]"
            >
              {t.profileColSeason}
            </th>
            <th
              scope="colgroup"
              colSpan={4}
              className="bg-[var(--color-bg-elevated)] px-3 py-2 text-center font-[family-name:var(--font-display)] text-base font-black uppercase tracking-[0.04em] text-[var(--color-messi-bright)]"
            >
              {messiName}
            </th>
            <th
              scope="col"
              rowSpan={2}
              className="bg-[var(--color-bg-elevated)] px-3 py-2.5 text-center align-bottom text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]"
            >
              {t.statsColDelta}
            </th>
            <th
              scope="colgroup"
              colSpan={4}
              className="bg-[var(--color-bg-elevated)] px-3 py-2 text-center font-[family-name:var(--font-display)] text-base font-black uppercase tracking-[0.04em] text-[var(--color-ronaldo-bright)]"
            >
              {ronaldoName}
            </th>
          </tr>
          <tr className="sticky top-[2.65rem] z-30 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            {[t.profileColGoals, t.profileColAssists, t.statsColGA, t.profileColMatches].map(
              (h, i) => (
                <th
                  key={`m-${i}`}
                  scope="col"
                  className="bg-[var(--color-bg-elevated)] px-3 py-2 text-center font-semibold"
                >
                  {h}
                </th>
              ),
            )}
            {[t.profileColGoals, t.profileColAssists, t.statsColGA, t.profileColMatches].map(
              (h, i) => (
                <th
                  key={`r-${i}`}
                  scope="col"
                  className="bg-[var(--color-bg-elevated)] px-3 py-2 text-center font-semibold"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <motion.tbody
          initial={reduce ? false : "hidden"}
          whileInView={reduce ? undefined : "show"}
          viewport={reduce ? undefined : { once: true, margin: "0px 0px -8% 0px" }}
          variants={reduce ? undefined : tbodyVariants}
        >
          {table.rows.map((row) => {
            const messiLeads = row.delta !== null && row.delta > 0;
            const ronaldoLeads = row.delta !== null && row.delta < 0;
            return (
              <motion.tr
                key={row.season}
                variants={reduce ? undefined : rowVariants}
                className="season-row border-b border-[var(--color-border-glass)]/60 last:border-0"
              >
                <th
                  scope="row"
                  className="sticky left-0 z-20 whitespace-nowrap bg-[var(--color-bg-elevated)] px-3 py-2.5 text-left font-[family-name:var(--font-display)] text-base font-bold tracking-[0.04em]"
                >
                  {row.season}
                </th>
                <SideCellsTinted
                  side={row.messi}
                  leads={messiLeads}
                  tint={HL_MESSI}
                  didNotPlay={t.statsDidNotPlay}
                  locale={locale}
                />
                <td className="px-3 py-2.5 text-center text-xs">
                  <AnimatedDelta delta={row.delta} />
                </td>
                <SideCellsTinted
                  side={row.ronaldo}
                  leads={ronaldoLeads}
                  tint={HL_RONALDO}
                  didNotPlay={t.statsDidNotPlay}
                  locale={locale}
                />
              </motion.tr>
            );
          })}
        </motion.tbody>
        <tfoot>
          <tr className="border-t-2 border-[color-mix(in_srgb,var(--color-gold)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_7%,transparent)] font-black">
            <th
              scope="row"
              className="sticky left-0 z-20 whitespace-nowrap px-3 py-3 text-left font-[family-name:var(--font-display)] text-base tracking-[0.04em] text-[var(--color-gold-bright)]"
              style={{ background: "color-mix(in srgb, var(--color-gold) 7%, var(--color-bg-elevated))" }}
            >
              {t.statsCareerRow}
            </th>
            {totalsRow(table.messiTotals)}
            <td className="px-3 py-3 text-center text-xs">
              <AnimatedDelta delta={table.delta} />
            </td>
            {totalsRow(table.ronaldoTotals)}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** Side cells with a leader tint applied to the G+A column. */
function SideCellsTinted({
  side,
  leads,
  tint,
  didNotPlay,
  locale,
}: {
  side: SeasonSide;
  leads: boolean;
  tint: string;
  didNotPlay: string;
  locale: Locale;
}) {
  if (side === null) {
    return (
      <td
        colSpan={4}
        className="px-3 py-2.5 text-center text-xs font-semibold italic text-[var(--color-text-muted)] opacity-65"
      >
        — {didNotPlay} —
      </td>
    );
  }
  return (
    <>
      <td className="tabular px-3 py-2.5 text-center font-bold">{side.goals}</td>
      <td className="tabular px-3 py-2.5 text-center font-bold">{side.assists}</td>
      <td className={`tabular px-3 py-2.5 text-center font-black ${leads ? tint : ""}`}>
        {side.ga}
      </td>
      <td className="tabular px-3 py-2.5 text-center font-semibold text-[var(--color-text-muted)]">
        {fmt(side.matches, locale)}
      </td>
    </>
  );
}
