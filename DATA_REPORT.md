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

## Photo rights — attribution required before public launch (SPEC §8, P8-5)

**Phase 8 status (P8-5):** the card + player profile pages now ship **real,
freely-licensed photos** of both players, sourced from Wikimedia Commons. Both
are **CC BY 4.0** (Creative Commons Attribution 4.0 International), which permits
commercial/online use *provided attribution is given*. The stylized neon
silhouette placeholders (`public/players/messi.svg`, `public/players/ronaldo.svg`)
are **kept in place as a fallback** and are no longer referenced by default.

**Attribution is REQUIRED before public launch.** CC BY 4.0 obliges us to credit
the author + license (and ideally link the source) wherever the images appear. A
visible credit (e.g. a footer/about line) MUST be added before any public/viral
launch. The two photos and their required attribution:

| Player | File (`public/players/`) | Author | License | Commons source |
| --- | --- | --- | --- | --- |
| Lionel Messi | `messi.jpg` (720×744) | Hossein Zohrevand / Tasnim News Agency | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Lionel_Messi_WC2022.jpg |
| Cristiano Ronaldo | `ronaldo.jpg` (307×425) | Hossein Zohrevand / Tasnim News Agency | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Cristiano_Ronaldo_WC2022_-_01_(cropped).jpg |

Suggested credit line (must appear in the live product before launch):

> Player photos: Lionel Messi & Cristiano Ronaldo by Hossein Zohrevand / Tasnim
> News Agency, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/),
> via Wikimedia Commons.

**Note on personality rights:** CC BY 4.0 covers the *photographer's copyright*,
not the subject's personality/publicity rights. At viral scale, an
image-rights/personality-rights review is still advisable. Swapping assets stays
a one-line change per player in `src/components/card/player-meta.ts`
(`photoSrc`), and the silhouette SVGs remain available as a drop-in fallback.

National-team flags (`public/flags/ar.svg`, `public/flags/pt.svg`) are simple
renderings of public-domain national symbols.

## Club crests — REAL official trademarks (P8-6, 2026-06-23)

