import { describe, expect, it } from "vitest";
import { dataSource } from "@/lib/data";
import { buildArenaModel, selectLeagueSplit } from "./arena-model";

const ROWS = dataSource.getAllRows();

// The user-facing league label keys the by-league strip may surface (UX.md table).
const LEAGUE_LABELS = new Set([
  "arenaLeaguePremierLeague",
  "arenaLeagueLaLiga",
  "arenaLeagueSerieA",
  "arenaLeagueLigue1",
  "arenaLeaguePrimeiraLiga",
  "arenaLeagueSaudiProLeague",
  "arenaLeagueMls",
]);

describe("selectLeagueSplit (P10-5 by-league evidence)", () => {
  it("returns named-league rows with both values, a local winner and [0,1] fills", () => {
    const split = selectLeagueSplit(ROWS, "goals");
    expect(split.length).toBeGreaterThan(0);
    for (const row of split) {
      expect(LEAGUE_LABELS.has(row.labelKey as string)).toBe(true);
      expect(Number.isFinite(row.messi)).toBe(true);
      expect(Number.isFinite(row.ronaldo)).toBe(true);
      expect(["messi", "ronaldo", "tie"]).toContain(row.winner);
      for (const f of [row.messiFill, row.ronaldoFill]) {
        expect(f).toBeGreaterThanOrEqual(0);
        expect(f).toBeLessThanOrEqual(1);
      }
    }
  });

  it("omits leagues where neither player has a value (never pads empty rows)", () => {
    const split = selectLeagueSplit(ROWS, "goals");
    for (const row of split) {
      expect(row.messi + row.ronaldo).toBeGreaterThan(0);
    }
  });

  it("groups both players by league name, not club (Real + Barça → one La Liga row)", () => {
    const split = selectLeagueSplit(ROWS, "goals");
    const laLiga = split.filter((r) => r.labelKey === "arenaLeagueLaLiga");
    expect(laLiga).toHaveLength(1);
    // Both played La Liga, so both sides are non-zero on the single grouped row.
    expect(laLiga[0].messi).toBeGreaterThan(0);
    expect(laLiga[0].ronaldo).toBeGreaterThan(0);
  });

  it("the per-league sum reconciles with the aggregate League total of the model", () => {
    // The aggregate "League Goals" sub-metric (model) must equal the sum of the
    // by-league goals for the same player — same machinery, just sub-grouped.
    const split = selectLeagueSplit(ROWS, "goals");
    const messiByLeague = split.reduce((s, r) => s + r.messi, 0);
    const ronaldoByLeague = split.reduce((s, r) => s + r.ronaldo, 0);

    const model = buildArenaModel(ROWS);
    const goals = model.categories.find((c) => c.key === "goals")!;
    const leagueRow = goals.rows.find((r) => r.labelKey === "arenaRowLeagueGoals")!;
    expect(messiByLeague).toBe(leagueRow.messi);
    expect(ronaldoByLeague).toBe(leagueRow.ronaldo);
  });

  it("works for assists and trophies metrics too", () => {
    expect(selectLeagueSplit(ROWS, "assists").length).toBeGreaterThan(0);
    expect(selectLeagueSplit(ROWS, "trophies").length).toBeGreaterThan(0);
  });
});

describe("by-league split is attached only where league data exists", () => {
  const model = buildArenaModel(ROWS);

  it("attaches leagueSplit to the League sub-metric rows of Goals/Assists/Trophies only", () => {
    const expected: Record<string, string> = {
      goals: "arenaRowLeagueGoals",
      assists: "arenaRowLeagueAssists",
      trophies: "arenaRowLeagueTitles",
    };
    for (const cat of model.categories) {
      for (const row of cat.rows) {
        if (row.leagueSplit) {
          // Only the designated league sub-metric rows carry a split.
          expect(row.labelKey).toBe(expected[cat.key]);
          expect(row.leagueSplit.length).toBeGreaterThan(0);
        }
      }
    }
    // And each of the three categories actually has its split.
    for (const [key, labelKey] of Object.entries(expected)) {
      const cat = model.categories.find((c) => c.key === key)!;
      const row = cat.rows.find((r) => r.labelKey === labelKey)!;
      expect(row.leagueSplit, `${key} should carry a by-league split`).toBeDefined();
    }
  });

  it("does NOT attach a split to non-league-bearing categories", () => {
    for (const key of ["ballonDor", "championsLeague", "worldCup", "longevity"]) {
      const cat = model.categories.find((c) => c.key === key)!;
      expect(cat.rows.some((r) => r.leagueSplit)).toBe(false);
    }
  });
});

describe("by-league split is read-only — it never changes the verdict", () => {
  it("the local per-league markers are not tallied into the category/verdict", () => {
    const model = buildArenaModel(ROWS);

    // Recompute the category winners purely from each row's own `winner` (the
    // aggregate sub-metric votes), exactly as buildArenaModel does — the league
    // split rows must NOT participate. We assert the category winner equals the
    // row-wins tally, proving the split markers are inert.
    for (const cat of model.categories) {
      let r = 0;
      let m = 0;
      for (const row of cat.rows) {
        if (row.winner === "ronaldo") r += 1;
        else if (row.winner === "messi") m += 1;
      }
      const expected = r === m ? "tie" : r > m ? "ronaldo" : "messi";
      expect(cat.winner).toBe(expected);
    }
  });
});
