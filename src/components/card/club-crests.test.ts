import { describe, expect, it } from "vitest";
import { crestForClub, PLAYER_CLUBS } from "./club-crests";

/** The exact dataset `club` strings for the players' career clubs. */
const CAREER_CLUBS = [
  // Messi
  "Barcelona",
  "Paris Saint-Germain",
  "Inter Miami",
  // Ronaldo
  "Sporting CP",
  "Manchester United",
  "Real Madrid",
  "Juventus",
  "Al Nassr",
] as const;

describe("crestForClub", () => {
  it.each(CAREER_CLUBS)("maps %s to a /crests/*.svg path", (club) => {
    const path = crestForClub(club);
    expect(path).not.toBeNull();
    expect(path).toMatch(/^\/crests\/[a-z-]+\.svg$/);
  });

  it("returns null for an unknown club", () => {
    expect(crestForClub("Some Unknown FC")).toBeNull();
  });

  it("returns null for national-team rows", () => {
    expect(crestForClub("Argentina")).toBeNull();
    expect(crestForClub("Portugal")).toBeNull();
  });

  it("trims and normalizes stray whitespace (dataset has \" Barcelona \")", () => {
    expect(crestForClub(" Barcelona ")).toBe("/crests/barcelona.svg");
    expect(crestForClub("Paris  Saint-Germain")).toBe("/crests/psg.svg");
  });
});

describe("PLAYER_CLUBS", () => {
  it("covers exactly Messi's career clubs in order", () => {
    expect(PLAYER_CLUBS.messi).toEqual(["Barcelona", "Paris Saint-Germain", "Inter Miami"]);
  });

  it("covers exactly Ronaldo's career clubs in order", () => {
    expect(PLAYER_CLUBS.ronaldo).toEqual([
      "Sporting CP",
      "Manchester United",
      "Real Madrid",
      "Juventus",
      "Al Nassr",
    ]);
  });

  it("every listed club resolves to a non-null crest", () => {
    for (const clubs of Object.values(PLAYER_CLUBS)) {
      for (const club of clubs) {
        expect(crestForClub(club)).not.toBeNull();
      }
    }
  });
});
