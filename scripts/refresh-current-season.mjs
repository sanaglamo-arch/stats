#!/usr/bin/env node
/**
 * Phase 8 P8-7 — daily CURRENT-SEASON refresh.
 *
 * History is FROZEN. This only upserts the two current-club current-season
 * blocks: Messi @ Inter Miami and Ronaldo @ Al Nassr, for the active season
 * (derived from the date). All other rows are never touched.
 *
 * Source: messivsronaldo.app exposes its data as Gatsby static JSON at
 *   /page-data/club-stats/<YYYY-YYYY>/page-data.json
 * (FBref/Transfermarkt/Understat are anti-bot/blocked — see DATA_REPORT). The
 * JSON carries apps/goals/assists/minutes/pens/freeKicks/shots/SoT/xg/xa per
 * competition, mapping 1:1 onto PlayerSeasonComp.
 *
 * Safety: degrades gracefully — any fetch/parse/validation failure logs and
 * exits WITHOUT modifying dataset.json. Only rebuilds + `pm2 restart footy`
 * when rows actually change. Run with `--dry` to preview without writing.
 *
 * Usage: node scripts/refresh-current-season.mjs [--dry]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATASET = join(ROOT, "src/data/dataset.json");
const DRY = process.argv.includes("--dry");
const log = (...a) => console.log(new Date().toISOString(), ...a);

/** Active season from today's date: Aug–Dec → Y/Y+1, Jan–Jul → Y-1/Y. */
function activeSeason(now = new Date()) {
  const y = now.getUTCFullYear();
  const start = now.getUTCMonth() + 1 >= 8 ? y : y - 1; // month is 0-based
  return { mvr: `${start}-${start + 1}`, label: `${start}/${String(start + 1).slice(2)}`, start };
}

/** Fixed players for this phase — current clubs only (history frozen). */
const PLAYERS = {
  messi: { key: "allSheetMessiClubStats", club: "Inter Miami", born: 1987 },
  ronaldo: { key: "allSheetRonaldoClubStats", club: "Al Nassr", born: 1985 },
};

/**
 * mvr competition → { type, name(player) }. Only explicitly-mapped, real
 * competitions are upserted; aggregates ("All Competitions", "Club and
 * Country", "Country", "Other Cups") and unmapped/secondary comps
 * ("AFC Champions League 2") are SKIPPED so nothing is double-counted.
 */
const COMP_MAP = {
  League: { type: "league", name: { messi: "Major League Soccer", ronaldo: "Saudi Pro League" } },
  "MLS Cup": { type: "league", name: { messi: "MLS Cup Playoffs" } },
  "Continental Tournament": {
    type: "champions_league",
    name: { messi: "CONCACAF Champions Cup", ronaldo: "AFC Champions League" },
  },
  "Leagues Cup": { type: "domestic_cup", name: { messi: "Leagues Cup" } },
  "Domestic Cup": { type: "domestic_cup", name: { messi: "U.S. Open Cup", ronaldo: "King's Cup" } },
  "Domestic Super Cup": { type: "super_cup", name: { ronaldo: "Saudi Super Cup" } },
  "Arab Club Champions Cup": { type: "super_cup", name: { ronaldo: "Arab Club Champions Cup" } },
  "Club World Cup": { type: "club_world_cup", name: { messi: "FIFA Club World Cup", ronaldo: "FIFA Club World Cup" } },
};

