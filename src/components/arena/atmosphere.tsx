"use client";

import { useMemo } from "react";
import type { PlayerId } from "@/lib/data";

/**
 * The floodlit-stadium ATMOSPHERE layer stack (DESIGN §2). A fixed, aria-hidden,
 * pointer-events:none stack behind page content: base navy wash, floor red/blue
 * glow, floodlight cones, crown glow, vignette, haze, film-grain and drifting
 * gold embers. All visual recipes live in globals.css; this component only emits
 * the layer elements + the ember particles (deterministic, seeded inline so the
 * markup is stable — the embers' MOTION is gated to reduced-motion in CSS, not
 * here, so server/client markup never mismatches).
 *
 * `quiet` dials the drama down for off-path screens (the player profile, DESIGN
 * §6.3): fewer embers, gentler.
 *
 * `side` makes the backdrop SINGLE-accent for a solo profile (DESIGN §6.3 — only
 * that player's nation/accent, never the opponent's): `messi` → cool blue /
 * Argentina hint, `ronaldo` → warm red / Portugal hint. When omitted the full
 * rivalry flag-split (both nations) is shown — the arena clash.
 */
export function Atmosphere({ quiet = false, side }: { quiet?: boolean; side?: PlayerId }) {
  // Deterministic ember placement (no RNG/clock) so SSR === CSR. Desktop count
  // 12 (5 when quiet); CSS hides them all under reduced-motion.
  const embers = useMemo(() => {
    const count = quiet ? 5 : 12;
    return Array.from({ length: count }, (_, i) => {
      // Spread across the width with deterministic, varied delay/duration.
      const left = ((i * 83) % 100) + ((i % 3) * 4);
      const duration = 18 + ((i * 7) % 16); // 18–33s
      const delay = (i * 11) % 24; // 0–23s
      const drift = ((i % 5) - 2) * 1.4; // slight horizontal drift
      return { id: i, left: Math.min(98, left), duration, delay, drift };
    });
  }, [quiet]);

  return (
    <>
      {/* O2: blurred flag base. Full rivalry split on the arena; a SINGLE-accent
          solo wash on a player profile (DESIGN §6.3 — only that player's side). */}
      <div
        className={`arena-flagsplit${side ? ` is-solo is-solo-${side}` : ""}`}
        aria-hidden
      />
      <div
        className={`arena-atmosphere is-overlay${side ? ` is-solo is-solo-${side}` : ""}`}
        aria-hidden
      />
      <div className="arena-grain" aria-hidden />
      <div aria-hidden>
        {embers.map((e) => (
          <span
            key={e.id}
            className="ember"
            style={{
              left: `${e.left}%`,
              animationDuration: `${e.duration}s`,
              animationDelay: `${e.delay}s`,
              ["--drift" as string]: `${e.drift}vw`,
            }}
          />
        ))}
      </div>
    </>
  );
}
