import { describe, expect, it } from "vitest";
import { DEFAULT_METRICS } from "@/lib/data";
import { DEFAULT_SLICE, type CardSlice } from "./card-model";
import { parseLocale, paramsFromSlice, sliceFromParams } from "./slice-params";

describe("slice-params", () => {
  it("round-trips a full slice through params", () => {
    const slice: CardSlice = {
      messi: { selection: { kind: "career" }, competition: "champions_league", includePenalties: false },
      ronaldo: { selection: { kind: "age", age: 27 }, competition: "league", includePenalties: true },
      metrics: DEFAULT_METRICS,
    };
    const params = paramsFromSlice(slice, "ru");
    const restored = sliceFromParams(params);
    expect(restored).toEqual(slice);
    expect(parseLocale(params.get("locale"))).toBe("ru");
  });

  it("round-trips lastNSeasons and season selections", () => {
    const slice: CardSlice = {
      messi: { selection: { kind: "lastNSeasons", n: 5 }, competition: "all", includePenalties: true },
      ronaldo: { selection: { kind: "season", season: "2017/18" }, competition: "all", includePenalties: true },
      metrics: DEFAULT_METRICS,
    };
    expect(sliceFromParams(paramsFromSlice(slice, "en"))).toEqual(slice);
  });

  it("falls back to DEFAULT_SLICE on empty params", () => {
    expect(sliceFromParams(new URLSearchParams())).toEqual(DEFAULT_SLICE);
  });

  it("round-trips a custom metric set and per-side stacking competitions (P6-3)", () => {
    const slice: CardSlice = {
      messi: {
        selection: { kind: "career" },
        competition: "all",
        competitions: ["league", "champions_league"],
        includePenalties: true,
      },
      ronaldo: {
        selection: { kind: "career" },
        competition: "all",
        competitions: ["national_team"],
        includePenalties: true,
      },
      metrics: ["goals", "assists", "goalContributions", "hatTricks"],
    };
    expect(sliceFromParams(paramsFromSlice(slice, "en"))).toEqual(slice);
  });

  it("omits the metrics param for the default metric set (clean default URLs)", () => {
    const params = paramsFromSlice(DEFAULT_SLICE, "en");
    expect(params.has("metrics")).toBe(false);
    expect(params.has("mComps")).toBe(false);
  });

  it("keeps the DEFAULT_SLICE render URL byte-identical to the legacy contract", () => {
    // mSel,mComp,mPen,rSel,rComp,rPen,locale — exactly the original order/values.
    expect(paramsFromSlice(DEFAULT_SLICE, "en").toString()).toBe(
      "mSel=season%3A2011%2F12&mComp=all&mPen=1&rSel=season%3A2014%2F15&rComp=all&rPen=1&locale=en",
    );
  });

  it("ignores malformed params and uses defaults", () => {
    const params = new URLSearchParams("mSel=bogus:99&mComp=not_a_comp&mPen=maybe");
    const slice = sliceFromParams(params);
    expect(slice.messi).toEqual(DEFAULT_SLICE.messi);
  });

  it("parseLocale defaults to en for unknown values", () => {
    expect(parseLocale("zz")).toBe("en");
    expect(parseLocale(null)).toBe("en");
    expect(parseLocale("ru")).toBe("ru");
  });
});
