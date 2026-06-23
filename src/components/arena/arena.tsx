"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { DURATION, EASE } from "@/lib/motion/tokens";
import type { ArenaModel, CategoryKey } from "./arena-model";
import { PlayerRender } from "./player-render";
import { VsMedallion } from "./vs-medallion";
import { CategoryTabs } from "./category-tabs";
import { ComparisonPanel } from "./comparison-panel";
import { VerdictPanel } from "./verdict-panel";

/**
 * The flagship HOME ARENA (P9-2). Replaces the old hero+studio home content.
 * Top: two duotone player renders flanking the glowing VS, each over an identity
 * glass-card. Middle: the category tablist. Bottom: a two-column block — the
 * selected category's COMPARISON panel (left) and the FINAL VERDICT panel
 * (right, with the Show-winner toggle). All data comes from the server-built
 * `ArenaModel`; this component owns only UI state (active tab, verdict toggle).
 */
export function Arena({ model, accurateAsOf }: { model: ArenaModel; accurateAsOf: string }) {
  const { t, locale } = useI18n();
  const reduce = useReducedMotion();

  const accurateDate = useMemo(
    () =>
      new Date(accurateAsOf).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [accurateAsOf, locale],
  );

  const [activeKey, setActiveKey] = useState<CategoryKey>(model.categories[0].key);
  const [showWinner, setShowWinner] = useState(true);

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
      {/* Title */}
      <motion.header className="mb-8 flex flex-col items-center text-center" {...reveal(0)}>
        <h1 className="font-[family-name:var(--font-display)] text-5xl font-black uppercase leading-none tracking-tight sm:text-7xl">
          <span className="text-glow-gold" style={{ color: "var(--color-gold-bright)" }}>
            {t.arenaTitleGoat}
          </span>{" "}
          <span className="bg-gradient-to-b from-white to-[var(--color-text-secondary)] bg-clip-text text-transparent">
            {t.arenaTitleArena}
          </span>
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)] sm:text-base">
          {t.arenaSubtitle}
        </p>
      </motion.header>

      {/* Renders + VS */}
      <motion.section
        className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-4"
        {...reveal(0.08)}
        aria-label={t.arenaSubtitle}
      >
        <PlayerRender id="ronaldo" identity={model.identity.ronaldo} align="left" />
        <div className="hidden items-center justify-center self-center lg:flex">
          <VsMedallion />
        </div>
        <PlayerRender id="messi" identity={model.identity.messi} align="right" />
      </motion.section>

      {/* Category tabs */}
      <motion.div className="mt-8" {...reveal(0.12)}>
        <CategoryTabs categories={model.categories} active={activeKey} onSelect={setActiveKey} />
      </motion.div>

      {/* Comparison + Verdict */}
      <motion.div
        className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]"
        {...reveal(0.16)}
      >
        <ComparisonPanel category={activeCategory} showWinner={showWinner} />
        <VerdictPanel verdict={model.verdict} showWinner={showWinner} onToggle={setShowWinner} />
      </motion.div>

      {/* Accuracy line */}
      <div className="mt-8 flex flex-col items-center gap-2 text-center text-xs text-[var(--color-text-muted)] sm:flex-row sm:justify-center sm:gap-4">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={14} aria-hidden />
          {t.arenaAccuracy.replace("{date}", accurateDate)}
        </span>
        <span className="hidden sm:inline" aria-hidden>
          |
        </span>
        <span>{t.arenaScope}</span>
      </div>
    </main>
  );
}
