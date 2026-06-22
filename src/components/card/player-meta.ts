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
  /** Path to the stylized silhouette placeholder asset. */
  photoSrc: string;
  /** Side accent color variable name (matches globals.css tokens). */
  accentVar: string;
};

export const PLAYER_META: Record<PlayerId, PlayerMeta> = {
  messi: {
    id: "messi",
    name: "Lionel Messi",
    position: "Forward",
    nationality: "Argentina",
    countryCode: "ar",
    photoSrc: "/players/messi.svg",
    accentVar: "--color-messi",
  },
  ronaldo: {
    id: "ronaldo",
    name: "Cristiano Ronaldo",
    position: "Forward",
    nationality: "Portugal",
    countryCode: "pt",
    photoSrc: "/players/ronaldo.svg",
    accentVar: "--color-ronaldo",
  },
};
