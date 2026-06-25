"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Crown } from "lucide-react";
import { PLAYER_META } from "@/components/card/player-meta";
import { useI18n } from "@/lib/i18n/provider";
import { DURATION, EASE } from "@/lib/motion/tokens";
import { useCountUp } from "@/lib/motion/use-count-up";
import type { ArenaVerdict } from "./arena-model";

/**
 * The VERDICT SCORE BAND (DESIGN §3.5) — the hero answer, overlapping the
 * lower-centre of the clash. "RONALDO N — M MESSI" in huge Bebas: each side
 * tinted its accent, the dash + numbers in gold. Below: "M categories won · K
 * tied" with a crown by the leader. Numbers count up on entrance (reduced-motion
 * → final). `showWinner` OFF → neutral mode: numbers only, no crown, no win
 * language (DESIGN §6.1D).
 */
export function ScoreBand({
  verdict,
  showWinner,
}: {
  verdict: ArenaVerdict;
  showWinner: boolean;
}) {
  const { t } = useI18n();
  const reduce = useReducedMotion();

  const { ronaldo, messi, tied } = verdict.categoriesWon;
  const rCount = Math.round(useCountUp(ronaldo, true));
  const mCount = Math.round(useCountUp(messi, true));

  const winnerId = showWinner && verdict.winner !== "tie" ? verdict.winner : null;
  const leaderCats = winnerId === "ronaldo" ? ronaldo : winnerId === "messi" ? messi : 0;
  const subline =
    leaderCats === 1
      ? t.arenaScoreCategoryWon.replace("{n}", String(leaderCats))
      : t.arenaScoreCategoriesWon.replace("{n}", String(leaderCats));

  const reveal = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: DURATION.base, ease: EASE.out, delay: 0.32 },
      };

  return (
    <motion.div
      className="glass-panel gold-hairline-top relative mx-auto w-full max-w-3xl px-5 py-5 text-center sm:px-8 sm:py-6"
      style={{ boxShadow: "var(--shadow-hero)" }}
      aria-label={t.arenaFinalVerdict}
      {...reveal}
    >
      {/* BOSS O1 — score order: MESSI (left) — RONALDO (right). */}
      <p className="flex items-center justify-center gap-3 font-[family-name:var(--font-display)] leading-[0.9] tracking-[0.01em] sm:gap-5">
        <span
          className="text-[clamp(2rem,7vw,4.5rem)]"
          style={{ color: "var(--color-messi-bright)" }}
        >
          {PLAYER_META.messi.name.split(" ").slice(-1)[0].toUpperCase()}
        </span>
        <span
          className="tabular text-[clamp(2.5rem,8vw,7rem)] tabular-nums text-glow-gold"
          style={{ color: "var(--color-gold-bright)" }}
        >
          {mCount}
        </span>
        <span className="text-[clamp(2rem,6vw,5rem)] text-[var(--color-gold)]">—</span>
        <span
          className="tabular text-[clamp(2.5rem,8vw,7rem)] tabular-nums text-glow-gold"
          style={{ color: "var(--color-gold-bright)" }}
        >
          {rCount}
        </span>
        <span
          className="text-[clamp(2rem,7vw,4.5rem)]"
          style={{ color: "var(--color-ronaldo-bright)" }}
        >
          {PLAYER_META.ronaldo.name.split(" ").slice(-1)[0].toUpperCase()}
        </span>
      </p>

      {showWinner ? (
        verdict.winner === "tie" ? (
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">
            {t.arenaDraw}
            {tied > 0 ? ` · ${t.arenaScoreTied.replace("{n}", String(tied))}` : ""}
          </p>
        ) : (
          <p className="mt-1 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">
            <Crown
              size={16}
              aria-hidden
              strokeWidth={1.75}
              style={{
                color: "var(--color-gold)",
                filter: "drop-shadow(0 0 8px rgba(245,180,60,0.6))",
              }}
            />
            {subline}
            {tied > 0 ? ` · ${t.arenaScoreTied.replace("{n}", String(tied))}` : ""}
          </p>
        )
      ) : (
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
          {t.arenaShowWinnerHint}
        </p>
      )}
    </motion.div>
  );
}
