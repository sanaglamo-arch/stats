"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Crown } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { DURATION, EASE, STAGGER } from "@/lib/motion/tokens";
import { CATEGORY_ICONS } from "./arena-icons";
import { VerdictToggle } from "./verdict-toggle";
import {
  formatArenaValue,
  type ArenaCategory,
  type ArenaRow,
  type CategoryKey,
} from "./arena-model";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]";

/**
 * The CATEGORY BREAKDOWN (DESIGN §6.1C) — the evidence, MERGING the old /verdict
 * breakdown with the old /compare selection onto the single screen. One glass-
 * panel with a header (title + Show/Hide-winner toggle) and one row per category:
 *   [count checkbox] · icon · LABEL · Ronaldo value —dual bar— Messi value · crown
 * Tap the label → expand the sub-metric rows in place (240ms). The count checkbox
 * includes/excludes a category → the parent recomputes the verdict live + updates
 * ?cats=. Excluded rows dim. Min-count fallback is enforced by the parent.
 */
export function CategoryBreakdown({
  categories,
  selected,
  showWinner,
  onToggleWinner,
  onToggleCategory,
}: {
  /** ALL categories (full model), so excluded rows still render (dimmed). */
  categories: ArenaCategory[];
  /** The keys currently counted in the score. */
  selected: Set<CategoryKey>;
  showWinner: boolean;
  onToggleWinner: (next: boolean) => void;
  onToggleCategory: (key: CategoryKey) => void;
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion();

  return (
    <section className="glass-panel gold-hairline-top p-4 sm:p-6" aria-label={t.arenaCategoryBreakdown}>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-[0.12em] text-[var(--color-text)] sm:text-2xl">
          {t.arenaCategoryBreakdown}
        </h2>
        <VerdictToggle checked={showWinner} onChange={onToggleWinner} />
      </header>

      <ul className="flex flex-col gap-2">
        {categories.map((cat, i) => (
          <BreakdownRow
            key={cat.key}
            category={cat}
            counted={selected.has(cat.key)}
            showWinner={showWinner}
            index={i}
            reduce={!!reduce}
            onToggleCategory={onToggleCategory}
          />
        ))}
      </ul>
    </section>
  );
}

function BreakdownRow({
  category,
  counted,
  showWinner,
  index,
  reduce,
  onToggleCategory,
}: {
  category: ArenaCategory;
  counted: boolean;
  showWinner: boolean;
  index: number;
  reduce: boolean;
  onToggleCategory: (key: CategoryKey) => void;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[category.icon];
  const headline = category.rows[0];

  const ronaldoWon = showWinner && counted && category.winner === "ronaldo";
  const messiWon = showWinner && counted && category.winner === "messi";
  // A side reads as "lost" (dimmed) only when the OTHER side won the category.
  const ronaldoLost = messiWon;
  const messiLost = ronaldoWon;

  return (
    <motion.li
      className="rounded-[var(--radius-md)] border border-[var(--color-border-glass)] bg-[var(--color-surface)] transition-opacity"
      style={{ opacity: counted ? 1 : 0.5 }}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={reduce ? undefined : { opacity: counted ? 1 : 0.5, y: 0 }}
      transition={{ duration: DURATION.fast, ease: EASE.out, delay: 0.12 + index * STAGGER * 0.5 }}
    >
      <div className="grid grid-cols-[auto_1fr] items-center gap-3 px-3 py-2.5 sm:grid-cols-[auto_minmax(7rem,9rem)_1fr] sm:px-4">
        {/* count checkbox */}
        <button
          type="button"
          role="checkbox"
          aria-checked={counted}
          aria-label={t.arenaCountThis.replace("{category}", t[category.labelKey])}
          onClick={() => onToggleCategory(category.key)}
          className={`flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border transition-colors duration-150 ${FOCUS_RING}`}
          style={{
            background: counted ? "color-mix(in srgb, var(--color-gold) 70%, transparent)" : "var(--color-surface)",
            borderColor: counted
              ? "color-mix(in srgb, var(--color-gold) 80%, transparent)"
              : "var(--color-border-strong)",
          }}
        >
          {counted ? (
            <svg width={13} height={13} viewBox="0 0 24 24" aria-hidden fill="none">
              <path d="M5 13l4 4L19 7" stroke="var(--color-bg-base)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </button>

        {/* label (tap to expand) */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={t.arenaExpandRow.replace("{category}", t[category.labelKey])}
          className={`col-start-2 row-start-1 flex min-h-11 cursor-pointer items-center gap-2.5 text-left sm:col-auto sm:row-auto sm:min-h-0 ${FOCUS_RING} rounded-[var(--radius-sm)]`}
        >
          <Icon
            size={20}
            aria-hidden
            strokeWidth={1.75}
            style={ronaldoWon ? { color: "var(--color-ronaldo-bright)" } : messiWon ? { color: "var(--color-messi-bright)" } : undefined}
            className={ronaldoWon || messiWon ? "" : "text-[var(--color-text-secondary)]"}
          />
          <span className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-tight text-[var(--color-text)] sm:text-base">
            {t[category.labelKey]}
          </span>
          <ChevronDown
            size={15}
            aria-hidden
            className="text-[var(--color-text-muted)] transition-transform duration-200"
            style={{ transform: expanded ? "rotate(180deg)" : "none" }}
          />
        </button>

        {/* DESIGN §6.1C — "Messi value ——dual bar—— Ronaldo value": the headline
            metric's two numbers flank the bar (Messi left / Ronaldo right, Inter
            700 .tabular, each tinted its accent, loser dimmed), with the leader
            crown over the winning side. */}
        <div className="col-span-2 row-start-2 grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2 sm:col-auto sm:row-auto sm:grid-cols-[3rem_1fr_3rem]">
          <span
            className={`tabular text-right text-sm font-bold tabular-nums sm:text-base ${
              messiLost ? "opacity-55" : ""
            }`}
            style={{ color: messiWon ? "var(--color-messi-bright)" : "var(--color-text)" }}
          >
            {formatArenaValue(headline, headline.messi)}
          </span>
          <DualBar
            row={headline}
            showWinner={showWinner && counted}
            winner={showWinner && counted ? category.winner : "tie"}
          />
          <span
            className={`tabular text-left text-sm font-bold tabular-nums sm:text-base ${
              ronaldoLost ? "opacity-55" : ""
            }`}
            style={{ color: ronaldoWon ? "var(--color-ronaldo-bright)" : "var(--color-text)" }}
          >
            {formatArenaValue(headline, headline.ronaldo)}
          </span>
        </div>
      </div>

      {/* expanded sub-metrics */}
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="sub"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: DURATION.base, ease: EASE.out }}
            className="overflow-hidden"
          >
            {/* BOSS O1 — Messi value left, Ronaldo value right */}
            <ul className="flex flex-col gap-2.5 border-t border-[var(--color-border-glass)] px-3 py-3 sm:px-4">
              {category.rows.map((row) => (
                <li key={row.labelKey} className="grid grid-cols-[3rem_1fr_3rem] items-center gap-2 sm:grid-cols-[3.5rem_1fr_3.5rem] sm:gap-3">
                  <span
                    className="tabular text-right text-sm font-bold tabular-nums"
                    style={{ color: showWinner && counted && row.winner === "messi" ? "var(--color-messi-bright)" : "var(--color-text-secondary)" }}
                  >
                    {formatArenaValue(row, row.messi)}
                  </span>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">
                      {t[row.labelKey]}
                    </span>
                    <DualBar row={row} showWinner={showWinner && counted} thin />
                  </div>
                  <span
                    className="tabular text-left text-sm font-bold tabular-nums"
                    style={{ color: showWinner && counted && row.winner === "ronaldo" ? "var(--color-ronaldo-bright)" : "var(--color-text-secondary)" }}
                  >
                    {formatArenaValue(row, row.ronaldo)}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  );
}

/**
 * The signature DUAL red/blue split bar (DESIGN §6.1C): a single track split at
 * centre — Ronaldo red fills left←centre, Messi blue fills centre→right; the
 * winner brighter + a faint accent glow, the loser greyed hue-independently (like
 * the existing cards/arena bars). Values flank it via the caller. When showWinner
 * is OFF both sides render neutral gold/white.
 */
function DualBar({
  row,
  showWinner,
  thin = false,
  winner = "tie",
}: {
  row: ArenaRow;
  showWinner: boolean;
  thin?: boolean;
  /** The CATEGORY winner — drives the leader crown over the winning half. */
  winner?: ArenaRow["winner"];
}) {
  const reduce = useReducedMotion();

  const ronaldoWon = showWinner && row.winner === "ronaldo";
  const messiWon = showWinner && row.winner === "messi";
  const ronaldoLost = messiWon;
  const messiLost = ronaldoWon;

  // Neutral mode → both bars warm gold/white (DESIGN §6.1D).
  const ronaldoColor = showWinner ? "var(--color-ronaldo)" : "var(--color-gold)";
  const messiColor = showWinner ? "var(--color-messi)" : "rgba(255,255,255,0.75)";

  const h = thin ? "h-2" : "h-2.5";
  const barTransition = reduce ? { duration: 0 } : { duration: DURATION.base, ease: EASE.out };

  // Leader crown sits over the WINNING half: Messi → left, Ronaldo → right.
  const crownSide = showWinner && winner === "messi" ? "left" : showWinner && winner === "ronaldo" ? "right" : null;

  // BOSS O1 — Messi fills left→centre, Ronaldo centre→right.
  return (
    <div className="relative flex w-full items-center gap-1">
      {crownSide ? (
        <span
          aria-label={`Leader: ${winner}`}
          className="absolute -top-4 z-10 flex -translate-x-1/2 items-center"
          style={{ left: crownSide === "left" ? "25%" : "75%" }}
        >
          <Crown
            size={15}
            aria-hidden
            strokeWidth={2}
            style={{
              color: winner === "messi" ? "var(--color-messi-bright)" : "var(--color-ronaldo-bright)",
              filter: "drop-shadow(0 0 6px rgba(245,180,60,0.5))",
            }}
          />
        </span>
      ) : null}
      {/* left (Messi) — fills from centre outward (right→left) */}
      <div className={`relative ${h} flex-1 overflow-hidden rounded-full bg-[var(--color-surface)]`}>
        <motion.div
          className="absolute inset-y-0 right-0 rounded-full"
          style={{
            background: messiLost ? "var(--color-text-muted)" : messiColor,
            boxShadow: messiWon ? "0 0 12px color-mix(in srgb, var(--color-messi) 70%, transparent)" : "none",
            opacity: messiLost ? 0.55 : 1,
          }}
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${row.messiFill * 100}%` }}
          transition={barTransition}
        />
      </div>
      {/* right (Ronaldo) — fills from centre outward (left→right) */}
      <div className={`relative ${h} flex-1 overflow-hidden rounded-full bg-[var(--color-surface)]`}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: ronaldoLost ? "var(--color-text-muted)" : ronaldoColor,
            boxShadow: ronaldoWon ? "0 0 12px color-mix(in srgb, var(--color-ronaldo) 70%, transparent)" : "none",
            opacity: ronaldoLost ? 0.55 : 1,
          }}
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${row.ronaldoFill * 100}%` }}
          transition={barTransition}
        />
      </div>
    </div>
  );
}
