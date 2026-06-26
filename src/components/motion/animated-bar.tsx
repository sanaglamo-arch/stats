import type { CSSProperties } from "react";

/**
 * AnimatedBar — a divergent head-to-head bar that grows from the centre seam
 * outward on mount: Messi fills the LEFT half centre→left (blue), Ronaldo fills
 * the RIGHT half centre→right (red) — matching BOSS-NOTES O1 (Messi left /
 * Ronaldo right). Bar LENGTH ∝ each side's raw magnitude (honest); the leader's
 * bar carries the bright accent + glow while the trailing side is dimmed, so
 * colour encodes "who leads" (the caller passes `leader`, already derived with
 * higher/lower-is-better) and length encodes the value. The reusable
 * comparison-bar primitive; `/compare` & `/player` inherit it.
 *
 * ROBUSTNESS (p11-3): pure CSS, no JS, no IntersectionObserver. The fill is
 * VISIBLE BY DEFAULT at its full width (`width: X%`, no transform) — the grow is
 * a `scaleX` keyframe that plays once on mount and always settles at the full
 * bar (`.bar-grow`). Reduced-motion / no-JS → the full bar shows immediately, it
 * is never stuck at zero width. transform/opacity only; never animates layout.
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
  const max = Math.max(Math.abs(messi), Math.abs(ronaldo), 1e-6);
  const mFrac = Math.abs(messi) / max;
  const rFrac = Math.abs(ronaldo) / max;

  const messiLeads = leader === "messi";
  const ronaldoLeads = leader === "ronaldo";

  const messiStyle: CSSProperties = {
    width: `${mFrac * 100}%`,
    transformOrigin: "right center",
    background: messiLeads
      ? "linear-gradient(270deg, var(--color-messi-bright), var(--color-messi))"
      : "color-mix(in srgb, var(--color-messi) 40%, transparent)",
    boxShadow: messiLeads ? "0 0 12px color-mix(in srgb, var(--color-messi-bright) 60%, transparent)" : "none",
  };
  const ronaldoStyle: CSSProperties = {
    width: `${rFrac * 100}%`,
    transformOrigin: "left center",
    background: ronaldoLeads
      ? "linear-gradient(90deg, var(--color-ronaldo-bright), var(--color-ronaldo))"
      : "color-mix(in srgb, var(--color-ronaldo) 40%, transparent)",
    boxShadow: ronaldoLeads ? "0 0 12px color-mix(in srgb, var(--color-ronaldo-bright) 60%, transparent)" : "none",
  };

  return (
    <div
      aria-hidden
      className={`relative flex h-1.5 w-full items-stretch overflow-hidden rounded-full bg-[var(--color-surface)] ${className ?? ""}`}
    >
      {/* Left half — Messi, anchored to the centre seam, grows leftward. */}
      <div className="relative flex-1 overflow-hidden">
        <span className="bar-grow absolute inset-y-0 right-0 rounded-l-full" style={messiStyle} />
      </div>
      {/* Centre seam — a faint gold hairline. */}
      <span className="z-10 w-px shrink-0 bg-[var(--gold-hairline)]" />
      {/* Right half — Ronaldo, anchored to the centre seam, grows rightward. */}
      <div className="relative flex-1 overflow-hidden">
        <span className="bar-grow absolute inset-y-0 left-0 rounded-r-full" style={ronaldoStyle} />
      </div>
    </div>
  );
}
