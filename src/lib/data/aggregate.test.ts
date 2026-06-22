import { describe, it, expect } from "vitest";
import {
  rowsForPlayer,
  filterByCompetition,
  filterByCompetitions,
  selectSeasons,
  sliceRows,
  aggregate,
  deriveMetrics,
  buildCardStats,
  compare,
  seasonTrend,
  DEFAULT_METRICS,
  type MetricKey,
} from "./aggregate";
import type { PlayerSeasonComp } from "./types";

/** Small in-repo fixture exercising every slice (no network). */
function row(p: Partial<PlayerSeasonComp> & Pick<PlayerSeasonComp, "player" | "season" | "ageDuringSeason" | "competitionType">): PlayerSeasonComp {
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

const FIXTURE: PlayerSeasonComp[] = [
  // Messi 2011/12, age 24
  row({ player: "messi", season: "2011/12", ageDuringSeason: 24, competitionType: "league", matches: 37, minutes: 3270, goals: 50, penaltyGoals: 7, shots: 234, assists: 16, trophies: ["La Liga"], individualAwards: ["Ballon d'Or"] }),
  row({ player: "messi", season: "2011/12", ageDuringSeason: 24, competitionType: "champions_league", matches: 11, minutes: 990, goals: 14, penaltyGoals: 1, shots: 62, assists: 5 }),
  // Messi 2014/15, age 27 (has xG)
  row({ player: "messi", season: "2014/15", ageDuringSeason: 27, competitionType: "league", matches: 38, minutes: 3210, goals: 43, penaltyGoals: 5, shots: 174, assists: 18, xg: 32.1, xa: 14.6, trophies: ["La Liga"] }),
  // Messi 2013/14, age 26 (pre-2014, no xG)
  row({ player: "messi", season: "2013/14", ageDuringSeason: 26, competitionType: "league", matches: 31, minutes: 2475, goals: 28, penaltyGoals: 8, shots: 154, assists: 11, xg: null }),
  // Ronaldo 2011/12, age 27
  row({ player: "ronaldo", season: "2011/12", ageDuringSeason: 27, competitionType: "league", matches: 38, minutes: 3370, goals: 46, penaltyGoals: 12, shots: 246, assists: 12, trophies: ["La Liga"] }),
  // Ronaldo at age 24 (different calendar year than Messi at 24)
  row({ player: "ronaldo", season: "2008/09", ageDuringSeason: 24, competitionType: "league", matches: 33, minutes: 2756, goals: 18, penaltyGoals: 4, shots: 158, assists: 6, individualAwards: ["Ballon d'Or"] }),
];

describe("rowsForPlayer / filterByCompetition / selectSeasons", () => {
  it("filters by player", () => {
    expect(rowsForPlayer(FIXTURE, "messi")).toHaveLength(4);
    expect(rowsForPlayer(FIXTURE, "ronaldo")).toHaveLength(2);
  });

  it("competition filter sums correctly (slice 2)", () => {
    const messi = rowsForPlayer(FIXTURE, "messi");
    const cl = filterByCompetition(messi, "champions_league");
    expect(cl).toHaveLength(1);
    expect(cl[0].goals).toBe(14);
    expect(filterByCompetition(messi, "all")).toHaveLength(4);
  });

  it("season pick and age alignment select correct rows (slices 1 & 3)", () => {
    const messi = rowsForPlayer(FIXTURE, "messi");
    expect(selectSeasons(messi, { kind: "season", season: "2011/12" })).toHaveLength(2);
    expect(selectSeasons(messi, { kind: "age", age: 27 })).toHaveLength(1);
    // last 2 seasons by recency: 2014/15 and 2013/14
    const last2 = selectSeasons(messi, { kind: "lastNSeasons", n: 2 });
    expect(new Set(last2.map((r) => r.season))).toEqual(new Set(["2014/15", "2013/14"]));
  });

  it("age alignment picks different calendar seasons for each player", () => {
    const messiAt24 = sliceRows(FIXTURE, {
      player: "messi",
      selection: { kind: "age", age: 24 },
      competition: "all",
      includePenalties: true,
    });
    const ronaldoAt24 = sliceRows(FIXTURE, {
      player: "ronaldo",
      selection: { kind: "age", age: 24 },
      competition: "all",
      includePenalties: true,
    });
    expect(messiAt24.every((r) => r.season === "2011/12")).toBe(true);
    expect(ronaldoAt24.every((r) => r.season === "2008/09")).toBe(true);
  });
});

describe("aggregate — penalties on/off (slice 4)", () => {
  it("includes penalty goals when on", () => {
    const messi2011 = sliceRows(FIXTURE, {
      player: "messi",
      selection: { kind: "season", season: "2011/12" },
      competition: "all",
      includePenalties: true,
    });
    const totals = aggregate(messi2011, true);
    expect(totals.goals).toBe(64); // 50 + 14
    expect(totals.penaltyGoals).toBe(8); // 7 + 1
  });

  it("subtracts penalty goals when off", () => {
    const messi2011 = sliceRows(FIXTURE, {
      player: "messi",
      selection: { kind: "season", season: "2011/12" },
      competition: "all",
      includePenalties: false,
    });
    const totals = aggregate(messi2011, false);
    expect(totals.goals).toBe(56); // 64 - 8 penalties
    expect(totals.penaltyGoals).toBe(8); // breakdown still reported
  });

  it("dedupes trophy/award NAMES but counts trophies WON and Ballon d'Or wins", () => {
    const messi2011 = sliceRows(FIXTURE, {
      player: "messi",
      selection: { kind: "season", season: "2011/12" },
      competition: "all",
      includePenalties: true,
    });
    const totals = aggregate(messi2011, true);
    // Distinct names are still deduped for display...
    expect(totals.trophies).toEqual(["La Liga"]);
    expect(totals.individualAwards).toEqual(["Ballon d'Or"]);
    // ...but the COUNTS reflect wins in this single season.
    expect(totals.trophyCount).toBe(1);
    expect(totals.ballonDor).toBe(1);
  });

  it("counts a repeated trophy across seasons as multiple wins (not one)", () => {
    // Messi career fixture: La Liga appears in 2011/12 AND 2014/15.
    const career = sliceRows(FIXTURE, {
      player: "messi",
      selection: { kind: "career" },
      competition: "all",
      includePenalties: true,
    });
    const totals = aggregate(career, true);
    expect(totals.trophies).toEqual(["La Liga"]); // one distinct name
    expect(totals.trophyCount).toBe(2); // but two wins (2011/12 + 2014/15)
    expect(totals.ballonDor).toBe(1); // Ballon d'Or only on 2011/12 in the fixture
  });
});

describe("aggregate — xG honesty line", () => {
  it("sums xG only across rows that have it", () => {
    const messi = rowsForPlayer(FIXTURE, "messi");
    const totals = aggregate(messi, true);
    expect(totals.xg).toBe(32.1); // only 2014/15 has xG
  });

  it("returns null xG when no selected row has it (pre-2014 only)", () => {
    const pre2014 = sliceRows(FIXTURE, {
      player: "messi",
      selection: { kind: "season", season: "2013/14" },
      competition: "all",
      includePenalties: true,
    });
    const totals = aggregate(pre2014, true);
    expect(totals.xg).toBeNull();
    expect(totals.xa).toBeNull();
  });
});

describe("deriveMetrics", () => {
  it("computes goals/90, conversion and xG/90", () => {
    const messi2014 = sliceRows(FIXTURE, {
      player: "messi",
      selection: { kind: "season", season: "2014/15" },
      competition: "all",
      includePenalties: true,
    });
    const totals = aggregate(messi2014, true);
    const d = deriveMetrics(totals);
    expect(d.goalsPer90).toBeCloseTo((43 * 90) / 3210, 2);
    expect(d.shotConversion).toBeCloseTo(43 / 174, 2);
    expect(d.xgPer90).toBeCloseTo((32.1 * 90) / 3210, 2);
  });

  it("returns null xG/90 when xG is null", () => {
    const pre2014 = sliceRows(FIXTURE, {
      player: "messi",
      selection: { kind: "season", season: "2013/14" },
      competition: "all",
      includePenalties: true,
    });
    const d = deriveMetrics(aggregate(pre2014, true));
    expect(d.xgPer90).toBeNull();
  });

  it("guards divide-by-zero for empty selections", () => {
    const d = deriveMetrics(aggregate([], true));
    expect(d.goalsPer90).toBe(0);
    expect(d.shotConversion).toBe(0);
  });
});

describe("buildCardStats", () => {
  it("emits the full stat set with xG null hidden-able pre-2014", () => {
    const pre2014 = sliceRows(FIXTURE, {
      player: "messi",
      selection: { kind: "season", season: "2013/14" },
      competition: "all",
      includePenalties: true,
    });
    const stats = buildCardStats(aggregate(pre2014, true), deriveMetrics(aggregate(pre2014, true)));
    const xg = stats.find((s) => s.key === "xg");
    expect(xg?.value).toBeNull(); // UI hides null stats
    expect(stats.find((s) => s.key === "goals")?.value).toBe(28);
    expect(stats.find((s) => s.key === "redCards")?.higherIsBetter).toBe(false);
  });
});

describe("compare — head-to-head verdict", () => {
  it("scores categories and skips stats where either side is null", () => {
    const result = compare(
      FIXTURE,
      { selection: { kind: "age", age: 24 }, competition: "all", includePenalties: true },
      { selection: { kind: "age", age: 24 }, competition: "all", includePenalties: true },
    );
    // Messi at 24 has xG=null (2011/12), so xG/xA must not be contested.
    const contestedKeys = result.perCategory.map((c) => c.key);
    expect(contestedKeys).not.toContain("xg");
    expect(contestedKeys).not.toContain("xa");
    // Score totals are consistent with per-category winners.
    const messiWins = result.perCategory.filter((c) => c.winner === "messi").length;
    const ronaldoWins = result.perCategory.filter((c) => c.winner === "ronaldo").length;
    expect(result.score.messi).toBe(messiWins);
    expect(result.score.ronaldo).toBe(ronaldoWins);
  });

  it("penalty toggle changes the goal comparison", () => {
    const on = compare(
      FIXTURE,
      { selection: { kind: "season", season: "2011/12" }, competition: "league", includePenalties: true },
      { selection: { kind: "season", season: "2011/12" }, competition: "league", includePenalties: false },
    );
    expect(on.messi.totals.goals).toBe(50);
    expect(on.ronaldo.totals.goals).toBe(34); // 46 - 12 penalties
  });
});

describe("compare — selection-aware verdict (P6-2)", () => {
  const both = {
    selection: { kind: "season" as const, season: "2011/12" },
    competition: "all" as const,
    includePenalties: true,
  };

  it("defaults (no metrics arg) reproduce the full default metric set & order", () => {
    const result = compare(FIXTURE, both, both);
    expect(result.messi.stats.map((s) => s.key)).toEqual(DEFAULT_METRICS);
  });

  it("scores ONLY over the selected metrics, in the selected order", () => {
    const metrics: MetricKey[] = ["assists", "goals"]; // note: reversed order
    const result = compare(FIXTURE, both, both, metrics);
    // Only the two chosen metrics are contested, in the chosen order.
    expect(result.perCategory.map((c) => c.key)).toEqual(["assists", "goals"]);
    // 2011/12: Messi 64 goals / 19 assists vs Ronaldo 46 goals (league only here)
    // — both contested categories go to Messi.
    expect(result.score.messi + result.score.ronaldo).toBeLessThanOrEqual(2);
    expect(result.messi.stats.map((s) => s.key)).toEqual(["assists", "goals"]);
  });

  it("a single-metric selection yields at most a 1:0 / 0:1 score", () => {
    const result = compare(FIXTURE, both, both, ["goals"]);
    expect(result.perCategory).toHaveLength(1);
    expect(result.score.messi + result.score.ronaldo).toBeLessThanOrEqual(1);
  });
});

describe("filterByCompetitions — stacking sets (P6-3)", () => {
  it("keeps rows whose type is in a multi-competition set, summing correctly", () => {
    const messi = rowsForPlayer(FIXTURE, "messi");
    // Messi 2011/12 fixture: league (50 g) + CL (14 g). A 2-comp set sums both.
    const stacked = filterByCompetitions(
      selectSeasons(messi, { kind: "season", season: "2011/12" }),
      ["league", "champions_league"],
    );
    const totals = aggregate(stacked, true);
    expect(totals.goals).toBe(64); // 50 + 14
  });

  it("an empty set passes everything through (acts like 'all')", () => {
    const messi = rowsForPlayer(FIXTURE, "messi");
    expect(filterByCompetitions(messi, [])).toHaveLength(messi.length);
  });

  it("sliceRows routes through the stacking set when present, else single comp", () => {
    const onlyCl = sliceRows(FIXTURE, {
      player: "messi",
      selection: { kind: "season", season: "2011/12" },
      competition: "all",
      competitions: ["champions_league"],
      includePenalties: true,
    });
    expect(onlyCl.every((r) => r.competitionType === "champions_league")).toBe(true);

    // Without `competitions`, the single-competition field still works.
    const single = sliceRows(FIXTURE, {
      player: "messi",
      selection: { kind: "season", season: "2011/12" },
      competition: "league",
      includePenalties: true,
    });
    expect(single.every((r) => r.competitionType === "league")).toBe(true);
  });
});

describe("seasonTrend (P6-4)", () => {
  it("returns ordered per-season values for a real metric", () => {
    const trend = seasonTrend(FIXTURE, "messi", "goals");
    expect(trend.map((p) => p.season)).toEqual(["2011/12", "2013/14", "2014/15"]);
    // 2011/12 = league 50 + CL 14 = 64 (all competitions, penalties on)
    expect(trend[0].value).toBe(64);
    expect(trend[1].value).toBe(28); // 2013/14 league only
  });

  it("respects a competition filter", () => {
    const trend = seasonTrend(FIXTURE, "messi", "goals", { competition: "league" });
    const s2011 = trend.find((p) => p.season === "2011/12");
    expect(s2011?.value).toBe(50); // league only
  });

  it("respects a stacking competition set", () => {
    const trend = seasonTrend(FIXTURE, "messi", "goals", {
      competitions: ["champions_league"],
    });
    expect(trend.map((p) => p.season)).toEqual(["2011/12"]); // only season with a CL row
    expect(trend[0].value).toBe(14);
  });

  it("yields null for a metric unavailable in a season (xG pre-2014)", () => {
    const trend = seasonTrend(FIXTURE, "messi", "xg");
    expect(trend.find((p) => p.season === "2013/14")?.value).toBeNull();
    expect(trend.find((p) => p.season === "2014/15")?.value).toBe(32.1);
  });
});
