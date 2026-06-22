import { describe, expect, it } from "vitest";
import {
  getIllustrativePositional,
  HEATMAP_COLS,
  HEATMAP_ROWS,
} from "./positional";
import { dataSource } from "./source";

describe("getIllustrativePositional (P6-4)", () => {
  it("is deterministic: same input → byte-identical output", () => {
    const a = getIllustrativePositional("messi");
    const b = getIllustrativePositional("messi");
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("differs between players", () => {
    const messi = getIllustrativePositional("messi");
    const ronaldo = getIllustrativePositional("ronaldo");
    expect(JSON.stringify(messi)).not.toBe(JSON.stringify(ronaldo));
  });

  it("returns a well-formed heatmap grid with values in [0,1]", () => {
    const { heatmap } = getIllustrativePositional("messi");
    expect(heatmap).toHaveLength(HEATMAP_ROWS);
    for (const row of heatmap) {
      expect(row).toHaveLength(HEATMAP_COLS);
      for (const v of row) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it("returns plausible normalized shotmap points flagged illustrative", () => {
    const data = getIllustrativePositional("ronaldo");
    expect(data.illustrative).toBe(true);
    expect(data.shotmap.length).toBeGreaterThan(0);
    for (const shot of data.shotmap) {
      expect(shot.x).toBeGreaterThanOrEqual(0);
      expect(shot.x).toBeLessThanOrEqual(1);
      expect(shot.y).toBeGreaterThanOrEqual(0);
      expect(shot.y).toBeLessThanOrEqual(1);
      expect(["goal", "saved", "missed"]).toContain(shot.outcome);
    }
  });

  it("is reachable through the DataSource interface (swappable)", () => {
    const viaSource = dataSource.getIllustrativePositional("messi");
    const direct = getIllustrativePositional("messi");
    expect(JSON.stringify(viaSource)).toBe(JSON.stringify(direct));
  });
});
