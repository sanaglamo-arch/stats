import {
  Award,
  CircleDot,
  Crosshair,
  Gauge,
  Goal,
  Square,
  SquareStack,
  Target,
  Timer,
  Trophy,
  Users,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import type { CardStatKey, CompetitionFilter, SeasonSelection } from "@/lib/data";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { SideOptions } from "./card-model";

/** lucide icon per stat (SPEC §4 — per-stat icon, one consistent icon family). */
export const STAT_ICONS: Record<CardStatKey, LucideIcon> = {
  goals: Goal,
  assists: Wand2,
  matches: Users,
  minutes: Timer,
  goalsPer90: Gauge,
  shotConversion: Target,
  xg: Crosshair,
  xa: CircleDot,
  trophies: Trophy,
  ballonDor: Award,
  yellowCards: Square,
  redCards: SquareStack,
};

const STAT_LABEL_KEYS: Record<CardStatKey, keyof Dictionary> = {
  goals: "statGoals",
  assists: "statAssists",
  matches: "statMatches",
  minutes: "statMinutes",
  goalsPer90: "statGoalsPer90",
  shotConversion: "statShotConversion",
  xg: "statXg",
  xa: "statXa",
  trophies: "statTrophies",
  ballonDor: "statBallonDor",
  yellowCards: "statYellowCards",
  redCards: "statRedCards",
};

export function statLabel(t: Dictionary, key: CardStatKey): string {
  return t[STAT_LABEL_KEYS[key]];
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
  if (opts.competition !== "all") chips.push(competitionLabel(t, opts.competition));
  chips.push(opts.includePenalties ? t.penaltiesIncluded : t.penaltiesExcluded);
  return chips;
}

/**
 * Format a stat value with the right decimals. Shot conversion is a 0..1 ratio
 * → rendered as a percentage so the card reads naturally.
 */
export function formatStatValue(key: CardStatKey, value: number, decimals: number): string {
  if (key === "shotConversion") {
    return `${(value * 100).toFixed(0)}%`;
  }
  if (key === "minutes") {
    return new Intl.NumberFormat("en-US").format(Math.round(value));
  }
  return value.toFixed(decimals);
}
