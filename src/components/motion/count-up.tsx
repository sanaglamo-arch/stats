"use client";

import { useCountUpReveal, useMounted } from "@/lib/motion/use-count-up";

/**
 * CountUp — a single numeric figure that ticks up from 0 → `value` once on mount,
 * easing on the shared count-up curve. The reusable "juicy number" primitive for
 * the whole product: the `/` stats grid, and (inherited) `/compare` & `/player`.
 *
 * ROBUSTNESS (p11-3): VISIBLE BY DEFAULT. SSR / the first client render / no-JS
 * all render the FINAL `value` (the count-up only starts after the mount effect),
 * so the number is never blank or stuck. `prefers-reduced-motion` → final value,
 * no frames.
 *
 * Honesty + a11y contract:
 *  - ONLY accepts a real `number`. Non-numeric cells (« н/д », « — ») must be
 *    rendered as plain text by the caller — never passed here — so they are
 *    never tweened or faked into a 0.
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
  const mounted = useMounted();
  const current = useCountUpReveal(value, mounted);

  return <span className={`tabular ${className ?? ""}`}>{format(current)}</span>;
}
