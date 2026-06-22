import type { AdapterResult, IngestionAdapter, PlayerSeasonComp } from "../types";
import {
  enrichWithAdvanced,
  normalizeSeasonLabel,
  type RawAdvancedRecord,
} from "../normalize";
import { hasAdvancedMetrics, seedRows } from "../seed";
import { fetchText } from "./http";

/**
 * Understat adapter — advanced metrics (xG/xA) for 2014+ seasons (SPEC §6).
 *
 * Understat embeds player data as JSON inside a `<script>` tag using a
 * hex-escaped `JSON.parse('...')` payload. We extract & decode it. If the page
 * is unreachable or the payload shape changes, we degrade: the base rows keep
 * their seed xG/xA (which are already null pre-2014).
 *
 * This adapter ENRICHES existing rows rather than producing new ones — it is
 * applied after the base adapter during ingestion.
 */

const UNDERSTAT_PLAYER_ID: Record<"messi" | "ronaldo", string> = {
  messi: "2097",
  ronaldo: "2371",
};

/** One season entry from Understat's embedded `groupsData.season` array. */
type UnderstatSeasonEntry = {
  season: string; // e.g. "2014"
  xG?: string | number;
  xA?: string | number;
};

/**
 * Decode the hex-escaped JSON Understat embeds, e.g.
 * `var playersData = JSON.parse('\x7B...\x7D');`
 */
export function decodeEmbeddedJson(html: string, varName: string): unknown {
  const re = new RegExp(`${varName}\\s*=\\s*JSON\\.parse\\('([^']+)'\\)`);
  const match = html.match(re);
  if (!match) throw new Error(`Embedded var ${varName} not found`);
  const decoded = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
  return JSON.parse(decoded);
}

/** Understat uses calendar start year ("2014"); map to our "2014/15" label. */
export function understatSeasonToLabel(yearStr: string): string {
  const year = Number.parseInt(yearStr, 10);
  if (!Number.isFinite(year)) return yearStr;
  const next = (year + 1) % 100;
  return normalizeSeasonLabel(`${year}/${String(next).padStart(2, "0")}`);
}

/**
 * Convert Understat per-season totals into our advanced records. Understat's
 * per-season totals are LEAGUE-competition data; the overlay (`enrichWithAdvanced`)
 * attaches them to each player-season's league row by (player, season), so the
 * record carries no competition name — it works for any league (La Liga, Serie A,
 * Premier League, Ligue 1, Saudi Pro League, MLS, ...).
 */
export function parseUnderstatSeasons(
  player: "messi" | "ronaldo",
  seasons: UnderstatSeasonEntry[],
): RawAdvancedRecord[] {
  const out: RawAdvancedRecord[] = [];
  for (const s of seasons) {
    const label = understatSeasonToLabel(s.season);
    if (!hasAdvancedMetrics(label)) continue;
    if (s.xG === undefined || s.xA === undefined) continue;
    out.push({
      player,
      season: label,
      xg: s.xG,
      xa: s.xA,
    });
  }
  return out;
}

type GroupsData = { season?: UnderstatSeasonEntry[] };

/**
 * The Understat adapter implements IngestionAdapter for symmetry, but its real
 * job is `enrich`. `fetchRows` returns the seed (so it is composable), while
 * `enrich` overlays live or seed-derived xG/xA onto base rows.
 */
export class UnderstatAdapter implements IngestionAdapter {
  readonly id = "understat" as const;

  /** Attempt live xG/xA; returns advanced records + whether the fetch worked. */
  async fetchAdvanced(): Promise<{ live: boolean; note: string; records: RawAdvancedRecord[] }> {
    const records: RawAdvancedRecord[] = [];
    try {
      for (const player of ["messi", "ronaldo"] as const) {
        const html = await fetchText(
          `https://understat.com/player/${UNDERSTAT_PLAYER_ID[player]}`,
        );
        const groups = decodeEmbeddedJson(html, "groupsData") as GroupsData;
        // Understat per-season totals are league data; the overlay attaches them
        // to each player-season's league row by (player, season) — no name needed.
        records.push(...parseUnderstatSeasons(player, groups.season ?? []));
      }
      if (records.length === 0) throw new Error("no advanced records parsed");
      return {
        live: true,
        note: `Fetched ${records.length} xG/xA season records from Understat.`,
        records,
      };
    } catch (err) {
      return {
        live: false,
        note: `Understat unreachable (${describe(err)}); xG/xA come from seed for 2014+ seasons.`,
        records: [],
      };
    }
  }

  /** Overlay advanced records onto base rows; returns enriched rows + report. */
  async enrich(
    rows: readonly PlayerSeasonComp[],
  ): Promise<{ live: boolean; note: string; rows: PlayerSeasonComp[] }> {
    const { live, note, records } = await this.fetchAdvanced();
    // When live failed, seed rows already carry xG/xA, so we keep them as-is.
    const enriched = live ? enrichWithAdvanced(rows, records, this.id) : [...rows];
    return { live, note, rows: enriched };
  }

  async fetchRows(): Promise<AdapterResult> {
    const { live, note, rows } = await this.enrich([
      ...seedRows("messi"),
      ...seedRows("ronaldo"),
    ]);
    return { adapter: this.id, liveFetchSucceeded: live, note, rows };
  }
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
