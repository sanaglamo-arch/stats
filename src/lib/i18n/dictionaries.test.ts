import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALES,
  dictionaries,
  getDictionary,
} from "@/lib/i18n/dictionaries";

describe("i18n dictionaries", () => {
  it("exposes the expected locales with EN as default", () => {
    expect(LOCALES).toEqual(["en", "ru"]);
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("RU mirrors the exact key set of EN", () => {
    const enKeys = Object.keys(dictionaries.en).sort();
    const ruKeys = Object.keys(dictionaries.ru).sort();
    expect(ruKeys).toEqual(enKeys);
  });

  it("getDictionary returns the matching locale dictionary", () => {
    expect(getDictionary("ru")).toBe(dictionaries.ru);
    expect(getDictionary("en")).toBe(dictionaries.en);
  });

  it("has no empty strings in any locale", () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(dictionaries[locale])) {
        expect(value, `${locale}.${key} should be non-empty`).not.toBe("");
      }
    }
  });
});
