"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { motion, useReducedMotion } from "framer-motion";
import type { CompetitionType } from "@/lib/data";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { SPRING } from "@/lib/motion/tokens";

/**
 * The PRIMARY context switcher (P6-10). A single full-width tab bar at the top of
 * the studio that sets the competition context GLOBALLY — applied to BOTH players
 * at once (no per-player competition stacking). Active tab → the global
 * `competitions` set both sides share. Built on @radix-ui/react-tabs for keyboard
 * + roving-focus a11y; a framer `layoutId` pill glides under the active tab
 * (transform-only, reduced-motion safe).
 *
 * The card's period-plaque context chip reflects the active tab via the slice's
 * `competitions` field (see card-labels `contextChips`).
 */

/** A tab's id and the competition set it applies to both players. */
export type CompetitionContext =
  | "all"
  | "league"
  | "champions_league"
  | "national_team"
  | "cups";

/** The stacking competition set each tab maps onto (undefined === "all"). */
const TAB_COMPETITIONS: Record<CompetitionContext, CompetitionType[] | undefined> = {
  all: undefined,
  league: ["league"],
  champions_league: ["champions_league"],
  national_team: ["national_team"],
  cups: ["domestic_cup", "super_cup", "club_world_cup"],
};

export function competitionsForContext(ctx: CompetitionContext): CompetitionType[] | undefined {
  const set = TAB_COMPETITIONS[ctx];
  return set ? [...set] : undefined;
}

/** Derive the active tab from a slice's `competitions` set (both sides share). */
export function contextFromCompetitions(
  competitions: readonly CompetitionType[] | undefined,
): CompetitionContext {
  if (!competitions || competitions.length === 0) return "all";
  const set = new Set(competitions);
  const sameAs = (members: readonly CompetitionType[]) =>
    members.length === set.size && members.every((m) => set.has(m));
  if (sameAs(["league"])) return "league";
  if (sameAs(["champions_league"])) return "champions_league";
  if (sameAs(["national_team"])) return "national_team";
  if (sameAs(["domestic_cup", "super_cup", "club_world_cup"])) return "cups";
  return "all";
}

export function CompetitionTabs({
  value,
  t,
  onChange,
}: {
  value: CompetitionContext;
  t: Dictionary;
  onChange: (next: CompetitionContext) => void;
}) {
  const reduce = useReducedMotion();
  const items: { value: CompetitionContext; label: string }[] = [
    { value: "all", label: t.compTabAll },
    { value: "league", label: t.compTabLeague },
    { value: "champions_league", label: t.compTabChampionsLeague },
    { value: "national_team", label: t.compTabNationalTeam },
    { value: "cups", label: t.compTabCups },
  ];

  return (
    <Tabs.Root
      value={value}
      onValueChange={(v) => onChange(v as CompetitionContext)}
      aria-label={t.competitionContext}
    >
      <Tabs.List
        aria-label={t.competitionContext}
        className="flex w-full flex-wrap gap-1.5 rounded-[var(--radius-lg)] border border-[var(--color-border-glass)] bg-[var(--color-surface)] p-1.5"
      >
        {items.map((item) => {
          const active = item.value === value;
          return (
            <Tabs.Trigger
              key={item.value}
              value={item.value}
              className={`relative flex-1 cursor-pointer rounded-[var(--radius-md)] px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.06em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)] ${
                active
                  ? "text-[var(--color-bg-base)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
              style={{ minWidth: "fit-content" }}
            >
              {active && (
                <motion.span
                  layoutId="comp-tab-indicator"
                  aria-hidden
                  className="absolute inset-0 -z-0 rounded-[var(--radius-md)]"
                  style={{
                    background: "var(--color-gold)",
                    boxShadow: "var(--shadow-glow-gold)",
                  }}
                  transition={reduce ? { duration: 0 } : SPRING.press}
                />
              )}
              <span className="relative z-10 whitespace-nowrap">{item.label}</span>
            </Tabs.Trigger>
          );
        })}
      </Tabs.List>
    </Tabs.Root>
  );
}
