"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/i18n/provider";
import { DURATION, EASE } from "@/lib/motion/tokens";

/**
 * The VS ENERGY CLASH (DESIGN §3.4): a gold-rimmed glass medallion at the centre
 * of the render-clash, framed by the energy event — the conic/radial burst
 * (.arena-vs-burst), an expanding gold shockwave ring (.vs-shockwave, slow loop),
 * and the lit red↔blue lightning seam (.vs-seam) where the two colour fields
 * collide. On entrance the medallion plays a single `vs-flash` (scale + brightness
 * pop), never looping. All motion is gated by prefers-reduced-motion (the global
 * reduce block freezes the shockwave, drops the flash and stills the seam glow).
 *
 * `compact` shrinks the medallion + frame for the mobile stack (DESIGN §3.6).
 */
export function VsMedallion({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const reduce = useReducedMotion();

  return (
    <div className="relative flex items-center justify-center" aria-hidden>
      {/* the lit collision seam — the cheapest, highest-impact clash signal */}
      <span className="vs-seam" />
      {/* the energy burst — static conic/radial bloom behind the medallion */}
      <div className="arena-vs-burst" />
      {/* the shockwave ring — slow expanding pulse (frozen under reduced-motion) */}
      <span className="vs-shockwave" />

      {/* Medallion */}
      <motion.div
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={reduce ? undefined : { scale: 1, opacity: 1 }}
        transition={{ duration: DURATION.slow, ease: EASE.impact }}
        className={`relative flex items-center justify-center rounded-full border ${
          compact ? "h-16 w-16" : "h-20 w-20 sm:h-28 sm:w-28"
        }`}
        style={{
          borderColor: "color-mix(in srgb, var(--color-gold) 70%, transparent)",
          background: "radial-gradient(closest-side, rgba(12,19,34,0.96), rgba(7,11,22,0.9))",
          boxShadow: "0 0 36px rgba(245,180,60,0.55), inset 0 0 18px rgba(245,180,60,0.25)",
          animation: reduce ? undefined : "vs-flash 0.5s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        <span
          className={`font-[family-name:var(--font-display)] font-black tracking-tight text-glow-gold ${
            compact ? "text-3xl" : "text-3xl sm:text-5xl"
          }`}
          style={{ color: "var(--color-gold-bright)" }}
        >
          {t.vs}
        </span>
      </motion.div>
    </div>
  );
}
