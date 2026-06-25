"use client";

import { useEffect, useState } from "react";
import { PLAYER_META } from "@/components/card/player-meta";
import type { PlayerId } from "@/lib/data";

/**
 * One side of the render-clash hero (DESIGN §3 + BOSS-NOTES O1/O3): a big,
 * near-full-height duotone player render facing inward toward the central VS
 * (BOSS O1 — Messi LEFT faces right, Ronaldo RIGHT faces left; the inward mirror
 * lives in CSS).
 *
 * Visibility-first strategy (fixes the "figure absent" blocker + headless-capture
 * timing): the proven head&shoulders JPG duotone (`/players/{id}.jpg`, the same
 * treatment that renders on /player and /cards) is ALWAYS painted as the visible
 * figure. In parallel we probe for the boss-supplied full-length transparent
 * cut-out (`/players/{id}-render.png`); only once it actually LOADS do we upgrade
 * to it. So the hero is never empty before assets land, and auto-upgrades when
 * they do. A JPG load failure degrades to the tinted silhouette SVG.
 */
export function RenderHero({ id }: { id: PlayerId }) {
  const meta = PLAYER_META[id];
  const [cutoutReady, setCutoutReady] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  const cutoutSrc = `/players/${id}-render.png`;

  // Probe the cut-out PNG without ever showing a broken image: load it off-DOM
  // and only flip to it on success.
  useEffect(() => {
    let alive = true;
    const probe = new Image();
    probe.onload = () => {
      if (alive) setCutoutReady(true);
    };
    probe.src = cutoutSrc;
    return () => {
      alive = false;
    };
  }, [cutoutSrc]);

  if (cutoutReady) {
    return (
      <div className={`render-hero is-${id} is-cutout h-full w-full`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static cut-out render */}
        <img src={cutoutSrc} alt="" aria-hidden draggable={false} />
      </div>
    );
  }

  const src = photoFailed ? `/players/${id}.svg` : meta.photoSrc;
  const variant = photoFailed ? "is-fallback" : "";

  return (
    <div className={`render-hero is-${id} ${variant} h-full w-full`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static render; the
          duotone is a CSS treatment, next/image's optimizer is off here. */}
      <img
        src={src}
        alt=""
        aria-hidden
        draggable={false}
        onError={() => {
          if (!photoFailed) setPhotoFailed(true);
        }}
      />
    </div>
  );
}
