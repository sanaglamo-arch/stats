"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { DURATION, EASE, STAGGER } from "@/lib/motion/tokens";
import { CATEGORY_ICONS } from "./arena-icons";
import {
  MIN_CATEGORIES,
  serializeCategoryParam,
  type ArenaCategory,
  type CategoryKey,
} from "./arena-model";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]";

/** One-line hint per category (keys mirrored in en+ru). */
const HINT_KEYS: Record<CategoryKey, keyof Dictionary> = {
  goals: "compareHintGoals",
  assists: "compareHintAssists",
  trophies: "compareHintTrophies",
  ballonDor: "compareHintBallonDor",
  championsLeague: "compareHintChampionsLeague",
  worldCup: "compareHintWorldCup",
  playmaking: "compareHintPlaymaking",
  longevity: "compareHintLongevity",
};

/**
 * CATEGORY SELECTION (P9-3) — the guided flow's first step. A grid of glass
 * category cards, each a real checkbox the user toggles to INCLUDE. Defaults to
 * all selected; a sensible minimum (≥{@link MIN_CATEGORIES}) is enforced. The
 * prominent "Start Comparison" CTA round-trips the selection into
 * `/verdict?cats=<keys>`. Pure UI state — the winners live in the server model.
 */
export function CompareSelector({ categories }: { categories: ArenaCategory[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const reduce = useReducedMotion();

  const allKeys = useMemo(() => categories.map((c) => c.key), [categories]);
  const [selected, setSelected] = useState<Set<CategoryKey>>(() => new Set(allKeys));

  const count = selected.size;
  const canStart = count >= MIN_CATEGORIES;

  function toggle(key: CategoryKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(allKeys));
  }

  function clear() {
    setSelected(new Set());
  }

  function start() {
    if (!canStart) return;
    const ordered = allKeys.filter((k) => selected.has(k));
    router.push(`/verdict?cats=${serializeCategoryParam(ordered)}`);
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
    <main className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      {/* Header */}
      <motion.header className="mb-8 flex flex-col items-center text-center" {...reveal(0)}>
        <Link
          href="/"
          className={`mb-4 inline-flex items-center gap-1.5 self-start rounded-full border border-[var(--color-border-glass)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors duration-200 hover:text-[var(--color-text)] ${FOCUS_RING}`}
        >
          <ArrowLeft size={14} aria-hidden />
          {t.compareBackToArena}
        </Link>
        <span className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.32em] text-[var(--color-gold)]">
          {t.compareKicker}
        </span>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">
          <span className="bg-gradient-to-b from-white to-[var(--color-text-secondary)] bg-clip-text text-transparent">
            {t.compareTitle}
          </span>
        </h1>
        <p className="mt-3 max-w-md text-sm text-[var(--color-text-secondary)] sm:text-base">
          {t.compareSubtitle.replace("{min}", String(MIN_CATEGORIES))}
        </p>
      </motion.header>

      {/* Quick actions */}
      <motion.div
        className="mb-4 flex flex-wrap items-center justify-between gap-3"
        {...reveal(0.06)}
      >
        <span
          className="tabular text-sm font-semibold tabular-nums text-[var(--color-text-secondary)]"
          aria-live="polite"
        >
          {t.compareSelectedCount.replace("{n}", String(count))}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className={`rounded-full border border-[var(--color-border-glass)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors duration-200 hover:text-[var(--color-text)] ${FOCUS_RING}`}
          >
            {t.compareSelectAll}
          </button>
          <button
            type="button"
            onClick={clear}
            className={`rounded-full border border-[var(--color-border-glass)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors duration-200 hover:text-[var(--color-text)] ${FOCUS_RING}`}
          >
            {t.compareClear}
          </button>
        </div>
      </motion.div>

      {/* Category grid */}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {categories.map((cat, i) => {
          const Icon = CATEGORY_ICONS[cat.icon];
          const isOn = selected.has(cat.key);
          return (
            <motion.li key={cat.key} {...reveal(0.1 + i * STAGGER * 0.5)}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isOn}
                aria-label={t.compareIncludeCategory.replace("{category}", t[cat.labelKey])}
                onClick={() => toggle(cat.key)}
                className={`group relative flex h-full w-full flex-col items-center gap-2 rounded-[var(--radius-md)] border p-4 text-center transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 ${FOCUS_RING}`}
                style={{
                  borderColor: isOn
                    ? "color-mix(in srgb, var(--color-gold) 60%, transparent)"
                    : "var(--color-border-glass)",
                  background: isOn
                    ? "color-mix(in srgb, var(--color-gold) 10%, var(--color-surface))"
                    : "var(--color-surface)",
                  boxShadow: isOn
                    ? "inset 0 0 0 1px color-mix(in srgb, var(--color-gold) 40%, transparent), 0 0 24px color-mix(in srgb, var(--color-gold) 18%, transparent)"
                    : "none",
                }}
              >
                {/* Selected check badge */}
                <span
                  aria-hidden
                  className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full transition-opacity duration-200"
                  style={{
                    background: isOn ? "var(--color-gold)" : "transparent",
                    border: isOn
                      ? "none"
                      : "1.5px solid var(--color-border-strong)",
                    opacity: isOn ? 1 : 0.6,
                  }}
                >
                  {isOn ? (
                    <Check size={13} strokeWidth={3} style={{ color: "var(--color-bg-base)" }} />
                  ) : null}
                </span>

                <Icon
                  size={28}
                  aria-hidden
                  strokeWidth={1.75}
                  style={{ color: isOn ? "var(--color-gold)" : "var(--color-text-secondary)" }}
                />
                <span className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-tight text-[var(--color-text)]">
                  {t[cat.labelKey]}
                </span>
                <span className="text-[11px] leading-snug text-[var(--color-text-muted)]">
                  {t[HINT_KEYS[cat.key]]}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>

      {/* Footer CTA */}
      <motion.div className="mt-8 flex flex-col items-center gap-3" {...reveal(0.2)}>
        {!canStart ? (
          <p className="text-xs font-medium text-[var(--color-ronaldo-bright)]" role="alert">
            {t.compareMinNotice.replace("{min}", String(MIN_CATEGORIES))}
          </p>
        ) : null}
        <button
          type="button"
          onClick={start}
          disabled={!canStart}
          className={`inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-[family-name:var(--font-display)] text-base font-bold uppercase tracking-wide transition-[transform,box-shadow,opacity] duration-200 enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 ${FOCUS_RING}`}
          style={{
            background: "linear-gradient(135deg, var(--color-gold-bright), var(--color-gold))",
            color: "var(--color-bg-base)",
            boxShadow: canStart ? "0 8px 28px color-mix(in srgb, var(--color-gold) 40%, transparent)" : "none",
          }}
        >
          {t.compareStart}
          <ArrowRight size={18} aria-hidden />
        </button>
      </motion.div>
    </main>
  );
}
