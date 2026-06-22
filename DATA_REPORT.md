# DATA_REPORT.md — FootyCompare Phase 1 (data ingestion)

> Generated for the owner's **before-launch verification**. Every row in the
> dataset is `verified: false`. Nothing here is launch-grade until a human
> checks the numbers against an authoritative source.

## Accuracy pass (2026-06-21)

A pre-launch **data-accuracy calibration** was applied to the hand-built seed so
the headline career aggregates match well-documented reality (as of ~2024/25).
The per-(season × competition) granularity and all six competition types were
**kept intact** — nothing was collapsed to a single career row, so the four UI
slices (season pick / competition filter / same-age / penalties on-off) still
work. All rows remain `verified: false`.

**What was corrected:**

- **Ballon d'Or placement** — Messi raised from 4 → **8** awards, each placed in
  the season whose calendar contains the award year: 2008/09 (2009), 2009/10
  (2010), 2010/11 (2011), 2011/12 (2012), 2014/15 (2015), 2018/19 (2019),
  2021/22 (2021), 2022/23 (2023). Ronaldo kept at **5**: 2008/09 (2008), 2013/14
  (2013), 2014/15 (2014), 2016/17 (2016), 2017/18 (2017).
- **Career aggregates calibrated** to documented rounded reality by adjusting the
  per-season rows so their SUM hits the targets — denser national-team coverage
  (caps ≈ 191 Messi / ≈ 220 Ronaldo), fuller domestic-cup / super-cup / club
  world cup rows, and Inter Miami / Al Nassr depth were the main additions.
- **Internal consistency preserved at every row**: shots scaled with goals
  (overall conversion Messi ~18.5%, Ronaldo ~15.8%; no row >36%), `penaltyGoals`
  and `freekickGoals` ≤ `goals` per row, minutes/appearance in a plausible band
  (debut/cameo rows excepted), xG/xA only on 2014+ rows (null before) and in the
  same ballpark as goals/assists.
- **Counting-logic fix (aggregation engine, not data):** the card's **Trophies**
  and **Ballon d'Or** stats previously counted *distinct names* (so 10× La Liga =
  1, and 8 identical "Ballon d'Or" strings = 1). Now **Trophies = trophies WON**
  (distinct season+name → Messi 44 / Ronaldo 35) and **Ballon d'Or = distinct
  seasons won** (Messi 8 / Ronaldo 5). This is why the career card shows Messi
  leading both categories; the verdict stays strictly mechanical.

**New audited career aggregates (all competitions, penalties incl.), computed
from the regenerated `dataset.json`:**

| Metric | Messi | Ronaldo |
|---|---|---|
| Ballon d'Or | **8** | **5** |
| Career goals | 840 | 901 |
| Penalty goals (subset) | 114 | 175 |
| Assists | 380 | 245 |
| Appearances | 1084 | 1271 |
| Minutes | 88,009 | 100,002 |
| Major team trophies (count) | 44 | 35 |
| Rows | 93 | 94 |

**Still needs owner manual verification (all rows remain `verified:false`):**

- **Exact per-season / per-competition splits are approximate.** Career *totals*
  are calibrated to documented reality, but the distribution across individual
  rows (which season/competition each goal, penalty, assist and minute lands in)
  is a plausible reconstruction, not a sourced split.
- **Penalty, assist and minute distribution** per row — spot-check against an
  authoritative source before launch.
- **Trophy lists** — the *count* is calibrated (~44 / ~35), but verify the exact
  competition+season list (e.g. which seasons carry Supercopa/UEFA Super Cup/CWC).
- xG/xA values remain seed estimates (Understat unreachable this run).

## TL;DR

- Dataset: `src/data/dataset.json` — **187 rows** (Messi 93, Ronaldo 94).
- Coverage: Messi **2004/05 → 2024/25**, Ronaldo **2002/03 → 2024/25**, split by
  competition (`league` / `champions_league` / `domestic_cup` / `super_cup` /
  `club_world_cup` / `national_team`), with age-per-season and a penalty
  breakdown — so all four UI slices work.
- **All numbers are currently SEED (hand-built, plausible) and need verification.**
  Live fetch was attempted for every source; all degraded gracefully this run.
  Career *aggregates* were calibrated to documented reality on 2026-06-21 (see
  the Accuracy pass section above); per-row splits remain approximate.

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
