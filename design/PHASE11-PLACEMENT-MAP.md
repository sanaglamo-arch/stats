# PHASE 11 — DATA-PLACEMENT MAP (Agent A) — for manager review

> **Purpose:** guarantee that **NO metric and NO cut** in `DATA-INVENTORY.md` is lost anywhere in the
> Phase-11 product, and **audit `PHASE11-UX-PLAN.md` against the full data inventory**.
> **Scope:** structure / IA only. NO app code changed by this document.
> **Companions:** `DATA-INVENTORY.md` (boss checklist), `PHASE11-UX-PLAN.md` (approved IA, §0.5 LOCKED),
> `DATA_REPORT.md` (honest gaps), `src/lib/data/aggregate.ts` (real registry — 24 keys).

## 0. Dataset facts — verified by me (not trusted blindly)

Counted directly off `src/data/dataset.json` (222 rows):

| Fact | Inventory claims | Verified | OK |
|---|---|---|---|
| Rows | 222 (messi 109 / ronaldo 113) | 222 / 109 / 113 | ✅ |
| Seasons | 24 (2002/03–2025/26) | 24 | ✅ |
| `competitionType` | 6 | 6 (champions_league, club_world_cup, domestic_cup, league, national_team, super_cup) | ✅ |
| `competitionName` | 34 | **34** (incl. mixed/aggregate: "Domestic Cup (mixed)", "Saudi Pro League / Premier League") | ✅ |
| Clubs/teams | 10 | 10 | ✅ |
| Age axis | 17→40 (`ageDuringSeason`) | min 17 / max 40 | ✅ |
| xG / xA coverage | 24 / 222 | 24 non-null each (198 null) | ✅ |
| Cards | 0 / 222 → н/д | yellow Σ 0 / red Σ 0 | ✅ |
| `verified:false` | 67 (42 national + 25 club) | 67 | ✅ |

**Registry reality:** `METRIC_CATALOG` has **24 keys**. Raw shot VOLUME (`shots`, `shotsOnTarget`) lives in
`AggregateTotals` but is **NOT** a catalog metric — only the derived `shotsPer90 / shotConversion /
shotsOnTargetPct` are keyed. (PHASE11-UX-PLAN §2.2 lists `shots`/`shotsOnTarget` as columns — they must be
read off totals directly, not via `metricValue`.) The boss's derived asks **xG-performance (goals−xG),
penalty% (pen/goals), start-share (starts/matches)** are **NOT in the catalog and NOT in `deriveMetrics`.**

**What p11-2 already shipped (inline body on `/`, `stats-model.ts` + `stats-body.tsx` + `stat-table.tsx`):**
- Career H2H **metric grid = ALL 24 catalog keys** (Core 8 visible + Advanced 16 behind toggle), each with
  leader tint + honesty badge (modern / illustrative / missing).
- Season comparative table — **only 4 columns** (`goals`, `assists`, `G+A`, `matches`) across **5 contexts**
  (all · league · CL · national · cups[bundled]).
- Cuts present inline: **by season** (table), **by club** (10, both players), **by competitionType** (6, the
  `types` cut), **career totals**.
- Honesty: cards forced `н/д`, national "распределено" badge, xG/xA modern badge, sparse seasons "—".

So the inline body is much richer than PHASE11-UX-PLAN §8.5 assumed (the plan predates the manager's
inline-first lock). The remaining work is **depth (rate metrics per-season), the 34 granular competitions,
and the age axis** — plus `/compare` and `/player/[id]` which are **not yet built**.

---

## 1. Coverage matrix — METRICS

Legend — Home columns: **CG** = `/` inline Career H2H grid · **ST** = `/` inline Season table ·
**CMP** = `/compare` Deep H2H · **PL** = `/player/[id]`. Tier: C = Core (default) · A = Advanced (toggle).
Honesty: ✅ always · 🕒 modern 2014+ (`н/д` pre-2014) · ⚠️ illustrative · 🚫 forced `н/д` (0/222).

