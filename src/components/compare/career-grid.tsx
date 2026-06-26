"use client";

import { CountUp } from "@/components/motion";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import type { CompareCareerRow } from "./compare-model";

/**
 * The "Career" alignment view for `/compare` — every metric as a row, Messi
 * (left, blue) · label · Ronaldo (right, red), with the leader tinted + a ▲
 * marker. READ-ONLY: the ▲ is local evidence, never a score. «н/д» values render
 * static (xG/xA pre-2014, forced cards), never tweened into a 0.
 */

const MESSI_BRIGHT = "var(--color-messi-bright)";
const RONALDO_BRIGHT = "var(--color-ronaldo-bright)";

export function CareerGrid({
  rows,
  t,
  locale,
}: {
  rows: CompareCareerRow[];
  t: Dictionary;
  locale: Locale;
}) {
  const nf = (n: number) => n.toLocaleString(locale === "ru" ? "ru-RU" : "en-US");

  const fmtStatic = (row: CompareCareerRow, value: number | null): string => {
    if (value === null) return t.statsNa;
    if (row.col.format === "percent") return `${(value * 100).toFixed(row.col.decimals)}%`;
    if (row.col.decimals > 0) return value.toFixed(row.col.decimals);
    return nf(value);
  };

  const fmtLive = (row: CompareCareerRow) => (n: number): string => {
    if (row.col.format === "percent") return `${(n * 100).toFixed(row.col.decimals)}%`;
    if (row.col.decimals > 0) return n.toFixed(row.col.decimals);
    return nf(Math.round(n));
  };

  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-1 sm:grid-cols-2">
      {rows.map((row) => {
        const messiLeads = row.leader === "messi";
        const ronaldoLeads = row.leader === "ronaldo";
        const badge = row.col.forcedNa
          ? t.statsBadgeMissing
          : row.col.availability === "modern"
            ? t.statsBadge2014
            : row.col.availability === "illustrative"
              ? t.illustrative
              : null;
        const format = fmtLive(row);

        return (
          <div key={row.col.key} className="h2h-row border-b border-[var(--color-border-glass)]/50 px-2 py-2.5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <span className="text-right text-lg font-extrabold sm:text-xl" style={messiLeads ? { color: MESSI_BRIGHT } : undefined}>
                {row.messi === null ? (
                  <span className="tabular text-[var(--color-text-muted)]">{fmtStatic(row, null)}</span>
                ) : (
                  <CountUp value={row.messi} format={format} />
                )}
                {messiLeads && (
                  <span aria-hidden className="leader-mark ml-1 align-super text-[0.6em]">
                    ▲
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap text-[0.66rem] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                {t[row.col.labelKey]}
                {badge && (
                  <span className="rounded-[4px] border border-[color-mix(in_srgb,var(--color-gold)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-gold)_12%,transparent)] px-1.5 py-px text-[0.58rem] font-bold normal-case tracking-normal text-[var(--color-gold)]">
                    {badge}
                  </span>
                )}
              </span>
              <span className="text-left text-lg font-extrabold sm:text-xl" style={ronaldoLeads ? { color: RONALDO_BRIGHT } : undefined}>
                {ronaldoLeads && (
                  <span aria-hidden className="leader-mark mr-1 align-super text-[0.6em]">
                    ▲
                  </span>
                )}
                {row.ronaldo === null ? (
                  <span className="tabular text-[var(--color-text-muted)]">{fmtStatic(row, null)}</span>
                ) : (
                  <CountUp value={row.ronaldo} format={format} />
                )}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
