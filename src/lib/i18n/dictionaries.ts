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

  // Cinematic homepage
  scrollCue: "Scroll to build your card",
  studioKicker: "The Studio",
  studioTitle: "Build the card. Tweak the slice.",
  verdictKicker: "The Verdict",
  verdictTitle: "Settle the debate.",
  verdictBody:
    "No opinions — just the score by categories. Pick a season, a competition, an age, and let the card do the arguing.",
  footerNote: "A card for every argument.",
  period: "Period",
  download: "Download PNG",
  share: "Share",
  language: "Language",
  buildingSoon: "The card studio is coming together. Pick a slice, get a card.",

  // Studio / controls
  preview: "Live preview",
  controls: "Controls",
  customize: "Customize",
  done: "Done",
  periodMode: "Period",
  competition: "Competition",
  penalties: "Penalties",
  modeSeason: "Season",
  modeCareer: "Career",
  modeLastN: "Last N seasons",
  modeAge: "At age",
  selectSeason: "Select season",
  // `seasonsCount` labels the dropdown options ("5 seasons"); `lastNSeasons`
  // below is the full card-plaque phrasing ("Last 5 seasons").
  seasonsCount: "{n} seasons",
  sameAge: "Compare at same age",
  sameAgeHint: "Aligns both players to the same age (e.g. both at 25).",
  downloading: "Preparing…",
  downloadError: "Render failed. Try again.",
  shareError: "Couldn't share. Link copied instead.",
  linkCopied: "Link copied to clipboard.",

  // Period / context plaque
  career: "Career",
  lastNSeasons: "Last {n} seasons",
  atAge: "At age {age}",
  // Competition filters
  compAll: "All competitions",
  compLeague: "League",
  compChampionsLeague: "Champions League",
  compDomesticCup: "Domestic Cup",
  compSuperCup: "Super Cup",
  compClubWorldCup: "Club World Cup",
  compNationalTeam: "National Team",
  // Penalties filter chip
  penaltiesIncluded: "Penalties incl.",
  penaltiesExcluded: "Penalties excl.",

  // Stat labels (SPEC §7)
  statGoals: "Goals",
  statAssists: "Assists",
  statMatches: "Matches",
  statMinutes: "Minutes",
  statGoalsPer90: "Goals / 90",
  statShotConversion: "Shot conversion",
  statXg: "Expected goals (xG)",
  statXa: "Expected assists (xA)",
  statTrophies: "Trophies",
  statBallonDor: "Ballon d'Or",
  statYellowCards: "Yellow cards",
  statRedCards: "Red cards",
} as const;

export type Dictionary = Record<keyof typeof en, string>;

const ru: Dictionary = {
  appName: "FootyCompare",
  tagline: "Месси против Роналду — закрой спор одной карточкой.",
  vs: "VS",
  overallResult: "Общий итог",
  categoriesWon: "категорий выиграно",

  scrollCue: "Листай — собери карточку",
  studioKicker: "Студия",
  studioTitle: "Собери карточку. Настрой срез.",
  verdictKicker: "Вердикт",
  verdictTitle: "Закрой спор.",
  verdictBody:
    "Без мнений — только счёт по категориям. Выбери сезон, турнир, возраст — и пусть карточка спорит за тебя.",
  footerNote: "Карточка для любого спора.",
  period: "Период",
  download: "Скачать PNG",
  share: "Поделиться",
  language: "Язык",
  buildingSoon: "Студия карточек собирается. Выбери срез — получи карточку.",

  preview: "Живой предпросмотр",
  controls: "Настройки",
  customize: "Настроить",
  done: "Готово",
  periodMode: "Период",
  competition: "Турнир",
  penalties: "Пенальти",
  modeSeason: "Сезон",
  modeCareer: "Карьера",
  modeLastN: "Последние N сезонов",
  modeAge: "В возрасте",
  selectSeason: "Выбери сезон",
  seasonsCount: "{n} сезонов",
  sameAge: "Сравнить в одном возрасте",
  sameAgeHint: "Выравнивает обоих игроков по возрасту (напр. оба в 25).",
  downloading: "Готовим…",
  downloadError: "Ошибка рендера. Попробуй снова.",
  shareError: "Не удалось поделиться. Ссылка скопирована.",
  linkCopied: "Ссылка скопирована.",

  career: "Карьера",
  lastNSeasons: "Последние {n} сезонов",
  atAge: "В возрасте {age}",
  compAll: "Все турниры",
  compLeague: "Лига",
  compChampionsLeague: "Лига чемпионов",
  compDomesticCup: "Кубок страны",
  compSuperCup: "Суперкубок",
  compClubWorldCup: "Клубный чемпионат мира",
  compNationalTeam: "Сборная",
  penaltiesIncluded: "С пенальти",
  penaltiesExcluded: "Без пенальти",

  statGoals: "Голы",
  statAssists: "Ассисты",
  statMatches: "Матчи",
  statMinutes: "Минуты",
  statGoalsPer90: "Голы / 90",
  statShotConversion: "Конверсия ударов",
  statXg: "Ожидаемые голы (xG)",
  statXa: "Ожидаемые ассисты (xA)",
  statTrophies: "Трофеи",
  statBallonDor: "Золотой мяч",
  statYellowCards: "Жёлтые карточки",
  statRedCards: "Красные карточки",
};

export const dictionaries: Record<Locale, Dictionary> = { en, ru };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}
