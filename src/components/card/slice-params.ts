import {
  DEFAULT_METRICS,
  METRIC_CATALOG,
  type CompetitionFilter,
  type CompetitionType,
  type MetricKey,
  type SeasonSelection,
} from "@/lib/data";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n/dictionaries";
import { DEFAULT_SLICE, type CardSlice, type SideOptions } from "./card-model";

/**
 * URL <-> CardSlice serialization. One canonical place so the render page and
 * the /api/card route agree on the contract. Per side the params are prefixed
 * `m` (Messi) / `r` (Ronaldo):
 *
 *   mSel, rSel    = "career" | "season:2011/12" | "lastN:5" | "age:25"
 *   mComp, rComp  = "all" | "league" | "champions_league" | ...
 *   mComps, rComps= comma list of competition types (stacking, P6-3); when
 *                   present & non-empty it OVERRIDES the single mComp/rComp
 *   mPen, rPen    = "1" | "0"  (penalties included)
 *   metrics       = comma list of metric keys (omitted when === DEFAULT_METRICS
 *                   so default URLs stay clean)
 *   locale        = "en" | "ru"
 *
 * Anything missing or malformed falls back to DEFAULT_SLICE — the route can
 * never throw on bad input. paramsFromSlice ⇄ sliceFromParams are exact inverses.
 */

const COMPETITIONS: readonly CompetitionFilter[] = [
  "all",
  "league",
  "champions_league",
  "domestic_cup",
  "super_cup",
  "club_world_cup",
  "national_team",
];

/** Canonical competition TYPES (no "all") for the stacking set. */
const COMPETITION_TYPES: readonly CompetitionType[] = [
  "league",
  "champions_league",
  "domestic_cup",
  "super_cup",
  "club_world_cup",
  "national_team",
];

/** Parse a comma list of competition types, dropping unknowns + duplicates. */
function parseCompetitions(raw: string | null): CompetitionType[] | undefined {
  if (!raw) return undefined;
  const seen = new Set<CompetitionType>();
  for (const token of raw.split(",")) {
    const match = COMPETITION_TYPES.find((c) => c === token.trim());
    if (match) seen.add(match);
  }
  return seen.size > 0 ? [...seen] : undefined;
}

/** Parse a comma list of metric keys; falls back to DEFAULT_METRICS. */
function parseMetrics(raw: string | null): MetricKey[] {
  if (!raw) return [...DEFAULT_METRICS];
  const seen = new Set<MetricKey>();
  const out: MetricKey[] = [];
  for (const token of raw.split(",")) {
    const key = token.trim();
    if (key in METRIC_CATALOG && !seen.has(key as MetricKey)) {
      seen.add(key as MetricKey);
      out.push(key as MetricKey);
    }
  }
  return out.length > 0 ? out : [...DEFAULT_METRICS];
}

/** True when two metric lists are identical (same keys, same order). */
function sameMetrics(a: readonly MetricKey[], b: readonly MetricKey[]): boolean {
  return a.length === b.length && a.every((k, i) => k === b[i]);
}

function parseSelection(raw: string | null, fallback: SeasonSelection): SeasonSelection {
  if (!raw) return fallback;
  if (raw === "career") return { kind: "career" };
  const [kind, arg] = raw.split(":");
  if (kind === "season" && arg) return { kind: "season", season: arg };
  if (kind === "lastN" && arg) {
    const n = Number.parseInt(arg, 10);
    if (Number.isFinite(n) && n > 0) return { kind: "lastNSeasons", n };
  }
  if (kind === "age" && arg) {
    const age = Number.parseInt(arg, 10);
    if (Number.isFinite(age) && age > 0) return { kind: "age", age };
  }
  return fallback;
}

function parseCompetition(raw: string | null, fallback: CompetitionFilter): CompetitionFilter {
  const match = COMPETITIONS.find((c) => c === raw);
  return match ?? fallback;
}

function parsePenalties(raw: string | null, fallback: boolean): boolean {
  if (raw === "1") return true;
  if (raw === "0") return false;
  return fallback;
}

function serializeSelection(sel: SeasonSelection): string {
  switch (sel.kind) {
    case "career":
      return "career";
    case "season":
      return `season:${sel.season}`;
    case "lastNSeasons":
      return `lastN:${sel.n}`;
    case "age":
      return `age:${sel.age}`;
  }
}

export function parseLocale(raw: string | null): Locale {
  const match = LOCALES.find((l) => l === raw);
  return match ?? DEFAULT_LOCALE;
}

/** Build a CardSlice from a URLSearchParams (or any get-able). */
export function sliceFromParams(params: URLSearchParams): CardSlice {
  const side = (prefix: "m" | "r", fallback: SideOptions): SideOptions => {
    const competitions = parseCompetitions(params.get(`${prefix}Comps`));
    const base: SideOptions = {
      selection: parseSelection(params.get(`${prefix}Sel`), fallback.selection),
      competition: parseCompetition(params.get(`${prefix}Comp`), fallback.competition),
      includePenalties: parsePenalties(params.get(`${prefix}Pen`), fallback.includePenalties),
    };
    // Only attach `competitions` when present (keep the field truly optional so
    // round-tripping a slice without it yields an identical object).
    return competitions ? { ...base, competitions } : base;
  };
  return {
    messi: side("m", DEFAULT_SLICE.messi),
    ronaldo: side("r", DEFAULT_SLICE.ronaldo),
    metrics: parseMetrics(params.get("metrics")),
  };
}

/** Inverse of sliceFromParams — used to build the render-page URL. */
export function paramsFromSlice(slice: CardSlice, locale: Locale): URLSearchParams {
  const p = new URLSearchParams();
  const side = (prefix: "m" | "r", opts: SideOptions): void => {
    p.set(`${prefix}Sel`, serializeSelection(opts.selection));
    p.set(`${prefix}Comp`, opts.competition);
    if (opts.competitions && opts.competitions.length > 0) {
      p.set(`${prefix}Comps`, opts.competitions.join(","));
    }
    p.set(`${prefix}Pen`, opts.includePenalties ? "1" : "0");
  };
  side("m", slice.messi);
  side("r", slice.ronaldo);
  // Omit `metrics` when it equals the default → clean default URLs.
  if (!sameMetrics(slice.metrics, DEFAULT_METRICS)) {
    p.set("metrics", slice.metrics.join(","));
  }
  p.set("locale", locale);
  return p;
}
