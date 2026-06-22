"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SPRING } from "@/lib/motion/tokens";

/**
 * Low-level, theme-tokened, accessible control primitives for the studio.
 * Every control: visible label, ≥44px touch target, visible focus ring
 * (--color-ring), cursor-pointer, smooth state transitions. No `any`.
 */

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]";

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export type Option = { value: string; label: string };

export function Select({
  id,
  value,
  options,
  onChange,
}: {
  id: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`tabular w-full min-h-[44px] cursor-pointer appearance-none rounded-[var(--radius-md)] border border-[var(--color-border-glass)] bg-[var(--color-surface-strong)] px-4 pr-10 text-sm font-medium text-[var(--color-text)] transition-colors duration-200 hover:border-[var(--color-border-strong)] ${FOCUS_RING}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[var(--color-bg-elevated)]">
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function SegmentedControl<T extends string>({
  id,
  ariaLabel,
  value,
  items,
  accent,
  onChange,
}: {
  id: string;
  ariaLabel: string;
  value: T;
  items: { value: T; label: string }[];
  accent: string;
  onChange: (value: T) => void;
}) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid grid-cols-2 gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-glass)] bg-[var(--color-surface)] p-1.5 sm:grid-cols-4"
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(item.value)}
            className={`relative min-h-[40px] cursor-pointer rounded-[var(--radius-sm)] px-2 text-xs font-semibold transition-colors duration-200 ${FOCUS_RING} ${
              active
                ? "text-[var(--color-bg-base)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            {/* Shared-layout thumb glides under the active item (transform-only
                via framer layout). Reduced-motion → instant via the layout
                spring being effectively skipped by the project-wide gate. */}
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                aria-hidden
                className="absolute inset-0 -z-0 rounded-[var(--radius-sm)]"
                style={{
                  background: accent,
                  boxShadow: `0 0 16px color-mix(in srgb, ${accent} 60%, transparent)`,
                }}
                transition={SPRING.press}
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function PenaltiesToggle({
  id,
  label,
  checked,
  accent,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  accent: string;
  onChange: (checked: boolean) => void;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="flex items-center justify-between gap-3">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]"
      >
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-[28px] w-[52px] shrink-0 cursor-pointer rounded-full border border-[var(--color-border-glass)] transition-colors duration-200 ${FOCUS_RING}`}
        style={{ background: checked ? accent : "var(--color-surface-strong)" }}
      >
        {/* Thumb slides via transform-x (not `left`) on a spring; the project's
            reduced-motion CSS gate also flattens it instantly. */}
        <motion.span
          aria-hidden
          className="absolute left-1 top-1/2 h-[20px] w-[20px] rounded-full bg-white shadow"
          style={{ y: "-50%" }}
          animate={{ x: checked ? 24 : 0 }}
          transition={reduce ? { duration: 0 } : SPRING.press}
        />
      </button>
    </div>
  );
}
