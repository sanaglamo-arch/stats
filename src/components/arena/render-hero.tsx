"use client";

import { useState } from "react";
import { PLAYER_META } from "@/components/card/player-meta";
import type { PlayerId } from "@/lib/data";

/**
 * One side of the render-clash hero (DESIGN §3 + BOSS-NOTES O1/O3): a big,
 * near-full-height duotone player render that faces inward toward the central VS
 * (BOSS O1 — Messi LEFT faces right, Ronaldo RIGHT faces left; the inward mirror
 * lives in CSS). Built to ACCEPT boss-supplied full-length transparent cut-out
 * PNGs as the foreground over the flag-split background (BOSS O3).
 *
 * Fallback chain (graceful, so the site never breaks before assets land):
 *   1. `/players/{id}-render.png`  — full-length transparent cut-out (is-cutout)
 *   2. `/players/{id}.jpg`         — head&shoulders photo, duotone + edge-mask
 *   3. `/players/{id}.svg`         — tinted silhouette (is-fallback)
 * Never a small boxed photo. The per-side duotone tint applies at every stage.
 */
type Stage = "cutout" | "photo" | "silhouette";

const NEXT_STAGE: Record<Stage, Stage | null> = {
  cutout: "photo",
  photo: "silhouette",
  silhouette: null,
};

export function RenderHero({ id }: { id: PlayerId }) {
  const meta = PLAYER_META[id];
  const [stage, setStage] = useState<Stage>("cutout");

  const src =
    stage === "cutout"
      ? `/players/${id}-render.png`
      : stage === "photo"
        ? meta.photoSrc
        : `/players/${id}.svg`;

  const variant = stage === "cutout" ? "is-cutout" : stage === "silhouette" ? "is-fallback" : "";

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
          const next = NEXT_STAGE[stage];
          if (next) setStage(next);
        }}
      />
    </div>
  );
}
