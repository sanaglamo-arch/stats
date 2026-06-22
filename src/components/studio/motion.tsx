"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * Shared Studio motion primitives (SPEC §10 — framer-motion is UI-only; the
 * ComparisonCard / /render/card stay animation-free). Every variant animates
 * transform + opacity only and is guarded by `useReducedMotion()`: when the user
 * prefers reduced motion we collapse to a no-op so layout never animates.
 *
 * Timings follow the ui-ux-pro-max guidance: 150–300ms, ease-out enter, a gentle
 * stagger for entering groups.
 */

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Container that staggers the entrance of its <Stagger.Item> children. */
const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
};

export function StaggerGroup({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduce ? undefined : containerVariants}
      initial={reduce ? false : "hidden"}
      animate={reduce ? undefined : "show"}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} variants={reduce ? undefined : itemVariants}>
      {children}
    </motion.div>
  );
}

/** Simple ease-out fade+rise used for a single block (e.g. the preview column). */
export function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
