"use client";

import { useMemo } from "react";

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
 * §6.3): fewer embers, gentler — it just renders fewer ember particles.
 */
export function Atmosphere({ quiet = false }: { quiet?: boolean }) {
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
      {/* O2: blurred flag-split is the primary base; the stadium floodlights +
          vignette layer subtly on top in overlay mode (no opaque base wash). */}
      <div className="arena-flagsplit" aria-hidden />
      <div className="arena-atmosphere is-overlay" aria-hidden />
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
