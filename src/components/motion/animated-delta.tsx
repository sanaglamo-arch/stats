"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DURATION, EASE } from "@/lib/motion/tokens";
import { useCountUpReveal, useInView } from "@/lib/motion/use-count-up";

const MESSI = "var(--color-messi-bright)";
const RONALDO = "var(--color-ronaldo-bright)";
const MUTED = "var(--color-text-muted)";

/**
 * AnimatedDelta — the season-table Δ tick. On scroll-into-view the signed value
 * counts up from 0 and the cell flashes the leader's colour (positive = Messi
 * blue, negative = Ronaldo red, 0/null = muted). The reusable "who-won-this-row"
 * micro-beat; `/compare` & `/player` season tables inherit it unchanged.
 *
 * Honesty + reduced-motion:
 *  - `delta === null` (a row where one side did not feature) renders a static
 *    « · » — never a tweened 0.
 *  - reduced-motion → final signed value + final colour, no count, no flash.
 */
export function AnimatedDelta({ delta }: { delta: number | null }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);

  if (delta === null) {
    return <span className="tabular font-black text-[var(--color-text-muted)]">·</span>;
  }

  const sign = Math.sign(delta);
  const color = sign > 0 ? MESSI : sign < 0 ? RONALDO : MUTED;
  const label = delta > 0 ? `+${delta}` : String(delta);

  return (
    <AnimatedDeltaInner
      spanRef={ref}
      magnitude={Math.abs(delta)}
      sign={sign}
      color={color}
      label={label}
      inView={inView}
      reduce={reduce}
    />
  );
}

function AnimatedDeltaInner({
  spanRef,
  magnitude,
  sign,
  color,
  label,
  inView,
  reduce,
}: {
  spanRef: React.RefObject<HTMLSpanElement | null>;
  magnitude: number;
  sign: number;
  color: string;
  label: string;
  inView: boolean;
  reduce: boolean | null;
}) {
  const counted = Math.round(useCountUpReveal(magnitude, inView));
  // While counting, mirror the final sign so it never shows a bare magnitude.
  const text =
    !inView || reduce ? label : sign > 0 ? `+${counted}` : sign < 0 ? `-${counted}` : String(counted);

  return (
    <motion.span
      ref={spanRef}
      className="tabular inline-block font-black"
      style={{ color }}
      initial={false}
      animate={
        reduce || !inView
          ? { scale: 1, textShadow: "0 0 0px transparent" }
          : {
              scale: [1.22, 1],
              textShadow: [
                `0 0 14px color-mix(in srgb, ${color} 75%, transparent)`,
                "0 0 0px transparent",
              ],
            }
      }
      transition={{ duration: DURATION.slow, ease: EASE.out }}
    >
      {text}
    </motion.span>
  );
}
