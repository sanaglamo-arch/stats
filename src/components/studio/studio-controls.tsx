"use client";

import { Users } from "lucide-react";
import type { MetricKey } from "@/lib/data";
import type { CardSlice, SideOptions } from "@/components/card";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { PlayerControls } from "./player-controls";
import { NeonSelect } from "./control-primitives";
import { StatPicker } from "./stat-picker";
import type { PlayerSliceOptions } from "./slice-options";

/**
 * The studio control set — clear top-down hierarchy (P6-8 + P6-10):
 *   1. per-player period blocks (mode segmented control + value pickers);
 *   2. a same-age convenience;
 *   3. the stat-selection block (chips + group presets + reorder).
 *
 * The global competition TABS live one level up (full-width, above the rail/card)
 * in <Studio>. This set is rendered once and re-homed by CSS (desktop rail /
 * mobile sheet) so there is a single instance of every ARIA region (one
 * "Lionel Messi" / "Cristiano Ronaldo" region) for screen readers and e2e.
 */
export function StudioControls({
  slice,
  messiOptions,
  ronaldoOptions,
  sharedAges,
  t,
  onMessiChange,
  onRonaldoChange,
  onSameAge,
  onMetricsChange,
}: {
  slice: CardSlice;
  messiOptions: PlayerSliceOptions;
  ronaldoOptions: PlayerSliceOptions;
  sharedAges: number[];
  t: Dictionary;
  onMessiChange: (next: SideOptions) => void;
  onRonaldoChange: (next: SideOptions) => void;
  onSameAge: (age: number) => void;
  onMetricsChange: (next: MetricKey[]) => void;
}) {
  // Same-age is active only when both sides already point at the same age value.
  const sameAgeValue =
    slice.messi.selection.kind === "age" &&
    slice.ronaldo.selection.kind === "age" &&
    slice.messi.selection.age === slice.ronaldo.selection.age
      ? slice.messi.selection.age
      : null;

  return (
    <div className="flex flex-col gap-4">
      <PlayerControls
        player="messi"
        side={slice.messi}
        options={messiOptions}
        t={t}
        onChange={onMessiChange}
      />
      <PlayerControls
        player="ronaldo"
        side={slice.ronaldo}
        options={ronaldoOptions}
        t={t}
        onChange={onRonaldoChange}
      />

      <section className="glass-panel flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-[var(--color-gold)]" aria-hidden />
          <label htmlFor="same-age" className="text-sm font-semibold text-[var(--color-text)]">
            {t.sameAge}
          </label>
        </div>
        <NeonSelect
          id="same-age"
          ariaLabel={t.sameAge}
          placeholder="—"
          value={sameAgeValue === null ? "" : String(sameAgeValue)}
          onChange={(raw) => onSameAge(Number.parseInt(raw, 10))}
          options={sharedAges.map((age) => ({ value: String(age), label: String(age) }))}
        />
        <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">{t.sameAgeHint}</p>
      </section>

      <StatPicker metrics={slice.metrics} t={t} onChange={onMetricsChange} />
    </div>
  );
}
