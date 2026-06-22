"use client";

import type { CompetitionFilter, PlayerId, SeasonSelection } from "@/lib/data";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { SideOptions } from "@/components/card";
import { PLAYER_META } from "@/components/card";
import type { PlayerSliceOptions } from "./slice-options";
import { Field, PenaltiesToggle, SegmentedControl, Select } from "./control-primitives";

/** Season-selection modes exposed in the UI (maps to SeasonSelection.kind). */
type SeasonMode = "season" | "career" | "lastNSeasons" | "age";

const LAST_N_CHOICES = [3, 5, 10] as const;

const COMPETITIONS: readonly CompetitionFilter[] = [
  "all",
  "league",
  "champions_league",
  "domestic_cup",
  "super_cup",
  "club_world_cup",
  "national_team",
];

const COMP_LABEL_KEYS: Record<CompetitionFilter, keyof Dictionary> = {
  all: "compAll",
  league: "compLeague",
  champions_league: "compChampionsLeague",
  domestic_cup: "compDomesticCup",
  super_cup: "compSuperCup",
  club_world_cup: "compClubWorldCup",
  national_team: "compNationalTeam",
};

/**
 * Switch the active period mode while keeping a sensible value: e.g. flipping to
 * "season" picks the player's newest season, "age" their first available age.
 */
function selectionForMode(mode: SeasonMode, opts: PlayerSliceOptions): SeasonSelection {
  switch (mode) {
    case "career":
      return { kind: "career" };
    case "season":
      return { kind: "season", season: opts.seasons[0] ?? "" };
    case "lastNSeasons":
      return { kind: "lastNSeasons", n: LAST_N_CHOICES[1] };
    case "age":
      return { kind: "age", age: opts.ages[0] ?? 0 };
  }
}

export function PlayerControls({
  player,
  side,
  options,
  t,
  onChange,
}: {
  player: PlayerId;
  side: SideOptions;
  options: PlayerSliceOptions;
  t: Dictionary;
  onChange: (next: SideOptions) => void;
}) {
  const meta = PLAYER_META[player];
  const accent = `var(${meta.accentVar})`;
  const mode = side.selection.kind;

  const setSelection = (selection: SeasonSelection) => onChange({ ...side, selection });

  const modeItems: { value: SeasonMode; label: string }[] = [
    { value: "season", label: t.modeSeason },
    { value: "career", label: t.modeCareer },
    { value: "lastNSeasons", label: t.modeLastN },
    { value: "age", label: t.modeAge },
  ];

  return (
    <section
      aria-label={meta.name}
      className="glass-panel flex flex-col gap-4 p-4"
      style={{ borderColor: "color-mix(in srgb, " + accent + " 38%, var(--color-border-glass))" }}
    >
      <header className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
        />
        <h3
          className="font-[family-name:var(--font-display)] text-sm font-black uppercase tracking-[0.12em]"
          style={{ color: accent }}
        >
          {meta.name}
        </h3>
      </header>

      <Field label={t.periodMode} htmlFor={`${player}-mode`}>
        <SegmentedControl
          id={`${player}-mode`}
          ariaLabel={t.periodMode}
          value={mode}
          accent={accent}
          items={modeItems}
          onChange={(next) => setSelection(selectionForMode(next, options))}
        />
      </Field>

      {mode === "season" && (
        <Field label={t.selectSeason} htmlFor={`${player}-season`}>
          <Select
            id={`${player}-season`}
            value={side.selection.kind === "season" ? side.selection.season : ""}
            onChange={(season) => setSelection({ kind: "season", season })}
            options={options.seasons.map((s) => ({ value: s, label: s }))}
          />
        </Field>
      )}

      {mode === "lastNSeasons" && (
        <Field label={t.modeLastN} htmlFor={`${player}-lastn`}>
          <Select
            id={`${player}-lastn`}
            value={side.selection.kind === "lastNSeasons" ? String(side.selection.n) : ""}
            onChange={(raw) => setSelection({ kind: "lastNSeasons", n: Number.parseInt(raw, 10) })}
            options={LAST_N_CHOICES.map((n) => ({
              value: String(n),
              label: t.seasonsCount.replace("{n}", String(n)),
            }))}
          />
        </Field>
      )}

      {mode === "age" && (
        <Field label={t.modeAge} htmlFor={`${player}-age`}>
          <Select
            id={`${player}-age`}
            value={side.selection.kind === "age" ? String(side.selection.age) : ""}
            onChange={(raw) => setSelection({ kind: "age", age: Number.parseInt(raw, 10) })}
            options={options.ages.map((age) => ({ value: String(age), label: String(age) }))}
          />
        </Field>
      )}

      <Field label={t.competition} htmlFor={`${player}-comp`}>
        <Select
          id={`${player}-comp`}
          value={side.competition}
          onChange={(raw) => onChange({ ...side, competition: raw as CompetitionFilter })}
          options={COMPETITIONS.map((c) => ({ value: c, label: t[COMP_LABEL_KEYS[c]] }))}
        />
      </Field>

      <PenaltiesToggle
        id={`${player}-pen`}
        label={t.penalties}
        checked={side.includePenalties}
        accent={accent}
        onChange={(includePenalties) => onChange({ ...side, includePenalties })}
      />
    </section>
  );
}
