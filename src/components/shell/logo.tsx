import Link from "next/link";

/**
 * CompareGOATs brand mark — a gold crown motif over a Bebas Neue wordmark, in
 * the "GOAT / Legends" key of the design-refs. The crown is an inline SVG (no
 * raster, themes cleanly, scales crisp) tinted with the brand gold gradient.
 *
 * "Compare" reads in muted white, "GOATs" in gold so the crown points at the
 * GOAT — the same emphasis split the refs use on the hero wordmark. Decorative
 * crown is aria-hidden; the link itself carries the accessible name.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="CompareGOATs — home"
      className={`group inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)] rounded-md ${className}`}
    >
      <Crown className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" />
      <span className="font-display text-2xl leading-none tracking-wide sm:text-[1.7rem]">
        <span className="text-[var(--color-text)]">Compare</span>
        <span className="text-glow-gold text-[var(--color-gold-bright)]">GOATs</span>
      </span>
    </Link>
  );
}

/** Standalone gold crown glyph. Decorative — keep aria-hidden at call sites. */
export function Crown({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 20"
      className={className}
      fill="none"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="cg-crown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-gold-bright)" />
          <stop offset="1" stopColor="var(--color-gold)" />
        </linearGradient>
      </defs>
      {/* Five-point crown with a flat base */}
      <path
        d="M2 6.2l3.6 3.1L12 2.4l6.4 6.9L22 6.2l-1.9 10.2H3.9L2 6.2z"
        fill="url(#cg-crown)"
        stroke="var(--color-gold-bright)"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      {/* Base bar */}
      <rect x="3.9" y="16.4" width="16.2" height="1.9" rx="0.6" fill="url(#cg-crown)" />
      {/* Jewel dots on the points */}
      <circle cx="12" cy="3.4" r="0.9" fill="var(--color-text)" opacity="0.85" />
    </svg>
  );
}
