"use client";

import { useEffect, useRef, useState } from "react";
import { CARD_HEIGHT, CARD_WIDTH, ComparisonCard, type CardSlice, type CardViewModel } from "@/components/card";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Responsive live preview. The card paints at its fixed 1080×1620 box; we scale
 * it down with CSS `transform: scale(...)` to whatever width the responsive
 * container gets (an aspect-ratio box reserves the height so there is no layout
 * shift). This is instant + free — no headless browser, no /api/card hit. The
 * preview re-renders purely from the in-memory view-model as selectors change.
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

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const update = () => setScale(box.clientWidth / CARD_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      className="relative w-full overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-glass)] shadow-[var(--shadow-glass)]"
      style={{ aspectRatio: `${CARD_WIDTH} / ${CARD_HEIGHT}` }}
    >
      {scale > 0 && (
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: CARD_WIDTH, height: CARD_HEIGHT, transform: `scale(${scale})` }}
        >
          <ComparisonCard model={model} slice={slice} t={t} />
        </div>
      )}
    </div>
  );
}
