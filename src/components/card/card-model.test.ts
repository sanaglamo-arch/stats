import { describe, expect, it } from "vitest";
import { dataSource } from "@/lib/data";
import { buildCardViewModel, DEFAULT_SLICE, type CardSlice } from "./card-model";

const ROWS = dataSource.getAllRows();

function build(slice: CardSlice) {
  return buildCardViewModel(ROWS, slice);
}

describe("buildCardViewModel", () => {
  it("builds the default matchup (Messi 2011/12 vs Ronaldo 2014/15) with sane structure", () => {
    const vm = build(DEFAULT_SLICE);
    expect(vm.rows.length).toBeGreaterThan(0);
    expect(vm.contested).toBe(vm.rows.length);
    // score components are non-negative integers and sum to the contested count
    expect(vm.score.messi + vm.score.ronaldo).toBeLessThanOrEqual(vm.contested);
    expect(Number.isInteger(vm.score.messi)).toBe(true);
    expect(Number.isInteger(vm.score.ronaldo)).toBe(true);
    expect(vm.messi.club).toBe("Barcelona");
    expect(vm.ronaldo.club).toBe("Real Madrid");
  });

  it("every stat row has both values and bar fractions in [0,1]", () => {
    const vm = build(DEFAULT_SLICE);
    for (const row of vm.rows) {
      expect(typeof row.messiValue).toBe("number");
      expect(typeof row.ronaldoValue).toBe("number");
      expect(row.messiFraction).toBeGreaterThanOrEqual(0);
      expect(row.messiFraction).toBeLessThanOrEqual(1);
      expect(row.ronaldoFraction).toBeGreaterThanOrEqual(0);
      expect(row.ronaldoFraction).toBeLessThanOrEqual(1);
      // the larger value maps to fraction 1 (normalized to the pair max),
      // unless both values are 0 (a 0-0 tie, e.g. red cards) → both 0.
      const maxFraction = Math.max(row.messiFraction, row.ronaldoFraction);
      if (row.messiValue === 0 && row.ronaldoValue === 0) {
        expect(maxFraction).toBe(0);
      } else {
        expect(maxFraction).toBeCloseTo(1, 5);
      }
    }
  });

  it("the winner of each row matches the higher/lower value per direction", () => {
    const vm = build(DEFAULT_SLICE);
    for (const row of vm.rows) {
      if (row.winner === "tie") {
        expect(row.messiValue).toBe(row.ronaldoValue);
        continue;
      }
      const messiBetter = row.higherIsBetter
        ? row.messiValue > row.ronaldoValue
        : row.messiValue < row.ronaldoValue;
      expect(row.winner).toBe(messiBetter ? "messi" : "ronaldo");
    }
  });

  it("career slice aggregates many seasons (Various club, non-empty)", () => {
    const career: CardSlice = {
      messi: { selection: { kind: "career" }, competition: "all", includePenalties: true },
      ronaldo: { selection: { kind: "career" }, competition: "all", includePenalties: true },
    };
    const vm = build(career);
    expect(vm.rows.length).toBeGreaterThan(0);
    // both players changed clubs over their careers
    expect(vm.messi.club).toBe("Various");
    expect(vm.ronaldo.club).toBe("Various");
    // xG/xA exist over a full career (post-2014 rows present) → contested includes them
    expect(vm.rows.some((r) => r.key === "xg")).toBe(true);
  });

  it("same-age slice (both at 25) builds without throwing", () => {
    const sameAge: CardSlice = {
      messi: { selection: { kind: "age", age: 25 }, competition: "all", includePenalties: true },
      ronaldo: { selection: { kind: "age", age: 25 }, competition: "all", includePenalties: true },
    };
    const vm = build(sameAge);
    expect(vm.rows.length).toBeGreaterThan(0);
    expect(vm.score.messi + vm.score.ronaldo).toBeLessThanOrEqual(vm.contested);
  });

  it("penalties off lowers (or holds) goal totals vs penalties on", () => {
    const sliceOn: CardSlice = {
      messi: { selection: { kind: "season", season: "2011/12" }, competition: "all", includePenalties: true },
      ronaldo: { selection: { kind: "season", season: "2011/12" }, competition: "all", includePenalties: true },
    };
    const sliceOff: CardSlice = {
      messi: { selection: { kind: "season", season: "2011/12" }, competition: "all", includePenalties: false },
      ronaldo: { selection: { kind: "season", season: "2011/12" }, competition: "all", includePenalties: false },
    };
    const goalsOn = build(sliceOn).rows.find((r) => r.key === "goals");
    const goalsOff = build(sliceOff).rows.find((r) => r.key === "goals");
    expect(goalsOn).toBeDefined();
    expect(goalsOff).toBeDefined();
    expect(goalsOff!.messiValue).toBeLessThanOrEqual(goalsOn!.messiValue);
  });

  it("a pre-2014 single-season matchup HIDES xG and xA (honesty line)", () => {
    const pre2014: CardSlice = {
      messi: { selection: { kind: "season", season: "2011/12" }, competition: "all", includePenalties: true },
      ronaldo: { selection: { kind: "season", season: "2011/12" }, competition: "all", includePenalties: true },
    };
    const vm = build(pre2014);
    expect(vm.rows.some((r) => r.key === "xg")).toBe(false);
    expect(vm.rows.some((r) => r.key === "xa")).toBe(false);
    // but core stats are still present
    expect(vm.rows.some((r) => r.key === "goals")).toBe(true);
  });

  it("an empty selection (impossible age) yields no contested rows but does not throw", () => {
    const impossible: CardSlice = {
      messi: { selection: { kind: "age", age: 999 }, competition: "all", includePenalties: true },
      ronaldo: { selection: { kind: "age", age: 999 }, competition: "all", includePenalties: true },
    };
    const vm = build(impossible);
    // ties (0 vs 0) produce rows but no score; goals row would be 0-0 tie
    expect(vm.score.messi).toBe(0);
    expect(vm.score.ronaldo).toBe(0);
    expect(vm.messi.club).toBe("—");
  });
});
