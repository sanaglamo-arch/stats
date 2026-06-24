"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n/provider";
import { DURATION, EASE } from "@/lib/motion/tokens";

/**
 * The glowing VS medallion with an energy-flash burst (the arena centrepiece).
 * The burst is a STATIC neon bloom (no rotation — a spinning gradient read as a
 * cringe rotating square). The only motion is the medallion's one-shot scale-in
 * entrance, which collapses under prefers-reduced-motion. The "VS" never moves.
 */
export function VsMedallion() {
  const { t } = useI18n();
  const reduce = useReducedMotion();

  return (
    <div className="relative flex items-center justify-center" aria-hidden>
      {/* Energy-flash burst — static radial/conic bloom, no animation. */}
      <div className="arena-vs-burst" />

      {/* Medallion */}
      <motion.div
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={reduce ? undefined : { scale: 1, opacity: 1 }}
        transition={{ duration: DURATION.slow, ease: EASE.impact }}
        className="relative flex h-20 w-20 items-center justify-center rounded-full border sm:h-24 sm:w-24"
        style={{
          borderColor: "color-mix(in srgb, var(--color-gold) 70%, transparent)",
          background:
            "radial-gradient(closest-side, rgba(12,19,34,0.96), rgba(7,11,22,0.9))",
          boxShadow:
            "0 0 36px rgba(245,180,60,0.55), inset 0 0 18px rgba(245,180,60,0.25)",
        }}
      >
        <span
          className="font-[family-name:var(--font-display)] text-3xl font-black tracking-tight text-glow-gold sm:text-4xl"
          style={{ color: "var(--color-gold-bright)" }}
        >
          {t.vs}
        </span>
      </motion.div>
    </div>
  );
}
