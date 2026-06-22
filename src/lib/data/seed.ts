import type { CompetitionType, PlayerSeasonComp } from "./types";

/**
 * Hand-built, plausible seed dataset covering BOTH careers split by competition.
 *
 * WHY this exists: live sources (Wikidata/Understat/FBref/Transfermarkt) are
 * unreliable in this environment (anti-bot, offline, rate limits). Adapters
 * attempt live fetch and degrade to this seed. Numbers are approximate and
 * MUST be owner-verified before launch — every row carries `verified:false`.
 *
 * Coverage:
 *   - Messi:   2004/05 → 2024/25
 *   - Ronaldo: 2002/03 → 2024/25
 *   - Competitions: league / champions_league / domestic_cup / super_cup /
 *     club_world_cup / national_team
 *   - xg/xa are null before the 2014/15 season (honesty line, SPEC §6).
 */

/** Compact per-(season,competition) tuple to keep the seed readable. */
type SeedTuple = {
  season: string;
  age: number;
  club: string;
  comp: CompetitionType;
  compName: string;
  m: number; // matches
  st: number; // starts
  min: number; // minutes
  g: number; // goals
  pk: number; // penalty goals
  fk: number; // freekick goals
  a: number; // assists
  sh: number; // shots
  sot: number; // shots on target
  xg?: number; // null before 2014/15
  xa?: number;
  yc?: number;
  rc?: number;
  trophies?: string[];
  awards?: string[];
};

const FIRST_XG_SEASON = "2014/15";

/** Seasons are labelled "YYYY/YY"; compare by leading year. */
function seasonStartYear(season: string): number {
  return Number.parseInt(season.slice(0, 4), 10);
}

function hasAdvancedMetrics(season: string): boolean {
  return seasonStartYear(season) >= seasonStartYear(FIRST_XG_SEASON);
}

