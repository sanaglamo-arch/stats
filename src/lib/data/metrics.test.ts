import { describe, expect, it } from "vitest";
import {
  DEFAULT_METRICS,
  METRIC_CATALOG,
  METRIC_KEYS,
  deriveMetrics,
  type AggregateTotals,
  type MetricKey,
} from "./aggregate";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { STAT_ICONS } from "@/components/card/card-labels";

function totals(overrides: Partial<AggregateTotals>): AggregateTotals {
  return {
    matches: 0,
    starts: 0,
    minutes: 0,
    goals: 0,
    modernGoals: 0,
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
    trophyCount: 0,
    individualAwards: [],
    ballonDor: 0,
    ...overrides,
  };
}

describe("METRIC_CATALOG (P6-1)", () => {
  it("has a self-consistent definition for every catalog key", () => {
    for (const key of METRIC_KEYS) {
      const def = METRIC_CATALOG[key];
      expect(def.key).toBe(key); // key matches its own entry
      expect(typeof def.group).toBe("string");
      expect(typeof def.definition).toBe("string");
      expect(def.definition.length).toBeGreaterThan(0);
      expect(def.decimals).toBeGreaterThanOrEqual(0);
    }
  });

  it("every metric key resolves to a non-empty dictionary label in BOTH locales", () => {
    for (const key of METRIC_KEYS) {
      const labelKey = METRIC_CATALOG[key].labelKey;
      expect(dictionaries.en[labelKey], `en.${labelKey}`).toBeTruthy();
      expect(dictionaries.ru[labelKey], `ru.${labelKey}`).toBeTruthy();
    }
  });

  it("every metric key has an icon", () => {
    for (const key of METRIC_KEYS) {
      expect(STAT_ICONS[key], `icon for ${key}`).toBeDefined();
      // the catalog's icon string also resolves to a real icon
      expect(STAT_ICONS[METRIC_CATALOG[key].icon]).toBeDefined();
    }
  });

  it("is a superset of the default 12 card metrics, default order unchanged", () => {
    expect(DEFAULT_METRICS).toEqual([
      "goals",
      "assists",
      "matches",
      "minutes",
      "goalsPer90",
      "shotConversion",
      "xg",
      "xa",
      "trophies",
      "ballonDor",
      "yellowCards",
      "redCards",
    ]);
    for (const key of DEFAULT_METRICS) {
      expect(METRIC_KEYS).toContain(key);
    }
    expect(METRIC_KEYS.length).toBeGreaterThan(DEFAULT_METRICS.length);
  });

  it("marks the xG/xA family as modern and hatTricks as illustrative", () => {
    const modern: MetricKey[] = ["xg", "xa", "xgPer90", "xaPer90"];
    for (const key of modern) {
      expect(METRIC_CATALOG[key].availability).toBe("modern");
    }
    expect(METRIC_CATALOG.hatTricks.availability).toBe("illustrative");
  });
});

describe("derived metrics p11-3a (xgPerformance / penaltyPct / startShare)", () => {
  it("xgPerformance = modernGoals − xg (same slice) when xG is present", () => {
    // all-time goals may exceed modern goals; xG-performance uses the modern slice only
    const d = deriveMetrics(totals({ goals: 50, modernGoals: 30, xg: 24.4 }));
    expect(d.xgPerformance).toBeCloseTo(5.6, 5);
  });

  it("xgPerformance is null when xG is unavailable (pre-2014)", () => {
    const d = deriveMetrics(totals({ goals: 30, xg: null }));
    expect(d.xgPerformance).toBeNull();
  });

  it("penaltyPct = penaltyGoals / goals (0 when no goals)", () => {
    expect(deriveMetrics(totals({ goals: 20, penaltyGoals: 5 })).penaltyPct).toBe(0.25);
    expect(deriveMetrics(totals({ goals: 0, penaltyGoals: 0 })).penaltyPct).toBe(0);
  });

  it("startShare = starts / matches (0 when no matches)", () => {
    expect(deriveMetrics(totals({ matches: 40, starts: 30 })).startShare).toBe(0.75);
    expect(deriveMetrics(totals({ matches: 0, starts: 0 })).startShare).toBe(0);
  });

  it("all three are in METRIC_CATALOG with an icon + en/ru labels", () => {
    const keys: MetricKey[] = ["xgPerformance", "penaltyPct", "startShare"];
    for (const key of keys) {
      expect(METRIC_KEYS).toContain(key);
      const def = METRIC_CATALOG[key];
      expect(def.key).toBe(key);
      expect(STAT_ICONS[key]).toBeDefined();
      expect(dictionaries.en[def.labelKey]).toBeTruthy();
      expect(dictionaries.ru[def.labelKey]).toBeTruthy();
    }
    expect(METRIC_CATALOG.xgPerformance.availability).toBe("modern");
    expect(METRIC_CATALOG.penaltyPct.availability).toBe("always");
    expect(METRIC_CATALOG.startShare.availability).toBe("always");
    // not added to the default card set (byte-identical guarantee)
    for (const key of keys) expect(DEFAULT_METRICS).not.toContain(key);
  });
});