| # | Metric (catalog key) | Group | Avail | Home today | Target homes | Tier | Honesty |
|---|---|---|---|---|---|---|---|
| 1 | `goals` | attack | always | CG, ST | CG·ST·CMP·PL | C | ✅ |
| 2 | `assists` | creation | always | CG, ST | CG·ST·CMP·PL | C | ✅ |
| 3 | `goalContributions` (G+A) | attack | always | CG, ST | CG·ST·CMP·PL | C | ✅ |
| 4 | `matches` | efficiency | always | CG, ST | CG·ST·CMP·PL | C | ✅ |
| 5 | `starts` | efficiency | always | CG | CG·CMP·PL | C | ✅ |
| 6 | `minutes` | efficiency | always | CG | CG·CMP·PL | C | ✅ |
| 7 | `goalsPer90` | attack | always | CG | CG·**ST**·CMP·PL | A | ✅ |
| 8 | `assistsPer90` | creation | always | CG | CG·**ST**·CMP·PL | A | ✅ |
| 9 | `goalContributionsPer90` (G+A/90) | attack | always | CG | CG·**ST**·CMP·PL | A | ✅ |
| 10 | `shotConversion` (goals/shots) | efficiency | always | CG | CG·**ST**·CMP·PL | A | ✅ |
| 11 | `shotsOnTargetPct` (SoT%) | efficiency | always | CG | CG·CMP·PL | A | ✅ |
| 12 | `shotsPer90` | attack | always | CG | CG·CMP·PL | A | ✅ |
| 13 | `minutesPerGoal` (↓ better) | efficiency | always | CG | CG·CMP·PL | A | ✅ |
| 14 | `freekickGoals` | attack | always | CG | CG·CMP·PL | A | ✅ |
| 15 | `penaltyGoals` | attack | always | CG | CG·CMP·PL | A | ✅ |
| 16 | `xg` | attack | modern | CG | CG·CMP·PL | A | 🕒 |
| 17 | `xa` | creation | modern | CG | CG·CMP·PL | A | 🕒 |
| 18 | `xgPer90` | attack | modern | CG | CG·CMP·PL | A | 🕒 |
| 19 | `xaPer90` | creation | modern | CG | CG·CMP·PL | A | 🕒 |
| 20 | `trophies` | trophies | always | CG | CG·CMP·PL(honours) | C | ✅ |
| 21 | `ballonDor` | trophies | always | CG | CG·CMP·PL(honours) | C | ✅ |
| 22 | `hatTricks` | attack | illustrative | CG | CG·PL | A | ⚠️ |
| 23 | `yellowCards` | discipline | always(0/222) | CG | CG·PL | A | 🚫 |
| 24 | `redCards` | discipline | always(0/222) | CG | CG·PL | A | 🚫 |

**Raw shot volume (not catalog keys, but in inventory):**

| Field | Source | Home today | Target | Note |
|---|---|---|---|---|
| `shots` | `AggregateTotals.shots` | — | ST(A)·CMP(A)·PL(A) | Read off totals; add a short column. No catalog key. |
| `shotsOnTarget` | `AggregateTotals.shotsOnTarget` | — | ST(A)·CMP(A)·PL(A) | Same. |

**Boss-asked DERIVED metrics NOT in the registry — GAPS (compute from real fields, never fabricate):**

| Derived ask | Formula (real fields) | In `deriveMetrics`? | Home today | Verdict |
|---|---|---|---|---|
| **xG-performance** (over/under) | `goals − xg` (modern only; `н/д` pre-2014) | ❌ | **none** | **GAP — must add.** CG + PL shooting block. Boss-named. |
| **penalty %** of goals | `penaltyGoals / goals` | ❌ | **none** | **GAP.** CG(A) + PL shooting block. Inventory-named. |
| **start share** | `starts / matches` | ❌ | **none** | **GAP.** CG(A) + PL. Inventory-named. |

### Metric coverage verdict
- **24 / 24** catalog metrics have a confirmed home **today** (the inline Career H2H grid surfaces every
  key). After Phase 11 each also lands in CMP + PL.
- **3 boss-asked derived metrics have NO home and are NOT computed** (xG-performance, penalty%, start-share).
  These are the only true METRIC gaps. All three are pure functions of existing fields → add to
  `deriveMetrics` (data-layer task for the build agent; surfaced here as placement).
- Per-season DEPTH gap: rate/efficiency metrics (7–13) exist only in the **career** grid, not in the
  **per-season** table — see §3 audit.

---

## 2. Coverage matrix — CUTS

