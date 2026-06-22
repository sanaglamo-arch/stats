"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { DURATION, EASE, SPRING } from "@/lib/motion/tokens";

/**
 * Shared Studio motion primitives (SPEC §10 — framer-motion is UI-only; the
 * ComparisonCard / /render/card stay animation-free). Every variant animates
 * transform + opacity only and is guarded by `useReducedMotion()`: when the user
 * prefers reduced motion we collapse to a no-op so layout never animates.
 *
 * Timings come from the shared motion tokens (one timing language site-wide).
 */

const EASE_OUT = EASE.out;

/** Simple ease-out fade+rise used for a single block (e.g. the preview column). */
export function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: DURATION.morph, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Hover tilt + lift for the hero card (Studio-only micro-interaction). On a
 * mouse pointer the card tilts toward the cursor (3D rotate via transform) and
 * lifts slightly; springs back on leave. Pointer-only (ignores touch) and a
 * no-op under reduced-motion — it just renders the plain wrapper. Transform-only
 * so it never reflows.
 */
export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0); // -0.5..0.5
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), SPRING.magnetic);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-6, 6]), SPRING.magnetic);

  if (reduce) return <div className={className}>{children}</div>;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const reset = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ rotateX, rotateY, transformPerspective: 1100 }}
      whileHover={{ scale: 1.012 }}
      transition={SPRING.magnetic}
    >
      {children}
    </motion.div>
  );
}

/**
 * Mobile bottom-sheet (Studio-only). Scrim fades + the panel slides up from the
 * bottom edge — its trigger source — for spatial context (ui-ux-pro-max
 * `modal-motion`). Transform/opacity only; reduced-motion collapses the slide to
 * a plain fade so nothing translates. Exit is faster than enter to feel snappy.
 *
 * As an `aria-modal` dialog it also: closes on Escape, moves focus into the sheet
 * on open, and restores focus to the trigger on close.
 */
export function BottomSheet({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const enter = reduce ? { opacity: 1 } : { opacity: 1, y: 0 };
  const hidden = reduce ? { opacity: 0 } : { opacity: 0, y: "100%" };

  const sheetRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    sheetRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <motion.button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 cursor-pointer bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.micro, ease: EASE_OUT }}
          />
          <motion.div
            ref={sheetRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[var(--radius-xl)] border-t border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]/95 px-4 pb-[max(env(safe-area-inset-bottom),20px)] pt-3 shadow-[0_-20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl outline-none"
            initial={hidden}
            animate={enter}
            exit={hidden}
            transition={{ duration: DURATION.fast, ease: EASE_OUT }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
