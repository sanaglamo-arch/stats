"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { dataSource, type SeasonSelection } from "@/lib/data";
import {
  buildCardViewModel,
  DEFAULT_SLICE,
  type CardSlice,
  type SideOptions,
} from "@/components/card";
import { useI18n } from "@/lib/i18n/provider";
import { CardPreview } from "./card-preview";
import { PlayerControls } from "./player-controls";
import { ShareActions } from "./share-actions";
import { Select } from "./control-primitives";
import { FadeIn, StaggerGroup, StaggerItem } from "./motion";
import { commonAges, playerSliceOptions } from "./slice-options";

/**
 * The card studio (SPEC §2/§5). Holds the single source of truth — one
 * `CardSlice` — and drives the live preview + the download/share contract from
 * it. All four slices per player live in <PlayerControls>; the global same-age
 * convenience just sets both sides to the same `age` selection at once.
 */
export function Studio() {
  const { locale, t } = useI18n();
  const [slice, setSlice] = useState<CardSlice>(DEFAULT_SLICE);

  const rows = useMemo(() => dataSource.getAllRows(), []);
  const messiOptions = useMemo(() => playerSliceOptions(rows, "messi"), [rows]);
  const ronaldoOptions = useMemo(() => playerSliceOptions(rows, "ronaldo"), [rows]);
  const sharedAges = useMemo(() => commonAges(rows), [rows]);

  const model = useMemo(() => buildCardViewModel(rows, slice), [rows, slice]);

  const setMessi = (messi: SideOptions) => setSlice((s) => ({ ...s, messi }));
  const setRonaldo = (ronaldo: SideOptions) => setSlice((s) => ({ ...s, ronaldo }));

  // Same-age convenience: both sides aligned to one age. Active only when both
  // sides already point at the same age value.
  const sameAgeValue =
    slice.messi.selection.kind === "age" &&
    slice.ronaldo.selection.kind === "age" &&
    slice.messi.selection.age === slice.ronaldo.selection.age
      ? slice.messi.selection.age
      : null;

  const applySameAge = (age: number) => {
    const selection: SeasonSelection = { kind: "age", age };
    setSlice((s) => ({
      messi: { ...s.messi, selection },
      ronaldo: { ...s.ronaldo, selection },
    }));
  };

  return (
    <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
      {/* Preview — first in DOM source on mobile so the card (the product) leads. */}
      <FadeIn className="order-1 flex flex-col gap-5 lg:sticky lg:top-6 lg:order-2 lg:self-start">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          {t.preview}
        </h2>
        <div className="mx-auto w-full max-w-[420px]">
          <CardPreview model={model} slice={slice} t={t} />
        </div>
        <ShareActions slice={slice} locale={locale} t={t} />
      </FadeIn>

      {/* Controls */}
      <StaggerGroup className="order-2 flex flex-col gap-5 lg:order-1">
        <StaggerItem>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            {t.controls}
          </h2>
        </StaggerItem>

        <StaggerItem>
          <PlayerControls
            player="messi"
            side={slice.messi}
            options={messiOptions}
            t={t}
            onChange={setMessi}
          />
        </StaggerItem>
        <StaggerItem>
          <PlayerControls
            player="ronaldo"
            side={slice.ronaldo}
            options={ronaldoOptions}
            t={t}
            onChange={setRonaldo}
          />
        </StaggerItem>

        <StaggerItem>
          <section className="glass flex flex-col gap-3 rounded-[var(--radius-lg)] p-5">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-[var(--color-gold)]" aria-hidden />
              <label htmlFor="same-age" className="text-sm font-semibold text-[var(--color-text)]">
                {t.sameAge}
              </label>
            </div>
            <Select
              id="same-age"
              value={sameAgeValue === null ? "" : String(sameAgeValue)}
              onChange={(raw) => applySameAge(Number.parseInt(raw, 10))}
              options={[
                { value: "", label: "—" },
                ...sharedAges.map((age) => ({ value: String(age), label: String(age) })),
              ]}
            />
            <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
              {t.sameAgeHint}
            </p>
          </section>
        </StaggerItem>
      </StaggerGroup>
    </div>
  );
}
