"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  ComparisonCard,
  type CardSlice,
  type CardViewModel,
} from "@/components/card";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { DURATION, EASE } from "@/lib/motion/tokens";

/**
 * Responsive live preview. The card paints at its fixed 1080×1620 box; we scale
 * it down with CSS `transform: scale(...)` to whatever width the responsive
 * container gets (an aspect-ratio box reserves the height so there is no layout
 * shift). This is instant + free — no headless browser, no /api/card hit. The
 * preview re-renders purely from the in-memory view-model as selectors change.
 *
 * Motion (Studio-only, reduced-motion guarded):
 * - a shimmer skeleton fills the box for the brief mount gap before the
 *   ResizeObserver reports a scale (avoids a flash of empty/oversized card);
 * - selector changes crossfade the card subtly so updates feel intentional, not
 *   janky on every keystroke. The ComparisonCard itself stays animation-free.
 */
export function CardPreview({
  model,
  slice,
  t,
}: {
  model: CardViewModel;
  slice: CardSlice;
  t: Dictionary;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const update = () => setScale(box.clientWidth / CARD_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // Crossfade key: changes when the rendered verdict changes (cheap proxy for
  // "the card content is different"), so we don't crossfade on no-op renders.
  const contentKey = `${model.score.messi}-${model.score.ronaldo}-${model.contested}-${slice.messi.selection.kind}-${slice.ronaldo.selection.kind}`;

  return (
    <div
      ref={boxRef}
      className="relative w-full overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-glass)] shadow-[var(--shadow-glass)]"
      style={{ aspectRatio: `${CARD_WIDTH} / ${CARD_HEIGHT}` }}
    >
      {scale === 0 && <PreviewSkeleton reduce={reduce} />}
      {scale > 0 && (
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: CARD_WIDTH, height: CARD_HEIGHT, transform: `scale(${scale})` }}
        >
          {reduce ? (
            <ComparisonCard model={model} slice={slice} t={t} />
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={contentKey}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.morph, ease: EASE.inOut }}
                style={{ position: "absolute", inset: 0 }}
              >
                {/* `animated` lights up the bar springs, count-ups and pulse —
                    live preview only; the PNG route never passes it. The
                    crossfade key re-mounts on slice change so the card morphs
                    and re-fills/re-counts instead of hard-swapping. */}
                <ComparisonCard model={model} slice={slice} t={t} animated />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}

/** Glassy shimmer placeholder shown during the (sub-frame) mount gap. */
function PreviewSkeleton({ reduce }: { reduce: boolean | null }) {
  return (
    <div aria-hidden className="absolute inset-0" style={{ background: "var(--color-bg-base)" }}>
      <div className="flex h-full flex-col gap-4 p-[5%]">
        <div className="flex items-start justify-between gap-3">
          <SkeletonBlock
            reduce={reduce}
            className="aspect-square w-[34%] rounded-[var(--radius-lg)]"
          />
          <SkeletonBlock
            reduce={reduce}
            className="aspect-square w-[34%] rounded-[var(--radius-lg)]"
          />
        </div>
        <SkeletonBlock reduce={reduce} className="h-[10%] w-full rounded-[var(--radius-lg)]" />
        <div className="flex flex-1 flex-col justify-center gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonBlock key={i} reduce={reduce} className="h-3 w-full rounded-full" />
          ))}
        </div>
        <SkeletonBlock reduce={reduce} className="h-[16%] w-full rounded-[var(--radius-xl)]" />
      </div>
    </div>
  );
}

function SkeletonBlock({ reduce, className }: { reduce: boolean | null; className?: string }) {
  return (
    <div
      className={`${className ?? ""} ${reduce ? "" : "animate-pulse"}`}
      style={{
        background: "var(--color-surface-strong)",
        border: "1px solid var(--color-border-glass)",
      }}
    />
  );
}
