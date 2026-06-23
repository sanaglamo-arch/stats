"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Share2, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { DURATION, EASE } from "@/lib/motion/tokens";
import { ShareModal } from "@/components/share/share-modal";
import { CATEGORY_KEYS, serializeCategoryParam, type ArenaModel, type CategoryKey } from "./arena-model";
import { PlayerRender } from "./player-render";
import { VsMedallion } from "./vs-medallion";
import { CategoryTabs } from "./category-tabs";
import { ComparisonPanel } from "./comparison-panel";
import { VerdictPanel } from "./verdict-panel";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]";

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
  const [shareOpen, setShareOpen] = useState(false);
  // The arena compares the full category set; a deep-linked ?cats= refines it.
  const [catsParam, setCatsParam] = useState(serializeCategoryParam(CATEGORY_KEYS));

  // Deep link: /?share=1[&cats=...] auto-opens the share modal (the verdict /
  // cards "Share" links route here). Reads the URL once on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cats = params.get("cats");
    if (cats) setCatsParam(cats);
    if (params.get("share") === "1") setShareOpen(true);
  }, []);

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

        {/* Guided-flow entry point → /compare (P9-3) */}
        <Link
          href="/compare"
          className="group mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]"
          style={{
            background: "linear-gradient(135deg, var(--color-gold-bright), var(--color-gold))",
            color: "var(--color-bg-base)",
            boxShadow: "0 8px 28px color-mix(in srgb, var(--color-gold) 38%, transparent)",
          }}
        >
          {t.arenaStartCompare}
          <ArrowRight size={17} aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
        <span className="mt-2 text-xs text-[var(--color-text-muted)]">{t.arenaStartCompareHint}</span>

        {/* Secondary entry → FUT collectible-card battle screen (P9-5) */}
        <Link
          href="/cards"
          className="group mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-gold)] bg-[rgba(245,180,60,0.08)] px-4 py-2 text-sm font-semibold text-[var(--color-gold-bright)] transition-colors duration-200 hover:bg-[rgba(245,180,60,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]"
        >
          {t.arenaViewCards}
          <ArrowRight size={15} aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
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

      {/* Generate share card */}
      <motion.div className="mt-6 flex justify-center" {...reveal(0.2)}>
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className={`inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] px-6 py-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-wide text-[var(--color-text)] transition-colors duration-200 hover:bg-[var(--color-surface)] ${FOCUS_RING}`}
        >
          <Share2 size={16} aria-hidden />
          {t.arenaGenerateShareCard}
        </button>
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

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        cats={catsParam}
        showWinner={showWinner}
      />
    </main>
  );
}
