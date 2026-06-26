"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import type { CompareColumn, ColMap } from "@/components/compare/compare-model";
import { competitionLabel } from "@/components/card/card-labels";
import type { SeasonStatTable } from "./profile-model";

/**
 * Single-player full season × competition table (Phase 11 p11-5). One row per
 * season carrying EVERY catalog metric + raw shot volume (Core/Advanced tiers via
 * the parent's `columns`), each expandable to its individual `competitionName`
 * rows (the 34-comp granular home, wireframe B). Career total + per-type
 * subtotals live in a pinned `<tfoot>`.
 *
 * Sticky header (top) + sticky season column (left), both on a solid surface so
 * scrolled rows never bleed through. Single-accent calm treatment (off the
 * arena's hot path). «н/д» cells (xG/xA pre-2014, forced cards) and "—" are never
 * a fabricated 0. national_team rows carry the "distributed" treatment.
 */

function fmtCell(value: number | null, col: CompareColumn, na: string, locale: Locale): string {
  if (value === null) return na;
  if (col.format === "percent") return `${(value * 100).toFixed(col.decimals)}%`;
  if (col.decimals > 0) return value.toFixed(col.decimals);
  return value.toLocaleString(locale === "ru" ? "ru-RU" : "en-US");
}

/** A tiny accent honesty marker on non-"always" column headers (title = note). */
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

function DataCells({
  cells,
  columns,
  na,
  locale,
  muted,
}: {
  cells: ColMap;
  columns: readonly CompareColumn[];
  na: string;
  locale: Locale;
  muted?: boolean;
}) {
  return (
    <>
      {columns.map((col) => {
        const value = cells[col.key] ?? null;
        return (
          <td
            key={col.key}
            className={`tabular px-3 py-2.5 text-center ${value === null ? "text-[var(--color-text-muted)]" : muted ? "text-[var(--color-text-secondary)]" : ""}`}
          >
            {fmtCell(value, col, na, locale)}
          </td>
        );
      })}
    </>
  );
}

