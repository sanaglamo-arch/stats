import {
  Award,
  Crosshair,
  Goal,
  Hourglass,
  Sparkles,
  Trophy,
  Wand2,
  Globe,
  type LucideIcon,
} from "lucide-react";
import type { CategoryKey } from "./arena-model";

/**
 * One consistent lucide icon family for the category tab bar (ui-ux-pro-max
 * `icon-style-consistent` / `no-emoji-icons`). Keyed by the model's CategoryKey.
 */
export const CATEGORY_ICONS: Record<CategoryKey, LucideIcon> = {
  goals: Goal,
  assists: Wand2,
  trophies: Trophy,
  ballonDor: Award,
  championsLeague: Crosshair,
  worldCup: Globe,
  playmaking: Sparkles,
  longevity: Hourglass,
};
