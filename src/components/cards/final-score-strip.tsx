"use client";

import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { PLAYER_META } from "@/components/card/player-meta";
import { useI18n } from "@/lib/i18n/provider";
import type { ArenaVerdict } from "@/components/arena/arena-model";
import { FOCUS_RING } from "@/components/studio/control-primitives";

/**
 * The FINAL SCORE strip (P9-5) — the real verdict tally (categories won) shown
 * as "Ronaldo N – M Messi" with a leader line, plus a link through to the full
 * `/verdict`. All numbers are REAL (the `ArenaVerdict` from `arena-model.ts`):
 * the FIFA card ratings above are the only cosmetic figures on the screen.
 */
export function FinalScoreStrip({ verdict }: { verdict: ArenaVerdict }) {
  const { t } = useI18n();
  const { ronaldo, messi } = verdict.categoriesWon;

  const leaderId = verdict.winner === "tie" ? null : verdict.winner;
  const leaderName = leaderId ? PLAYER_META[leaderId].name : null;
  const leaderLine =
    leaderName === null ? t.verdictTiedScore : t.verdictLeads.replace("{name}", leaderName);

  return (
    <section
      className="glass-panel flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:justify-between sm:p-6 sm:text-left"
      aria-label={t.verdictFinalScore}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background: "color-mix(in srgb, var(--color-gold) 16%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-gold) 45%, transparent)",
          }}
        >
          <Trophy size={22} aria-hidden style={{ color: "var(--color-gold)" }} />
        </div>
        <div>
          <span className="font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--color-text-secondary)]">
            {t.verdictFinalScore}
          </span>
          <div className="flex items-baseline gap-2.5 leading-none">
            <span
              className="tabular font-[family-name:var(--font-display)] text-4xl font-black tabular-nums"
              style={{ color: "var(--color-ronaldo-bright)" }}
            >
              {ronaldo}
            </span>
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-text-muted)]">
              –
            </span>
            <span
              className="tabular font-[family-name:var(--font-display)] text-4xl font-black tabular-nums"
              style={{ color: "var(--color-messi-bright)" }}
            >
              {messi}
            </span>
          </div>
          <span className="mt-1 block text-xs text-[var(--color-text-secondary)]">{leaderLine}</span>
        </div>
      </div>

      <Link
        href="/verdict"
        className={`group inline-flex items-center gap-2 rounded-full px-5 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 ${FOCUS_RING}`}
        style={{
          background: "linear-gradient(135deg, var(--color-gold-bright), var(--color-gold))",
          color: "var(--color-bg-base)",
          boxShadow: "0 8px 28px color-mix(in srgb, var(--color-gold) 38%, transparent)",
        }}
      >
        {t.cardsViewVerdict}
        <ArrowRight size={17} aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </section>
  );
}
