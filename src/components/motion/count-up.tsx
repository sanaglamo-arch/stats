"use client";

import { useRef } from "react";
import { useCountUpReveal, useInView } from "@/lib/motion/use-count-up";

/**
 * CountUp — a single numeric figure that ticks up from 0 → `value` the first
 * time it scrolls into view (IntersectionObserver), easing on the shared
 * count-up curve. The reusable "juicy number" primitive for the whole product:
 * the `/` stats grid, and (inherited) the future `/compare` and `/player` views.
 *
 * Honesty + a11y contract:
 *  - ONLY accepts a real `number`. Non-numeric cells (« н/д », « — ») must be
 *    rendered as plain text by the caller — never passed here — so they are
 *    never tweened or faked into a 0.
 *  - `prefers-reduced-motion` (and SSR / no-IntersectionObserver) → the final
 *    `value` is shown instantly, no animation frames.
 *  - `format` controls the rendered string (locale digits, %, decimals) and is
 *    applied to the IN-PROGRESS value each frame, so the format never jumps.
 *  - `tabular` numerals are always on, so the width never reflows mid-count.
 */
export function CountUp({
  value,
  format,
  className,
}: {
  value: number;
  /** Render the (possibly fractional, mid-tween) number → display string. */
  format: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  const current = useCountUpReveal(value, inView);

  return (
    <span ref={ref} className={`tabular ${className ?? ""}`}>
      {format(current)}
    </span>
  );
}
