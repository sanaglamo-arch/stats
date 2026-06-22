import { describe, it, expect } from "vitest";
import type { PlayerSeasonComp } from "@/lib/data";
import { buildTrendModel } from "./trend-model";

function row(
  p: Partial<PlayerSeasonComp> &
    Pick<PlayerSeasonComp, "player" | "season" | "ageDuringSeason" | "competitionType">,
): PlayerSeasonComp {
  return {
    club: "Test FC",
    competitionName: "Test",
    matches: 0,
    starts: 0,
    minutes: 0,
    goals: 0,
    penaltyGoals: 0,
    freekickGoals: 0,
    assists: 0,
    shots: 0,
    shotsOnTarget: 0,
    xg: null,
    xa: null,
    yellowCards: 0,
    redCards: 0,
    hatTricks: 0,
    trophies: [],
    individualAwards: [],
    verified: false,
    source: { adapter: "wikidata", origin: "seed", enrichedBy: [] },
    ...p,
  };
}

const ROWS: PlayerSeasonComp[] = [
  // Messi: 2012/13 (no xG), 2013/14 (no xG), 2014/15 (xG present)
  row({
    player: "messi",
    season: "2012/13",
    ageDuringSeason: 25,
    competitionType: "league",
    goals: 46,
    minutes: 3000,
    xg: null,
  }),
  row({
    player: "messi",
    season: "2013/14",
    ageDuringSeason: 26,
    competitionType: "league",
    goals: 28,
    minutes: 2400,
    xg: null,
  }),
  row({
    player: "messi",
    season: "2014/15",
    ageDuringSeason: 27,
    competitionType: "league",
    goals: 43,
    minutes: 3200,
    xg: 32.1,
  }),
  // Ronaldo: only 2013/14 and 2014/15 (gap at 2012/13 — different season set)
  row({
    player: "ronaldo",
    season: "2013/14",
    ageDuringSeason: 29,
    competitionType: "league",
    goals: 31,
    minutes: 2900,
    xg: null,
  }),
  row({
    player: "ronaldo",
    season: "2014/15",
    ageDuringSeason: 30,
    competitionType: "league",
    goals: 48,
    minutes: 3100,
    xg: 28.4,
  }),
];

describe("buildTrendModel", () => {
  it("unions both players' seasons in chronological order", () => {
    const m = buildTrendModel(ROWS, "goals");
    expect(m.seasons).toEqual(["2012/13", "2013/14", "2014/15"]);
  });

  it("aligns each player's values to the union x-axis with null for missing seasons", () => {
    const m = buildTrendModel(ROWS, "goals");
    expect(m.messi).toEqual([46, 28, 43]);
    // Ronaldo has no 2012/13 row → null gap at index 0.
    expect(m.ronaldo).toEqual([null, 31, 48]);
  });

  it("keeps null gaps for unavailable metrics (xG pre-2014) — never faked", () => {
    const m = buildTrendModel(ROWS, "xg");
    // Messi: 2012/13 null, 2013/14 null, 2014/15 32.1
    expect(m.messi).toEqual([null, null, 32.1]);
    // Ronaldo: no 2012/13, 2013/14 null, 2014/15 28.4
    expect(m.ronaldo).toEqual([null, null, 28.4]);
  });

  it("computes a shared 'nice' y-scale covering both series", () => {
    const m = buildTrendModel(ROWS, "goals");
    expect(m.yMin).toBe(0);
    // max raw is 48 → niceCeil rounds up to 50.
    expect(m.yMax).toBe(50);
    expect(m.hasData).toBe(true);
  });

  it("flags hasData=false when the metric has no values in any season", () => {
    // assists are all 0 here, but 0 is a real value → hasData true.
    const m = buildTrendModel(ROWS, "assists");
    expect(m.hasData).toBe(true);
    expect(m.yMax).toBeGreaterThanOrEqual(1);

    // A metric that is null everywhere (xa never set) → no data.
    const none = buildTrendModel(ROWS, "xa");
    expect(none.hasData).toBe(false);
    expect(none.messi.every((v) => v === null)).toBe(true);
    expect(none.ronaldo.every((v) => v === null)).toBe(true);
  });

  it("respects the competitions filter via opts", () => {
    const withCl: PlayerSeasonComp[] = [
      ...ROWS,
      row({
        player: "messi",
        season: "2014/15",
        ageDuringSeason: 27,
        competitionType: "champions_league",
        goals: 10,
        minutes: 900,
      }),
    ];
    const leagueOnly = buildTrendModel(withCl, "goals", { competitions: ["league"] });
    // 2014/15 Messi stays 43 (CL row excluded).
    const idx = leagueOnly.seasons.indexOf("2014/15");
    expect(leagueOnly.messi[idx]).toBe(43);
  });
});
