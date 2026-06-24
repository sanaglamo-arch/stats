"use client";

import { useI18n } from "@/lib/i18n/provider";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]";

/**
 * "Show winner" switch (default ON). A real ARIA switch — keyboard-operable, with
 * a visible label. ON reveals the winner identity + per-category score; OFF hides
 * the whole verdict so the numbers can be read neutrally (state owned by parent).
 */
export function VerdictToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  const { t } = useI18n();

  return (
    <label className="flex cursor-pointer select-none items-center justify-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
        {t.arenaShowWinner}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={t.arenaShowWinner}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200 before:absolute before:-inset-x-2 before:-inset-y-2.5 before:content-[''] ${FOCUS_RING}`}
        style={{
          background: checked
            ? "color-mix(in srgb, var(--color-gold) 70%, transparent)"
            : "var(--color-surface)",
          borderColor: checked
            ? "color-mix(in srgb, var(--color-gold) 80%, transparent)"
            : "var(--color-border-strong)",
        }}
      >
        <span
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white transition-[left] duration-200"
          style={{ left: checked ? "calc(100% - 1.25rem)" : "0.25rem" }}
        />
      </button>
    </label>
  );
}
