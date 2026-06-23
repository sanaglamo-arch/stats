"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Crown, Download, Share2, SlidersHorizontal } from "lucide-react";
import { PLAYER_META } from "@/components/card/player-meta";
import { useI18n } from "@/lib/i18n/provider";
import { DURATION, EASE, STAGGER } from "@/lib/motion/tokens";
import { CATEGORY_ICONS } from "./arena-icons";
import { VerdictToggle } from "./verdict-toggle";
import {
  formatArenaValue,
  serializeCategoryParam,
  type ArenaCategory,
  type ArenaVerdict,
  type CategoryKey,
  type RowWinner,
} from "./arena-model";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]";

/**
 * VERDICT / RESULT (P9-4) — step 2 of the guided flow. Reads the selection
 * (validated server-side) and renders, all from the real model:
 *   • the FINAL VERDICT header (crowns + each side's categories-won count),
 *   • a CATEGORY BREAKDOWN (each selected category → its winner + the two
 *     headline values),
 *   • the FINAL SCORE + a "Why X wins" blurb,
 *   • Download Summary Card + Share buttons (wired, share modal is P9-6).
 *
 * The "Show winner" toggle (default ON; reuses {@link VerdictToggle}) governs
 * everything verdict-ish: OFF hides the crowns, score, "why" AND per-category
 * winners — the breakdown collapses to neutral two-value rows (just the numbers).
 */
