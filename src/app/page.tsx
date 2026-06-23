"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Hero } from "@/components/home/hero";
import { VerdictBand } from "@/components/home/verdict-band";
import { Studio } from "@/components/studio/studio";
import { useI18n } from "@/lib/i18n/provider";
import { DURATION, EASE, SPRING } from "@/lib/motion/tokens";

/**
 * The cinematic homepage — a scrollable experience with depth (Motion system).
 *
 *   1. Hero        — staggered reveal of the matchup, premium easing.
 *   2. Studio      — the card is the dramatic centrepiece; arrives with impact
 *                    (spring) as it scrolls into view. The full functional
 *                    Studio (controls, preview, Download/Share, RU/EN, mobile
 *                    sheet) lives here, fully reachable.
 *   3. VerdictBand — scroll-triggered parallax depth beat ("settle the debate").
 *   4. Footer.
 *
 * The ambient dual-accent aura sits behind everything (static CSS). All motion
 * is transform/opacity-only and collapses under prefers-reduced-motion; the
 * Lenis momentum scroll (in the layout) is likewise disabled there.
 */
export default function HomePage() {
  const { t } = useI18n();
  const reduce = useReducedMotion();

  return (
    <div className="relative overflow-hidden">
      <div className="studio-aura-fixed" aria-hidden />

      <Hero />

      <main id="studio" className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
        <motion.header
          className="mb-10 flex flex-col items-center gap-2 text-center"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: DURATION.base, ease: EASE.out }}
        >
          <span
            className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.4em]"
            style={{ color: "var(--color-gold)" }}
          >
            {t.studioKicker}
          </span>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-black uppercase tracking-tight sm:text-4xl">
            {t.studioTitle}
          </h2>
        </motion.header>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={SPRING.hero}
        >
          <Studio />
        </motion.div>
      </main>

      <VerdictBand />
    </div>
  );
}
