"use client";

import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/lib/i18n/provider";
import { DURATION, EASE, STAGGER } from "@/lib/motion/tokens";

/**
 * Cinematic hero (first viewport). A staggered reveal — wordmark → matchup
 * title → tagline → scroll cue — using the shared easing/stagger tokens. Only
 * transform + opacity animate. Reduced-motion collapses every variant to the
 * final state instantly (no rise, no stagger, no infinite cue bob).
 *
 * The <h1> keeps "MESSI … RONALDO" intact for the e2e/a11y heading contract.
 */
export function Hero() {
  const { t } = useI18n();
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : STAGGER, delayChildren: reduce ? 0 : 0.1 },
    },
  };
  const item: Variants = reduce
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 28 },
        show: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE.out } },
      };

  return (
    <section className="relative flex min-h-dvh flex-col">
      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-end px-4 pt-6 sm:px-6">
        <LanguageToggle />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-7 px-4 text-center sm:px-6"
      >
        <motion.span
          variants={item}
          className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.4em] sm:text-sm"
          style={{ color: "var(--color-gold)", textShadow: "var(--shadow-glow-gold)" }}
        >
          {t.appName}
        </motion.span>

        {/* Mobile: stack MESSI / vs / RONALDO so the wide Orbitron-black names
            always fit (the page root clips horizontal overflow). sm+ goes back
            to one dramatic inline line. Accessible name stays "MESSI vs RONALDO". */}
        <motion.h1
          variants={item}
          className="flex flex-col items-center gap-1 font-[family-name:var(--font-display)] text-5xl font-black uppercase leading-[0.95] tracking-tight sm:flex-row sm:items-baseline sm:justify-center sm:gap-0 sm:text-7xl lg:text-8xl"
        >
          <span
            style={{ color: "var(--color-messi-bright)", textShadow: "var(--shadow-glow-messi)" }}
          >
            MESSI
          </span>
          <span
            className="text-2xl sm:mx-4 sm:align-middle sm:text-5xl"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t.vs}
          </span>
          <span
            style={{
              color: "var(--color-ronaldo-bright)",
              textShadow: "var(--shadow-glow-ronaldo)",
            }}
          >
            RONALDO
          </span>
        </motion.h1>

        {/* Derby kicker — nation · club per side, tying each legend to a
            footballing nation & dynasty. Mirrors the h1's mobile stacking
            (column → row at sm+). Flags carry alt text; the "×" is decorative.
            Garnet (Barça) / Portugal-green accent tokens tint the rule above
            each label so the palette gains derby depth beyond blue/red. */}
        <motion.div
          variants={item}
          className="-mt-2 flex flex-col items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[var(--color-text-secondary)] sm:flex-row sm:gap-5 sm:text-xs"
        >
          <span className="flex items-center gap-2">
            <Image
              src="/flags/ar.svg"
              alt={t.flagArgentina}
              width={20}
              height={14}
              className="h-3.5 w-5 rounded-[2px] ring-1 ring-[var(--color-border-glass)]"
            />
            <span style={{ borderTop: "2px solid var(--color-messi-accent)" }} className="pt-1">
              {t.derbyMessi}
            </span>
          </span>
          <span aria-hidden className="text-[var(--color-text-muted)]">
            ×
          </span>
          <span className="flex items-center gap-2">
            <span style={{ borderTop: "2px solid var(--color-ronaldo-accent)" }} className="pt-1">
              {t.derbyRonaldo}
            </span>
            <Image
              src="/flags/pt.svg"
              alt={t.flagPortugal}
              width={20}
              height={14}
              className="h-3.5 w-5 rounded-[2px] ring-1 ring-[var(--color-border-glass)]"
            />
          </span>
        </motion.div>

        <motion.p
          variants={item}
          className="max-w-xl text-balance text-base text-[var(--color-text-secondary)] sm:text-lg"
        >
          {t.tagline}
        </motion.p>

        <motion.div
          variants={item}
          className="mt-4 flex flex-col items-center gap-2 text-[var(--color-text-muted)]"
        >
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.22em]">
            {t.scrollCue}
          </span>
          <motion.span
            aria-hidden
            animate={reduce ? undefined : { y: [0, 7, 0] }}
            transition={reduce ? undefined : { duration: 1.8, ease: "easeInOut", repeat: Infinity }}
          >
            <ChevronDown size={20} />
          </motion.span>
        </motion.div>
      </motion.div>
    </section>
  );
}