export function VerdictResult({
  categories,
  verdict,
  selectedKeys,
}: {
  categories: ArenaCategory[];
  verdict: ArenaVerdict;
  selectedKeys: CategoryKey[];
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [showWinner, setShowWinner] = useState(true);

  const winnerId = verdict.winner === "tie" ? null : verdict.winner;
  const accent =
    winnerId === null ? "var(--color-gold)" : `var(${PLAYER_META[winnerId].accentVar})`;
  const why =
    verdict.winner === "messi"
      ? t.arenaWhyMessi
      : verdict.winner === "ronaldo"
        ? t.arenaWhyRonaldo
        : t.arenaWhyTie;

  const { ronaldo, messi } = verdict.categoriesWon;
  const scoreLeader =
    verdict.winner === "tie"
      ? t.verdictTiedScore
      : t.verdictLeads.replace("{name}", PLAYER_META[verdict.winner].name);

  const editHref = `/compare`;
  const shareHref = `/?share=1&cats=${serializeCategoryParam(selectedKeys)}`;

  function onDownload() {
    // P9-6 share/summary-card modal lands here; ready hook for now.
    window.location.assign(shareHref);
  }

  const reveal = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: DURATION.base, ease: EASE.out, delay },
        };

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      {/* Top bar: back + step + toggle */}
      <motion.div
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        {...reveal(0)}
      >
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className={`inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--color-border-glass)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors duration-200 hover:text-[var(--color-text)] ${FOCUS_RING}`}
          >
            <ArrowLeft size={14} aria-hidden />
            {t.verdictBackToArena}
          </Link>
          <span className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.32em] text-[var(--color-gold)]">
            {t.verdictKickerStep}
          </span>
        </div>
        <VerdictToggle checked={showWinner} onChange={setShowWinner} />
      </motion.div>

      {/* FINAL VERDICT header */}
      <motion.section
        className="glass-panel flex flex-col items-center p-6 text-center sm:p-8"
        style={{ borderColor: `color-mix(in srgb, ${accent} 38%, var(--color-border-glass))` }}
        aria-label={t.arenaFinalVerdict}
        {...reveal(0.06)}
      >
        <span className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.32em] text-[var(--color-text-secondary)]">
          {t.arenaFinalVerdict}
        </span>

        {/* Two-sided crowned scoreboard */}
        <div className="mt-5 grid w-full max-w-md grid-cols-[1fr_auto_1fr] items-center gap-3">
          <SideScore
            id="ronaldo"
            count={ronaldo}
            crowned={showWinner && verdict.winner === "ronaldo"}
            showWinner={showWinner}
          />
          <span className="font-[family-name:var(--font-display)] text-2xl font-black uppercase text-[var(--color-text-muted)]">
            {t.vs}
          </span>
          <SideScore
            id="messi"
            count={messi}
            crowned={showWinner && verdict.winner === "messi"}
            showWinner={showWinner}
          />
        </div>

        {showWinner ? (
          <p className="mt-6 max-w-md text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {why}
          </p>
        ) : (
          <p className="mt-6 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
            {t.verdictNeutralHint}
          </p>
        )}
      </motion.section>

      {/* CATEGORY BREAKDOWN */}
      <motion.section className="mt-6" {...reveal(0.12)}>
        <header className="mb-3 flex items-baseline justify-between gap-3 px-1">
          <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
            {t.verdictBreakdown}
          </h2>
          <span className="text-xs text-[var(--color-text-muted)]">{t.verdictBreakdownHint}</span>
        </header>
        <ul className="flex flex-col gap-2">
          {categories.map((cat, i) => (
            <BreakdownRow key={cat.key} category={cat} showWinner={showWinner} index={i} />
          ))}
        </ul>
      </motion.section>

      {/* FINAL SCORE */}
      {showWinner ? (
        <motion.section
          className="glass-panel mt-6 flex flex-col items-center gap-1 p-5 text-center"
          {...reveal(0.16)}
          aria-label={t.verdictFinalScore}
        >
          <span className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-text-secondary)]">
            {t.verdictFinalScore}
          </span>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-black uppercase tracking-tight sm:text-3xl">
            <span style={{ color: "var(--color-ronaldo-bright)" }}>{PLAYER_META.ronaldo.name.split(" ")[0]}</span>
            <span className="mx-2 tabular tabular-nums text-[var(--color-text)]">{ronaldo}</span>
            <span className="text-[var(--color-text-muted)]">—</span>
            <span className="mx-2 tabular tabular-nums text-[var(--color-text)]">{messi}</span>
            <span style={{ color: "var(--color-messi-bright)" }}>{PLAYER_META.messi.name.split(" ")[0]}</span>
          </p>
          <p className="mt-1 text-sm font-semibold" style={{ color: accent }}>
            {scoreLeader}
          </p>
        </motion.section>
      ) : null}

      {/* Actions */}
      <motion.div
        className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        {...reveal(0.2)}
      >
        <button
          type="button"
          onClick={onDownload}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 sm:w-auto ${FOCUS_RING}`}
          style={{
            background: "linear-gradient(135deg, var(--color-gold-bright), var(--color-gold))",
            color: "var(--color-bg-base)",
            boxShadow: "0 8px 28px color-mix(in srgb, var(--color-gold) 38%, transparent)",
          }}
        >
          <Download size={17} aria-hidden />
          {t.verdictDownloadCard}
        </button>
        <Link
          href={shareHref}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-border-strong)] px-6 py-3.5 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-text)] transition-colors duration-200 hover:bg-[var(--color-surface)] sm:w-auto ${FOCUS_RING}`}
        >
          <Share2 size={17} aria-hidden />
          {t.verdictShare}
        </Link>
        <Link
          href={editHref}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors duration-200 hover:text-[var(--color-text)] sm:w-auto ${FOCUS_RING}`}
        >
          <SlidersHorizontal size={16} aria-hidden />
          {t.verdictEditCategories}
        </Link>
      </motion.div>
    </main>
  );
}

/** One side of the crowned scoreboard: player name + categories-won count. */
function SideScore({
  id,
  count,
  crowned,
  showWinner,
}: {
  id: "ronaldo" | "messi";
  count: number;
  crowned: boolean;
  showWinner: boolean;
}) {
  const { t } = useI18n();
  const meta = PLAYER_META[id];
  const accent = `var(${meta.accentVar})`;
  return (
    <div className="flex flex-col items-center gap-1">
      <Crown
        size={26}
        aria-hidden
        strokeWidth={1.75}
        style={{
          color: crowned ? accent : "var(--color-border-strong)",
          filter: crowned ? `drop-shadow(0 0 10px ${accent})` : "none",
          opacity: crowned ? 1 : showWinner ? 0.35 : 0.2,
        }}
      />
      <span
        className="font-[family-name:var(--font-display)] text-base font-bold uppercase leading-tight tracking-tight"
        style={{ color: showWinner ? accent : "var(--color-text)" }}
      >
        {meta.name.split(" ").slice(-1)[0]}
      </span>
      {showWinner ? (
        <>
          <span className="tabular text-3xl font-black tabular-nums text-[var(--color-text)]">
            {count}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {t.arenaCategoriesWon}
          </span>
        </>
      ) : null}
    </div>
  );
}

/** One category row in the breakdown: icon + label, the two headline values, and
 *  (when showWinner) a winner pill. Neutral = just the two numbers. */
function BreakdownRow({
  category,
  showWinner,
  index,
}: {
  category: ArenaCategory;
  showWinner: boolean;
  index: number;
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const Icon = CATEGORY_ICONS[category.icon];
  const headline = category.rows[0];

  const winnerPill = winnerLabel(category.winner, t);
  const pillColor =
    category.winner === "ronaldo"
      ? "var(--color-ronaldo-bright)"
      : category.winner === "messi"
        ? "var(--color-messi-bright)"
        : "var(--color-text-secondary)";

  const ronaldoWon = showWinner && category.winner === "ronaldo";
  const messiWon = showWinner && category.winner === "messi";

  return (
    <motion.li
      className="glass-panel grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3"
      initial={reduce ? false : { opacity: 0, x: -12 }}
      animate={reduce ? undefined : { opacity: 1, x: 0 }}
      transition={{ duration: DURATION.fast, ease: EASE.out, delay: 0.14 + index * STAGGER * 0.5 }}
    >
      {/* Label */}
      <div className="flex items-center gap-2.5">
        <Icon size={20} aria-hidden strokeWidth={1.75} className="text-[var(--color-text-secondary)]" />
        <span className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-tight text-[var(--color-text)]">
          {t[category.labelKey]}
        </span>
      </div>

      {/* Two headline values */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <span
          className="tabular font-bold tabular-nums"
          style={{ color: ronaldoWon ? "var(--color-ronaldo-bright)" : "var(--color-text-secondary)" }}
        >
          {formatArenaValue(headline, headline.ronaldo)}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">{t.vs}</span>
        <span
          className="tabular font-bold tabular-nums"
          style={{ color: messiWon ? "var(--color-messi-bright)" : "var(--color-text-secondary)" }}
        >
          {formatArenaValue(headline, headline.messi)}
        </span>
      </div>

      {/* Winner pill / neutral metric label */}
      {showWinner ? (
        <span
          className="justify-self-end rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
          style={{
            color: pillColor,
            background: `color-mix(in srgb, ${pillColor} 14%, transparent)`,
          }}
        >
          {winnerPill}
        </span>
      ) : (
        <span className="justify-self-end text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          {t[headline.labelKey]}
        </span>
      )}
    </motion.li>
  );
}

function winnerLabel(winner: RowWinner, t: ReturnType<typeof useI18n>["t"]): string {
  if (winner === "tie") return t.verdictPerCatTie;
  return t.verdictPerCatWins.replace("{name}", PLAYER_META[winner].name.split(" ").slice(-1)[0]);
}
