/**
 * One-shot ingestion (P1-5): run adapters → normalize → save dataset JSON.
 *
 *   pnpm ingest
 *
 * Strategy (SPEC §6 hybrid):
 *   1. Wikidata = reliable base (degrades to seed — Wikidata lacks per-comp splits).
 *   2. Understat = xG/xA enrichment for 2014+ (degrades to seed values).
 *   3. FBref/Transfermarkt = best-effort shots/discipline overlay (degrades to seed).
 *
 * Network is unreliable here, so every step degrades gracefully and records
 * what happened. The committed dataset always covers both full careers so all
 * four UI slices work offline.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import type { PlayerSeasonComp } from "@/lib/data/types";
import { WikidataAdapter } from "@/lib/data/adapters/wikidata";
import { UnderstatAdapter } from "@/lib/data/adapters/understat";
import { FbrefAdapter } from "@/lib/data/adapters/fbref";
import { enrichWithShots } from "@/lib/data/normalize";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../src/data/dataset.json");

type StepReport = { adapter: string; live: boolean; note: string };

async function run(): Promise<void> {
  const reports: StepReport[] = [];

  // 1. Base rows (Wikidata or seed).
  const wikidata = new WikidataAdapter();
  const base = await wikidata.fetchRows();
  reports.push({ adapter: base.adapter, live: base.liveFetchSucceeded, note: base.note });
  let rows: PlayerSeasonComp[] = base.rows;

  // 2. Understat xG/xA enrichment.
  const understat = new UnderstatAdapter();
  const enriched = await understat.enrich(rows);
  reports.push({ adapter: "understat", live: enriched.live, note: enriched.note });
  rows = enriched.rows;

  // 3. FBref/Transfermarkt best-effort overlay (shots/SoT/cards).
  const fbref = new FbrefAdapter();
  const fb = await fbref.fetchEnrichment();
  reports.push({ adapter: "fbref", live: fb.live, note: fb.note });
  if (fb.live && fb.records.length > 0) {
    rows = enrichWithShots(rows, fb.records, "fbref");
  }

  // Invariant: every row stays verified:false until owner sign-off.
  rows = rows.map((r) => ({ ...r, verified: false }));

  const out = {
    generatedAt: new Date().toISOString(),
    reports,
    rows,
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n", "utf8");

  const messi = rows.filter((r) => r.player === "messi").length;
  const ronaldo = rows.filter((r) => r.player === "ronaldo").length;
  console.log(
    `[ingest] wrote ${rows.length} rows (messi ${messi}, ronaldo ${ronaldo}) → ${OUT_PATH}`,
  );
  for (const r of reports) {
    console.log(`[ingest] ${r.adapter}: live=${r.live} — ${r.note}`);
  }
}

run().catch((err: unknown) => {
  console.error("[ingest] fatal", err);
  process.exit(1);
});
