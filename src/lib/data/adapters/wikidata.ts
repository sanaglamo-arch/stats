import type {
  AdapterResult,
  IngestionAdapter,
  PlayerSeasonComp,
} from "../types";
import { normalizeSeasonRecord, type RawSeasonRecord } from "../normalize";
import { seedRows } from "../seed";
import { fetchJson } from "./http";

/**
 * Wikidata/Wikipedia adapter — the reliable base source (SPEC §6).
 *
 * Provides: seasons, clubs, matches, goals, assists, age, trophies, awards.
 * Strategy: query the Wikidata SPARQL endpoint; if it is unreachable, banned,
 * or returns unusable data, degrade to the seed dataset and record it.
 */

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

/** Shape of a SPARQL JSON binding we care about. */
type SparqlResponse = {
  results?: {
    bindings?: Array<Record<string, { value: string }>>;
  };
};

/** Wikidata QIDs for the two players. */
const PLAYER_QID: Record<"messi" | "ronaldo", string> = {
  messi: "Q615",
  ronaldo: "Q11571",
};

/**
 * Map a raw SPARQL binding onto our loose RawSeasonRecord. Wikidata's per-season
 * club stats are sparse/inconsistent, so this is best-effort; missing numeric
 * fields normalize to 0 downstream.
 */
export function bindingToRaw(
  player: "messi" | "ronaldo",
  binding: Record<string, { value: string }>,
): RawSeasonRecord | null {
  const season = binding.season?.value;
  const club = binding.club?.value;
  const competitionName = binding.competition?.value ?? "League";
  if (!season || !club) return null;
  return {
    player,
    season,
    age: binding.age?.value ?? 0,
    club,
    competitionName,
    matches: binding.matches?.value,
    goals: binding.goals?.value,
    assists: binding.assists?.value,
  };
}

function parseResponse(
  player: "messi" | "ronaldo",
  res: SparqlResponse,
): PlayerSeasonComp[] {
  const bindings = res.results?.bindings ?? [];
  const rows: PlayerSeasonComp[] = [];
  for (const b of bindings) {
    const raw = bindingToRaw(player, b);
    if (raw) rows.push(normalizeSeasonRecord(raw, "wikidata"));
  }
  return rows;
}

function buildQuery(qid: string): string {
  // Minimal participation query; full per-competition splits are not reliably
  // modelled in Wikidata, which is exactly why we keep the seed fallback.
  return `SELECT ?season ?club ?competition ?matches ?goals WHERE {
    wd:${qid} p:P54 ?stmt .
    ?stmt ps:P54 ?clubEntity .
    OPTIONAL { ?clubEntity rdfs:label ?club . FILTER(LANG(?club)="en") }
  } LIMIT 200`;
}

export class WikidataAdapter implements IngestionAdapter {
  readonly id = "wikidata" as const;

  async fetchRows(): Promise<AdapterResult> {
    const rows: PlayerSeasonComp[] = [];
    try {
      for (const player of ["messi", "ronaldo"] as const) {
        const url = `${SPARQL_ENDPOINT}?format=json&query=${encodeURIComponent(
          buildQuery(PLAYER_QID[player]),
        )}`;
        const res = await fetchJson<SparqlResponse>(url);
        rows.push(...parseResponse(player, res));
      }
      // Wikidata does not carry usable per-competition season splits, so even a
      // successful HTTP call yields too few rows to drive the 4 slices.
      if (rows.length < 20) {
        throw new Error(
          `Wikidata returned ${rows.length} usable rows; insufficient for per-competition splits`,
        );
      }
      return {
        adapter: this.id,
        liveFetchSucceeded: true,
        note: `Fetched ${rows.length} rows from Wikidata SPARQL.`,
        rows,
      };
    } catch (err) {
      return {
        adapter: this.id,
        liveFetchSucceeded: false,
        note: `Degraded to seed (${describe(err)}). Wikidata lacks reliable per-(season×competition) splits; seed carries the canonical base data.`,
        rows: [...seedRows("messi"), ...seedRows("ronaldo")],
      };
    }
  }
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
