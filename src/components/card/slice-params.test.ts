import { describe, expect, it } from "vitest";
import { DEFAULT_SLICE, type CardSlice } from "./card-model";
import { parseLocale, paramsFromSlice, sliceFromParams } from "./slice-params";

describe("slice-params", () => {
  it("round-trips a full slice through params", () => {
    const slice: CardSlice = {
      messi: { selection: { kind: "career" }, competition: "champions_league", includePenalties: false },
      ronaldo: { selection: { kind: "age", age: 27 }, competition: "league", includePenalties: true },
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
    };
    expect(sliceFromParams(paramsFromSlice(slice, "en"))).toEqual(slice);
  });

  it("falls back to DEFAULT_SLICE on empty params", () => {
    expect(sliceFromParams(new URLSearchParams())).toEqual(DEFAULT_SLICE);
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
