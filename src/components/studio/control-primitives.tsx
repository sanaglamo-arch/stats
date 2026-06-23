"use client";

import type { ReactNode } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { SPRING } from "@/lib/motion/tokens";

/**
 * Low-level, theme-tokened, accessible control primitives for the studio.
 * Every control: visible label, ≥44px touch target, visible focus ring
 * (--color-ring), cursor-pointer, smooth state transitions. No `any`.
 */

/** Shared neon focus-visible ring — the single source for every studio control. */
export const FOCUS_RING =
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

/**
 * Site-style value picker built on @radix-ui/react-select — replaces the native
 * `<select>` entirely. The trigger is a dark-neon glass pill with a chevron; the
 * content is a glass popover that scales/fades up on open (`.neon-popover`,
 * reduced-motion safe) with a check-marked selected item. Radix supplies full
 * keyboard + a11y (the trigger reports `role="combobox"`, the list `listbox`,
 * items `option`). `placeholder` shows when `value` is empty.
 */
export function NeonSelect({
  id,
  value,
  options,
  onChange,
  ariaLabel,
  placeholder = "—",
}: {
  id: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
}) {
  return (
    <RadixSelect.Root value={value || undefined} onValueChange={onChange}>
      <RadixSelect.Trigger
        id={id}
        aria-label={ariaLabel}
        className={`tabular flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-glass)] bg-[var(--color-surface-strong)] px-4 text-sm font-medium text-[var(--color-text)] transition-colors duration-200 hover:border-[var(--color-border-strong)] data-[state=open]:border-[var(--color-border-strong)] ${FOCUS_RING}`}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon className="text-[var(--color-text-muted)]">
          <ChevronDown size={16} aria-hidden className="transition-transform duration-200" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="neon-popover z-[1000] max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]/95 shadow-[var(--shadow-glass)] backdrop-blur-2xl"
        >
          <RadixSelect.Viewport className="p-1.5">
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                className={`tabular relative flex min-h-[40px] cursor-pointer select-none items-center gap-2 rounded-[var(--radius-sm)] px-3 pr-8 text-sm font-medium text-[var(--color-text-secondary)] outline-none data-[highlighted]:bg-[var(--color-surface-strong)] data-[highlighted]:text-[var(--color-text)] data-[state=checked]:text-[var(--color-text)]`}
              >
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="absolute right-2.5 inline-flex">
                  <Check size={16} aria-hidden className="text-[var(--color-gold)]" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
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
            className={`relative min-h-[44px] cursor-pointer rounded-[var(--radius-sm)] px-2 text-xs font-semibold transition-colors duration-200 ${FOCUS_RING} ${
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
