"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LENIS_CONFIG } from "@/lib/motion/tokens";

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis momentum-scroll provider (Motion system).
 *
 * Wraps the page and drives a single rAF loop that advances Lenis and the GSAP
 * ticker, keeping ScrollTrigger in sync with the smoothed scroll position so
 * parallax beats track the inertial scroll exactly.
 *
 * Hard reduced-motion gate: when the user prefers reduced motion we never
 * instantiate Lenis (native scroll is used) and we do not run the rAF loop. The
 * media query is also watched live so toggling the OS setting re-evaluates.
 *
 * Lenis only smooths the SCROLL — it adds no overlay and intercepts no pointer
 * events, so every control stays clickable.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;

    const start = () => {
      if (lenis || mql.matches) return;
      lenis = new Lenis(LENIS_CONFIG);

      lenis.on("scroll", ScrollTrigger.update);

      const tickerFn = (time: number) => {
        // gsap ticker time is in seconds; Lenis.raf wants milliseconds.
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(tickerFn);
      gsap.ticker.lagSmoothing(0);

      // Stash the ticker fn so we can detach it on stop.
      (lenis as Lenis & { _tickerFn?: typeof tickerFn })._tickerFn = tickerFn;
    };

    const stop = () => {
      if (!lenis) return;
      const tickerFn = (lenis as Lenis & { _tickerFn?: (t: number) => void })._tickerFn;
      if (tickerFn) gsap.ticker.remove(tickerFn);
      lenis.destroy();
      lenis = null;
      ScrollTrigger.refresh();
    };

    const onPrefChange = () => (mql.matches ? stop() : start());
    mql.addEventListener("change", onPrefChange);
    start();

    return () => {
      mql.removeEventListener("change", onPrefChange);
      stop();
    };
  }, []);

  return <>{children}</>;
}
