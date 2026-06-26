"use client";

import { AnimatedDelta } from "@/components/motion/animated-delta";
import { competitionLabel, statLabel } from "@/components/card/card-labels";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import type { MetricKey } from "@/lib/data";
import {
  COMPARE_COLUMNS,
  type ColMap,
  type CompareColumn,
  type CompareTableModel,
  type CompareTableRow,
  type CompareTypeTotal,
} from "./compare-model";

/**
 * Aligned dual comparative table for `/compare` (Phase 11 p11-4). Messi columns
 * LEFT (blue), Ronaldo columns RIGHT (red), the season/age label pinned as the
 * sticky first column and a centre Δ column for the focus metric. Header is
 * sticky-top and the row label sticky-left, both on a solid surface so scrolled
 * rows never bleed through. Career + per-competition totals live in a pinned
 * `<tfoot>`.
 *
 * READ-ONLY: renders deltas + a LOCAL per-row "who-leads" ▲ on the focus column,
 * never tallied into a verdict/score. Sparse rows render an honest "—"; «н/д»
 * cells (xG/xA pre-2014, forced cards) are never a fabricated 0.
 */

const HL_MESSI = "text-[var(--color-messi-bright)]";
const HL_RONALDO = "text-[var(--color-ronaldo-bright)]";

function fmtCell(value: number | null, col: CompareColumn, na: string, locale: Locale): string {
  if (value === null) return na;
  if (col.format === "percent") return `${(value * 100).toFixed(col.decimals)}%`;
  if (col.decimals > 0) return value.toFixed(col.decimals);
  return value.toLocaleString(locale === "ru" ? "ru-RU" : "en-US");
}

/** A tiny gold honesty marker on non-"always" column headers (title = note). */
function HeaderMark({ col, t }: { col: CompareColumn; t: Dictionary }) {
  let note: string | null = null;
  if (col.forcedNa) note = t.statsBadgeMissing;
  else if (col.availability === "modern") note = t.statsBadge2014;
  else if (col.availability === "illustrative") note = t.illustrative;
  if (!note) return null;
  return (
    <span title={note} aria-label={note} className="ml-0.5 align-super text-[0.5rem] text-[var(--color-gold)]">
      ⓘ
    </span>
  );
}

function SideCells({
  side,
  columns,
  focusKey,
  leads,
  tint,
  t,
  locale,
}: {
  side: ColMap | null;
  columns: readonly CompareColumn[];
  focusKey: MetricKey;
  leads: boolean;
  tint: string;
  t: Dictionary;
  locale: Locale;
}) {
  if (side === null) {
    return (
      <td
        colSpan={columns.length}
        className="whitespace-nowrap px-3 py-2.5 text-center text-xs font-semibold italic text-[var(--color-text-muted)] opacity-65"
      >
        — {t.statsDidNotPlay} —
      </td>
    );
  }
  return (
    <>
      {columns.map((col) => {
        const isFocus = col.key === focusKey;
        const value = side[col.key] ?? null;
        const focusTint = isFocus && leads ? tint : "";
        return (
          <td
            key={col.key}
            className={`tabular px-3 py-2.5 text-center ${isFocus ? "font-black" : "font-medium"} ${focusTint} ${value === null ? "text-[var(--color-text-muted)]" : ""}`}
          >
            {fmtCell(value, col, t.statsNa, locale)}
            {isFocus && leads && (
              <span aria-hidden className="ml-0.5 align-super text-[0.6em]">
                ▲
              </span>
            )}
          </td>
        );
      })}
    </>
  );
}

function TotalCells({
  side,
  columns,
  focusKey,
  leads,
  tint,
  t,
  locale,
}: {
  side: ColMap;
  columns: readonly CompareColumn[];
  focusKey: MetricKey;
  leads: boolean;
  tint: string;
  t: Dictionary;
  locale: Locale;
}) {
  return (
    <>
      {columns.map((col) => {
        const isFocus = col.key === focusKey;
        const value = side[col.key] ?? null;
        return (
          <td
            key={col.key}
            className={`tabular px-3 py-3 text-center ${isFocus && leads ? `${tint} font-black` : "font-bold"} ${value === null ? "text-[var(--color-text-muted)]" : ""}`}
          >
            {fmtCell(value, col, t.statsNa, locale)}
          </td>
        );
      })}
    </>
  );
}

/**
 * Mobile (<sm) per-metric stack — the wide 26-column dual table is unreadable at
 * 390px, so on phones we render a compact 4-cell row (label · Messi · Δ · Ronaldo)
 * for the FOCUS metric only, switched via the existing focus select. Keeps the
 * side-by-side comparison + leader ▲ + career total without a horizontal crush.
 */
