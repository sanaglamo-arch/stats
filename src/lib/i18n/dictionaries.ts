export const LOCALES = ["en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/**
 * UI/card string dictionary. Every user-facing string routes through here.
 * `ru` must mirror the exact key shape of `en` (enforced by the Dictionary type).
 */
const en = {
  appName: "FootyCompare",
  tagline: "Messi vs Ronaldo — settle the debate with a card.",
  vs: "VS",
  overallResult: "Overall Result",
  categoriesWon: "categories won",
  period: "Period",
  download: "Download PNG",
  share: "Share",
  language: "Language",
  buildingSoon: "The card studio is coming together. Pick a slice, get a card.",
} as const;

export type Dictionary = Record<keyof typeof en, string>;

const ru: Dictionary = {
  appName: "FootyCompare",
  tagline: "Месси против Роналду — закрой спор одной карточкой.",
  vs: "VS",
  overallResult: "Общий итог",
  categoriesWon: "категорий выиграно",
  period: "Период",
  download: "Скачать PNG",
  share: "Поделиться",
  language: "Язык",
  buildingSoon: "Студия карточек собирается. Выбери срез — получи карточку.",
};

export const dictionaries: Record<Locale, Dictionary> = { en, ru };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}
