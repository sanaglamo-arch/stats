"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PLAYER_META } from "@/components/card/player-meta";
import { CATEGORY_ICONS } from "@/components/arena/arena-icons";
import { formatArenaValue, type ArenaCategory, type ArenaRow } from "@/components/arena/arena-model";
import { useI18n } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { DURATION, EASE } from "@/lib/motion/tokens";

/**
 * The selected-category DETAIL panel for the FUT battle screen (P9-5), modelled
 * on ref2's "UCL" panel: a big category icon + blurb on the left, a "WINNER: X"
 * banner in the centre, and a few REAL stat rows on the right with red/blue
 * divergent bars. EVERYTHING here is real Phase-8 data from the `ArenaModel`
 * (`arena-model.ts`) — the cosmetic FIFA ratings live ONLY on the cards above.
 *
 * This is the tablist's `role="tabpanel"` (controlled by `CategoryTabs`).
 */

/** Per-category one-line blurb (reuses the compare-flow hint strings). */
const CATEGORY_BLURB: Record<ArenaCategory["key"], keyof Dictionary> = {
  goals: "compareHintGoals",
  assists: "compareHintAssists",
  trophies: "compareHintTrophies",
  ballonDor: "compareHintBallonDor",
  championsLeague: "compareHintChampionsLeague",
  worldCup: "compareHintWorldCup",
  playmaking: "compareHintPlaymaking",
  longevity: "compareHintLongevity",
};

export function CardsCategoryPanel({ category }: { category: ArenaCategory }) {
  const { t } = useI18n();
  const Icon = CATEGORY_ICONS[category.icon];

  const winnerId = category.winner === "tie" ? null : category.winner;
  const accent = winnerId === null ? "var(--color-gold)" : `var(${PLAYER_META[winnerId].accentVar})`;
  const winnerName = winnerId === null ? t.arenaDraw : PLAYER_META[winnerId].name;

  return (
    <section
      role="tabpanel"
      id={`cards-panel-${category.key}`}
      aria-labelledby={`arena-tab-${category.key}`}
      tabIndex={0}
      className="glass-panel grid grid-cols-1 gap-5 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] sm:p-6 lg:grid-cols-[minmax(0,1fr)_1.4fr]"
      style={{ borderColor: `color-mix(in srgb, ${accent} 34%, var(--color-border-glass))` }}
    >
      {/* Left: icon + blurb + WINNER banner */}
      <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)]"
          style={{
            background: "color-mix(in srgb, var(--color-gold) 14%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-gold) 40%, transparent)",
          }}
        >
          <Icon size={28} aria-hidden strokeWidth={1.75} style={{ color: "var(--color-gold)" }} />
        </div>
        <h3 className="font-[family-name:var(--font-display)] text-2xl font-black uppercase leading-none tracking-tight text-white">
          {t[category.labelKey]}
        </h3>
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {t[CATEGORY_BLURB[category.key]]}
        </p>

        <div
          className="mt-1 inline-flex flex-col items-center gap-0.5 rounded-[var(--radius-md)] px-4 py-2 lg:items-start"
          style={{
            background: `color-mix(in srgb, ${accent} 12%, rgba(0,0,0,0.25))`,
            border: `1px solid color-mix(in srgb, ${accent} 45%, transparent)`,
          }}
        >
          <span className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--color-text-secondary)]">
            {category.winner === "tie" ? t.verdictPerCatTie : t.arenaWinner}
          </span>
          <span
            className="font-[family-name:var(--font-display)] text-2xl font-black uppercase leading-none tracking-tight"
            style={{ color: accent }}
          >
            {category.winner === "tie" ? t.arenaDraw : winnerName}
          </span>
        </div>
      </div>

      {/* Right: real stat rows with red/blue bars */}
      <div>
        <div className="mb-2 grid grid-cols-[3.5rem_1fr_3.5rem] items-center gap-2 text-[11px] font-bold uppercase tracking-wider sm:grid-cols-[4.5rem_1fr_4.5rem]">
          <span style={{ color: "var(--color-ronaldo-bright)" }}>{PLAYER_META.ronaldo.name.split(" ")[0]}</span>
          <span className="text-center text-[var(--color-text-muted)]">{t.arenaColTotal}</span>
          <span className="text-right" style={{ color: "var(--color-messi-bright)" }}>
            {PLAYER_META.messi.name.split(" ")[0]}
          </span>
        </div>
        <ul className="flex flex-col gap-3">
          {category.rows.map((row) => (
            <DetailRow key={row.labelKey} row={row} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function DetailRow({ row }: { row: ArenaRow }) {
  const { t } = useI18n();
  const reduce = useReducedMotion();

  const ronaldoWon = row.winner === "ronaldo";
  const messiWon = row.winner === "messi";

  const barTransition = reduce ? { duration: 0 } : { duration: DURATION.base, ease: EASE.out };

  return (
    <li className="grid grid-cols-[3.5rem_1fr_3.5rem] items-center gap-2 sm:grid-cols-[4.5rem_1fr_4.5rem] sm:gap-3">
      <span
        className={`tabular text-right text-lg font-bold tabular-nums sm:text-xl ${ronaldoWon ? "" : "opacity-60"}`}
        style={{ color: ronaldoWon ? "var(--color-ronaldo-bright)" : "var(--color-text)" }}
      >
        {formatArenaValue(row, row.ronaldo)}
      </span>

      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">{t[row.labelKey]}</span>
        <div className="flex w-full items-center gap-1">
          <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface)]">
            <motion.div
              className="absolute inset-y-0 right-0 rounded-full"
              style={{
                background: "var(--color-ronaldo)",
                boxShadow: ronaldoWon ? "0 0 12px color-mix(in srgb, var(--color-ronaldo) 70%, transparent)" : "none",
                opacity: ronaldoWon ? 1 : 0.45,
              }}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${row.ronaldoFill * 100}%` }}
              transition={barTransition}
            />
          </div>
          <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface)]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: "var(--color-messi)",
                boxShadow: messiWon ? "0 0 12px color-mix(in srgb, var(--color-messi) 70%, transparent)" : "none",
                opacity: messiWon ? 1 : 0.45,
              }}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${row.messiFill * 100}%` }}
              transition={barTransition}
            />
          </div>
        </div>
      </div>

      <span
        className={`tabular text-left text-lg font-bold tabular-nums sm:text-xl ${messiWon ? "" : "opacity-60"}`}
        style={{ color: messiWon ? "var(--color-messi-bright)" : "var(--color-text)" }}
      >
        {formatArenaValue(row, row.messi)}
      </span>
    </li>
  );
}
