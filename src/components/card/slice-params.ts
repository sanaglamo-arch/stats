import type { CompetitionFilter, SeasonSelection } from "@/lib/data";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n/dictionaries";
import { DEFAULT_SLICE, type CardSlice, type SideOptions } from "./card-model";

/**
 * URL <-> CardSlice serialization. One canonical place so the render page and
 * the /api/card route agree on the contract. Per side the params are prefixed
 * `m` (Messi) / `r` (Ronaldo):
 *
 *   mSel, rSel   = "career" | "season:2011/12" | "lastN:5" | "age:25"
 *   mComp, rComp = "all" | "league" | "champions_league" | ...
 *   mPen, rPen   = "1" | "0"  (penalties included)
 *   locale       = "en" | "ru"
 *
 * Anything missing or malformed falls back to DEFAULT_SLICE — the route can
 * never throw on bad input.
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
  const side = (prefix: "m" | "r", fallback: SideOptions): SideOptions => ({
    selection: parseSelection(params.get(`${prefix}Sel`), fallback.selection),
    competition: parseCompetition(params.get(`${prefix}Comp`), fallback.competition),
    includePenalties: parsePenalties(params.get(`${prefix}Pen`), fallback.includePenalties),
  });
  return {
    messi: side("m", DEFAULT_SLICE.messi),
    ronaldo: side("r", DEFAULT_SLICE.ronaldo),
  };
}

/** Inverse of sliceFromParams — used to build the render-page URL. */
export function paramsFromSlice(slice: CardSlice, locale: Locale): URLSearchParams {
  const p = new URLSearchParams();
  p.set("mSel", serializeSelection(slice.messi.selection));
  p.set("mComp", slice.messi.competition);
  p.set("mPen", slice.messi.includePenalties ? "1" : "0");
  p.set("rSel", serializeSelection(slice.ronaldo.selection));
  p.set("rComp", slice.ronaldo.competition);
  p.set("rPen", slice.ronaldo.includePenalties ? "1" : "0");
  p.set("locale", locale);
  return p;
}