const num = (v) => {
  const n = Number(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const numOrNull = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

async function fetchSeason(mvr) {
  const url = `https://www.messivsronaldo.app/page-data/club-stats/${mvr}/page-data.json`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (FootyCompare refresh)" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const json = await res.json();
  const data = json?.result?.data;
  if (!data?.allSheetMessiClubStats || !data?.allSheetRonaldoClubStats) {
    throw new Error("unexpected page-data shape (mvr changed?)");
  }
  return data;
}

/** Build the upsert rows for one player's current club this season. */
function buildRows(playerId, edges, season) {
  const { club, born } = PLAYERS[playerId];
  const age = season.start - born;
  const rows = [];
  for (const { node } of edges) {
    const map = COMP_MAP[node.competition];
    if (!map) continue; // aggregate / unmapped / skipped
    const name = map.name[playerId];
    if (!name) continue; // this comp doesn't apply to this player
    const apps = num(node.apps);
    if (apps <= 0) continue; // didn't feature → no row
    rows.push({
      player: playerId,
      season: season.label,
      ageDuringSeason: age,
      club,
      competitionType: map.type,
      competitionName: name,
      matches: apps,
      starts: apps, // mvr has no starts split — approximate (unsourced), verified:false
      minutes: num(node.minsPlayed),
      goals: num(node.goals),
      penaltyGoals: num(node.pens),
      freekickGoals: num(node.freeKicks),
      assists: num(node.assists),
      shots: num(node.shots),
      shotsOnTarget: num(node.shotsOnTarget),
      xg: numOrNull(node.xg),
      xa: numOrNull(node.xa),
      yellowCards: 0, // not in this feed (unsourced)
      redCards: 0,
      hatTricks: num(node.hatTricks),
      trophies: [],
      individualAwards: [],
      verified: false, // in-progress season + starts/cards unsourced
      source: { adapter: "mvr", origin: "fetched", enrichedBy: [] },
    });
  }
  return rows;
}

const sortKey = (r) => `${r.player}|${r.season}|${r.competitionType}|${r.competitionName}`;
const canon = (rows) =>
  [...rows].sort((a, b) => sortKey(a).localeCompare(sortKey(b))).map((r) => JSON.stringify(r)).join("\n");

async function main() {
  const season = activeSeason();
  log(`refresh start — active season ${season.label} (mvr ${season.mvr})${DRY ? " [DRY]" : ""}`);

  const file = JSON.parse(readFileSync(DATASET, "utf8"));
  if (!Array.isArray(file.rows)) throw new Error("dataset.json: rows[] missing");

  const data = await fetchSeason(season.mvr);
  const fresh = [
    ...buildRows("messi", data.allSheetMessiClubStats.edges, season),
    ...buildRows("ronaldo", data.allSheetRonaldoClubStats.edges, season),
  ];
  if (fresh.length === 0) throw new Error("0 rows parsed — aborting (no write)");
  log(`parsed ${fresh.length} current-season rows: ${fresh.map((r) => `${r.player}/${r.competitionName}:${r.goals}g`).join(", ")}`);

  // Only the (current-club × active-season) block is in scope; everything else frozen.
  const inScope = (r) =>
    r.season === season.label &&
    ((r.player === "messi" && r.club === "Inter Miami") || (r.player === "ronaldo" && r.club === "Al Nassr"));
  const frozen = file.rows.filter((r) => !inScope(r));
  const old = file.rows.filter(inScope);

  if (canon(old) === canon(fresh)) {
    log(`no change for ${season.label} — nothing to do (${old.length} existing rows match).`);
    return;
  }
  log(`change detected: ${old.length} existing → ${fresh.length} fresh rows for ${season.label}.`);

  const next = { ...file, generatedAt: new Date().toISOString(), rows: [...frozen, ...fresh] };

  // Sanity: never drop the frozen history.
  if (next.rows.length < frozen.length) throw new Error("row-count sanity failed");

  if (DRY) {
    log("DRY RUN — would write dataset.json and rebuild. Diff preview:");
    log("OLD:\n" + (canon(old) || "(none)"));
    log("NEW:\n" + canon(fresh));
    return;
  }

  writeFileSync(DATASET, JSON.stringify(next, null, 2) + "\n");
  log(`wrote dataset.json (${next.rows.length} rows). Rebuilding…`);
  execSync("node ./node_modules/next/dist/bin/next build", { cwd: ROOT, stdio: "inherit" });
  execSync("/opt/node20/bin/pm2 restart footy", { cwd: ROOT, stdio: "inherit" });
  log("rebuild + pm2 restart done.");
}

main().catch((err) => {
  log("ERROR (no dataset change):", err?.message || err);
  process.exitCode = 1;
});
