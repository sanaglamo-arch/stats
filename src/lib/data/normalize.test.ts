import { describe, it, expect } from "vitest";
import {
  classifyCompetition,
  normalizeSeasonLabel,
  toNumber,
  normalizeSeasonRecord,
  enrichWithAdvanced,
  enrichWithShots,
  type RawSeasonRecord,
  type RawAdvancedRecord,
  type RawShotRecord,
} from "./normalize";
import type { PlayerSeasonComp } from "./types";

describe("normalizeSeasonLabel", () => {
  it("normalizes dash and four-digit-end forms to YYYY/YY", () => {
    expect(normalizeSeasonLabel("2011/12")).toBe("2011/12");
    expect(normalizeSeasonLabel("2011-12")).toBe("2011/12");
    expect(normalizeSeasonLabel("2011/2012")).toBe("2011/12");
    expect(normalizeSeasonLabel(" 2004/05 ")).toBe("2004/05");
  });

  it("leaves unrecognized labels untouched", () => {
    expect(normalizeSeasonLabel("career")).toBe("career");
  });
});

describe("toNumber", () => {
  it("coerces strings and guards non-finite", () => {
    expect(toNumber("12")).toBe(12);
    expect(toNumber("3.5")).toBe(3.5);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber("not-a-number")).toBe(0);
  });
});

describe("classifyCompetition", () => {
  it("maps free-text names to canonical buckets", () => {
    expect(classifyCompetition("UEFA Champions League")).toBe("champions_league");
    expect(classifyCompetition("La Liga")).toBe("league");
    expect(classifyCompetition("Premier League")).toBe("league");
    expect(classifyCompetition("Copa del Rey")).toBe("domestic_cup");
    expect(classifyCompetition("FA Cup")).toBe("domestic_cup");
    expect(classifyCompetition("Supercopa de España")).toBe("super_cup");
    expect(classifyCompetition("FIFA Club World Cup")).toBe("club_world_cup");
    expect(classifyCompetition("Argentina national team")).toBe("national_team");
  });

  it("defaults unknown names to league rather than dropping", () => {
    expect(classifyCompetition("Some Friendly Trophy")).toBe("league");
  });
});

describe("normalizeSeasonRecord", () => {
  const raw: RawSeasonRecord = {
    player: "messi",
    season: "2011-12",
    age: "24",
    club: " Barcelona ",
    competitionName: "La Liga",
    matches: "37",
    goals: "50",
    assists: "16",
  };

  it("produces a canonical row with xG/xA null and verified false", () => {
    const row = normalizeSeasonRecord(raw, "wikidata");
    expect(row.season).toBe("2011/12");
    expect(row.ageDuringSeason).toBe(24);
    expect(row.club).toBe("Barcelona");
    expect(row.competitionType).toBe("league");
    expect(row.matches).toBe(37);
    expect(row.goals).toBe(50);
    expect(row.xg).toBeNull();
    expect(row.xa).toBeNull();
    expect(row.verified).toBe(false);
    expect(row.source).toEqual({ adapter: "wikidata", origin: "fetched", enrichedBy: [] });
  });

  it("defaults missing numeric fields to 0", () => {
    const row = normalizeSeasonRecord(raw, "wikidata");
    expect(row.minutes).toBe(0);
    expect(row.penaltyGoals).toBe(0);
    expect(row.redCards).toBe(0);
  });
});

