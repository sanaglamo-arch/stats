import {
  Award,
  CircleDot,
  Crosshair,
  Flame,
  Gauge,
  Goal,
  Hourglass,
  PlusCircle,
  Sparkles,
  Square,
  SquareStack,
  Target,
  Timer,
  Trophy,
  Users,
  Wand2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  METRIC_CATALOG,
  type CardStatKey,
  type CompetitionFilter,
  type CompetitionType,
  type SeasonSelection,
} from "@/lib/data";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { SideOptions } from "./card-model";

/**
 * lucide icon per metric (SPEC §4 — per-stat icon, one consistent icon family).
 * Covers EVERY MetricKey so the card can render any catalog metric.
 */
export const STAT_ICONS: Record<CardStatKey, LucideIcon> = {
  goals: Goal,
  assists: Wand2,
  goalContributions: PlusCircle,
  matches: Users,
  starts: Users,
  minutes: Timer,
  goalsPer90: Gauge,
  assistsPer90: Gauge,
  goalContributionsPer90: Gauge,
  shotConversion: Target,
  shotsOnTargetPct: Target,
  shotsPer90: Zap,
  minutesPerGoal: Hourglass,
  freekickGoals: Sparkles,
  penaltyGoals: CircleDot,
  xg: Crosshair,
  xa: CircleDot,
  xgPer90: Crosshair,
  xaPer90: CircleDot,
  trophies: Trophy,
  ballonDor: Award,
  hatTricks: Flame,
  yellowCards: Square,
  redCards: SquareStack,
};

/** Label dictionary key per metric — sourced from the catalog (single source). */
export function statLabel(t: Dictionary, key: CardStatKey): string {
  return t[METRIC_CATALOG[key].labelKey];
}

const COMP_LABEL_KEYS: Record<CompetitionFilter, keyof Dictionary> = {
  all: "compAll",
  league: "compLeague",
  champions_league: "compChampionsLeague",
  domestic_cup: "compDomesticCup",
  super_cup: "compSuperCup",
  club_world_cup: "compClubWorldCup",
  national_team: "compNationalTeam",
};

export function competitionLabel(t: Dictionary, comp: CompetitionFilter): string {
  return t[COMP_LABEL_KEYS[comp]];
}

/** The cup competition types grouped under the single "Cups" context tab. */
const CUP_TYPES: readonly CompetitionType[] = ["domestic_cup", "super_cup", "club_world_cup"];

/**
 * Human label for a stacking competition set (the global context tabs set
 * `competitions`, keeping `competition:"all"`). The cup trio collapses to a
 * single "Cups" chip; a single type reads as that competition's name; any other
 * mix joins the individual labels.
 */
export function competitionsLabel(t: Dictionary, competitions: readonly CompetitionType[]): string {
  const set = new Set(competitions);
  if (set.size === CUP_TYPES.length && CUP_TYPES.every((c) => set.has(c))) {
    return t.compCups;
  }
  return competitions.map((c) => competitionLabel(t, c)).join(" + ");
}

/** Human label for a season selection, e.g. "2011/12", "Career", "At age 25". */
export function selectionLabel(t: Dictionary, selection: SeasonSelection): string {
  switch (selection.kind) {
    case "career":
      return t.career;
    case "season":
      return selection.season;
    case "lastNSeasons":
      return t.lastNSeasons.replace("{n}", String(selection.n));
    case "age":
      return t.atAge.replace("{age}", String(selection.age));
  }
}

/** Active-filter chips for one side, excluding the always-shown period itself. */
export function contextChips(t: Dictionary, opts: SideOptions): string[] {
  const chips: string[] = [];
  // The stacking `competitions` set (set by the global context tabs) takes
  // precedence over the single `competition` field, mirroring the data layer.
  if (opts.competitions && opts.competitions.length > 0) {
    chips.push(competitionsLabel(t, opts.competitions));
  } else if (opts.competition !== "all") {
    chips.push(competitionLabel(t, opts.competition));
  }
  chips.push(opts.includePenalties ? t.penaltiesIncluded : t.penaltiesExcluded);
  return chips;
}

/**
 * Format a stat value with the right decimals. `percent` metrics (a 0..1 ratio)
 * are rendered as a percentage; large counts (minutes) get thousands grouping.
 * Driven by the metric catalog's `format` so every metric renders consistently.
 */
export function formatStatValue(key: CardStatKey, value: number, decimals: number): string {
  const format = METRIC_CATALOG[key].format;
  if (format === "percent") {
    return `${(value * 100).toFixed(0)}%`;
  }
  if (key === "minutes" || key === "minutesPerGoal") {
    return new Intl.NumberFormat("en-US").format(Math.round(value));
  }
  return value.toFixed(decimals);
}
