import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Honesty badge (SPEC §6 — hard requirement). Any chart built on illustrative
 * placeholder data MUST render this so the viewer cannot mistake it for real
 * tracking. A prominent gold pill ("Illustrative" / "Иллюстративно") plus a
 * one-line caption. Both strings are i18n (RU/EN parity enforced).
 *
 * Pure presentational, framework-light: takes the active dictionary as a prop
 * so it works in the live preview AND the headless PNG route alike.
 */
export function IllustrativeBadge({ t }: { t: Dictionary }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
        style={{
          color: "#1a1205",
          background: "linear-gradient(180deg, var(--color-gold-bright), var(--color-gold))",
          borderColor: "rgba(245, 196, 81, 0.6)",
          boxShadow: "var(--shadow-glow-gold)",
        }}
        role="status"
      >
        <svg
          aria-hidden
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {t.illustrative}
      </span>
      <p className="text-xs leading-snug" style={{ color: "var(--color-text-secondary)" }}>
        {t.illustrativeCaption}
      </p>
    </div>
  );
}
