"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { useCountUp } from "@/lib/motion/use-count-up";
import { SPRING } from "@/lib/motion/tokens";
import { formatStatValue } from "./card-labels";
import type { CardStatKey } from "@/lib/data";

/**
 * Card animation primitives. ALL of them are no-ops unless `animated` is true,
 * and `animated` is only passed by the live preview — never by the headless
 * /render/card PNG route. When `animated` is false each one renders EXACTLY the
 * original static markup, so the deterministic PNG output is byte-for-byte
 * unchanged.
 *
 * Everything animates transform / opacity / filter only (60fps).
 */

/**
 * The coloured bar fill. Static branch = the original plain <div> (same class,
 * same inline style → identical pixels). Animated branch springs `scaleX` from
 * 0→1 with the transform-origin pinned to the centre meeting edge so the bar
 * grows OUT of the centre divider (never animates width).
 */
export function AnimatedBarFill({
  className,
  style,
  direction,
  animated,
}: {
  className?: string;
  style: CSSProperties;
  direction: "ltr" | "rtl";
  animated: boolean;
}) {
  const reduce = useReducedMotion();
  if (!animated || reduce) {
    return <div className={className} style={style} />;
  }
  // rtl bars (Messi, left of centre) meet the divider on their RIGHT edge;
  // ltr bars (Ronaldo) meet it on their LEFT edge.
  const transformOrigin = direction === "rtl" ? "right center" : "left center";
  return (
    <motion.div
      className={className}
      style={{ ...style, transformOrigin }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={SPRING.bar}
    />
  );
}

/**
 * A stat / score value. Static branch returns the exact formatted string the
 * card always showed. Animated branch rAF-counts up to the value and formats
 * each frame (reduced-motion handled inside `useCountUp`).
 *
 * `statKey` present → use the stat formatter (handles %, thousands, decimals).
 * `statKey` absent → an integer score (the OVERALL result digits).
 */
export function CountUpValue({
  value,
  decimals,
  statKey,
  animated,
}: {
  value: number;
  decimals: number;
  statKey?: CardStatKey;
  animated: boolean;
}) {
  const current = useCountUp(value, animated);
  if (statKey) return <>{formatStatValue(statKey, current, decimals)}</>;
  return <>{Math.round(current)}</>;
}

/**
 * Soft pulsing neon glow layered over the card (animated preview only). Subtle,
 * infinite opacity/transform breathing — no layout, no width/height. Absolutely
 * positioned + pointer-events-none so it never blocks the controls beneath.
 */
export function CardPulse() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-0"
      style={{
        background:
          "radial-gradient(50% 40% at 22% 30%, rgba(47,107,255,0.18), transparent 70%)," +
          "radial-gradient(50% 40% at 78% 30%, rgba(225,29,60,0.18), transparent 70%)",
        mixBlendMode: "screen",
      }}
      initial={{ opacity: 0.45 }}
      animate={{ opacity: [0.45, 0.85, 0.45], scale: [1, 1.02, 1] }}
      transition={{ duration: 4.5, ease: "easeInOut", repeat: Infinity }}
    />
  );
}
