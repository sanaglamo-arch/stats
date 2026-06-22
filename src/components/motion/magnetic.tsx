"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { SPRING } from "@/lib/motion/tokens";

/**
 * Magnetic pointer-follow wrapper (micro-interaction). The child translates a
 * small amount toward the cursor while hovering, then springs back to center on
 * leave. Spring physics use the shared `SPRING.magnetic` token.
 *
 * Pointer-only + reduced-motion safe:
 *  - skipped on coarse/touch pointers (pointer events that aren't a mouse);
 *  - skipped entirely under `prefers-reduced-motion` (renders a plain wrapper).
 *
 * Renders an inline-flex span so it can wrap a single button without affecting
 * layout; it does not intercept clicks (pointer events pass through to the
 * child).
 */
export function Magnetic({
  children,
  radius = 14,
  className,
}: {
  children: ReactNode;
  /** Max translate in px the element drifts toward the cursor. */
  radius?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING.magnetic);
  const sy = useSpring(y, SPRING.magnetic);

  if (reduce) {
    return <span className={className}>{children}</span>;
  }

  const onMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    // Normalize against half-size so the pull is proportional within bounds.
    x.set(Math.max(-1, Math.min(1, dx / (rect.width / 2))) * radius);
    y.set(Math.max(-1, Math.min(1, dy / (rect.height / 2))) * radius);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      ref={ref}
      className={`inline-flex ${className ?? ""}`}
      style={{ x: sx, y: sy }}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.span>
  );
}
