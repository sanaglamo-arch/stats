import { describe, expect, it } from "vitest";
import {
  DEFAULT_METRICS,
  METRIC_CATALOG,
  METRIC_KEYS,
  type MetricKey,
} from "./aggregate";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { STAT_ICONS } from "@/components/card/card-labels";

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
