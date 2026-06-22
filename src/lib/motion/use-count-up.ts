"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { DURATION_MS, EASE } from "./tokens";

/** Evaluate a cubic-bézier easing at progress `t` ∈ [0,1] (Newton solve). */
function cubicBezier([x1, y1, x2, y2]: readonly number[], t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const bx = (u: number) => 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
  const by = (u: number) => 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  let u = t;
  for (let i = 0; i < 5; i += 1) {
    const x = bx(u) - t;
    const dx =
      3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);
    if (Math.abs(dx) < 1e-5) break;
    u -= x / dx;
  }
  return by(u);
}

/**
 * rAF-based count-up. Animates a number from its previous value to `target`
 * whenever `target` changes, easing with the shared `EASE.out` curve over the
 * shared count-up duration.
 *
 * Hard gates (so the static PNG and reduced-motion users see the final number
 * instantly, no animation frames at all):
 *  - `enabled === false` → returns `target` verbatim, no rAF loop.
 *  - `prefers-reduced-motion` → same.
 */
export function useCountUp(target: number, enabled: boolean): number {
  const reduce = useReducedMotion();
  const active = enabled && !reduce;
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setValue(target);
      return;
    }
    const from = fromRef.current;
    if (from === target) return;

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION_MS.countUp, 1);
      const eased = cubicBezier(EASE.out, t);
      const next = from + (target - from) * eased;
      setValue(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, active]);

  // Keep the "from" anchor current when animation is disabled.
  useEffect(() => {
    if (!active) fromRef.current = target;
  }, [active, target]);

  return active ? value : target;
}