function MobileFocusTable({
  model,
  focusKey,
  t,
  locale,
  messiName,
  ronaldoName,
}: {
  model: CompareTableModel;
  focusKey: MetricKey;
  t: Dictionary;
  locale: Locale;
  messiName: string;
  ronaldoName: string;
}) {
  const focusCol = COMPARE_COLUMNS.find((c) => c.key === focusKey) ?? COMPARE_COLUMNS[0];
  const cell = (side: ColMap | null, lead: boolean, tint: string, markerLeft: boolean) => {
    if (side === null) return <span className="italic text-[var(--color-text-muted)] opacity-65">—</span>;
    const v = side[focusKey] ?? null;
    const marker = lead ? <span aria-hidden className="align-super text-[0.6em]">▲</span> : null;
    return (
      <span className={`${lead ? `${tint} font-black` : "font-semibold"} ${v === null ? "text-[var(--color-text-muted)]" : ""}`}>
        {markerLeft && marker}
        {fmtCell(v, focusCol, t.statsNa, locale)}
        {!markerLeft && marker}
      </span>
    );
  };
  return (
    <div className="glass-panel p-4">
      <div className="mb-3 flex items-center justify-between gap-2 text-[0.6rem] font-bold uppercase tracking-[0.08em]">
        <span className="text-[var(--color-messi-bright)]">{messiName}</span>
        <span className="inline-flex items-center text-[var(--color-text-secondary)]">
          {statLabel(t, focusKey)}
          <HeaderMark col={focusCol} t={t} />
        </span>
        <span className="text-[var(--color-ronaldo-bright)]">{ronaldoName}</span>
      </div>
      <table className="tabular w-full">
        <caption className="sr-only">{`${t.cmpTitle} — ${statLabel(t, focusKey)}`}</caption>
        <tbody className="season-reveal">
          {model.rows.map((row) => (
            <tr key={row.key} className="season-row border-b border-[var(--color-border-glass)]/50 last:border-0">
              <th scope="row" className="py-2 pr-2 text-left font-[family-name:var(--font-display)] text-[0.95rem] font-bold tracking-[0.03em]">
                {row.key}
              </th>
              <td className="py-2 text-center text-[0.95rem]">{cell(row.messi, row.leader === "messi", HL_MESSI, true)}</td>
              <td className="w-12 py-2 text-center text-xs">
                <AnimatedDelta delta={row.delta} />
              </td>
              <td className="py-2 text-center text-[0.95rem]">{cell(row.ronaldo, row.leader === "ronaldo", HL_RONALDO, false)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-[color-mix(in_srgb,var(--color-gold)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_7%,transparent)] font-black">
            <th scope="row" className="py-2.5 pr-2 text-left font-[family-name:var(--font-display)] text-[0.95rem] tracking-[0.03em] text-[var(--color-gold-bright)]">
              {t.statsCareerRow}
            </th>
            <td className="py-2.5 text-center text-[0.95rem]">{fmtCell(model.total.messi[focusKey] ?? null, focusCol, t.statsNa, locale)}</td>
            <td className="py-2.5 text-center text-xs">
              <AnimatedDelta delta={model.total.delta} />
            </td>
            <td className="py-2.5 text-center text-[0.95rem]">{fmtCell(model.total.ronaldo[focusKey] ?? null, focusCol, t.statsNa, locale)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function CompareTable({
  model,
  columns,
  focusKey,
  t,
  locale,
  messiName,
  ronaldoName,
}: {
  model: CompareTableModel;
  columns: readonly CompareColumn[];
  focusKey: MetricKey;
  t: Dictionary;
  locale: Locale;
  messiName: string;
  ronaldoName: string;
}) {
  const rowHeader = model.rowHeaderKey === "age" ? t.cmpColAge : t.profileColSeason;
  const minW = 360 + columns.length * 2 * 64;

  const messiLeads = (row: CompareTableRow) => row.leader === "messi";
  const ronaldoLeads = (row: CompareTableRow) => row.leader === "ronaldo";

  return (
    <>
      <div className="hidden glass-panel overflow-x-auto p-0 sm:block">
      <table className="tabular w-full border-collapse text-sm" style={{ minWidth: `${minW}px` }}>
        <caption className="sr-only">{t.cmpTitle}</caption>
        <thead>
          <tr className="sticky top-0 z-30">
            <th
              scope="col"
              rowSpan={2}
              className="sticky left-0 z-40 bg-[var(--color-bg-elevated)] px-3 py-2.5 text-left align-bottom text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]"
            >
              {rowHeader}
            </th>
            <th
              scope="colgroup"
              colSpan={columns.length}
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
              colSpan={columns.length}
              className="bg-[var(--color-bg-elevated)] px-3 py-2 text-center font-[family-name:var(--font-display)] text-base font-black uppercase tracking-[0.04em] text-[var(--color-ronaldo-bright)]"
            >
              {ronaldoName}
            </th>
          </tr>
          <tr className="sticky top-[2.65rem] z-30 text-[0.6rem] font-bold uppercase tracking-[0.04em] text-[var(--color-text-muted)]">
            {columns.map((col) => (
              <th
                key={`m-${col.key}`}
                scope="col"
                className={`bg-[var(--color-bg-elevated)] px-3 py-2 text-center font-semibold ${col.key === focusKey ? "text-[var(--color-text-secondary)]" : ""}`}
              >
                {t[col.labelKey]}
                <HeaderMark col={col} t={t} />
              </th>
            ))}
            {columns.map((col) => (
              <th
                key={`r-${col.key}`}
                scope="col"
                className={`bg-[var(--color-bg-elevated)] px-3 py-2 text-center font-semibold ${col.key === focusKey ? "text-[var(--color-text-secondary)]" : ""}`}
              >
                {t[col.labelKey]}
                <HeaderMark col={col} t={t} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="season-reveal">
          {model.rows.map((row) => (
            <tr key={row.key} className="season-row border-b border-[var(--color-border-glass)]/60 last:border-0">
              <th
                scope="row"
                className="sticky left-0 z-20 whitespace-nowrap bg-[var(--color-bg-elevated)] px-3 py-2.5 text-left font-[family-name:var(--font-display)] text-base font-bold tracking-[0.04em]"
              >
                {row.key}
              </th>
              <SideCells side={row.messi} columns={columns} focusKey={focusKey} leads={messiLeads(row)} tint={HL_MESSI} t={t} locale={locale} />
              <td className="px-3 py-2.5 text-center text-xs">
                <AnimatedDelta delta={row.delta} />
              </td>
              <SideCells side={row.ronaldo} columns={columns} focusKey={focusKey} leads={ronaldoLeads(row)} tint={HL_RONALDO} t={t} locale={locale} />
            </tr>
          ))}
        </tbody>
        <tfoot>
          {model.perType.map((tt) => (
            <TypeTotalRow key={tt.type} tt={tt} columns={columns} t={t} locale={locale} />
          ))}
          <tr className="border-t-2 border-[color-mix(in_srgb,var(--color-gold)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_7%,transparent)] font-black">
            <th
              scope="row"
              className="sticky left-0 z-20 whitespace-nowrap px-3 py-3 text-left font-[family-name:var(--font-display)] text-base tracking-[0.04em] text-[var(--color-gold-bright)]"
              style={{ background: "color-mix(in srgb, var(--color-gold) 7%, var(--color-bg-elevated))" }}
            >
              {t.statsCareerRow}
            </th>
            <TotalCells side={model.total.messi} columns={columns} focusKey={focusKey} leads={model.total.leader === "messi"} tint={HL_MESSI} t={t} locale={locale} />
            <td className="px-3 py-3 text-center text-xs">
              <AnimatedDelta delta={model.total.delta} />
            </td>
            <TotalCells side={model.total.ronaldo} columns={columns} focusKey={focusKey} leads={model.total.leader === "ronaldo"} tint={HL_RONALDO} t={t} locale={locale} />
          </tr>
        </tfoot>
      </table>
      </div>
      <div className="sm:hidden">
        <MobileFocusTable
          model={model}
          focusKey={focusKey}
          t={t}
          locale={locale}
          messiName={messiName}
          ronaldoName={ronaldoName}
        />
      </div>
    </>
  );
}

/** A per-competition-type subtotal row (only shown when comp === "all"). */
function TypeTotalRow({
  tt,
  columns,
  t,
  locale,
}: {
  tt: CompareTypeTotal;
  columns: readonly CompareColumn[];
  t: Dictionary;
  locale: Locale;
}) {
  return (
    <tr className="border-t border-[var(--color-border-glass)]/60 text-[var(--color-text-secondary)]">
      <th
        scope="row"
        className="sticky left-0 z-20 whitespace-nowrap bg-[var(--color-bg-elevated)] px-3 py-2 text-left text-[0.66rem] font-bold uppercase tracking-[0.06em] text-[var(--color-text-muted)]"
      >
        {competitionLabel(t, tt.type)}
      </th>
      <SideTotalCells side={tt.messi} columns={columns} t={t} locale={locale} />
      <td className="px-3 py-2 text-center text-[var(--color-text-muted)]">·</td>
      <SideTotalCells side={tt.ronaldo} columns={columns} t={t} locale={locale} />
    </tr>
  );
}

function SideTotalCells({
  side,
  columns,
  t,
  locale,
}: {
  side: ColMap;
  columns: readonly CompareColumn[];
  t: Dictionary;
  locale: Locale;
}) {
  return (
    <>
      {columns.map((col) => {
        const value = side[col.key] ?? null;
        return (
          <td key={col.key} className={`tabular px-3 py-2 text-center text-xs ${value === null ? "text-[var(--color-text-muted)]" : ""}`}>
            {fmtCell(value, col, t.statsNa, locale)}
          </td>
        );
      })}
    </>
  );
}
