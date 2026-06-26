import { describe, expect, it } from "vitest";
import { dataSource, aggregate, rowsForPlayer, METRIC_KEYS } from "@/lib/data";
import {
  COMPARE_COLUMNS,
  FOCUS_METRICS,
  buildAgeTrend,
  buildCompareCareer,
  buildCompareScope,
  buildCompareTable,
  competitionNameOptions,
  filterForComp,
  isContext,
} from "./compare-model";

const ROWS = dataSource.getAllRows();

describe("compare columns (full inventory)", () => {
  it("covers all 24 catalog metrics + 2 raw shot-volume columns", () => {
    expect(COMPARE_COLUMNS).toHaveLength(METRIC_KEYS.length + 2);
    const keys = new Set(COMPARE_COLUMNS.map((c) => c.key));
    for (const k of METRIC_KEYS) expect(keys.has(k)).toBe(true);
    expect(keys.has("shots")).toBe(true);
    expect(keys.has("shotsOnTarget")).toBe(true);
  });

  it("forces yellow/red cards to «н/д» (forcedNa), never 0", () => {
    const career = buildCompareCareer(ROWS, "all");
    for (const key of ["yellowCards", "redCards"] as const) {
      const row = career.find((r) => r.col.key === key);
      expect(row?.messi).toBeNull();
      expect(row?.ronaldo).toBeNull();
    }
  });

  it("offers only higher-is-better, non-illustrative focus metrics", () => {
    expect(FOCUS_METRICS).toContain("goals");
    expect(FOCUS_METRICS).not.toContain("minutesPerGoal");
    expect(FOCUS_METRICS).not.toContain("yellowCards");
    expect(FOCUS_METRICS).not.toContain("hatTricks");
  });
});

describe("competition resolution (5 contexts + 34 granular names)", () => {
  it("recognizes the type contexts and treats anything else as a granular name", () => {
    expect(isContext("all")).toBe(true);
    expect(isContext("league")).toBe(true);
    expect(isContext("cups")).toBe(true);
    expect(isContext("La Liga")).toBe(false);
  });

  it("exposes every distinct competitionName as an option", () => {
    const names = new Set(ROWS.map((r) => r.competitionName));
    expect(competitionNameOptions(ROWS)).toHaveLength(names.size);
  });

  it("filters by granular competitionName", () => {
    const laLiga = filterForComp(rowsForPlayer(ROWS, "messi"), "La Liga");
    expect(laLiga.length).toBeGreaterThan(0);
    expect(laLiga.every((r) => r.competitionName === "La Liga")).toBe(true);
  });

  it("filters by a type context (league ⊂ all)", () => {
    const all = filterForComp(rowsForPlayer(ROWS, "messi"), "all");
    const league = filterForComp(rowsForPlayer(ROWS, "messi"), "league");
    expect(league.length).toBeGreaterThan(0);
    expect(league.length).toBeLessThan(all.length);
    expect(league.every((r) => r.competitionType === "league")).toBe(true);
  });
});

describe("buildCompareCareer", () => {
  it("matches the canonical aggregate for goals and surfaces a delta + leader", () => {
    const career = buildCompareCareer(ROWS, "all");
    const goals = career.find((r) => r.col.key === "goals");
    const messiGoals = aggregate(rowsForPlayer(ROWS, "messi"), true).goals;
    const ronaldoGoals = aggregate(rowsForPlayer(ROWS, "ronaldo"), true).goals;
    expect(goals?.messi).toBe(messiGoals);
    expect(goals?.ronaldo).toBe(ronaldoGoals);
    expect(goals?.delta).toBe(messiGoals - ronaldoGoals);
    expect(goals?.leader).toBe(messiGoals > ronaldoGoals ? "messi" : "ronaldo");
  });

  it("keeps xG modern-only (career xG is non-null because modern rows exist)", () => {
    const career = buildCompareCareer(ROWS, "all");
    expect(career.find((r) => r.col.key === "xg")?.messi).not.toBeNull();
  });
});

describe("buildCompareTable (season + age)", () => {
  it("season view: unions all seasons, sorts chronologically, career total = aggregate", () => {
    const model = buildCompareTable(ROWS, "all", "season", "goals");
    expect(model.rowHeaderKey).toBe("season");
    const seasons = new Set(ROWS.map((r) => r.season));
    expect(model.rows).toHaveLength(seasons.size);
    const years = model.rows.map((r) => Number.parseInt(r.key.slice(0, 4), 10));
    expect([...years]).toEqual([...years].sort((a, b) => a - b));
    expect(model.total.messi.goals).toBe(aggregate(rowsForPlayer(ROWS, "messi"), true).goals);
  });

  it("emits per-competition-type subtotals only for comp=all", () => {
    expect(buildCompareTable(ROWS, "all", "season", "goals").perType).toHaveLength(6);
    expect(buildCompareTable(ROWS, "league", "season", "goals").perType).toHaveLength(0);
  });

  it("age view: keys are ages, sorted ascending", () => {
    const model = buildCompareTable(ROWS, "all", "age", "goals");
    expect(model.rowHeaderKey).toBe("age");
    const ages = model.rows.map((r) => Number(r.key));
    expect([...ages]).toEqual([...ages].sort((a, b) => a - b));
  });

  it("renders sparse rows honestly (a side can be null, never fabricated)", () => {
    const model = buildCompareTable(ROWS, "all", "season", "goals");
    // Every row must have at least one side present; null sides are allowed.
    for (const row of model.rows) {
      expect(row.messi !== null || row.ronaldo !== null).toBe(true);
    }
  });
});

describe("buildAgeTrend (same-age overlay)", () => {
  it("produces ascending ages with aligned, gap-honest series", () => {
    const trend = buildAgeTrend(ROWS, "all", "goals");
    expect(trend.hasData).toBe(true);
    expect([...trend.ages]).toEqual([...trend.ages].sort((a, b) => a - b));
    expect(trend.messi).toHaveLength(trend.ages.length);
    expect(trend.ronaldo).toHaveLength(trend.ages.length);
    expect(trend.yMax).toBeGreaterThan(0);
  });
});

describe("buildCompareScope", () => {
  it("computes a real scope (222 rows, 24 seasons, ages span)", () => {
    const scope = buildCompareScope(ROWS);
    expect(scope.rows).toBe(ROWS.length);
    expect(scope.seasons).toBe(new Set(ROWS.map((r) => r.season)).size);
    expect(scope.comps).toBe(new Set(ROWS.map((r) => r.competitionName)).size);
    expect(scope.minAge).toBeLessThan(scope.maxAge);
  });
});