const MESSI_SEED: SeedTuple[] = [
  // --- Barcelona ---
  { season: "2004/05", age: 17, club: "Barcelona", comp: "league", compName: "La Liga", m: 7, st: 1, min: 77, g: 1, pk: 0, fk: 0, a: 0, sh: 4, sot: 2, trophies: ["La Liga"] },
  { season: "2005/06", age: 18, club: "Barcelona", comp: "league", compName: "La Liga", m: 17, st: 11, min: 942, g: 6, pk: 0, fk: 0, a: 3, sh: 33, sot: 16, trophies: ["La Liga"] },
  { season: "2005/06", age: 18, club: "Barcelona", comp: "champions_league", compName: "UEFA Champions League", m: 6, st: 5, min: 405, g: 1, pk: 0, fk: 0, a: 1, sh: 14, sot: 7, trophies: ["UEFA Champions League"] },
  { season: "2006/07", age: 19, club: "Barcelona", comp: "league", compName: "La Liga", m: 26, st: 22, min: 1925, g: 14, pk: 0, fk: 2, a: 3, sh: 78, sot: 38 },
  { season: "2006/07", age: 19, club: "Barcelona", comp: "champions_league", compName: "UEFA Champions League", m: 5, st: 4, min: 360, g: 1, pk: 0, fk: 0, a: 0, sh: 13, sot: 6 },
  { season: "2007/08", age: 20, club: "Barcelona", comp: "league", compName: "La Liga", m: 28, st: 24, min: 2197, g: 10, pk: 1, fk: 1, a: 12, sh: 96, sot: 44 },
  { season: "2007/08", age: 20, club: "Barcelona", comp: "champions_league", compName: "UEFA Champions League", m: 9, st: 8, min: 720, g: 6, pk: 0, fk: 0, a: 2, sh: 31, sot: 17 },
  { season: "2008/09", age: 21, club: "Barcelona", comp: "league", compName: "La Liga", m: 31, st: 27, min: 2542, g: 23, pk: 3, fk: 1, a: 11, sh: 132, sot: 66, trophies: ["La Liga"] },
  { season: "2008/09", age: 21, club: "Barcelona", comp: "champions_league", compName: "UEFA Champions League", m: 12, st: 11, min: 985, g: 9, pk: 0, fk: 0, a: 5, sh: 44, sot: 23, trophies: ["UEFA Champions League"] },
  { season: "2008/09", age: 21, club: "Barcelona", comp: "domestic_cup", compName: "Copa del Rey", m: 8, st: 6, min: 540, g: 6, pk: 0, fk: 0, a: 4, sh: 28, sot: 15, trophies: ["Copa del Rey"] },
  { season: "2009/10", age: 22, club: "Barcelona", comp: "league", compName: "La Liga", m: 35, st: 32, min: 2975, g: 34, pk: 2, fk: 1, a: 9, sh: 187, sot: 96, trophies: ["La Liga"], awards: ["Ballon d'Or", "European Golden Shoe"] },
  { season: "2009/10", age: 22, club: "Barcelona", comp: "champions_league", compName: "UEFA Champions League", m: 11, st: 10, min: 945, g: 8, pk: 0, fk: 0, a: 1, sh: 48, sot: 26 },
  { season: "2009/10", age: 22, club: "Barcelona", comp: "club_world_cup", compName: "FIFA Club World Cup", m: 2, st: 2, min: 180, g: 1, pk: 0, fk: 0, a: 0, sh: 7, sot: 4, trophies: ["FIFA Club World Cup"] },
  { season: "2009/10", age: 22, club: "Barcelona", comp: "super_cup", compName: "Supercopa de España", m: 2, st: 2, min: 180, g: 2, pk: 0, fk: 0, a: 1, sh: 8, sot: 5, trophies: ["Supercopa de España"] },
  { season: "2010/11", age: 23, club: "Barcelona", comp: "league", compName: "La Liga", m: 33, st: 31, min: 2900, g: 31, pk: 4, fk: 2, a: 18, sh: 178, sot: 92, trophies: ["La Liga"] },
  { season: "2010/11", age: 23, club: "Barcelona", comp: "champions_league", compName: "UEFA Champions League", m: 13, st: 13, min: 1170, g: 12, pk: 0, fk: 0, a: 3, sh: 56, sot: 31, trophies: ["UEFA Champions League"] },
  { season: "2011/12", age: 24, club: "Barcelona", comp: "league", compName: "La Liga", m: 37, st: 36, min: 3270, g: 50, pk: 7, fk: 3, a: 16, sh: 234, sot: 124, awards: ["Ballon d'Or", "European Golden Shoe"] },
  { season: "2011/12", age: 24, club: "Barcelona", comp: "champions_league", compName: "UEFA Champions League", m: 11, st: 11, min: 990, g: 14, pk: 1, fk: 0, a: 5, sh: 62, sot: 35 },
  { season: "2011/12", age: 24, club: "Barcelona", comp: "domestic_cup", compName: "Copa del Rey", m: 8, st: 7, min: 640, g: 3, pk: 0, fk: 0, a: 5, sh: 31, sot: 16, trophies: ["Copa del Rey"] },
  { season: "2011/12", age: 24, club: "Barcelona", comp: "club_world_cup", compName: "FIFA Club World Cup", m: 2, st: 2, min: 180, g: 2, pk: 0, fk: 0, a: 0, sh: 9, sot: 5, trophies: ["FIFA Club World Cup"] },
  { season: "2012/13", age: 25, club: "Barcelona", comp: "league", compName: "La Liga", m: 32, st: 31, min: 2782, g: 46, pk: 7, fk: 2, a: 11, sh: 211, sot: 113, trophies: ["La Liga"], awards: ["European Golden Shoe"] },
  { season: "2012/13", age: 25, club: "Barcelona", comp: "champions_league", compName: "UEFA Champions League", m: 11, st: 10, min: 945, g: 8, pk: 0, fk: 0, a: 2, sh: 47, sot: 25 },
  { season: "2013/14", age: 26, club: "Barcelona", comp: "league", compName: "La Liga", m: 31, st: 28, min: 2475, g: 28, pk: 8, fk: 2, a: 11, sh: 154, sot: 80 },
  { season: "2013/14", age: 26, club: "Barcelona", comp: "champions_league", compName: "UEFA Champions League", m: 7, st: 7, min: 630, g: 8, pk: 1, fk: 0, a: 1, sh: 33, sot: 19 },
  { season: "2014/15", age: 27, club: "Barcelona", comp: "league", compName: "La Liga", m: 38, st: 35, min: 3210, g: 43, pk: 5, fk: 4, a: 18, sh: 174, sot: 92, xg: 32.1, xa: 14.6, trophies: ["La Liga"] },
  { season: "2014/15", age: 27, club: "Barcelona", comp: "champions_league", compName: "UEFA Champions League", m: 13, st: 13, min: 1170, g: 10, pk: 0, fk: 1, a: 6, sh: 51, sot: 29, xg: 8.9, xa: 4.8, trophies: ["UEFA Champions League"] },
  { season: "2014/15", age: 27, club: "Barcelona", comp: "domestic_cup", compName: "Copa del Rey", m: 6, st: 6, min: 540, g: 5, pk: 0, fk: 1, a: 5, sh: 27, sot: 14, xg: 4.1, xa: 3.2, trophies: ["Copa del Rey"] },
  { season: "2015/16", age: 28, club: "Barcelona", comp: "league", compName: "La Liga", m: 33, st: 32, min: 2810, g: 26, pk: 4, fk: 3, a: 16, sh: 142, sot: 74, xg: 24.4, xa: 13.1, trophies: ["La Liga"] },
  { season: "2015/16", age: 28, club: "Barcelona", comp: "champions_league", compName: "UEFA Champions League", m: 7, st: 7, min: 630, g: 6, pk: 2, fk: 0, a: 1, sh: 30, sot: 17, xg: 5.5, xa: 1.9 },
  { season: "2016/17", age: 29, club: "Barcelona", comp: "league", compName: "La Liga", m: 34, st: 32, min: 2864, g: 37, pk: 5, fk: 5, a: 9, sh: 183, sot: 96, xg: 28.7, xa: 9.4, awards: ["European Golden Shoe"] },
  { season: "2016/17", age: 29, club: "Barcelona", comp: "champions_league", compName: "UEFA Champions League", m: 9, st: 9, min: 810, g: 11, pk: 2, fk: 1, a: 2, sh: 44, sot: 26, xg: 7.8, xa: 2.2 },
  { season: "2016/17", age: 29, club: "Barcelona", comp: "domestic_cup", compName: "Copa del Rey", m: 7, st: 6, min: 590, g: 5, pk: 0, fk: 1, a: 3, sh: 28, sot: 15, xg: 3.9, xa: 2.1, trophies: ["Copa del Rey"] },
  { season: "2017/18", age: 30, club: "Barcelona", comp: "league", compName: "La Liga", m: 36, st: 35, min: 3093, g: 34, pk: 4, fk: 4, a: 12, sh: 167, sot: 90, xg: 27.5, xa: 11.2, trophies: ["La Liga"], awards: ["European Golden Shoe"] },
  { season: "2017/18", age: 30, club: "Barcelona", comp: "champions_league", compName: "UEFA Champions League", m: 10, st: 10, min: 900, g: 6, pk: 1, fk: 1, a: 2, sh: 41, sot: 22, xg: 5.6, xa: 2.3 },
  { season: "2017/18", age: 30, club: "Barcelona", comp: "domestic_cup", compName: "Copa del Rey", m: 6, st: 5, min: 470, g: 4, pk: 0, fk: 0, a: 4, sh: 24, sot: 13, xg: 3.4, xa: 2.6, trophies: ["Copa del Rey"] },
  { season: "2018/19", age: 31, club: "Barcelona", comp: "league", compName: "La Liga", m: 34, st: 33, min: 2842, g: 36, pk: 4, fk: 4, a: 13, sh: 168, sot: 94, xg: 27.9, xa: 12.5, trophies: ["La Liga"], awards: ["European Golden Shoe"] },
  { season: "2018/19", age: 31, club: "Barcelona", comp: "champions_league", compName: "UEFA Champions League", m: 10, st: 10, min: 900, g: 12, pk: 0, fk: 2, a: 3, sh: 47, sot: 28, xg: 8.4, xa: 2.8 },
  { season: "2019/20", age: 32, club: "Barcelona", comp: "league", compName: "La Liga", m: 33, st: 31, min: 2880, g: 25, pk: 5, fk: 3, a: 21, sh: 144, sot: 78, xg: 22.7, xa: 16.1, awards: ["European Golden Shoe"] },
  { season: "2019/20", age: 32, club: "Barcelona", comp: "champions_league", compName: "UEFA Champions League", m: 8, st: 8, min: 720, g: 3, pk: 1, fk: 0, a: 4, sh: 33, sot: 18, xg: 4.2, xa: 2.7 },
  { season: "2020/21", age: 33, club: "Barcelona", comp: "league", compName: "La Liga", m: 35, st: 34, min: 3037, g: 30, pk: 6, fk: 4, a: 9, sh: 156, sot: 80, xg: 24.1, xa: 8.7, awards: ["European Golden Shoe"] },
  { season: "2020/21", age: 33, club: "Barcelona", comp: "champions_league", compName: "UEFA Champions League", m: 6, st: 6, min: 540, g: 5, pk: 2, fk: 0, a: 0, sh: 24, sot: 13, xg: 3.8, xa: 1.1 },
  { season: "2020/21", age: 33, club: "Barcelona", comp: "domestic_cup", compName: "Copa del Rey", m: 5, st: 5, min: 450, g: 5, pk: 0, fk: 1, a: 3, sh: 22, sot: 13, xg: 3.6, xa: 1.9, trophies: ["Copa del Rey"] },
  // --- Paris Saint-Germain ---
  { season: "2021/22", age: 34, club: "Paris Saint-Germain", comp: "league", compName: "Ligue 1", m: 26, st: 24, min: 2034, g: 6, pk: 0, fk: 0, a: 14, sh: 78, sot: 35, xg: 7.1, xa: 11.6, trophies: ["Ligue 1"] },
  { season: "2021/22", age: 34, club: "Paris Saint-Germain", comp: "champions_league", compName: "UEFA Champions League", m: 7, st: 7, min: 630, g: 5, pk: 0, fk: 0, a: 0, sh: 28, sot: 15, xg: 3.9, xa: 1.4 },
  { season: "2022/23", age: 35, club: "Paris Saint-Germain", comp: "league", compName: "Ligue 1", m: 32, st: 31, min: 2701, g: 16, pk: 0, fk: 2, a: 16, sh: 96, sot: 48, xg: 14.2, xa: 12.9, trophies: ["Ligue 1"] },
  { season: "2022/23", age: 35, club: "Paris Saint-Germain", comp: "champions_league", compName: "UEFA Champions League", m: 6, st: 6, min: 540, g: 4, pk: 0, fk: 0, a: 1, sh: 22, sot: 11, xg: 3.1, xa: 1.0 },
  // --- Inter Miami ---
  { season: "2023/24", age: 36, club: "Inter Miami", comp: "league", compName: "Major League Soccer", m: 14, st: 13, min: 1142, g: 11, pk: 1, fk: 2, a: 5, sh: 58, sot: 31, xg: 9.4, xa: 4.6 },
  { season: "2024/25", age: 37, club: "Inter Miami", comp: "league", compName: "Major League Soccer", m: 19, st: 18, min: 1560, g: 20, pk: 2, fk: 3, a: 12, sh: 88, sot: 47, xg: 16.8, xa: 9.1 },
  // --- Argentina (national team), spread across career ---
  { season: "2009/10", age: 22, club: "Argentina", comp: "national_team", compName: "Argentina", m: 10, st: 9, min: 810, g: 2, pk: 0, fk: 0, a: 2, sh: 30, sot: 15 },
  { season: "2011/12", age: 24, club: "Argentina", comp: "national_team", compName: "Argentina", m: 9, st: 9, min: 810, g: 12, pk: 1, fk: 1, a: 3, sh: 41, sot: 22 },
  { season: "2013/14", age: 26, club: "Argentina", comp: "national_team", compName: "Argentina", m: 12, st: 11, min: 1010, g: 8, pk: 1, fk: 1, a: 4, sh: 44, sot: 23 },
  { season: "2015/16", age: 28, club: "Argentina", comp: "national_team", compName: "Argentina", m: 11, st: 10, min: 920, g: 9, pk: 2, fk: 2, a: 5, sh: 40, sot: 21, xg: 6.8, xa: 3.9 },
  { season: "2020/21", age: 33, club: "Argentina", comp: "national_team", compName: "Argentina", m: 12, st: 12, min: 1050, g: 9, pk: 2, fk: 2, a: 7, sh: 48, sot: 26, xg: 7.1, xa: 4.8, trophies: ["Copa América"] },
  { season: "2021/22", age: 34, club: "Argentina", comp: "national_team", compName: "Argentina", m: 10, st: 9, min: 820, g: 7, pk: 1, fk: 1, a: 8, sh: 38, sot: 20, xg: 5.9, xa: 5.7, trophies: ["FIFA World Cup"], awards: ["Ballon d'Or"] },
  { season: "2023/24", age: 36, club: "Argentina", comp: "national_team", compName: "Argentina", m: 9, st: 8, min: 720, g: 6, pk: 1, fk: 1, a: 4, sh: 33, sot: 18, xg: 4.7, xa: 3.1, trophies: ["Copa América"], awards: ["Ballon d'Or"] },
];

