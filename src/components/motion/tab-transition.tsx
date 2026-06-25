"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DURATION, EASE } from "@/lib/motion/tokens";

/**
 * TabTransition — a smooth crossfade for swappable tab/segment content. Keyed by
 * `id`: when the active tab changes, the new panel remounts and fades in cleanly,
 * replacing the old at its natural height — so there is NO layout jump and any
 * `position: sticky` header inside stays anchored to the viewport.
 *
 * Deliberately OPACITY-ONLY (no transform): a lingering `translate` on an
 * ancestor would re-base sticky children to that ancestor and break the
 * sticky-on-scroll header. Reduced-motion → instant swap, no fade.
 *
 * Reusable: the `/` competition tabs + cut switcher use it; `/compare` &
 * `/player` tab panels inherit it.
 */
export function TabTransition({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      key={id}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.morph, ease: EASE.out }}
    >
      {children}
    </motion.div>
  );
}
