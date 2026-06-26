"use client";

import { motion } from "framer-motion";
import { DURATION, EASE } from "@/lib/motion/tokens";
import { useCountUpReveal, useMounted } from "@/lib/motion/use-count-up";

const MESSI = "var(--color-messi-bright)";
const RONALDO = "var(--color-ronaldo-bright)";
const MUTED = "var(--color-text-muted)";

/**
 * AnimatedDelta — the season-table Δ tick. On mount the signed value counts up
 * from 0 and the cell flashes the leader's colour (positive = Messi blue,
 * negative = Ronaldo red, 0/null = muted). The reusable "who-won-this-row"
 * micro-beat; `/compare` & `/player` season tables inherit it unchanged.
 *
 * ROBUSTNESS (p11-3): VISIBLE BY DEFAULT. Before the mount effect (SSR / no-JS)
 * the FINAL signed value is rendered at full opacity/scale — the count + flash
 * are a pure enhancement, so the figure is never blank or stuck.
 *
 * Honesty:
 *  - `delta === null` (a row where one side did not feature) renders a static
 *    « · » — never a tweened 0.
 */
export function AnimatedDelta({ delta }: { delta: number | null }) {
  const mounted = useMounted();

  // Hooks above the early return so order is stable; the inner count is gated
  // by `mounted` AND a real (non-null) magnitude.
  const counted = Math.round(useCountUpReveal(delta === null ? 0 : Math.abs(delta), mounted));

  if (delta === null) {
    return <span className="tabular font-black text-[var(--color-text-muted)]">·</span>;
  }

  const sign = Math.sign(delta);
  const color = sign > 0 ? MESSI : sign < 0 ? RONALDO : MUTED;
  const label = delta > 0 ? `+${delta}` : String(delta);
  // While counting, mirror the final sign so it never shows a bare magnitude.
  const text = !mounted ? label : sign > 0 ? `+${counted}` : sign < 0 ? `-${counted}` : String(counted);

  return (
    <motion.span
      className="tabular inline-block font-black"
      style={{ color }}
      initial={false}
      animate={
        mounted
          ? {
              scale: [1.22, 1],
              textShadow: [
                `0 0 14px color-mix(in srgb, ${color} 75%, transparent)`,
                "0 0 0px transparent",
              ],
            }
          : { scale: 1, textShadow: "0 0 0px transparent" }
      }
      transition={{ duration: DURATION.slow, ease: EASE.out }}
    >
      {text}
    </motion.span>
  );
}