const RONALDO_SEED: SeedTuple[] = [
  // --- Sporting CP ---
  { season: "2002/03", age: 18, club: "Sporting CP", comp: "league", compName: "Primeira Liga", m: 25, st: 20, min: 1763, g: 3, pk: 0, fk: 0, a: 2, sh: 52, sot: 24 },
  { season: "2002/03", age: 18, club: "Sporting CP", comp: "champions_league", compName: "UEFA Champions League", m: 3, st: 2, min: 200, g: 0, pk: 0, fk: 0, a: 0, sh: 6, sot: 2 },
  // --- Manchester United (first spell) ---
  { season: "2003/04", age: 19, club: "Manchester United", comp: "league", compName: "Premier League", m: 29, st: 23, min: 2078, g: 4, pk: 0, fk: 1, a: 4, sh: 68, sot: 30 },
  { season: "2003/04", age: 19, club: "Manchester United", comp: "domestic_cup", compName: "FA Cup", m: 7, st: 6, min: 560, g: 4, pk: 0, fk: 1, a: 2, sh: 24, sot: 12, trophies: ["FA Cup"] },
  { season: "2004/05", age: 20, club: "Manchester United", comp: "league", compName: "Premier League", m: 33, st: 28, min: 2563, g: 5, pk: 0, fk: 0, a: 5, sh: 84, sot: 38 },
  { season: "2004/05", age: 20, club: "Manchester United", comp: "champions_league", compName: "UEFA Champions League", m: 8, st: 6, min: 540, g: 0, pk: 0, fk: 0, a: 1, sh: 20, sot: 9 },
  { season: "2005/06", age: 21, club: "Manchester United", comp: "league", compName: "Premier League", m: 33, st: 30, min: 2667, g: 9, pk: 1, fk: 2, a: 6, sh: 96, sot: 45 },
  { season: "2005/06", age: 21, club: "Manchester United", comp: "champions_league", compName: "UEFA Champions League", m: 8, st: 7, min: 620, g: 1, pk: 0, fk: 0, a: 1, sh: 22, sot: 10 },
  { season: "2006/07", age: 22, club: "Manchester United", comp: "league", compName: "Premier League", m: 34, st: 31, min: 2845, g: 17, pk: 2, fk: 3, a: 8, sh: 130, sot: 62, trophies: ["Premier League"] },
  { season: "2006/07", age: 22, club: "Manchester United", comp: "champions_league", compName: "UEFA Champions League", m: 11, st: 10, min: 940, g: 3, pk: 0, fk: 1, a: 2, sh: 36, sot: 17 },
  { season: "2007/08", age: 23, club: "Manchester United", comp: "league", compName: "Premier League", m: 34, st: 32, min: 2920, g: 31, pk: 3, fk: 4, a: 6, sh: 174, sot: 88, trophies: ["Premier League"], awards: ["European Golden Shoe"] },
  { season: "2007/08", age: 23, club: "Manchester United", comp: "champions_league", compName: "UEFA Champions League", m: 11, st: 11, min: 990, g: 8, pk: 1, fk: 1, a: 1, sh: 47, sot: 24, trophies: ["UEFA Champions League"] },
  { season: "2008/09", age: 24, club: "Manchester United", comp: "league", compName: "Premier League", m: 33, st: 30, min: 2756, g: 18, pk: 4, fk: 4, a: 6, sh: 158, sot: 73, trophies: ["Premier League"], awards: ["Ballon d'Or"] },
  { season: "2008/09", age: 24, club: "Manchester United", comp: "champions_league", compName: "UEFA Champions League", m: 12, st: 11, min: 1015, g: 4, pk: 0, fk: 2, a: 1, sh: 53, sot: 25 },
  { season: "2008/09", age: 24, club: "Manchester United", comp: "club_world_cup", compName: "FIFA Club World Cup", m: 2, st: 2, min: 180, g: 1, pk: 0, fk: 0, a: 0, sh: 9, sot: 4, trophies: ["FIFA Club World Cup"] },
  { season: "2017/18", age: 33, club: "Real Madrid", comp: "super_cup", compName: "UEFA Super Cup", m: 1, st: 1, min: 90, g: 1, pk: 0, fk: 0, a: 0, sh: 5, sot: 3, xg: 0.9, xa: 0.2, trophies: ["UEFA Super Cup"] },
  // --- Real Madrid ---
  { season: "2009/10", age: 25, club: "Real Madrid", comp: "league", compName: "La Liga", m: 29, st: 28, min: 2447, g: 26, pk: 7, fk: 4, a: 8, sh: 170, sot: 84 },
  { season: "2009/10", age: 25, club: "Real Madrid", comp: "champions_league", compName: "UEFA Champions League", m: 6, st: 6, min: 540, g: 7, pk: 1, fk: 1, a: 1, sh: 34, sot: 18 },
  { season: "2010/11", age: 26, club: "Real Madrid", comp: "league", compName: "La Liga", m: 34, st: 33, min: 2967, g: 40, pk: 9, fk: 4, a: 10, sh: 224, sot: 116, awards: ["European Golden Shoe"] },
  { season: "2010/11", age: 26, club: "Real Madrid", comp: "champions_league", compName: "UEFA Champions League", m: 12, st: 12, min: 1080, g: 6, pk: 0, fk: 1, a: 4, sh: 58, sot: 30 },
  { season: "2010/11", age: 26, club: "Real Madrid", comp: "domestic_cup", compName: "Copa del Rey", m: 8, st: 7, min: 660, g: 7, pk: 1, fk: 1, a: 3, sh: 36, sot: 19, trophies: ["Copa del Rey"] },
  { season: "2011/12", age: 27, club: "Real Madrid", comp: "league", compName: "La Liga", m: 38, st: 37, min: 3370, g: 46, pk: 12, fk: 3, a: 12, sh: 246, sot: 128, trophies: ["La Liga"] },
  { season: "2011/12", age: 27, club: "Real Madrid", comp: "champions_league", compName: "UEFA Champions League", m: 10, st: 10, min: 900, g: 10, pk: 2, fk: 1, a: 2, sh: 54, sot: 28 },
  { season: "2012/13", age: 28, club: "Real Madrid", comp: "league", compName: "La Liga", m: 34, st: 33, min: 3002, g: 34, pk: 7, fk: 2, a: 11, sh: 207, sot: 105 },
  { season: "2012/13", age: 28, club: "Real Madrid", comp: "champions_league", compName: "UEFA Champions League", m: 12, st: 12, min: 1080, g: 12, pk: 2, fk: 1, a: 3, sh: 62, sot: 33 },
  { season: "2013/14", age: 29, club: "Real Madrid", comp: "league", compName: "La Liga", m: 30, st: 29, min: 2630, g: 31, pk: 8, fk: 3, a: 9, sh: 192, sot: 98, awards: ["Ballon d'Or"] },
  { season: "2013/14", age: 29, club: "Real Madrid", comp: "champions_league", compName: "UEFA Champions League", m: 11, st: 11, min: 990, g: 17, pk: 3, fk: 1, a: 5, sh: 66, sot: 38, trophies: ["UEFA Champions League"] },
  { season: "2013/14", age: 29, club: "Real Madrid", comp: "domestic_cup", compName: "Copa del Rey", m: 6, st: 5, min: 470, g: 3, pk: 0, fk: 1, a: 1, sh: 26, sot: 13, trophies: ["Copa del Rey"] },
  { season: "2014/15", age: 30, club: "Real Madrid", comp: "league", compName: "La Liga", m: 35, st: 34, min: 3084, g: 48, pk: 9, fk: 3, a: 16, sh: 226, sot: 122, xg: 31.8, xa: 12.4, awards: ["European Golden Shoe", "Ballon d'Or"] },
  { season: "2014/15", age: 30, club: "Real Madrid", comp: "champions_league", compName: "UEFA Champions League", m: 12, st: 12, min: 1080, g: 10, pk: 1, fk: 1, a: 2, sh: 58, sot: 32, xg: 9.6, xa: 1.9, trophies: ["FIFA Club World Cup"] },
  { season: "2015/16", age: 31, club: "Real Madrid", comp: "league", compName: "La Liga", m: 36, st: 35, min: 3197, g: 35, pk: 6, fk: 2, a: 11, sh: 210, sot: 110, xg: 27.4, xa: 8.8 },
  { season: "2015/16", age: 31, club: "Real Madrid", comp: "champions_league", compName: "UEFA Champions League", m: 12, st: 12, min: 1080, g: 16, pk: 4, fk: 1, a: 3, sh: 64, sot: 34, xg: 11.2, xa: 1.7, trophies: ["UEFA Champions League"] },
  { season: "2016/17", age: 32, club: "Real Madrid", comp: "league", compName: "La Liga", m: 29, st: 28, min: 2542, g: 25, pk: 6, fk: 1, a: 6, sh: 168, sot: 84, xg: 21.7, xa: 5.4, trophies: ["La Liga"], awards: ["Ballon d'Or"] },
  { season: "2016/17", age: 32, club: "Real Madrid", comp: "champions_league", compName: "UEFA Champions League", m: 13, st: 13, min: 1170, g: 12, pk: 2, fk: 0, a: 1, sh: 60, sot: 32, xg: 9.8, xa: 1.2, trophies: ["UEFA Champions League"] },
  { season: "2016/17", age: 32, club: "Real Madrid", comp: "club_world_cup", compName: "FIFA Club World Cup", m: 2, st: 2, min: 180, g: 2, pk: 0, fk: 0, a: 0, sh: 8, sot: 5, xg: 1.6, xa: 0.3, trophies: ["FIFA Club World Cup"] },
  { season: "2017/18", age: 33, club: "Real Madrid", comp: "league", compName: "La Liga", m: 27, st: 26, min: 2326, g: 26, pk: 4, fk: 1, a: 5, sh: 162, sot: 82, xg: 22.9, xa: 4.1 },
  { season: "2017/18", age: 33, club: "Real Madrid", comp: "champions_league", compName: "UEFA Champions League", m: 13, st: 13, min: 1170, g: 15, pk: 4, fk: 0, a: 3, sh: 62, sot: 34, xg: 12.4, xa: 1.9, trophies: ["UEFA Champions League"], awards: ["Ballon d'Or"] },
  // --- Juventus ---
  { season: "2018/19", age: 34, club: "Juventus", comp: "league", compName: "Serie A", m: 31, st: 29, min: 2659, g: 21, pk: 6, fk: 1, a: 8, sh: 150, sot: 72, xg: 19.1, xa: 6.6, trophies: ["Serie A"] },
  { season: "2018/19", age: 34, club: "Juventus", comp: "champions_league", compName: "UEFA Champions League", m: 9, st: 9, min: 810, g: 6, pk: 1, fk: 1, a: 1, sh: 42, sot: 22, xg: 5.7, xa: 0.9 },
  { season: "2019/20", age: 35, club: "Juventus", comp: "league", compName: "Serie A", m: 33, st: 32, min: 2917, g: 31, pk: 12, fk: 2, a: 5, sh: 168, sot: 84, xg: 22.4, xa: 4.6, trophies: ["Serie A"] },
  { season: "2019/20", age: 35, club: "Juventus", comp: "champions_league", compName: "UEFA Champions League", m: 7, st: 7, min: 630, g: 4, pk: 1, fk: 0, a: 0, sh: 32, sot: 16, xg: 4.1, xa: 0.6 },
  { season: "2020/21", age: 36, club: "Juventus", comp: "league", compName: "Serie A", m: 33, st: 31, min: 2767, g: 29, pk: 7, fk: 1, a: 3, sh: 156, sot: 80, xg: 21.6, xa: 3.2, awards: ["European Golden Shoe"] },
  { season: "2020/21", age: 36, club: "Juventus", comp: "champions_league", compName: "UEFA Champions League", m: 6, st: 6, min: 540, g: 4, pk: 0, fk: 0, a: 0, sh: 28, sot: 14, xg: 3.4, xa: 0.4 },
  // --- Manchester United (second spell) ---
  { season: "2021/22", age: 37, club: "Manchester United", comp: "league", compName: "Premier League", m: 30, st: 27, min: 2456, g: 18, pk: 3, fk: 1, a: 3, sh: 138, sot: 60, xg: 16.4, xa: 2.7 },
  { season: "2021/22", age: 37, club: "Manchester United", comp: "champions_league", compName: "UEFA Champions League", m: 7, st: 7, min: 630, g: 6, pk: 1, fk: 0, a: 0, sh: 30, sot: 15, xg: 4.6, xa: 0.5 },
  { season: "2022/23", age: 38, club: "Manchester United", comp: "league", compName: "Premier League", m: 16, st: 10, min: 870, g: 3, pk: 1, fk: 0, a: 2, sh: 44, sot: 18, xg: 4.9, xa: 1.6 },
  // --- Al Nassr ---
  { season: "2022/23", age: 38, club: "Al Nassr", comp: "league", compName: "Saudi Pro League", m: 16, st: 16, min: 1411, g: 14, pk: 3, fk: 2, a: 2, sh: 78, sot: 41, xg: 12.1, xa: 2.4 },
  { season: "2023/24", age: 39, club: "Al Nassr", comp: "league", compName: "Saudi Pro League", m: 31, st: 30, min: 2730, g: 35, pk: 9, fk: 3, a: 11, sh: 188, sot: 102, xg: 28.6, xa: 8.1 },
  { season: "2024/25", age: 40, club: "Al Nassr", comp: "league", compName: "Saudi Pro League", m: 30, st: 29, min: 2620, g: 25, pk: 6, fk: 2, a: 5, sh: 162, sot: 84, xg: 22.1, xa: 4.7 },
  // --- Portugal (national team) ---
  { season: "2003/04", age: 19, club: "Portugal", comp: "national_team", compName: "Portugal", m: 8, st: 6, min: 540, g: 2, pk: 0, fk: 0, a: 1, sh: 24, sot: 11 },
  { season: "2007/08", age: 23, club: "Portugal", comp: "national_team", compName: "Portugal", m: 9, st: 9, min: 800, g: 5, pk: 1, fk: 1, a: 2, sh: 36, sot: 18 },
  { season: "2011/12", age: 27, club: "Portugal", comp: "national_team", compName: "Portugal", m: 10, st: 10, min: 900, g: 7, pk: 1, fk: 2, a: 2, sh: 42, sot: 22 },
  { season: "2013/14", age: 29, club: "Portugal", comp: "national_team", compName: "Portugal", m: 9, st: 9, min: 810, g: 8, pk: 1, fk: 2, a: 1, sh: 44, sot: 24 },
  { season: "2015/16", age: 31, club: "Portugal", comp: "national_team", compName: "Portugal", m: 12, st: 12, min: 1080, g: 9, pk: 2, fk: 1, a: 3, sh: 50, sot: 26, xg: 7.6, xa: 2.8, trophies: ["UEFA European Championship"] },
  { season: "2018/19", age: 34, club: "Portugal", comp: "national_team", compName: "Portugal", m: 7, st: 7, min: 630, g: 5, pk: 1, fk: 1, a: 1, sh: 32, sot: 16, xg: 4.4, xa: 1.1, trophies: ["UEFA Nations League"] },
  { season: "2020/21", age: 36, club: "Portugal", comp: "national_team", compName: "Portugal", m: 10, st: 10, min: 880, g: 11, pk: 3, fk: 1, a: 2, sh: 46, sot: 25, xg: 7.9, xa: 1.6 },
  { season: "2023/24", age: 39, club: "Portugal", comp: "national_team", compName: "Portugal", m: 11, st: 10, min: 910, g: 10, pk: 2, fk: 1, a: 3, sh: 48, sot: 26, xg: 7.2, xa: 2.4 },
];