⚠️ **TRADEMARK / LICENSING CLEARANCE IS REQUIRED BEFORE PUBLIC LAUNCH.** As of
P8-6 the 8 stylized placeholder marks have been **REPLACED with the real,
official club crests** sourced from Wikimedia (`upload.wikimedia.org`). These are
**registered trademarks** of their respective clubs. The originals were
**overwritten** — the previous P7-3 stylized placeholders (shield/roundel +
monogram in each club's colors) **no longer exist in the tree**; they can be
recovered from git history (commit `c830b46` and earlier) if a rollback is needed
for licensing reasons.

The card header + the player-profile crest row now render these official crests
(`public/crests/*.svg`, all 8 still SVG, same slugs, mapped in
`src/components/card/club-crests.ts` — the `crestForClub` API and the `.svg`
paths are unchanged, so no code/test change was needed).

| Club (dataset string) | File | Format | License tag | Wikimedia file page |
| --- | --- | --- | --- | --- |
| Barcelona (`Barcelona`) | `barcelona.svg` | SVG | **PD-textlogo** + trademark | https://en.wikipedia.org/wiki/File:FC_Barcelona_(crest).svg |
| Paris Saint-Germain | `psg.svg` | SVG | **PD-textlogo** + trademark | https://en.wikipedia.org/wiki/File:Paris_Saint-Germain_F.C..svg |
| Inter Miami | `inter-miami.svg` | SVG | **PD-textlogo** + trademark | https://commons.wikimedia.org/wiki/File:MLS_crest_logo_RGB_-_Inter_Miami_CF.svg |
| Sporting CP | `sporting.svg` | SVG | **Non-free logo** (fair use) | https://en.wikipedia.org/wiki/File:Sporting_CP_crest.svg |
| Manchester United | `man-united.svg` | SVG | **Non-free logo** (fair use) | https://en.wikipedia.org/wiki/File:Manchester_United_FC_crest.svg |
| Real Madrid | `real-madrid.svg` | SVG | **Non-free logo** (fair use) | https://en.wikipedia.org/wiki/File:Real_Madrid_CF.svg |
| Juventus | `juventus.svg` | SVG | **PD-textlogo** + trademark | https://commons.wikimedia.org/wiki/File:Juventus_FC_2017_logo.svg |
| Al Nassr | `al-nassr.svg` | SVG | **Trademarked** / non-free (`Marque déposée`) | https://fr.wikipedia.org/wiki/Fichier:Logo_Al-Nassr_FC_2025.svg |

License notes:
- **Barcelona / PSG / Inter Miami / Juventus** are tagged **PD-textlogo** (below
  the US threshold of originality) but **still carry the clubs' trademark
  rights** — public-domain copyright status does NOT grant trademark permission.
- **Sporting CP / Manchester United / Real Madrid** are **non-free logos** hosted
  under fair-use rationales on Wikipedia; using them in a product is **not**
  covered by that rationale and needs explicit clearance.
- **Al Nassr** is the current 2025 (70th-anniversary) crest, tagged a registered
  trademark on fr.wikipedia.
- **Juventus** is the modern 2017 "J" logo (the club's current official mark; the
  classic striped oval is no longer the current crest on Wikimedia).

Before any public/viral launch, the owner MUST **secure proper licence /
trademark clearance** for all 8 crests, or revert to bespoke/original marks
(recoverable from git history). Swapping any crest back is a one-file change in
`public/crests/` (the mapping in `club-crests.ts` resolves by exact club name and
returns `null` for unknown clubs / national-team rows, so the card omits the
accent gracefully).

**Legibility note (for the conductor):** the **Juventus** crest is a solid-black
"J" with no light fill, rendered at ~36px on the dark card base (`#0a0e1a`). It
will read very faintly / nearly vanish against the dark background (the existing
`drop-shadow` does not help a solid-black mark). A subtle light backing chip
behind the crest (or only for Juventus) would fix it — flagged, not
over-engineered here. The other 7 crests use light/saturated colors (white,
yellow, red, blue) and read fine on dark.

## Phase 6 — metric expansion, illustrative data (2026-06-22)

Phase 6 expanded the data/contract layer (the card/charts/UI consume it). All
rows remain `verified: false`.

### New derived metrics (computed from rows, never stored)

Added to `deriveMetrics` and exposed via the metric registry `METRIC_CATALOG`
(`src/lib/data/aggregate.ts`). All are genuinely derivable from the canonical
`PlayerSeasonComp` schema:

- `goalContributions` (G+A), `goalContributionsPer90`
- `assistsPer90`
- `shotsOnTargetPct` (SoT / shots), `shotsPer90`
- `minutesPerGoal` (lower-is-better)
- `xgPer90`, `xaPer90` (availability `"modern"` — **null** for pre-2014 seasons,
  same honesty line as xG/xA)

Also surfaced as catalog metrics (already in the schema): `starts`,
`freekickGoals`, `penaltyGoals`. The catalog groups every metric into
attack / creation / efficiency / discipline / trophies and records, per metric,
a single canonical `definition`, decimals, format, `higherIsBetter` and
`availability`.

The **default card is unchanged**: `DEFAULT_METRICS` is exactly the original 12
keys in the original order, and `DEFAULT_SLICE` uses it, so the default
`/render/card` PNG and view-model are byte-identical.

### hatTricks — ILLUSTRATIVE (not real, `verified:false`)

`hatTricks: number` was **added to the `PlayerSeasonComp` schema** even though it
is **not** part of the SPEC §6 canonical model and is **not sourced from any real
feed**. Seed values are a deterministic placeholder (`floor(goals / 14)` for open-
play club competitions; 0 for national-team / super-cup / club-world-cup cameos),
written by the seed path in `src/lib/data/seed.ts`. The live-source normalize path
sets it to 0. Its catalog entry is `availability:"illustrative"`. **TODO before
launch:** replace with real hat-trick counts or drop the metric.

### Illustrative positional data — heatmap + shotmap (NOT real)

Free positional feeds (heatmaps / shotmaps) are unavailable, so
`getIllustrativePositional(player)` (`src/lib/data/positional.ts`, exposed on the
`DataSource` interface so it is swappable) returns a **deterministic placeholder**:

- a `16×10` heatmap intensity grid (each cell 0..1),
- a shotmap of points on a normalized `0..1` pitch half (x, y, xg, outcome),
- `illustrative: true` as part of the return.

It is derived from a seeded PRNG (mulberry32) keyed by an FNV-1a hash of the
player id — **no `Math.random` / `Date` / clock** — so the same player always
yields byte-identical output (charts/PNG stay deterministic). This is **NOT real
tracking/positional data**; the UI must badge it `illustrative`. **TODO before
launch:** swap in a real positional provider behind `DataSource` (no frontend
change required) or keep it explicitly labelled.

## Phase 8 — REAL cross-verified data (2026-06-23)

Phase 8 replaced the hand-built seed numbers with **real, cross-verified** club + national-team data. `dataset.json` now has **215 rows** (Messi 105, Ronaldo 110); 155 rows `verified:true`, 60 `verified:false` (see divergences below).

### Source availability (calibrated 2026-06-23) — IMPORTANT
The sources named in the brief were tested before any collection:

| Source | Status | Used for |
|---|---|---|
| **FBref (Opta)** — intended canon | ❌ HTTP **403** anti-bot | unreachable; documented only |
| **Transfermarkt** | ❌ blocked (cannot fetch) | unreachable |
| **Understat** (xG/xA) | ❌ blocked (JS-gated, no table in fetch) | unreachable |
| **messivsronaldo.app** `/club-stats/<season>/` | ✅ fetchable, structured | **PRIMARY club canon** — per-competition apps/goals/assists/minutes for both players, maps 1:1 to the schema |
| **Wikipedia** (article + by-year intl tables) | ✅ fetchable | national-team totals, awards, corroboration |
| **WebSearch** | ✅ | per-season headline cross-verification |

→ **Adopted canon: messivsronaldo.app (mvr) for club structure, Wikipedia + WebSearch for cross-verification.** Fabricating "real" numbers from blocked sources was explicitly avoided. `source.adapter:"mvr"` (new `AdapterId`) marks mvr-sourced club rows; `"wikidata"` marks national rows (Wikipedia + mvr).

### Per-metric canon + definition
- **matches / minutes / goals / assists / penaltyGoals** (club): mvr per (season × competition), club + all comps. Definition e.g. *"goals = club, that competition, mvr (corroborated vs Wikipedia/WebSearch)"*.
- **xg / xa**: mvr league-row only, ≈2014/15+; `null` otherwise (honesty line — pre-2014 advanced metrics don't exist publicly). Understat (the intended xG source) was blocked.
- **national caps / goals**: Wikipedia by-year intl tables + mvr, cross-verified to the career total; per-season split **distributed** (no Aug–Jul intl source exists).
- **starts, shots, shotsOnTarget, freekickGoals, yellowCards, redCards, hatTricks**: ⚠️ **NOT yet from a real source** — carried over from the Phase-1 seed row for that (player × season × competition). `hatTricks` remains illustrative. These are the main remaining owner-verification items.
- **Ballon d'Or**: ✅ re-verified — Messi 8 (2009–12, 2015, 2019, 2021, 2023), Ronaldo 5 (2008, 2013, 2014, 2016, 2017), placed on the correct award-season league rows.
- **trophies (team trophies)**: ✅ **cross-verified (P8-4 follow-up; was seed-carried)** — rebuilt every `trophies` array against Wikipedia *"List of career achievements by Lionel Messi / Cristiano Ronaldo"* + main player pages, cross-verified via WebSearch (CBS/UEFA/ESPN/MLSsoccer/SI). Each trophy now sits on the correct (player × season × competition) row using the real competition name; the prior seed had many misplacements (e.g. Ronaldo's single Al-Nassr Arab Club Champions Cup spread across 4 rows; "EFL Cup" mis-tagged on Man Utd 2008/09 cups; Inter Miami "Leagues Cup" duplicated onto the U.S. Open Cup row). **Verified distinct trophyCount (season+name) within dataset coverage: Messi 42, Ronaldo 32** (down from seed ~45 / ~33 — the seed over-counted via duplicates/misplacements). Out-of-dataset-coverage wins with no host row: Messi MLS Cup 2025 (2025/26, beyond coverage) and Ronaldo Sporting CP Supertaça 2002 (no super_cup row exists for 2002/03) — noted, not added (row structure left intact).
  - **Messi per-competition breakdown (42):** La Liga 10, Copa del Rey 6, UEFA Champions League 4, Supercopa de España 6, UEFA Super Cup 3, FIFA Club World Cup 3, Ligue 1 2, Trophée des Champions 1, Leagues Cup 1, Supporters' Shield 1; Argentina — FIFA World Cup 1, Copa América 2 (2021, 2024), Finalissima 1, Olympic Gold 1.
  - **Ronaldo per-competition breakdown (32):** Premier League 3, La Liga 2, Serie A 2, UEFA Champions League 5, FIFA Club World Cup 4, UEFA Super Cup 2, Supercopa de España 2, Supercoppa Italiana 2, Coppa Italia 1, Copa del Rey 2, FA Cup 1, Football League Cup 1, FA Community Shield 1, Arab Club Champions Cup 1; Portugal — UEFA European Championship 1 (2016), UEFA Nations League 2 (2019, 2025).
- **other individualAwards / ageDuringSeason**: other awards (e.g. Golden Shoe) still carried from seed (NOT yet re-verified); Ballon d'Or untouched (still 8/5). `ageDuringSeason` recomputed deterministically = `seasonStartYear − birthYear` (Messi b. 1987-06-24, Ronaldo b. 1985-02-05; both birthdays precede August, so this is age at season start). This corrected seed shifts (e.g. Ronaldo 2002/03: 18 → 17).

### Career-total cross-verification (the headline numbers — 2+ sources)
| Figure | Our data | Cross-source | Verdict |
|---|---|---|---|
| Messi club goals | **762** | Barça 672 = Wikipedia exact; PSG 32, Inter Miami 58 (mvr + WebSearch) | ✅ verified |
| Ronaldo club goals | **798** | Real Madrid 450 = canonical (RM site says 451); Man Utd 142, Juve 101, Sporting 5, Al Nassr 100 | ✅ verified (≈801 canonical incl. excluded Europa rows — see below) |
| Messi Argentina | **196 caps / 115 goals** (thru 2024/25) | Wikipedia by-year + mvr (full-career 201/122 incl. in-progress 2026) | ✅ caps/goals exact; per-season distributed |
| Ronaldo Portugal | **226 caps / 143 goals** (thru 2024/25) | Wikipedia + mvr + UEFA (all-time men's top scorer); full-career 229/143 | ✅ caps/goals exact; per-season distributed |
| Ballon d'Or | **Messi 8 / Ronaldo 5** | Wikipedia (exact award years) | ✅ verified + normalized to the correct award seasons |
| Team trophies (distinct, in-coverage) | **Messi 42 / Ronaldo 32** | Wikipedia "List of career achievements by…" + WebSearch (CBS/UEFA/ESPN/MLSsoccer/SI) | ✅ verified + placed on correct (season×competition) rows; out-of-coverage wins (Messi MLS Cup 2025, Ronaldo Supertaça 2002) noted, not host-able |

### Divergences → `verified:false` (recorded for owner sign-off)
1. **Messi PSG 2022/23 (4 rows):** goals agree (21), but **appearances diverge** — mvr 41 vs WebSearch 54 (mvr counts only its 4 listed comps). Both values noted.
2. **Messi Inter Miami 2023/24 & 2024/25 (8 rows):** **MLS calendar-year vs European Aug–May boundary** mismatch — mvr splits on the Euro calendar (its "2024-2025" even includes the Jun-2025 Club World Cup), not comparable to calendar-year sources. Flagged pending a boundary decision (also relevant to the P8-7 current-season cron).
3. **Ronaldo 2021/22 & 2022/23 (6 rows):** mid-season transfers (Juve→Man Utd; Man Utd→Al Nassr). mvr returns **combined** per-competition totals only — the two clubs cannot be cleanly split (mvr footnotes: "+1 Serie A app for Juventus", "+3 goals/2 assists/16 apps for Man Utd"). Rows assigned to the majority club; both values noted.
4. **Ronaldo Europa League / UEFA Cup EXCLUDED:** 2002/03 Sporting UEFA Cup (2 app, 0 g) + 2022/23 Man Utd Europa League (6 app, **2 g**) are **not in the dataset** — the closed `CompetitionType` union has no Europa/UEFA-Cup bucket, and force-fitting into `champions_league` would corrupt CL totals. This is the ~2-goal gap between our 798 and the canonical ~800. **Owner decision needed:** add a `europa_league` competition type (touches UI tabs/aggregation) or accept the documented exclusion.
5. **All 42 national rows `verified:false`:** career caps/goals are real + cross-verified, but per-season values were **distributed** from calendar-year data (no per-season Aug–Jul source). `assists` distributed proportionally.

### Still needs owner verification before launch
- The carried-from-seed fields (starts/shots/SoT/freekicks/cards/hatTricks) — no real source yet.
- ~~trophies~~ ✅ now cross-verified (P8-4, see above; Messi 42 / Ronaldo 32 distinct). Remaining: other individualAwards (e.g. Golden Shoe) still seed-carried; Ballon d'Or already verified 8/5.
- The PSG-apps, Inter-Miami-boundary, Ronaldo-combined-transfer, and Europa-League items above.

## How to regenerate

```bash
# Phase 8 club/national data was collected via web research (messivsronaldo.app +
# Wikipedia + WebSearch) into data-staging/*.json, then merged into dataset.json.
# The original adapter pipeline (FBref/TM/Understat) remains but those sources are
# anti-bot/blocked, so it degrades to seed — see "Source availability" above.
./node_modules/.bin/tsc --noEmit   # typecheck (corepack/pnpm is broken in this env)
./node_modules/.bin/vitest run     # unit tests on fixtures (no network)
```
