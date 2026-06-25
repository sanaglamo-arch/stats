/**
 * Motion / animation primitives — the reusable, reduced-motion-safe design
 * system every view inherits (`/`, and the future `/compare` & `/player`).
 *
 * All animate transform/opacity only and honour `prefers-reduced-motion`.
 *  - CountUp        · a number ticks 0→value on scroll-into-view (numeric only).
 *  - AnimatedBar    · divergent H2H bar grows from the centre seam (Messi L / Ronaldo R).
 *  - AnimatedDelta  · season Δ ticks up + flashes the leader colour.
 *  - Reveal / Stagger… · section + row entrance on scroll-into-view, with cascade.
 *  - TabTransition  · opacity-only tab-content crossfade (sticky-safe, no jump).
 *  - Magnetic       · pointer-follow micro-interaction (existing).
 */
export { CountUp } from "./count-up";
export { AnimatedBar } from "./animated-bar";
export { AnimatedDelta } from "./animated-delta";
export { Reveal, StaggerGroup, StaggerItem, riseVariants, staggerContainer } from "./reveal";
export { TabTransition } from "./tab-transition";
export { Magnetic } from "./magnetic";
