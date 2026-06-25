"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { DURATION, EASE, STAGGER } from "@/lib/motion/tokens";

/**
 * Scroll-reveal primitives — the shared entrance language for the whole product
 * (sections, cards, table rows). Everything animates transform + opacity only,
 * fires once on scroll-into-view, and collapses to a plain wrapper under
 * `prefers-reduced-motion`. `/compare` & `/player` inherit these unchanged.
 */

const VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;

/** Shared "rise + fade" item variants — reused by div items AND table rows. */
export const riseVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.morph, ease: EASE.out } },
};

/** Container variants that stagger their children's `riseVariants`. */
export function staggerContainer(step: number = STAGGER): Variants {
  return { hidden: {}, show: { transition: { staggerChildren: step } } };
}

/**
 * Reveal — a single block that fades + rises into view on first scroll-into-view.
 * Replaces the old on-mount `Reveal` so content lower on the page animates as the
 * reader reaches it (not all at once on load).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: DURATION.morph, ease: EASE.out, delay }}
    >
      {children}
    </motion.div>
  );
}

/** StaggerGroup — reveals its `StaggerItem` children in a cascade on scroll-in. */
export function StaggerGroup({
  children,
  className,
  step = STAGGER,
}: {
  children: ReactNode;
  className?: string;
  step?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      variants={staggerContainer(step)}
    >
      {children}
    </motion.div>
  );
}

/** One staggered child of a `StaggerGroup`. */
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={riseVariants}>
      {children}
    </motion.div>
  );
}
