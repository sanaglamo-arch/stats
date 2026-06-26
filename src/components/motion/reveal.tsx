import type { CSSProperties, ReactNode } from "react";

/**
 * Scroll-reveal primitives — the shared entrance language for the whole product
 * (sections, cards, table rows). `/compare` & `/player` inherit these unchanged.
 *
 * ROBUSTNESS (p11-3): these are PURE-CSS, on-mount reveals. Content is VISIBLE BY
 * DEFAULT — there is no inline `opacity:0`, no JavaScript, and no
 * IntersectionObserver, so it can never be left permanently hidden (no-JS, slow/
 * flaky devices, headless render, reduced-motion all show the full body). The
 * premium rise/fade lives entirely in `globals.css` (`@keyframes stats-rise`,
 * fill-mode `both`) and ALWAYS completes at opacity:1; reduced-motion strips the
 * animation, leaving the already-visible base state. The hidden frame exists only
 * inside the keyframe `from`, never as a persisted style.
 */

/** A single block that rises + fades in once on mount. `delay` in seconds. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const style = delay ? ({ "--reveal-delay": `${delay}s` } as CSSProperties) : undefined;
  return (
    <div className={`reveal-rise ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}

/** A container whose direct children cascade in (CSS nth-child stagger). */
export function StaggerGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`reveal-stagger ${className ?? ""}`}>{children}</div>;
}

/** One child of a `StaggerGroup` — its cascade timing comes from the parent. */
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
