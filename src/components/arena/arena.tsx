"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Share2 } from "lucide-react";
import { PLAYER_META } from "@/components/card/player-meta";
import { useI18n } from "@/lib/i18n/provider";
import { DURATION, EASE } from "@/lib/motion/tokens";
import { ShareModal } from "@/components/share/share-modal";
import {
  CATEGORY_KEYS,
  MIN_CATEGORIES,
  parseCategoryParam,
  selectVerdict,
  serializeCategoryParam,
  type ArenaModel,
  type CategoryKey,
} from "./arena-model";
import { Atmosphere } from "./atmosphere";
import { RenderHero } from "./render-hero";
import { VsMedallion } from "./vs-medallion";
import { ScoreBand } from "./score-band";
import { CategoryBreakdown } from "./category-breakdown";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]";

/**
 * VERDICT ARENA — the whole product on one screen (Phase 10, DESIGN §6.1 over
 * UX.md §4). The floodlit atmosphere sits behind everything; the render-clash
 * hero (two near-full-height duotone figures facing the VS energy clash) carries
 * the score band as the above-the-fold answer; the category breakdown below
 * merges the old /verdict evidence + the old /compare selection; the single gold
 * "SHARE VERDICT" CTA opens the share sheet. State lives in the URL (?cats=,
 * ?share=1) so links are lossless. Reuses the server-built ArenaModel +
 * selectVerdict — this is a re-skin/restructure, not a data change.
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

  const [showWinner, setShowWinner] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  // The set of categories counted in the score. Default: all. A deep-linked
  // ?cats= refines it (validated → min-count fallback by parseCategoryParam).
  const [selected, setSelected] = useState<Set<CategoryKey>>(() => new Set(CATEGORY_KEYS));

  // Whether the initial deep-link read has run; the URL-sync effect waits for it
  // so it never clobbers an inbound ?cats= before it is applied to state.
  const hydrated = useRef(false);

  // Deep link: /?cats=… restores the selection; /?share=1 auto-opens the sheet.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cats = params.get("cats");
    if (cats) setSelected(new Set(parseCategoryParam(cats)));
    if (params.get("share") === "1") setShareOpen(true);
    hydrated.current = true;
  }, []);

  const selectedKeys = useMemo(
    () => CATEGORY_KEYS.filter((k) => selected.has(k)),
    [selected],
  );
  const catsParam = useMemo(() => serializeCategoryParam(selectedKeys), [selectedKeys]);

  // Recompute the verdict over EXACTLY the counted categories (reuses the model).
  const { verdict } = useMemo(() => selectVerdict(model, selectedKeys), [model, selectedKeys]);

  // Keep ?cats= in the URL in sync (shallow, no navigation) so the link is
  // shareable. Skips until the inbound deep-link has been read (above).
  useEffect(() => {
    if (!hydrated.current) return;
    const url = new URL(window.location.href);
    if (selectedKeys.length === CATEGORY_KEYS.length) url.searchParams.delete("cats");
    else url.searchParams.set("cats", catsParam);
    window.history.replaceState(null, "", url.toString());
  }, [catsParam, selectedKeys.length]);

  // Toggle a category in/out of the score, enforcing the min-count floor: never
  // drop below MIN_CATEGORIES (the last few stay locked on, mirroring the parser).
  const toggleCategory = useCallback((key: CategoryKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= MIN_CATEGORIES) return prev; // floor reached — no-op
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const reveal = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: DURATION.base, ease: EASE.out, delay },
        };

  const sideReveal = (from: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, x: from },
          animate: { opacity: 1, x: 0 },
          transition: { duration: DURATION.slow, ease: EASE.out, delay: 0.08 },
        };

  return (
    <>
      <Atmosphere />

      <main className="relative z-10 mx-auto w-full max-w-6xl overflow-x-clip px-4 pb-20 pt-5 sm:px-6 sm:pt-8">
        {/* A. Top bar — wordmark + trust line */}
        <motion.header className="mb-2 text-center" {...reveal(0)}>
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.5rem,6vw,5rem)] uppercase leading-[0.95] tracking-[0.04em]">
            <span className="text-glow-gold" style={{ color: "var(--color-gold-bright)" }}>
              {t.arenaTitleGoat}
            </span>{" "}
            <span className="bg-gradient-to-b from-white to-[var(--color-text-secondary)] bg-clip-text text-transparent">
              {t.arenaTitleArena}
            </span>
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-xs text-[var(--color-text-muted)] sm:text-[0.8rem]">
            {t.arenaTrustLine.replace("{date}", accurateDate)}
          </p>
        </motion.header>

        {/* B. The clash hero — two full-height duotone renders facing the VS, the
            score band overlapping lower-centre. Full-bleed to the viewport edges
            (breaks out of the max-w container) so the figures bleed off-screen. */}
        <section
          className="relative left-1/2 grid w-screen max-w-[100vw] -translate-x-1/2 grid-cols-[1fr_auto_1fr] items-stretch gap-1 sm:gap-2"
          style={{ minHeight: "clamp(360px, 62vh, 720px)" }}
          aria-label={t.arenaSubtitle}
        >
          {/* BOSS O1 — Messi render LEFT (faces right), bleeds off the left edge */}
          <motion.div className="relative -ml-[6vw] min-w-0 lg:-ml-[7vw]" {...sideReveal(-24)}>
            <RenderHero id="messi" />
            <PlayerChip id="messi" align="left" />
          </motion.div>

          {/* VS energy clash, centred */}
          <div className="relative flex items-center justify-center self-center px-1 sm:px-2">
            <VsMedallion />
          </div>

          {/* BOSS O1 — Ronaldo render RIGHT (faces left), bleeds off the right edge */}
          <motion.div className="relative -mr-[6vw] min-w-0 lg:-mr-[7vw]" {...sideReveal(24)}>
            <RenderHero id="ronaldo" />
            <PlayerChip id="ronaldo" align="right" />
          </motion.div>

          {/* Verdict score band — overlaps the lower-centre of the clash */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-2 sm:px-4">
            <div className="pointer-events-auto w-full">
              <ScoreBand verdict={verdict} showWinner={showWinner} />
            </div>
          </div>
        </section>

        {/* C+D. Category breakdown (evidence + selection) + winner toggle */}
        <motion.div className="mt-12 sm:mt-16" {...reveal(0.16)}>
          <CategoryBreakdown
            categories={model.categories}
            selected={selected}
            showWinner={showWinner}
            onToggleWinner={setShowWinner}
            onToggleCategory={toggleCategory}
          />
        </motion.div>

        {/* E. The single primary CTA — SHARE VERDICT */}
        <motion.div className="mt-8 flex justify-center" {...reveal(0.22)}>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className={`group inline-flex min-h-12 w-full max-w-md items-center justify-center gap-2.5 rounded-[var(--radius-md)] px-8 py-4 font-[family-name:var(--font-display)] text-base font-bold uppercase tracking-[0.04em] transition-transform duration-150 hover:-translate-y-px active:scale-[0.97] ${FOCUS_RING}`}
            style={{
              background: "linear-gradient(135deg, var(--color-gold-bright), var(--color-gold))",
              color: "var(--color-bg-base)",
              boxShadow: "var(--glow-cta)",
            }}
          >
            <Share2 size={18} aria-hidden />
            {t.arenaShareVerdict}
          </button>
        </motion.div>

        {/* F. Footer trust line */}
        <p className="mt-8 text-center text-xs text-[var(--color-text-muted)]">{t.arenaScope}</p>
      </main>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        cats={catsParam}
        showWinner={showWinner}
      />
    </>
  );
}

