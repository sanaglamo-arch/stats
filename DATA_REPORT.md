# DATA_REPORT.md — FootyCompare Phase 1 (data ingestion)

> Generated for the owner's **before-launch verification**. Every row in the
> dataset is `verified: false`. Nothing here is launch-grade until a human
> checks the numbers against an authoritative source.

## TL;DR

- Dataset: `src/data/dataset.json` — **112 rows** (Messi 55, Ronaldo 57).
- Coverage: Messi **2004/05 → 2024/25**, Ronaldo **2002/03 → 2024/25**, split by
  competition (`league` / `champions_league` / `domestic_cup` / `super_cup` /
  `club_world_cup` / `national_team`), with age-per-season and a penalty
  breakdown — so all four UI slices work.
- **All numbers are currently SEED (hand-built, plausible) and need verification.**
  Live fetch was attempted for every source; all degraded gracefully this run.

## Sources & what each provides

| Source | Role | Provides | Live this run? |
|---|---|---|---|
| **Wikidata/Wikipedia** (`wikidata`) | Reliable base | seasons, clubs, matches, goals, assists, age, trophies, awards | **No** — endpoint reachable but returns no usable per-(season×competition) splits → seed |
| **Understat** (`understat`) | Advanced metrics | xG / xA for 2014+ seasons | **No** — page fetch did not return the embedded `groupsData` payload → seed xG/xA kept |
| **FBref** (`fbref`) | Best-effort enrichment | shots, shots on target, cards | **No** — HTTP 403 (anti-bot) → seed |
| **Transfermarkt** | Best-effort enrichment | (shares the `fbref` adapter overlay path) | **No** — same degradation path |

> Re-run `pnpm ingest` to retry live fetch. The ingestion log prints
> `live=true/false` per adapter, and each row records its provenance in
> `source.origin` (`fetched` vs `seed`) and `source.enrichedBy`.

## Degradation behavior (by design)

Network is unreliable in the build environment, so adapters **never block**:

1. `WikidataAdapter` — even on HTTP 200, Wikidata lacks reliable
   per-competition season splits, so it intentionally degrades to seed (the
   seed is the canonical base for the 4 slices).
2. `UnderstatAdapter` — on fetch/parse failure, seed xG/xA are kept; pre-2014
   seasons stay `null` (honesty line, SPEC §6).
3. `FbrefAdapter` — on 403/offline, seed shots/SoT/cards are kept.

The parse/normalize logic for all three is real and unit-tested on fixtures
(`src/lib/data/normalize.test.ts`, `src/lib/data/adapters/parsers.test.ts`), so
when a source becomes reachable (proxy/cache) the data normalizes correctly.

## What needs owner verification before launch (everything numeric)

Because all rows are seed this run, **every numeric field is approximate**.
Priority checks:

- **Goal & penalty totals per (player × season × competition)** — these drive
  the headline verdict and the penalties on/off slice. Verify against an
  authoritative source (e.g. official club/league records, RSSSF).
- **xG / xA (2014+ rows)** — verify against Understat once reachable. Pre-2014
  rows are correctly `null` and hidden in the UI; do not backfill them.
- **Shots / shots-on-target** — used for the shot-conversion stat; seed
  estimates, verify against FBref.
- **Trophies & individual awards (Ballon d'Or count)** — used for two card
  categories; spot-check the lists per season.
- **Age-per-season** — drives the same-age comparison slice; verify boundary
  seasons (a player's age can map to two seasons).
- **Minutes** — drives all per-90 derived metrics.

When a number is confirmed, set its row's `verified: true` (and ideally switch
`source.origin` to `fetched` with the real source).

## Photo rights — before-launch TODO (SPEC §8)

⚠️ **Not a Phase-1 blocker, but a launch blocker.** The MVP card uses two real
player photos (Messi, Ronaldo) as swappable assets. Before any public/viral
launch, the owner MUST either:

- secure a proper licence / image-rights clearance for both photos, **or**
- replace them with commissioned stylized art / silhouettes.

Real photos at viral scale = copyright + personality-rights exposure. The photo
component takes a `src`, so swapping assets is a one-line change.

**Phase 2 status (Card/Design):** the MVP intentionally ships **stylized neon
silhouette placeholders** (`public/players/messi.svg`, `public/players/ronaldo.svg`)
instead of real photos — no copyrighted likeness is embedded, so the build is
legal and works offline. National-team flags (`public/flags/ar.svg`,
`public/flags/pt.svg`) are simple renderings of public-domain national symbols.
The `<PhotoSlot src=…>` component takes a replaceable `src`; dropping in a
licensed photo later is a one-line change per player in
`src/components/card/player-meta.ts`. The before-launch decision (licence real
photos **or** commission art) is unchanged.

## How to regenerate

```bash
pnpm ingest      # runs adapters → normalize → writes src/data/dataset.json
pnpm test        # unit tests on fixtures (no network)
```