export function SeasonStatTable({
  model,
  columns,
  t,
  locale,
  accent,
}: {
  model: SeasonStatTable;
  columns: readonly CompareColumn[];
  t: Dictionary;
  locale: Locale;
  accent: string;
}) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const toggle = (season: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(season)) next.delete(season);
      else next.add(season);
      return next;
    });

  const minW = 240 + columns.length * 66;

  return (
    <div className="glass-panel overflow-x-auto p-0">
      <table className="tabular w-full border-collapse text-sm" style={{ minWidth: `${minW}px` }}>
        <caption className="sr-only">{t.profileFullStats}</caption>
        <thead>
          <tr className="sticky top-0 z-30 text-[0.6rem] font-bold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
            <th
              scope="col"
              className="sticky left-0 z-40 bg-[var(--color-bg-elevated)] px-3 py-2.5 text-left text-[0.62rem] tracking-[0.1em]"
            >
              {t.profileColSeason}
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="whitespace-nowrap bg-[var(--color-bg-elevated)] px-3 py-2.5 text-center font-semibold"
              >
                {t[col.labelKey]}
                <HeaderMark col={col} t={t} />
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="season-reveal">
          {model.rows.map((row) => {
            const isOpen = expanded.has(row.season);
            return (
              <SeasonRows
                key={row.season}
                row={row}
                columns={columns}
                isOpen={isOpen}
                onToggle={() => toggle(row.season)}
                t={t}
                locale={locale}
                accent={accent}
              />
            );
          })}
        </tbody>

        <tfoot>
          {model.perType.map((tt) => (
            <tr
              key={tt.type}
              className="border-t border-[var(--color-border-glass)]/60 text-[var(--color-text-secondary)]"
            >
              <th
                scope="row"
                className="sticky left-0 z-20 whitespace-nowrap bg-[var(--color-bg-elevated)] px-3 py-2 pl-9 text-left text-[0.66rem] font-bold uppercase tracking-[0.06em] text-[var(--color-text-muted)]"
              >
                {competitionLabel(t, tt.type)}
              </th>
              <DataCells cells={tt.cells} columns={columns} na={t.statsNa} locale={locale} muted />
            </tr>
          ))}
          <tr
            className="border-t-2 font-black"
            style={{
              borderColor: `color-mix(in srgb, ${accent} 45%, transparent)`,
              background: `color-mix(in srgb, ${accent} 8%, transparent)`,
            }}
          >
            <th
              scope="row"
              className="sticky left-0 z-20 whitespace-nowrap px-3 py-3 pl-9 text-left font-[family-name:var(--font-display)] text-base tracking-[0.04em]"
              style={{
                color: accent,
                background: `color-mix(in srgb, ${accent} 8%, var(--color-bg-elevated))`,
              }}
            >
              {t.statsCareerRow}
            </th>
            <DataCells cells={model.total} columns={columns} na={t.statsNa} locale={locale} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function SeasonRows({
  row,
  columns,
  isOpen,
  onToggle,
  t,
  locale,
  accent,
}: {
  row: SeasonStatTable["rows"][number];
  columns: readonly CompareColumn[];
  isOpen: boolean;
  onToggle: () => void;
  t: Dictionary;
  locale: Locale;
  accent: string;
}) {
  return (
    <>
      <tr className="season-row border-b border-[var(--color-border-glass)]/60">
        <th
          scope="row"
          className="sticky left-0 z-20 whitespace-nowrap bg-[var(--color-bg-elevated)] px-3 py-2 text-left align-middle"
        >
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? t.profileCollapse : t.profileExpand} — ${row.season}`}
            className="group flex items-center gap-2 rounded-[var(--radius-sm)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]"
          >
            <ChevronRight
              size={14}
              aria-hidden
              className="shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 group-hover:text-[var(--color-text)]"
              style={{ transform: isOpen ? "rotate(90deg)" : "none" }}
            />
            <span className="flex flex-col">
              <span className="font-[family-name:var(--font-display)] text-base font-bold tracking-[0.04em]">
                {row.season}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[0.66rem] font-medium normal-case tracking-normal text-[var(--color-text-muted)]">
                {row.club}
                {row.hasNational && (
                  <span className="rounded-[3px] border border-[color-mix(in_srgb,var(--color-gold)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_12%,transparent)] px-1 py-px text-[0.56rem] font-bold text-[var(--color-gold)]">
                    {t.statsDistributed}
                  </span>
                )}
              </span>
            </span>
          </button>
        </th>
        <DataCellsTinted cells={row.cells} columns={columns} t={t} locale={locale} accent={accent} />
      </tr>

      {isOpen &&
        row.granular.map((g) => (
          <tr
            key={g.competitionName}
            className="border-b border-[var(--color-border-glass)]/40 bg-[color-mix(in_srgb,var(--color-surface)_55%,transparent)]"
          >
            <th
              scope="row"
              className="sticky left-0 z-20 whitespace-nowrap px-3 py-2 pl-9 text-left"
              style={{ background: "color-mix(in srgb, var(--color-surface) 55%, var(--color-bg-elevated))" }}
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
                <span aria-hidden className="text-[var(--color-text-muted)]">
                  ├
                </span>
                {g.competitionName}
                {g.national && (
                  <span className="rounded-[3px] border border-[color-mix(in_srgb,var(--color-gold)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_12%,transparent)] px-1 py-px text-[0.56rem] font-bold text-[var(--color-gold)]">
                    {t.statsDistributed}
                  </span>
                )}
              </span>
            </th>
            <DataCells cells={g.cells} columns={columns} na={t.statsNa} locale={locale} muted />
          </tr>
        ))}
    </>
  );
}

/** Season aggregate cells — the goals column tinted in the single accent. */
function DataCellsTinted({
  cells,
  columns,
  t,
  locale,
  accent,
}: {
  cells: ColMap;
  columns: readonly CompareColumn[];
  t: Dictionary;
  locale: Locale;
  accent: string;
}) {
  return (
    <>
      {columns.map((col) => {
        const value = cells[col.key] ?? null;
        const isGoals = col.key === "goals";
        return (
          <td
            key={col.key}
            className={`tabular px-3 py-2.5 text-center ${isGoals ? "font-bold" : ""} ${value === null ? "text-[var(--color-text-muted)]" : ""}`}
            style={isGoals && value !== null ? { color: accent } : undefined}
          >
            {fmtCell(value, col, t.statsNa, locale)}
          </td>
        );
      })}
    </>
  );
}
