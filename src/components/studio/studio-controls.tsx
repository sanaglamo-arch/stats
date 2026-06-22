"use client";

import { Users } from "lucide-react";
import type { CardSlice, SideOptions } from "@/components/card";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { PlayerControls } from "./player-controls";
import { Select } from "./control-primitives";
import type { PlayerSliceOptions } from "./slice-options";

/**
 * The studio control set — both per-player slice panels + the same-age
 * convenience. Rendered once and re-homed by CSS: it is the quiet glass rail on
 * desktop (≥lg) and the body of the mobile bottom-sheet below lg. Keeping a
 * single instance avoids duplicate ARIA regions (the e2e selectors and screen
 * readers see exactly one "Lionel Messi" / "Cristiano Ronaldo" region).
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
}: {
  slice: CardSlice;
  messiOptions: PlayerSliceOptions;
  ronaldoOptions: PlayerSliceOptions;
  sharedAges: number[];
  t: Dictionary;
  onMessiChange: (next: SideOptions) => void;
  onRonaldoChange: (next: SideOptions) => void;
  onSameAge: (age: number) => void;
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
        <Select
          id="same-age"
          value={sameAgeValue === null ? "" : String(sameAgeValue)}
          onChange={(raw) => onSameAge(Number.parseInt(raw, 10))}
          options={[
            { value: "", label: "—" },
            ...sharedAges.map((age) => ({ value: String(age), label: String(age) })),
          ]}
        />
        <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">{t.sameAgeHint}</p>
      </section>
    </div>
  );
}
