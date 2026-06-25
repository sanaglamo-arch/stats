"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SPRING } from "@/lib/motion/tokens";
import { useInView } from "@/lib/motion/use-count-up";

/**
 * AnimatedBar — a divergent head-to-head bar that grows from the centre seam
 * outward on scroll-into-view: Messi fills the LEFT half centre→left (blue),
 * Ronaldo fills the RIGHT half centre→right (red) — matching BOSS-NOTES O1
 * (Messi left / Ronaldo right). Bar LENGTH ∝ each side's raw magnitude (honest);
 * the leader's bar carries the bright accent + glow while the trailing side is
 * dimmed, so colour encodes "who leads" (the caller passes `leader`, already
 * derived with higher/lower-is-better) and length encodes the value.
 *
 * The reusable comparison-bar primitive; `/compare` & `/player` inherit it.
 *
 * Motion: transform `scaleX` only (origin at the centre seam) on the shared
 * `SPRING.bar` — never animates width/layout. Reduced-motion / SSR → bars render
 * at full length instantly. Non-numeric rows must not call this (caller gates
 * « н/д » before rendering a bar).
 */
export function AnimatedBar({
  messi,
  ronaldo,
  leader,
  className,
}: {
  messi: number;
  ronaldo: number;
  leader: "messi" | "ronaldo" | "tie" | null;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const grown = reduce || inView;

  const max = Math.max(Math.abs(messi), Math.abs(ronaldo), 1e-6);
  const mFrac = Math.abs(messi) / max;
  const rFrac = Math.abs(ronaldo) / max;

  const messiLeads = leader === "messi";
  const ronaldoLeads = leader === "ronaldo";

  return (
    <div
      ref={ref}
      aria-hidden
      className={`relative flex h-1.5 w-full items-stretch overflow-hidden rounded-full bg-[var(--color-surface)] ${className ?? ""}`}
    >
      {/* Left half — Messi, anchored to the centre seam, grows leftward. */}
      <div className="relative flex-1 overflow-hidden">
        <motion.span
          className="absolute inset-y-0 right-0 rounded-l-full"
          style={{
            width: `${mFrac * 100}%`,
            transformOrigin: "right center",
            background: messiLeads
              ? "linear-gradient(270deg, var(--color-messi-bright), var(--color-messi))"
              : "color-mix(in srgb, var(--color-messi) 40%, transparent)",
            boxShadow: messiLeads ? "0 0 12px color-mix(in srgb, var(--color-messi-bright) 60%, transparent)" : "none",
          }}
          initial={false}
          animate={{ scaleX: grown ? 1 : 0 }}
          transition={reduce ? { duration: 0 } : SPRING.bar}
        />
      </div>
      {/* Centre seam — a faint gold hairline. */}
      <span className="z-10 w-px shrink-0 bg-[var(--gold-hairline)]" />
      {/* Right half — Ronaldo, anchored to the centre seam, grows rightward. */}
      <div className="relative flex-1 overflow-hidden">
        <motion.span
          className="absolute inset-y-0 left-0 rounded-r-full"
          style={{
            width: `${rFrac * 100}%`,
            transformOrigin: "left center",
            background: ronaldoLeads
              ? "linear-gradient(90deg, var(--color-ronaldo-bright), var(--color-ronaldo))"
              : "color-mix(in srgb, var(--color-ronaldo) 40%, transparent)",
            boxShadow: ronaldoLeads ? "0 0 12px color-mix(in srgb, var(--color-ronaldo-bright) 60%, transparent)" : "none",
          }}
          initial={false}
          animate={{ scaleX: grown ? 1 : 0 }}
          transition={reduce ? { duration: 0 } : SPRING.bar}
        />
      </div>
    </div>
  );
}
