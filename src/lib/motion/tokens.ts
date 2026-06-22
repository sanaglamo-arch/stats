/**
 * The single timing language for the whole site (Motion / Design system).
 *
 * Every animation — framer-motion variants, the Lenis momentum scroll, the card
 * bar springs, count-ups, magnetic buttons — reuses these tokens so the product
 * shares one cohesive rhythm and feel (ui-ux-pro-max `motion-consistency`).
 *
 * Constraints baked in:
 *  - eases are custom cubic-béziers; enter is ease-out, exit is faster (≈65%);
 *  - springs are physics-based (ui-ux-pro-max `spring-physics`);
 *  - durations sit in the 150–600ms cinematic band.
 *
 * Pure constants — no React, no DOM — safe to import anywhere.
 */

/** Custom cubic-bézier easings (framer-motion `ease` tuples). */
export const EASE = {
  /** Signature ease-out — strong decelerate, used for entrances. */
  out: [0.16, 1, 0.3, 1],
  /** Symmetric in-out for crossfades / morphs. */
  inOut: [0.65, 0, 0.35, 1],
  /** Quick ease-in for exits (snappier than the enter). */
  in: [0.4, 0, 1, 1],
  /** Expressive overshoot for hero/impact reveals (slight anticipation). */
  impact: [0.34, 1.56, 0.64, 1],
} as const;

/** Durations in SECONDS (framer-motion native unit). */
export const DURATION = {
  micro: 0.18, // hover / press micro-interactions
  fast: 0.26, // small state changes, exits
  base: 0.4, // standard enter
  slow: 0.6, // cinematic hero beats
  morph: 0.32, // card crossfade / content morph
} as const;

/** Durations in MILLISECONDS for non-framer consumers (rAF hooks, CSS). */
export const DURATION_MS = {
  countUp: 900, // stat / score count-up sweep
  morph: 320,
} as const;

/** Physics springs (framer-motion `{ type: "spring", ... }`). */
export const SPRING = {
  /** Card bar fill — lively but settles cleanly, no long tail. */
  bar: { type: "spring", stiffness: 120, damping: 18, mass: 0.9 },
  /** Buttons / press feedback — crisp, fast settle. */
  press: { type: "spring", stiffness: 420, damping: 30 },
  /** Magnetic pointer-follow — soft, trails the cursor then springs back. */
  magnetic: { type: "spring", stiffness: 220, damping: 18, mass: 0.6 },
  /** Hero card entrance — heavier, dramatic arrival. */
  hero: { type: "spring", stiffness: 90, damping: 16, mass: 1.1 },
} as const;

/** Stagger step between sequenced children (seconds). 30–50ms guidance. */
export const STAGGER = 0.08;

/** Lenis momentum-scroll config (single source for the smooth-scroll provider). */
export const LENIS_CONFIG = {
  duration: 1.1,
  /** Custom exponential ease for the inertial glide. */
  easing: (t: number): number => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 1.4,
} as const;
