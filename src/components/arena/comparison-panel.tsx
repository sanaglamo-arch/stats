"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Info } from "lucide-react";
import { PLAYER_META } from "@/components/card/player-meta";
import { useI18n } from "@/lib/i18n/provider";
import { DURATION, EASE } from "@/lib/motion/tokens";
import { formatArenaValue, type ArenaCategory, type ArenaRow } from "./arena-model";

/**
 * The COMPARISON panel for the selected category: a labelled stat row per metric
 * with divergent bars — Ronaldo (gold/red) growing left from centre, Messi (blue)
 * growing right. Values sit on the outer edges (Ronaldo left / Messi right), the
 * row label centred. The winning side's bar is fully saturated + glows; the
 * loser is dimmed. When `showWinner` is OFF, both bars render neutral (no glow,
 * no dim) and the value weights are equal — fully neutral, just the numbers.
 *
 * This is the tab panel (role="tabpanel") controlled by the category tablist.
 */
export function ComparisonPanel({
  category,
  showWinner,
}: {
  category: ArenaCategory;
  showWinner: boolean;
}) {
  const { t } = useI18n();

  return (
    <section
      role="tabpanel"
      id={`arena-panel-${category.key}`}
      aria-labelledby={`arena-tab-${category.key}`}
      tabIndex={0}
      className="glass-panel p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] sm:p-6"
    >
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
          {t.arenaComparison}: <span style={{ color: "var(--color-gold)" }}>{t[category.labelKey]}</span>
        </h3>
      </header>

      {/* Column headers */}
      <div className="mb-2 grid grid-cols-[auto_1fr_auto] items-center gap-3 px-1 text-[11px] font-bold uppercase tracking-wider">
        <span style={{ color: "var(--color-ronaldo-bright)" }}>{PLAYER_META.ronaldo.name}</span>
        <span className="text-center text-[var(--color-text-muted)]">{t.arenaColTotal}</span>
        <span className="text-right" style={{ color: "var(--color-messi-bright)" }}>
          {PLAYER_META.messi.name}
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {category.rows.map((row) => (
          <Row key={row.labelKey} row={row} showWinner={showWinner} />
        ))}
      </ul>
    </section>
  );
}

function Row({ row, showWinner }: { row: ArenaRow; showWinner: boolean }) {
  const { t } = useI18n();
  const reduce = useReducedMotion();

  const ronaldoWon = showWinner && row.winner === "ronaldo";
  const messiWon = showWinner && row.winner === "messi";

  const ronaldoColor = "var(--color-ronaldo)";
  const messiColor = "var(--color-messi)";

  // Bar fill (0..1). Neutral mode keeps the real share but flat styling.
  const rFill = row.ronaldoFill;
  const mFill = row.messiFill;

  const barTransition = reduce
    ? { duration: 0 }
    : { duration: DURATION.base, ease: EASE.out };

  return (
    <li className="grid grid-cols-[3.5rem_1fr_3.5rem] items-center gap-2 sm:grid-cols-[4.5rem_1fr_4.5rem] sm:gap-3">
      {/* Ronaldo value (left) */}
      <span
        className={`tabular text-right text-lg font-bold tabular-nums sm:text-xl ${
          ronaldoWon ? "" : showWinner ? "opacity-60" : ""
        }`}
        style={{ color: ronaldoWon ? "var(--color-ronaldo-bright)" : "var(--color-text)" }}
      >
        {formatArenaValue(row, row.ronaldo)}
      </span>

      {/* Divergent bars + centre label */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">
          <span className="inline-flex items-center gap-1">
            {t[row.labelKey]}
            <Info size={12} aria-hidden className="text-[var(--color-text-muted)]" />
          </span>
        </span>
        <div className="flex w-full items-center gap-1">
          {/* left track (Ronaldo) — fills from centre outward (right→left) */}
          <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface)]">
            <motion.div
              className="absolute inset-y-0 right-0 rounded-full"
              style={{
                background: ronaldoColor,
                boxShadow: ronaldoWon ? "0 0 12px color-mix(in srgb, var(--color-ronaldo) 70%, transparent)" : "none",
                opacity: showWinner && !ronaldoWon ? 0.45 : 1,
              }}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${rFill * 100}%` }}
              transition={barTransition}
            />
          </div>
          {/* right track (Messi) — fills from centre outward (left→right) */}
          <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface)]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: messiColor,
                boxShadow: messiWon ? "0 0 12px color-mix(in srgb, var(--color-messi) 70%, transparent)" : "none",
                opacity: showWinner && !messiWon ? 0.45 : 1,
              }}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${mFill * 100}%` }}
              transition={barTransition}
            />
          </div>
        </div>
      </div>

      {/* Messi value (right) */}
      <span
        className={`tabular text-left text-lg font-bold tabular-nums sm:text-xl ${
          messiWon ? "" : showWinner ? "opacity-60" : ""
        }`}
        style={{ color: messiWon ? "var(--color-messi-bright)" : "var(--color-text)" }}
      >
        {formatArenaValue(row, row.messi)}
      </span>
    </li>
  );
}