| Cut | Granularity | Engine (reuse) | Home today | Target home(s) | Control | Verdict |
|---|---|---|---|---|---|---|
| **By season** | 24 | `seasonTrend` / per-season `aggregate` | ST (G/A/G+A/MP) | ST · CMP(season view) · PL(season table) | rows; chronological | ✅ homed (deepen cols) |
| **By competitionType** | 6 | `filterByCompetitions` | ST 5-context tabs + `types` cut (6) | ST · CMP tabs · PL tabs | radix `CompetitionTabs` | ✅ homed |
| **By competitionName** | **34** | row `competitionName` + `mapLeagueLabel` | **NONE** | **PL** per-season expandable (every name) · **CMP** competition `NeonSelect` · **PL** by-league strip | expandable `<details>` + select | 🚨 **GAP — no home today** |
| **By club/team** | 10 | `clubCuts` (built) | clubs cut (both players) | ST(clubs) · PL(header crests + per-club totals) | `clubs` tab; optional club select on PL | ✅ homed |
| **By age** | 17→40 | `selectSeasons{kind:"age"}`, `seasonTrend` re-keyed | **NONE** | **CMP** same-age curve chart + same-age table view · **PL** age-progression strip | `SegmentedControl` "Same age" + age-curve module | 🚨 **GAP — no home today** |
| **Career totals** | per slice | `aggregate` | CG, `totals` cut, ST `<tfoot>` | CG · CMP `<tfoot>` · PL hero + `<tfoot>` | pinned total row | ✅ homed |
| **H2H (metric × cut)** | any × any | `compare` / aligned model | CG (all metrics) + ST (4 metrics) | CG · CMP (full metric × season × comp + Δ + who-leads) | dual aligned table + Δ col | ⚠️ partial (CMP not built) |

### Cut coverage verdict
- **5 / 7** cut families have a concrete home today (season, competitionType, club, career totals, H2H-core).
- **2 hard GAPS, both explicitly boss-named:**
  - **34 granular `competitionName`** — nothing renders La Liga / Copa del Rey / Supercopa separately
    anywhere. Engine exists (`competitionName` on every row); UI does not. **Top gap.**
  - **Age axis** — `selectSeasons{kind:"age"}` and `seasonTrend` exist; no age-curve chart, no same-age
    table renders anywhere. Boss explicitly asks for overlaid age curves ("наложение кривых").

---

## 3. Audit — PHASE11-UX-PLAN vs the inventory (what it UNDER-serves / omits)

| Boss-named need | What the PLAN says | Reality / gap | Fix: where it goes + engine |
|---|---|---|---|
| **Derived rate metrics** (/90, conv, SoT%, mins/goal) | §2.2 lists them as Advanced columns | They live in the **career** grid only; the **per-season** ST shows just G/A/G+A/MP. A user can't see goals/90 *per season*. | Add Advanced tier to **ST + CMP + PL** season tables (the `SegmentedControl` already exists; reuse `metricValue` per season). |
| **G+A, conversion, xG-performance** | G+A ✅ everywhere; conversion ✅ career; **xG-performance not mentioned at all** | `goalContributions`/`shotConversion` fine. **xG-performance (goals−xG) is neither in the catalog nor in any plan section** → silently dropped. | **Add `xgPerformance` to `deriveMetrics`** (`goals−xg`, modern-only). Home: CG row + PL "Shooting & xG" block. |
| **Age curves (same-age overlay)** | §3 + §4.1 mention a "Same age" *view* that re-keys rows by age | Only a **table re-key**; no **curve chart**, and **nothing by-age inline on `/`**. The boss's "overlaid curves" visual has no module. | **New age-curve module on `/compare`** (`seasonTrend` re-keyed by `ageDuringSeason`, two overlaid lines) + **age-progression strip on `/player`**. ASCII §4.4. |
| **Granular 34 competitions** | §2.1 *notes* a "By individual competition" expandable "offered" under season rows; §10 risk (b) | Only a NOTE — **no wireframe, no column spec, no phase assignment**. The single largest inventory item (34) is effectively unplaced. | **Per-season expandable on `/player`** (each season → its 4–6 `competitionName` rows) + **competition `NeonSelect` on `/compare`**. Engine: row `competitionName` + `mapLeagueLabel` (tolerate mixed labels). ASCII §4.3/§4.4. |
| **Discipline (cards)** | §5 row: cards → `н/д` | Honest treatment defined ✅, but cards appear only in the **career** grid; PL has no discipline block. Acceptable (0/222) but state it. | Keep `н/д`; surface in **PL** "Discipline" block (Advanced), career grid (already there). No per-season column (would be a wall of `н/д`). |
| **Shots / xG quality** | §2.2 lists `shots`/`shotsOnTarget` as columns | Those raw keys **aren't catalog metrics** (`metricValue` can't resolve them) — plan implies a resolver that doesn't exist. xG/xA only 24/222. | Read `shots`/`shotsOnTarget` off `AggregateTotals` directly; group xG/xA/conv/SoT%/xG-perf into a **PL "Shooting & xG" block** (Advanced), modern `ⓘ`. |
| **Club cut** | §3 says club is "not a separate filter… a derived label" (Q4 defers a club tab) | Inline body **already ships a full by-club cut** (`clubCuts`, 10 clubs, both players) → the plan UNDER-claims what's built. | Keep the inline `clubs` cut; on PL add a per-club totals strip. Q4 is effectively answered (club cut exists). |

