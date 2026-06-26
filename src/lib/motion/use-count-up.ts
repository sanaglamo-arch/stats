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

/**
 * On-mount trigger — `false` during SSR / the first client render, then flips to
 * `true` in a mount effect. The shared "play the entrance" gate for the JS-driven
 * numeric primitives (CountUp, AnimatedDelta).
 *
 * ROBUSTNESS (p11-3): unlike an IntersectionObserver gate, this can NEVER leave
 * content stuck hidden — the consumers (useCountUpReveal) render the FINAL value
 * while the gate is `false`, so SSR, no-JS, and "observer never fired" all show
 * the real number; the count-up is a pure enhancement that fires once on mount.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

/**
 * rAF count-up that animates from 0 → `target` ONCE, the first time `active`
 * flips true (the scroll-reveal entrance). Unlike `useCountUp` (which tweens on
 * every value change), this is a single fire-and-settle sweep for figures that
 * "tick up" as they enter the viewport.
 *
 * Hard gates (identical honesty contract to `useCountUp`):
 *  - `active === false` → returns `target` verbatim (pre-reveal shows nothing
 *    animating; callers gate non-numeric «н/д»/«—» BEFORE this hook so they are
 *    never tweened);
 *  - `prefers-reduced-motion` → returns `target` instantly, no frames.
 */
export function useCountUpReveal(target: number, active: boolean): number {
  const reduce = useReducedMotion();
  const animate = active && !reduce;
  const [value, setValue] = useState(target);
  const startedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animate || startedRef.current) {
      if (!animate) setValue(target);
      return;
    }
    startedRef.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION_MS.countUp, 1);
      const eased = cubicBezier(EASE.out, t);
      setValue(target * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [animate, target]);

  return animate ? value : target;
}
