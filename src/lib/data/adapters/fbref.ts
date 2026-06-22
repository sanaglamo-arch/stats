import type { AdapterResult, IngestionAdapter } from "../types";
import {
  normalizeSeasonLabel,
  toNumber,
  type RawShotRecord,
} from "../normalize";
import { fetchText } from "./http";

/**
 * FBref / Transfermarkt enrichment adapter — BEST EFFORT (SPEC §6).
 *
 * Provides shot/shot-on-target detail and discipline. FBref aggressively
 * anti-bots automated requests, so this almost always degrades to seed in an
 * unattended environment. We implement the parse path (for when a proxy/cache
 * is available) but never let it block ingestion.
 *
 * Enriches existing rows (overlays shots/SoT/cards) — does not create rows.
 */

const FBREF_URL: Record<"messi" | "ronaldo", string> = {
  messi: "https://fbref.com/en/players/d70ce98e/Lionel-Messi",
  ronaldo: "https://fbref.com/en/players/dea698d9/Cristiano-Ronaldo",
};

/** A parsed FBref shooting-table row, keyed for overlay onto base rows. */
export type FbrefShotRecord = RawShotRecord;

/**
 * Parse FBref's shooting table out of an HTML page. FBref wraps many tables in
 * HTML comments, so we strip comment markers before matching rows. This is a
 * tolerant regex parser (no DOM dep); rows that don't parse are skipped.
 */
export function parseFbrefShooting(
  player: "messi" | "ronaldo",
  html: string,
): FbrefShotRecord[] {
  const uncommented = html.replace(/<!--/g, "").replace(/-->/g, "");
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  const records: FbrefShotRecord[] = [];
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(uncommented)) !== null) {
    const cells = extractCells(m[1]);
    const season = cells["year_id"];
    if (!season || !/^\d{4}/.test(season)) continue;
    records.push({
      player,
      season: normalizeSeasonLabel(season),
      competitionName: cells["comp_level"] ?? "League",
      shots: toNumber(cells["shots_total"]),
      shotsOnTarget: toNumber(cells["shots_on_target"]),
      yellowCards: toNumber(cells["cards_yellow"]),
      redCards: toNumber(cells["cards_red"]),
    });
  }
  return records;
}

/** Pull `data-stat="key">value<` cells out of a table row's inner HTML. */
function extractCells(rowHtml: string): Record<string, string> {
  const cellRe = /data-stat="([^"]+)"[^>]*>([\s\S]*?)<\/t[dh]>/g;
  const out: Record<string, string> = {};
  let m: RegExpExecArray | null;
  while ((m = cellRe.exec(rowHtml)) !== null) {
    out[m[1]] = m[2].replace(/<[^>]+>/g, "").trim();
  }
  return out;
}

export class FbrefAdapter implements IngestionAdapter {
  readonly id = "fbref" as const;

  async fetchEnrichment(): Promise<{ live: boolean; note: string; records: FbrefShotRecord[] }> {
    const records: FbrefShotRecord[] = [];
    try {
      for (const player of ["messi", "ronaldo"] as const) {
        const html = await fetchText(FBREF_URL[player]);
        records.push(...parseFbrefShooting(player, html));
      }
      if (records.length === 0) throw new Error("no shooting rows parsed");
      return {
        live: true,
        note: `Fetched ${records.length} shooting/discipline rows from FBref.`,
        records,
      };
    } catch (err) {
      return {
        live: false,
        note: `FBref/Transfermarkt anti-bot or offline (${describe(err)}); shots/SoT/cards come from seed.`,
        records: [],
      };
    }
  }

  async fetchRows(): Promise<AdapterResult> {
    // FBref/Transfermarkt only ENRICH existing rows (shots/SoT/cards); it never
    // creates canonical rows, so this returns none — ingestion uses
    // `fetchEnrichment` to overlay onto the base rows instead.
    const { live, note } = await this.fetchEnrichment();
    return { adapter: this.id, liveFetchSucceeded: live, note, rows: [] };
  }
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