**Net:** PHASE11-UX-PLAN is sound on IA but **omits xG-performance entirely**, **under-specifies the 34-competition drill and the age-curve chart** (notes without modules/phases), and **assumes per-season rate
columns + raw shot columns that the current models don't yet expose.**

---

## 4. Per-view placement spec

### 4.1 `/` (inline body — extend p11-2, do NOT bloat the money path)
Already present: scope line · Career H2H grid (24 metrics) · Season table (4 cols × 5 contexts) ·
clubs/types/totals cuts · deep-link entries. **Add, below the existing cuts (all collapsed-by-default, inline-first lock honored):**
1. **Core/Advanced toggle on the Season table** — promote rate metrics (goals/90, G+A/90, conv, mins/goal)
   into the per-season view so depth is visible without leaving `/`.
2. **By-age toggle** — a 4th view alongside seasons/clubs/types/totals: a compact same-age strip (G+A by
   age, overlaid) — links out to the full age curve on `/compare`.
3. **xG-performance row** in the Career grid (Advanced) once `deriveMetrics` carries it.
4. **"By competition" affordance** — a low-emphasis link/disclosure pointing to the 34-name drill on
   `/player` (keep the inline body from becoming a 34-row dump).

### 4.2 `/compare` — Deep H2H (p11-3, NOT yet built) — read-only, no verdict
Full **metric × season × competition** aligned dual table (Messi LEFT / Ronaldo RIGHT, centre Δ, per-row
who-leads ▲), Core/Advanced column tiers, `CompetitionTabs` (6 types). **PLUS the two gap-closers:**
- **Competition `NeonSelect`** to drill into any of the **34 `competitionName`** (not just the 6 types).
- **"Same age" view** (`view=age`) re-keys rows by `ageDuringSeason` + an **overlaid age-curve chart**
  (`seasonTrend` re-keyed, two lines, focus-metric select).
- Career + per-competition `<tfoot>` totals; deep-linkable `?comp= ?view= ?metric=`; `?cats=`→`/` kept.

### 4.3 `/player/[id]` — Full stat page (p11-4, expand from current 3-section profile)
Hero (header + career totals) → **full season×competition table** (all catalog metrics via Core/Advanced) →
**per-season expandable → the 34 `competitionName` rows** (the granular home) → **"Shooting & xG" block**
(shots, SoT, conv, SoT%, xG, xA, xG-performance, penalty%) → **Discipline block** (cards, `н/д`) →
**age-progression strip** (G / G+A by age) → **by-league strip** (`selectLeagueSplit`) → honours → provenance.

### 4.4 ASCII wireframes — NEW modules not in PHASE11-UX-PLAN §8

**(A) Same-age overlay curve — `/compare` (new):**
```
┌─ SAME-AGE CURVES ──────────  Focus: [ G+A ▾ ]  [Goals|G+A|G/90] ┐
│  value                                                          │
│   ▲          ╭─╮ Messi (blue)                                   │
│   │        ╭─╯ ╰╮      ╭──╮                                     │
│   │   ╭────╯    ╰─╮  ╭─╯  ╰── Ronaldo (red)                     │
│   │ ╭─╯          ╰──╯                                           │
│   └────┬────┬────┬────┬────┬────┬────┬────►  age               │
│       17   21   24   27   30   33   37   40                     │
│  ⓘ same-age slice from ageDuringSeason; gaps where one side н/д │
└────────────────────────────────────────────────────────────────┘
```

**(B) Per-season → 34-competition expandable — `/player/[id]` (new home for the 34):**
```
│ ▾ 2011/12   MP 60  G 73  A 29  G+A 102   (season aggregate row) │
│   ├ La Liga              MP 37  G 50  A 16  …                    │
│   ├ UEFA Champions League MP 11 G 14  A 5   …                    │
│   ├ Copa del Rey          MP 7  G 3   A 3   …                    │
│   └ Supercopa de España   MP 2  G 3   A 1   …  ← each = 1 competitionName (mapLeagueLabel) │
│ ▸ 2012/13   …                                                   │
```