/** Expand a compact seed tuple into a full canonical row (xg/xa nulled pre-2014). */
function expand(player: "messi" | "ronaldo", t: SeedTuple): PlayerSeasonComp {
  const advanced = hasAdvancedMetrics(t.season);
  return {
    player,
    season: t.season,
    ageDuringSeason: t.age,
    club: t.club,
    competitionType: t.comp,
    competitionName: t.compName,
    matches: t.m,
    starts: t.st,
    minutes: t.min,
    goals: t.g,
    penaltyGoals: t.pk,
    freekickGoals: t.fk,
    assists: t.a,
    shots: t.sh,
    shotsOnTarget: t.sot,
    xg: advanced && t.xg !== undefined ? t.xg : null,
    xa: advanced && t.xa !== undefined ? t.xa : null,
    yellowCards: t.yc ?? 0,
    redCards: t.rc ?? 0,
    trophies: t.trophies ?? [],
    individualAwards: t.awards ?? [],
    verified: false,
    source: { adapter: "wikidata", origin: "seed", enrichedBy: [] },
  };
}

/** All seed rows for a player. Adapters clone these as their fallback. */
export function seedRows(player: "messi" | "ronaldo"): PlayerSeasonComp[] {
  const tuples = player === "messi" ? MESSI_SEED : RONALDO_SEED;
  return tuples.map((t) => expand(player, t));
}

/** Whether a season is recent enough to carry xG/xA. Exported for adapters/tests. */
export { hasAdvancedMetrics };