describe("enrichWithAdvanced", () => {
  const base: PlayerSeasonComp[] = [
    {
      player: "messi",
      season: "2014/15",
      ageDuringSeason: 27,
      club: "Barcelona",
      competitionType: "league",
      competitionName: "La Liga",
      matches: 38,
      starts: 35,
      minutes: 3210,
      goals: 43,
      penaltyGoals: 5,
      freekickGoals: 4,
      assists: 18,
      shots: 174,
      shotsOnTarget: 92,
      xg: null,
      xa: null,
      yellowCards: 0,
      redCards: 0,
      hatTricks: 0,
      trophies: [],
      individualAwards: [],
      verified: false,
      source: { adapter: "wikidata", origin: "fetched", enrichedBy: [] },
    },
    {
      player: "messi",
      season: "2011/12",
      ageDuringSeason: 24,
      club: "Barcelona",
      competitionType: "league",
      competitionName: "La Liga",
      matches: 37,
      starts: 36,
      minutes: 3270,
      goals: 50,
      penaltyGoals: 7,
      freekickGoals: 3,
      assists: 16,
      shots: 234,
      shotsOnTarget: 124,
      xg: null,
      xa: null,
      yellowCards: 0,
      redCards: 0,
      hatTricks: 0,
      trophies: [],
      individualAwards: [],
      verified: false,
      source: { adapter: "wikidata", origin: "fetched", enrichedBy: [] },
    },
  ];

  // Advanced records arrive with season labels already in YYYY/YY form (the
  // Understat adapter converts "2014" → "2014/15" before calling enrich).
  const advanced: RawAdvancedRecord[] = [
    { player: "messi", season: "2014/15", xg: "32.1", xa: "14.6" },
    { player: "messi", season: "2011/12", xg: "40.0", xa: "20.0" },
  ];

  it("fills xG/xA for 2014+ seasons and records the enricher", () => {
    const enriched = enrichWithAdvanced(base, advanced, "understat");
    const row = enriched.find((r) => r.season === "2014/15");
    expect(row?.xg).toBe(32.1);
    expect(row?.xa).toBe(14.6);
    expect(row?.source.enrichedBy).toContain("understat");
  });

  it("keeps xG/xA null for pre-2014 seasons (honesty line)", () => {
    const enriched = enrichWithAdvanced(base, advanced, "understat");
    const row = enriched.find((r) => r.season === "2011/12");
    expect(row?.xg).toBeNull();
    expect(row?.xa).toBeNull();
  });

  it("does not mutate the input rows", () => {
    enrichWithAdvanced(base, advanced, "understat");
    expect(base[0].xg).toBeNull();
  });

  // Regression: Understat xG/xA must attach to the player-season's LEAGUE row
  // regardless of the league's name, and never to non-league rows of the same
  // season. Previously the overlay keyed by competitionName="La Liga" and so
  // missed Serie A / Premier League / etc. when Understat went live.
  it("attaches xG/xA to a non-La-Liga league row by (player, season, league)", () => {
    const mixed: PlayerSeasonComp[] = [
      // Serie A league row (NOT La Liga) — should receive xG/xA.
      {
        ...base[0],
        player: "ronaldo",
        season: "2018/19",
        ageDuringSeason: 34,
        club: "Juventus",
        competitionType: "league",
        competitionName: "Serie A",
      },
      // UCL row of the SAME player-season — must stay null (not a league row).
      {
        ...base[0],
        player: "ronaldo",
        season: "2018/19",
        ageDuringSeason: 34,
        club: "Juventus",
        competitionType: "champions_league",
        competitionName: "UEFA Champions League",
      },
    ];
    const advancedSerieA: RawAdvancedRecord[] = [
      { player: "ronaldo", season: "2018/19", xg: "27.3", xa: "5.4" },
    ];

    const enriched = enrichWithAdvanced(mixed, advancedSerieA, "understat");
    const leagueRow = enriched.find((r) => r.competitionType === "league");
    const uclRow = enriched.find((r) => r.competitionType === "champions_league");

    expect(leagueRow?.competitionName).toBe("Serie A");
    expect(leagueRow?.xg).toBe(27.3);
    expect(leagueRow?.xa).toBe(5.4);
    expect(leagueRow?.source.enrichedBy).toContain("understat");
    // xG/xA must land ONLY on the league row, nowhere else.
    expect(uclRow?.xg).toBeNull();
    expect(uclRow?.xa).toBeNull();
    expect(uclRow?.source.enrichedBy).not.toContain("understat");
  });
});

describe("enrichWithShots", () => {
  const base: PlayerSeasonComp[] = [
    {
      player: "messi",
      season: "2014/15",
      ageDuringSeason: 27,
      club: "Barcelona",
      competitionType: "league",
      competitionName: "La Liga",
      matches: 38,
      starts: 35,
      minutes: 3210,
      goals: 43,
      penaltyGoals: 5,
      freekickGoals: 4,
      assists: 18,
      shots: 100, // seed value, should be overwritten by overlay
      shotsOnTarget: 50,
      xg: null,
      xa: null,
      yellowCards: 0,
      redCards: 0,
      hatTricks: 0,
      trophies: [],
      individualAwards: [],
      verified: false,
      source: { adapter: "wikidata", origin: "fetched", enrichedBy: [] },
    },
  ];

  it("overlays shots/SoT/cards and records the enricher (FBref path)", () => {
    const records: RawShotRecord[] = [
      {
        player: "messi",
        season: "2014-2015", // un-normalized label — overlay normalizes it
        competitionName: "La Liga",
        shots: 174,
        shotsOnTarget: 92,
        yellowCards: 3,
        redCards: 0,
      },
    ];
    const enriched = enrichWithShots(base, records, "fbref");
    const row = enriched[0];
    expect(row.shots).toBe(174);
    expect(row.shotsOnTarget).toBe(92);
    expect(row.yellowCards).toBe(3);
    expect(row.source.enrichedBy).toContain("fbref");
  });

  it("keeps seed values when the overlay carries zero and does not mutate input", () => {
    const records: RawShotRecord[] = [
      {
        player: "messi",
        season: "2014/15",
        competitionName: "La Liga",
        shots: 0, // zero → keep seed shots
        shotsOnTarget: 92,
        yellowCards: 0,
        redCards: 0,
      },
    ];
    const enriched = enrichWithShots(base, records, "fbref");
    expect(enriched[0].shots).toBe(100); // seed retained
    expect(enriched[0].shotsOnTarget).toBe(92);
    expect(base[0].shots).toBe(100); // input untouched
  });

  it("leaves rows with no matching overlay record unchanged", () => {
    const enriched = enrichWithShots(base, [], "fbref");
    expect(enriched[0].shots).toBe(100);
    expect(enriched[0].source.enrichedBy).not.toContain("fbref");
  });
});