**(C) Shooting & xG block — `/player/[id]` (new, groups the shot/xG quality + xG-performance):**
```
┌─ SHOOTING & xG ───────────────────────────────────  [Advanced] ┐
│ Shots 4204 · SoT 2100 · Conv 0.18 · SoT% 0.50                   │
│ xG 96.3 · xA 41.2  ⓘ 2014+ only (24 seasons)                    │
│ xG-performance  +38.7  (goals − xG, modern slice)               │
│ Penalty goals 112 · Penalty% 13% · Free-kicks 65               │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Honesty mapping (tie to `DATA_REPORT.md`)

| Metric / case | Coverage | Render rule | Reuse |
|---|---|---|---|
| `xg` `xa` `xgPer90` `xaPer90` | 24/222 (2014+) | Cell `н/д` muted pre-2014; header `ⓘ` "доступно с 2014/15"; **Advanced only**; totals sum over available rows + "из N сезонов". | `availability:"modern"`, `statsBadge2014` |
| **xG-performance** (new) | modern only | `н/д` whenever the slice's xG is null; never compute over a partial-xG slice silently — label "modern slice". | new `deriveMetrics` field, modern badge |
| `yellowCards` `redCards` | 0/222 | **forced `н/д`** (`FORCED_NA`) — never `0` (already enforced in `stats-model`). | `statsBadgeMissing` |
| `hatTricks` | placeholder | Advanced only, ⚠️ illustrative badge, muted. | `illustrative-badge`, `availability:"illustrative"` |
| National-team rows (42, `verified:false`) | per-season distributed | "распределено / distributed" chip + one-step muting on national rows; **career national total normal** (cross-checked). | `statsDistributed` chip (already wired in `ClubTable`) |
| Other club `verified:false` (25) | — | single page-level provenance footer; no per-row badge (noise). | `profileUnverified` |
| Sparse season (player absent) | — | render row with "—", never hidden, never `0`. | `SeasonSide = null` → "—" |
| Source | `source.origin=seed` (mvr) | footer attribution + `datasetGeneratedAt`. | existing footer |

**Contract:** no number is invented; derived metrics (incl. the 3 new ones) are pure functions of existing
fields; missing → `н/д`, never `0`.

---

## 6. Phasing delta — so nothing is silently dropped

| Phase | Status | Carries (this map's gap-closers in **bold**) |
|---|---|---|
| **p11-2** | ✅ shipped | Inline body on `/`: 24-metric Career grid, 4-col Season table ×5 contexts, club/type/totals cuts, honesty badges. |
| **p11-3** | next | `/compare` Deep H2H: full metric×season×comp dual table + Δ + who-leads; **competition `NeonSelect` → 34 names**; **"Same age" view + overlaid age-curve chart**; per-comp/career `<tfoot>`; `?cats=`→`/` kept. |
| **p11-4** | after 3 | `/player/[id]` expand: full season×comp table (all metrics, Core/Adv); **per-season expandable → 34 `competitionName` rows**; **"Shooting & xG" block** incl xG-performance/penalty%/start-share; **Discipline block**; **age-progression strip**; by-league strip; honours; provenance. |
| **p11-5 (NEW — registry completion)** | parallel to 3/4 | **Add `xgPerformance`, `penaltyPct`, `startShare` to `deriveMetrics` + `METRIC_CATALOG`** (data task); surface in Career grid + PL shooting block. Promote rate metrics into the **per-season** ST/CMP/PL tables. Without this phase the 3 derived asks stay dropped. |
| **p11-6** | last | Sparse/illustrative UX pass + responsive/mobile hardening + i18n + `/` age-toggle & "by competition" link + final QA. |

**Dependency:** p11-5 (registry) unblocks the xG-performance/penalty%/start-share homes in p11-3/4; the
34-competition drill is owned by p11-4 (PL) + p11-3 (CMP select); age curves owned by p11-3.

---

## 7. Recommendations for the manager (decisive)

1. **Approve p11-5 (registry completion).** xG-performance, penalty%, start-share are boss-named, trivially
   derivable, and currently **homeless**. Without an explicit phase they will be silently dropped.
2. **Give the 34 competitions a real home, not a note.** Per-season expandable on `/player` (primary) +
   competition select on `/compare`. This is the single biggest inventory item with zero current UI.
3. **Build the age-curve module** (overlaid `seasonTrend`-by-age) — the boss's "наложение кривых" is a chart,
   not just a table re-key.
4. **Promote rate metrics into the per-season tables** via the existing Core/Advanced toggle, so /90 / conv /
   mins-per-goal are visible per season, not only career.
5. **Treat raw `shots`/`shotsOnTarget` as totals-read columns**, not catalog metrics (fix the §2.2 assumption).
