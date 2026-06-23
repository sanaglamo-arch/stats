import type { PlayerId } from "@/lib/data";

/**
 * Maps each career club (exact dataset `club` string) to an ORIGINAL stylized
 * crest asset in `/public/crests/*.svg`.
 *
 * ⚠️ These crests are original placeholder marks — NOT official trademarked club
 * vector art. Official/licensed crests must be cleared before public launch (see
 * DATA_REPORT.md, same spirit as the player-photo rights note).
 *
 * National-team "clubs" in the dataset ("Argentina", "Portugal") and any unknown
 * string deliberately have no entry → `crestForClub` returns `null` so the card
 * can gracefully omit the accent (no broken image).
 */
const CREST_BY_CLUB: Record<string, string> = {
  // Messi
  Barcelona: "/crests/barcelona.svg",
  "Paris Saint-Germain": "/crests/psg.svg",
  "Inter Miami": "/crests/inter-miami.svg",
  // Ronaldo
  "Sporting CP": "/crests/sporting.svg",
  "Manchester United": "/crests/man-united.svg",
  "Real Madrid": "/crests/real-madrid.svg",
  Juventus: "/crests/juventus.svg",
  "Al Nassr": "/crests/al-nassr.svg",
};

/**
 * Resolve a club's crest path. Input is trimmed/normalized (the dataset has
 * stray-whitespace rows like `" Barcelona "`). Returns `null` for any club not
 * in the career map (unknown clubs, national teams) so callers can omit cleanly.
 */
export function crestForClub(club: string): string | null {
  const normalized = club.trim().replace(/\s+/g, " ");
  return CREST_BY_CLUB[normalized] ?? null;
}

/**
 * Ordered (chronological) career-club list per player, for the upcoming profile
 * page (P7-5) to consume. Order matches each player's real career timeline.
 */
export const PLAYER_CLUBS: Record<PlayerId, string[]> = {
  messi: ["Barcelona", "Paris Saint-Germain", "Inter Miami"],
  ronaldo: ["Sporting CP", "Manchester United", "Real Madrid", "Juventus", "Al Nassr"],
};
