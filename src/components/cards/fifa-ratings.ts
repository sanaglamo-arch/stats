import type { PlayerId } from "@/lib/data";

/**
 * ───────────────────────────────────────────────────────────────────────────
 *  FIFA-STYLE COSMETIC RATINGS — *NOT* real Phase-8 statistics.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * These are the well-known peak FIFA-game ratings used purely for the FUT
 * collectible-card flourish on `/cards`. They are decorative chrome — they do
 * NOT come from the data layer and MUST NOT be read by any statistical model.
 * Every REAL number on the page (the category detail panel, the final score)
 * still resolves through `arena-model.ts` over the canonical dataset.
 *
 * A visible "FIFA-style ratings · cosmetic" caption is rendered next to the
 * cards so users always know the real stats live in the comparison/verdict.
 *
 * Values mirror the design reference (ref2-fut-legends):
 *   Ronaldo 94 ST · Messi 93 RW.
 */

/** The six canonical FUT face stats plus a "CLUTCH" flourish stat. */
export type FifaStatKey = "pac" | "sho" | "pas" | "dri" | "def" | "phy" | "clutch";

/** Ordered FUT face-stat keys (PAC/SHO/PAS/DRI/DEF/PHY) — CLUTCH shown apart. */
export const FUT_FACE_STATS: readonly FifaStatKey[] = [
  "pac",
  "sho",
  "pas",
  "dri",
  "def",
  "phy",
] as const;

export type FifaRating = {
  /** Overall rating (top-left of the card). Cosmetic. */
  overall: number;
  /** FUT position token (ST / RW …). Cosmetic. */
  position: string;
  /** Card tint: red = Ronaldo, blue = Messi. */
  side: "ronaldo" | "messi";
  /** The seven cosmetic face stats. */
  stats: Record<FifaStatKey, number>;
};

/**
 * Peak FIFA-style ratings, keyed by the canonical {@link PlayerId}. COSMETIC.
 */
export const FIFA_RATINGS: Record<PlayerId, FifaRating> = {
  ronaldo: {
    overall: 94,
    position: "ST",
    side: "ronaldo",
    stats: { pac: 92, sho: 95, pas: 81, dri: 88, def: 36, phy: 89, clutch: 95 },
  },
  messi: {
    overall: 93,
    position: "RW",
    side: "messi",
    stats: { pac: 86, sho: 92, pas: 96, dri: 97, def: 40, phy: 72, clutch: 94 },
  },
};
