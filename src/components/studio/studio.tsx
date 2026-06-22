"use client";

import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { dataSource, type SeasonSelection } from "@/lib/data";
import {
  buildCardViewModel,
  DEFAULT_SLICE,
  type CardSlice,
  type SideOptions,
} from "@/components/card";
import { useI18n } from "@/lib/i18n/provider";
import { CardPreview } from "./card-preview";
import { ShareActions } from "./share-actions";
import { StudioControls } from "./studio-controls";
import { BottomSheet, FadeIn, TiltCard } from "./motion";
import { Magnetic } from "@/components/motion/magnetic";
import { commonAges, playerSliceOptions } from "./slice-options";

/**
 * The card studio (SPEC §2/§3/§5) — recomposed as a CARD-HERO stage.
 *
 * The product is the picture, so the live ComparisonCard is the visual center of
 * gravity: large, centered on an ambient dual-accent backdrop, lifted off the
 * page with a volumetric shadow + neon halo. The controls are deliberately
 * secondary:
 *   - desktop (≥lg): a slim, quiet glass control rail docked at the right;
 *   - mobile: the card fills the screen and the controls live in a slide-up
 *     glass bottom-sheet behind a single "Customize" trigger (product-first —
 *     no tall form competing with the card).
 *
 * One `CardSlice` is the single source of truth; the same <StudioControls>
 * instance is re-homed by CSS into the rail / the sheet, so there is exactly one
 * set of ARIA regions in the DOM.
 */
/**
 * Tracks the `lg` breakpoint (1024px) so the control set is rendered in exactly
 * ONE home — the desktop rail OR the mobile sheet — never both. This keeps a
 * single instance of every ARIA region (e.g. one "Lionel Messi" region) for
 * screen readers and the e2e selectors. SSR/first paint assume desktop, then the
 * effect corrects on mount (no hydration text mismatch — only placement).
 */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

export function Studio() {
  const { locale, t } = useI18n();
  const [slice, setSlice] = useState<CardSlice>(DEFAULT_SLICE);
  const [sheetOpen, setSheetOpen] = useState(false);
  const isDesktop = useIsDesktop();

  // Close the sheet automatically if we grow into the desktop rail.
  useEffect(() => {
    if (isDesktop && sheetOpen) setSheetOpen(false);
  }, [isDesktop, sheetOpen]);

  const rows = useMemo(() => dataSource.getAllRows(), []);
  const messiOptions = useMemo(() => playerSliceOptions(rows, "messi"), [rows]);
  const ronaldoOptions = useMemo(() => playerSliceOptions(rows, "ronaldo"), [rows]);
  const sharedAges = useMemo(() => commonAges(rows), [rows]);

  const model = useMemo(() => buildCardViewModel(rows, slice), [rows, slice]);

  const setMessi = (messi: SideOptions) => setSlice((s) => ({ ...s, messi }));
  const setRonaldo = (ronaldo: SideOptions) => setSlice((s) => ({ ...s, ronaldo }));

  const applySameAge = (age: number) => {
    const selection: SeasonSelection = { kind: "age", age };
    setSlice((s) => ({
      ...s,
      messi: { ...s.messi, selection },
      ronaldo: { ...s.ronaldo, selection },
    }));
  };

  const controls = (
    <StudioControls
      slice={slice}
      messiOptions={messiOptions}
      ronaldoOptions={ronaldoOptions}
      sharedAges={sharedAges}
      t={t}
      onMessiChange={setMessi}
      onRonaldoChange={setRonaldo}
      onSameAge={applySameAge}
    />
  );

  return (
    <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
      {/* ── Hero stage: the card dominates. ── */}
      <FadeIn className="relative order-1 flex flex-col items-center gap-6 pb-24 lg:pb-0">
        <div className="card-halo" aria-hidden />
        <div className="relative z-10 w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[520px]">
          <TiltCard className="rounded-[var(--radius-xl)] shadow-[var(--shadow-hero)]">
            <CardPreview model={model} slice={slice} t={t} />
          </TiltCard>
        </div>
        <div className="relative z-10 w-full max-w-[300px] sm:max-w-[420px]">
          <ShareActions slice={slice} locale={locale} t={t} />
        </div>
      </FadeIn>

      {/* ── Desktop control rail (quiet, secondary). Renders only ≥lg. ── */}
      {isDesktop && (
        <aside className="relative z-10 order-2 lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            {t.controls}
          </h2>
          {controls}
        </aside>
      )}

      {/* ── Mobile: floating "Customize" trigger + bottom-sheet. Only <lg. ── */}
      {!isDesktop && (
        <>
          <Magnetic className="fixed inset-x-4 bottom-[max(env(safe-area-inset-bottom),16px)] z-30">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]/90 px-6 text-sm font-bold uppercase tracking-wide text-[var(--color-text)] backdrop-blur-xl transition-colors duration-200 hover:bg-[var(--color-surface-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]"
              style={{ boxShadow: "var(--shadow-glass), var(--shadow-glow-gold)" }}
            >
              <SlidersHorizontal size={18} aria-hidden />
              {t.customize}
            </button>
          </Magnetic>

          <BottomSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            labelledBy="sheet-title"
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[var(--color-border-strong)]" />
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="sheet-title"
                className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
              >
                {t.controls}
              </h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors duration-200 hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                aria-label={t.done}
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            {controls}
          </BottomSheet>
        </>
      )}
    </div>
  );
}
