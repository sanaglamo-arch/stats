"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Crown, Crosshair, Equal, Trophy } from "lucide-react";
import { PLAYER_META } from "@/components/card/player-meta";
import { useI18n } from "@/lib/i18n/provider";
import { DURATION, EASE } from "@/lib/motion/tokens";
import type { ArenaVerdict } from "./arena-model";
import { VerdictToggle } from "./verdict-toggle";

/**
 * The FINAL VERDICT panel — crown, "Winner: X", a categories Won / Tied / (other
 * Won) score strip, and a one-line "why" blurb. The "Show winner" switch lives in
 * the header: when OFF, the entire winner identity AND the score strip collapse —
 * the panel goes fully neutral (just the verdict frame + the toggle), so nothing
 * reveals who is ahead (boss requirement).
 */
export function VerdictPanel({
  verdict,
  showWinner,
  onToggle,
}: {
  verdict: ArenaVerdict;
  showWinner: boolean;
  onToggle: (next: boolean) => void;
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion();

  const winnerId = verdict.winner === "tie" ? null : verdict.winner;
  const accent =
    winnerId === null ? "var(--color-gold)" : `var(${PLAYER_META[winnerId].accentVar})`;
  const winnerName = winnerId === null ? t.arenaDraw : PLAYER_META[winnerId].name;
  const why =
    verdict.winner === "messi"
      ? t.arenaWhyMessi
      : verdict.winner === "ronaldo"
        ? t.arenaWhyRonaldo
        : t.arenaWhyTie;

  // Score strip: winner's categories, ties, runner-up's categories.
  const { ronaldo, messi, tied } = verdict.categoriesWon;
  const winnerCats = winnerId === "ronaldo" ? ronaldo : winnerId === "messi" ? messi : ronaldo;
  const loserCats = winnerId === "ronaldo" ? messi : winnerId === "messi" ? ronaldo : messi;

  return (
    <section
      className="glass-panel flex flex-col items-center p-6 text-center sm:p-7"
      style={{ borderColor: `color-mix(in srgb, ${accent} 38%, var(--color-border-glass))` }}
      aria-label={t.arenaFinalVerdict}
    >
      {/* Toggle */}
      <div className="mb-5 w-full">
        <VerdictToggle checked={showWinner} onChange={onToggle} />
      </div>

      {/* Crown */}
      <motion.div
        initial={reduce ? false : { scale: 0.7, opacity: 0 }}
        animate={reduce ? undefined : { scale: 1, opacity: 1 }}
        transition={{ duration: DURATION.base, ease: EASE.impact }}
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background: `radial-gradient(closest-side, color-mix(in srgb, ${accent} 30%, transparent), transparent)`,
          boxShadow: `0 0 30px color-mix(in srgb, ${accent} 45%, transparent)`,
        }}
      >
        <Crown size={34} aria-hidden style={{ color: accent }} strokeWidth={1.75} />
      </motion.div>

      <span className="mt-3 font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.32em] text-[var(--color-text-secondary)]">
        {t.arenaFinalVerdict}
      </span>

      {showWinner ? (
        <>
          <div className="mt-1 flex flex-col items-center">
            <span className="font-[family-name:var(--font-display)] text-lg font-bold uppercase tracking-tight text-[var(--color-text-secondary)]">
              {verdict.winner === "tie" ? "" : t.arenaWinner}
            </span>
            <span
              className="font-[family-name:var(--font-display)] text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl"
              style={{ color: accent }}
            >
              {winnerName}
            </span>
          </div>

          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {why}
          </p>

          {/* Score strip */}
          <dl className="mt-5 grid w-full grid-cols-3 gap-2">
            <ScoreCell
              icon={<Crosshair size={18} aria-hidden style={{ color: accent }} />}
              value={winnerCats}
              label={t.arenaCategoriesWon}
            />
            <ScoreCell
              icon={<Equal size={18} aria-hidden className="text-[var(--color-text-secondary)]" />}
              value={tied}
              label={t.arenaCategoriesTied}
            />
            <ScoreCell
              icon={<Trophy size={18} aria-hidden className="text-[var(--color-text-muted)]" />}
              value={loserCats}
              label={loserCats === 1 ? t.arenaCategoryWon : t.arenaCategoriesWon}
            />
          </dl>
        </>
      ) : (
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--color-text-muted)]">
          {t.arenaShowWinnerHint}
        </p>
      )}
    </section>
  );
}

function ScoreCell({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border-glass)] bg-[var(--color-bg-elevated)] px-2 py-3">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="tabular text-xl font-bold tabular-nums">{value}</span>
      </div>
      <span className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-[var(--color-text-muted)]">
        {label}
      </span>
    </div>
  );
}
