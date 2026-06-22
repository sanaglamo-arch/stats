import { describe, it, expect } from "vitest";
import { buildRadarModel, type RadarStat } from "./radar-model";
import { normalizePair } from "./chart-util";
import type { CardViewModel } from "@/components/card";

/** A higher-is-better metric: goals. Lower-is-better: yellowCards / minutesPerGoal. */

describe("normalizePair", () => {
  it("higher-is-better: the larger value reaches the rim (1)", () => {
    expect(normalizePair(30, 15, true)).toEqual({ messi: 1, ronaldo: 0.5 });
  });

  it("higher-is-better: both zero → both 0 (nothing to show)", () => {
    expect(normalizePair(0, 0, true)).toEqual({ messi: 0, ronaldo: 0 });
  });

  it("higher-is-better: equal values tie at the rim", () => {
    expect(normalizePair(10, 10, true)).toEqual({ messi: 1, ronaldo: 1 });
  });

  it("lower-is-better is INVERTED: the smaller value reaches the rim", () => {
    // minutesPerGoal: Messi 90 (better), Ronaldo 180 (worse).
    const r = normalizePair(90, 180, false);
    expect(r.messi).toBe(1); // best → rim
    expect(r.ronaldo).toBeCloseTo(0.5, 5); // worse → halfway
    expect(r.messi).toBeGreaterThan(r.ronaldo);
  });

  it("lower-is-better: a 0 (best possible) side reaches the rim, positive side collapses", () => {
    // yellowCards: Messi 0 (perfect), Ronaldo 4.
    expect(normalizePair(0, 4, false)).toEqual({ messi: 1, ronaldo: 0 });
  });

  it("lower-is-better: both zero → both at the rim (perfect tie)", () => {
    expect(normalizePair(0, 0, false)).toEqual({ messi: 1, ronaldo: 1 });
  });
});

describe("buildRadarModel", () => {
  const stats: RadarStat[] = [
    { key: "goals", messiValue: 30, ronaldoValue: 15 }, // higher-better
    { key: "assists", messiValue: 10, ronaldoValue: 10 }, // tie
    { key: "yellowCards", messiValue: 2, ronaldoValue: 6 }, // lower-better
  ];

  it("preserves the requested metric order", () => {
    const m = buildRadarModel(stats, ["yellowCards", "goals", "assists"]);
    expect(m.axes.map((a) => a.key)).toEqual(["yellowCards", "goals", "assists"]);
  });

  it("normalizes higher-better and lower-better correctly per axis", () => {
    const m = buildRadarModel(stats, ["goals", "yellowCards"]);
    const goals = m.axes.find((a) => a.key === "goals")!;
    expect(goals.messi).toBe(1);
    expect(goals.ronaldo).toBe(0.5);
    const yc = m.axes.find((a) => a.key === "yellowCards")!;
    // Messi fewer cards (2 < 6) → reaches further out.
    expect(yc.messi).toBeGreaterThan(yc.ronaldo);
    expect(yc.messi).toBe(1);
  });

  it("keeps the exact raw values + decimals for direct labeling", () => {
    const m = buildRadarModel(stats, ["goals"]);
    expect(m.axes[0].messiRaw).toBe(30);
    expect(m.axes[0].ronaldoRaw).toBe(15);
    expect(m.axes[0].decimals).toBe(0);
  });

  it("skips metrics absent from the source (no empty spokes)", () => {
    const m = buildRadarModel(stats, ["goals", "xg"]); // xg not in stats
    expect(m.axes.map((a) => a.key)).toEqual(["goals"]);
  });

  it("accepts a CardViewModel and reads its rows", () => {
    const vm = {
      rows: [
        { key: "goals", messiValue: 40, ronaldoValue: 20 },
        { key: "minutesPerGoal", messiValue: 80, ronaldoValue: 160 },
      ],
    } as unknown as CardViewModel;
    const m = buildRadarModel(vm, ["goals", "minutesPerGoal"]);
    expect(m.axes).toHaveLength(2);
    expect(m.axes[0].messi).toBe(1);
    expect(m.axes[0].ronaldo).toBe(0.5);
    // lower-is-better minutesPerGoal: Messi 80 better → rim.
    expect(m.axes[1].messi).toBe(1);
    expect(m.axes[1].ronaldo).toBeCloseTo(0.5, 5);
  });
});
