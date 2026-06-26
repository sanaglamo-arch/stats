/**
 * Motion / animation primitives — the reusable, reduced-motion-safe design
 * system every view inherits (`/`, and the future `/compare` & `/player`).
 *
 * All animate transform/opacity only and honour `prefers-reduced-motion`. They
 * are VISIBLE BY DEFAULT — the entrance is a progressive enhancement that can
 * never leave content permanently hidden (p11-3 robustness contract).
 *  - CountUp        · a number ticks 0→value once on mount (numeric only; shows final value otherwise).
 *  - AnimatedBar    · divergent H2H bar grows from the centre seam (Messi L / Ronaldo R); full bar by default.
 *  - AnimatedDelta  · season Δ ticks up + flashes the leader colour (final value shown by default).
 *  - Reveal / Stagger… · pure-CSS on-mount section + row entrance, visible by default.
 *  - TabTransition  · opacity-only tab-content crossfade (sticky-safe, no jump).
 *  - Magnetic       · pointer-follow micro-interaction (existing).
 */
export { CountUp } from "./count-up";
export { AnimatedBar } from "./animated-bar";
export { AnimatedDelta } from "./animated-delta";
export { Reveal, StaggerGroup, StaggerItem } from "./reveal";
export { TabTransition } from "./tab-transition";
export { Magnetic } from "./magnetic";
