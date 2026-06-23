"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useI18n } from "@/lib/i18n/provider";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-triggered "Verdict" beat — a product-relevant band that reframes the
 * card as the way to settle the debate. Three parallax depth layers (two accent
 * auras + the text) drift at different rates against the scroll for a sense of
 * depth, synced to the Lenis-smoothed scroll via ScrollTrigger.
 *
 * Reduced-motion: no ScrollTrigger is created at all (the band renders static),
 * and the live media query is watched so toggling re-evaluates.
 */
export function VerdictBand() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const messiAuraRef = useRef<HTMLDivElement>(null);
  const ronaldoAuraRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce) return;
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const base = {
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      } as const;
      gsap.fromTo(
        messiAuraRef.current,
        { yPercent: -18 },
        { yPercent: 18, ease: "none", scrollTrigger: base },
      );
      gsap.fromTo(
        ronaldoAuraRef.current,
        { yPercent: 14 },
        { yPercent: -14, ease: "none", scrollTrigger: base },
      );
      gsap.fromTo(
        textRef.current,
        { yPercent: 8, opacity: 0.65 },
        {
          yPercent: -8,
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top bottom", end: "center center", scrub: true },
        },
      );
    }, root);

    return () => ctx.revert();
  }, [reduce]);

  return (
    <section
      ref={rootRef}
      className="relative flex min-h-[80dvh] items-center justify-center overflow-hidden px-4 py-24 sm:px-6"
    >
      <div
        ref={messiAuraRef}
        aria-hidden
        className="pointer-events-none absolute left-[-10%] top-[-10%] h-[70%] w-[60%] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(47,107,255,0.32), transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      <div
        ref={ronaldoAuraRef}
        aria-hidden
        className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[70%] w-[60%] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(225,29,60,0.32), transparent 70%)",
          filter: "blur(70px)",
        }}
      />

      <div ref={textRef} className="relative z-10 mx-auto max-w-2xl text-center">
        <span
          className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-[0.4em]"
          style={{ color: "var(--color-gold)" }}
        >
          {t.verdictKicker}
        </span>
        <h2 className="mt-5 font-[family-name:var(--font-display)] text-4xl font-black uppercase tracking-tight sm:text-6xl">
          {t.verdictTitle}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
          {t.verdictBody}
        </p>
      </div>
    </section>
  );
}