/**
 * The player identity chip at the base of each render (name · flag · nation),
 * tinted the player's accent, on a faint glass chip. Whole chip links to the
 * off-path profile (/player/[id]).
 */
function PlayerChip({ id, align }: { id: "ronaldo" | "messi"; align: "left" | "right" }) {
  const { t } = useI18n();
  const meta = PLAYER_META[id];
  const accent = `var(${meta.accentVar})`;
  const nationAlt = id === "messi" ? t.flagArgentina : t.flagPortugal;

  return (
    <Link
      href={`/player/${id}`}
      aria-label={t.arenaToProfile.replace("{name}", meta.name)}
      className={`glass absolute bottom-[14%] z-10 inline-flex max-w-[88%] flex-col gap-1 rounded-[var(--radius-md)] px-3 py-2 transition-[transform,box-shadow] duration-200 hover:-translate-y-px ${FOCUS_RING} ${
        align === "left" ? "left-[8%] items-start text-left" : "right-[8%] items-end text-right"
      }`}
      style={{ borderColor: `color-mix(in srgb, ${accent} 45%, var(--color-border-glass))` }}
    >
      <span
        className="font-[family-name:var(--font-display)] text-lg font-bold uppercase leading-none tracking-[0.03em] sm:text-2xl"
        style={{ color: id === "ronaldo" ? "var(--color-ronaldo-bright)" : "var(--color-messi-bright)" }}
      >
        {meta.name}
      </span>
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)] sm:text-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/flags/${meta.countryCode}.svg`} alt={nationAlt} width={18} height={13} className="rounded-[2px]" />
        {meta.nationality}
      </span>
    </Link>
  );
}
