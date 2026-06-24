"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, Info } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { DURATION, EASE } from "@/lib/motion/tokens";
import type { ArenaModel, CategoryKey } from "@/components/arena/arena-model";
import { CategoryTabs } from "@/components/arena/category-tabs";
import { VsMedallion } from "@/components/arena/vs-medallion";
import { FOCUS_RING } from "@/components/studio/control-primitives";
import { FutCard } from "./fut-card";
import { CardsCategoryPanel } from "./cards-category-panel";
import { FinalScoreStrip } from "./final-score-strip";

/**
 * The FUT COLLECTIBLE-CARD BATTLE SCREEN (P9-5, /cards). Replicates ref2:
 *   • two FUT cards facing centre (Ronaldo RED left, Messi BLUE right) flanking
 *     a gold crown + "THE GREATEST OF ALL TIME?" + the glowing VS;
 *   • a visible "FIFA-style ratings · cosmetic" caption so users know the card
 *     numbers are decorative (real stats live below + in /verdict);
 *   • the category tablist (reused arena tabs) → a selected-category DETAIL
 *     panel with REAL Phase-8 stats (icon + blurb + WINNER + red/blue bars);
 *   • a FINAL SCORE strip with the real verdict tally + a /verdict link.
 *
 * Only UI state lives here (active tab). All numbers come from the server-built
 * `ArenaModel`, except the cosmetic FIFA ratings on the cards themselves.
 */
export function CardsBattle({ model }: { model: ArenaModel }) {
  const { t } = useI18n();
  const reduce = useReducedMotion();

  const [activeKey, setActiveKey] = useState<CategoryKey>(model.categories[0].key);
  const activeCategory = useMemo(
    () => model.categories.find((c) => c.key === activeKey) ?? model.categories[0],
    [model.categories, activeKey],
  );

  const reveal = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: DURATION.base, ease: EASE.out, delay },
        };

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
      {/* Crown title */}
      <motion.header className="mb-8 flex flex-col items-center text-center" {...reveal(0)}>
        <Crown size={30} aria-hidden style={{ color: "var(--color-gold-bright)" }} className="text-glow-gold" />
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">
          <span className="text-glow-gold" style={{ color: "var(--color-gold-bright)" }}>
            {t.cardsTitle}
          </span>
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)] sm:text-base">{t.cardsSubtitle}</p>
      </motion.header>

      {/* Cards + VS */}
      <motion.section
        className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-6"
        {...reveal(0.08)}
        aria-label={t.cardsBattleLabel}
      >
        <FutCard id="ronaldo" align="left" delay={reduce ? 0 : 0.12} />
        <div className="flex items-center justify-center">
          <VsMedallion />
        </div>
        <FutCard id="messi" align="right" delay={reduce ? 0 : 0.2} />
      </motion.section>

      {/* Cosmetic-ratings caption */}
      <motion.div className="mt-5 flex justify-center" {...reveal(0.12)}>
        <span
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)]"
          style={{
            background: "color-mix(in srgb, var(--color-gold) 10%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-gold) 35%, transparent)",
          }}
        >
          <Info size={14} aria-hidden style={{ color: "var(--color-gold)" }} />
          {t.cardsCosmeticBadge}
        </span>
      </motion.div>
      <p className="mx-auto mt-2 max-w-xl text-center text-xs text-[var(--color-text-muted)]">
        {t.cardsCosmeticNote}
      </p>

      {/* Category tabs */}
      <motion.div className="mt-8" {...reveal(0.16)}>
        <CategoryTabs categories={model.categories} active={activeKey} onSelect={setActiveKey} />
      </motion.div>

      {/* Real-data category detail panel */}
      <motion.div className="mt-6" {...reveal(0.2)}>
        <CardsCategoryPanel category={activeCategory} />
      </motion.div>

      {/* Final score + verdict link */}
      <motion.div className="mt-6" {...reveal(0.24)}>
        <FinalScoreStrip verdict={model.verdict} />
      </motion.div>

      {/* Back to arena */}
      <div className="mt-6 flex justify-center">
        <Link
          href="/"
          className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--color-border-glass)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] lg:min-h-0 lg:px-4 lg:py-2 ${FOCUS_RING}`}
        >
          {t.cardsBackToArena}
        </Link>
      </div>
    </main>
  );
}
