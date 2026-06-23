import type { PlayerId } from "@/lib/data";

/**
 * Static, non-statistical facts about the two fixed players (SPEC §2 hardcode).
 * These are identity attributes (name, nationality, position, accent), NOT
 * numbers — numbers always come from the data layer. The club shown on the card
 * is derived per-slice from the selected rows, so it is NOT stored here.
 */
export type PlayerMeta = {
  id: PlayerId;
  /** Display name on the card header. */
  name: string;
  /** Primary playing position label. */
  position: string;
  /** National team. */
  nationality: string;
  /** ISO-ish two-letter code used to pick the flag asset. */
  countryCode: string;
  /**
   * Path to the player photo. Real licensed photos (Wikimedia Commons, CC BY 4.0
   * — attribution recorded in DATA_REPORT.md §8). Silhouette SVGs are kept in
   * public/players/*.svg as a fallback.
   */
  photoSrc: string;
  /** Side accent color variable name (matches globals.css tokens). */
  accentVar: string;
  /** Date of birth (ISO) — drives the computed Age in the Arena identity card. */
  dob: string;
  /** Standing height in centimetres (well-known static fact). */
  heightCm: number;
  /** Preferred foot (well-known static fact). */
  foot: "Left" | "Right";
};

/** Whole-years age as of `asOf` (defaults to now). Pure; no locale leak. */
export function ageFromDob(dob: string, asOf: Date = new Date()): number {
  const birth = new Date(dob);
  let age = asOf.getFullYear() - birth.getFullYear();
  const m = asOf.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && asOf.getDate() < birth.getDate())) age -= 1;
  return age;
}

export const PLAYER_META: Record<PlayerId, PlayerMeta> = {
  messi: {
    id: "messi",
    name: "Lionel Messi",
    position: "Forward",
    nationality: "Argentina",
    countryCode: "ar",
    photoSrc: "/players/messi.jpg",
    accentVar: "--color-messi",
    dob: "1987-06-24",
    heightCm: 170,
    foot: "Left",
  },
  ronaldo: {
    id: "ronaldo",
    name: "Cristiano Ronaldo",
    position: "Forward",
    nationality: "Portugal",
    countryCode: "pt",
    photoSrc: "/players/ronaldo.jpg",
    accentVar: "--color-ronaldo",
    dob: "1985-02-05",
    heightCm: 187,
    foot: "Right",
  },
};
