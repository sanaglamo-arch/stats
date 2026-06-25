# PHASE 11 — UX/IA PLAN: surfacing all 222 rows (Agent A)

> **Status:** for manager review *before* any UI is built (Agent B / UI implements after sign-off).
> **Scope:** UX/IA only. No app code is touched by this document.
> **Companions:** `PHASE11-COMPREHENSIVE-STATS.md` (brief), `DATA_REPORT.md` (data inventory),
> `UX.md` (Phase-10 IA + league-split), `DESIGN.md` (visual system), `BOSS-NOTES.md` (Messi LEFT / Ronaldo RIGHT, flag-split bg).

## 0. The one decision everything hangs on

The arena verdict (`/`) is the **hook**; it stays exactly as approved in Phase 10 (2 taps to share, score above the fold).
Phase 11 adds the **product body** — the comprehensive stats — as **two dedicated, off-the-hot-path destinations linked from beneath the arena**, *not* by bloating the arena itself. The arena answers "who won by categories?"; the body answers "show me every number." Keeping them separate is what lets us dump all 222 rows readably without ever taxing the 2-tap money path.

The body is **read-only evidence**. Exactly as the league-split decision in `UX.md` established: deep tables **never recompute the verdict**. One stable, defensible score lives on `/`; the tables inform, they do not vote. This is the honesty contract and it is non-negotiable.

---

## 0.5 Manager decisions — LOCKED (Phase 11)

Manager sign-off on the open questions. **These override any conflicting recommendation above.**

1. **Placement = HYBRID, inline-first.** Boss verbatim: «тело продукта = стата под ней». So **substantial comprehensive stats render INLINE under the arena on `/`** — full *comparative* season tables (not a teaser), depth visible **without clicks**. PLUS expanded dedicated `/player/[id]` pages and a full dedicated head-to-head view for exhaustive drill-down, reached by a **prominent** entry. Do NOT hide all stats behind a click.
2. **H2H = inline primary + dedicated deep view.** The main Messi-vs-Ronaldo comparison lives inline under the arena (that IS the product). Full per-competition / per-season exhaustive tables live on the dedicated H2H view (`/compare`).
3. **Sparse rows shown honestly.** Where a player didn't play a competition/season, render the row with a **dash «—»** — never hide, never fabricate. Completeness > minimalism; mark clearly (this extends the §5 `н/д` rule to whole missing rows).
4. **All cuts = YES:** by club, by competition, by season, career totals — via tabs/filters so it's structured, not a dump.
5. **Read-only body** (never recomputes the verdict) accepted as the contract.

Principle: **MAX data on screen, structured.**

---

## 1. Information architecture + sitemap

### 1.1 Sitemap (after Phase 11)

```
/                         VERDICT ARENA (hook) + COMPREHENSIVE STATS BODY (inline)
│   ├─ ABOVE FOLD: render-clash + score band + 8-category breakdown + Share sheet
│   │              (Phase-10 money path — untouched, still 2 taps to share)
│   └─ BELOW FOLD (NEW, the product body — inline, no click needed):
│        ├─ Career head-to-head totals (Messi vs Ronaldo, full metric grid)
│        ├─ Season-by-season comparative table (competitionType tabs + cuts)
│        ├─ Cuts: by club · by competition · by season · career totals (tabs/filters)
│        └─ Prominent entries → "Full head-to-head" /compare · "Messi"/"Ronaldo" profiles
│
├─ /compare               DEEP HEAD-TO-HEAD  (PRODUCT BODY #1 — repurposed)
│   │   Full-metric Messi-vs-Ronaldo across every season & competition.
│   │   Side-by-side season tables, per-competition tabs, delta + "who leads".
│   │   Career-total + per-competition-total rows. Read-only (no verdict here).
│   └─ ?comp=<type>  ?view=season|career|age  ?metric=<group>   (deep-linkable)
│
├─ /player/[id]           FULL STAT PAGE  (PRODUCT BODY #2 — expanded from 3 sections)
│   │   id ∈ {messi, ronaldo}. Career totals → full season×competition tables →
│   │   per-competition breakdowns → by-league strip → honours.
│   └─ ?comp=<type>  ?metric=<group>  (deep-linkable; mirrors /compare controls)
│
└─ Share sheet (modal over /)   unchanged
```

`/cards` stays demoted/off-path (per `UX.md`/`DESIGN §6.4`). `/wireframe` stays the bare sketch route.

### 1.2 Route decisions (decisive)

- **`/` (arena) — KEEP, add one link band.** The only change is a slim, low-emphasis **"See the full numbers"** band appended *after* the breakdown and *after* the Share CTA (so it never competes with the money path). It carries 3 links: **Deep head-to-head → `/compare`**, **Messi → `/player/messi`**, **Ronaldo → `/player/ronaldo`**. Tapping a render/name on the hero continues to deep-link the profile (already wired). No new control on the hero, no tabs on the arena — the minimal default is preserved.

- **`/compare` — REPURPOSE into the Deep Head-to-Head.** Today it is a thin redirect (`/compare?cats=… → /?cats=…`, a Phase-10 legacy). We reclaim the route for the deep H2H because the name is exactly right and it is already in `sitemap.ts`. **Backward-compat rule:** when the request carries `?cats=` (an old *verdict-selection* share link), keep redirecting to `/?cats=…` (those belong on the arena). Bare `/compare` and the new params (`?comp=`, `?view=`, `?metric=`) render the H2H. This preserves every old shared link while giving us the route. *(Listed as Open Question Q1 in case the manager prefers a fresh `/stats` route.)*

- **`/player/[id]` — EXPAND, do not discard.** The current 3-section profile (`profile-view.tsx`) becomes the top of a full stat page: keep header + career-totals as the hero, then replace the thin single season table (Season/Club/Comps/MP/G/A/Min) with the **full table system** (§2), add **per-competition-type breakdown tables**, the **by-league strip** (reuse `selectLeagueSplit`), and keep honours. Same calm, single-accent, off-path treatment (`DESIGN §6.3`).

- **`studio/` — REVIVE as the component library, not a route.** The orphaned `src/components/studio/*` (currently unrouted) already contains radix `CompetitionTabs`, `NeonSelect`, `SegmentedControl`, `Field`, `PenaltiesToggle`, `season-trend-chart`, `comparison-radar`. These are the building blocks for §2–§4. We harvest them; we do not resurrect the card-studio screen.

---

## 2. Core table system (the load-bearing wall)

One reusable `<StatTable>` powers both the profile (single player) and the H2H (two players, aligned). Built directly on `PlayerSeasonComp` rows via the existing aggregators — no new statistics.

### 2.1 Navigation model — **competitionType tabs, then season rows** (recommended over virtualization)

222 rows feels large but never lands in one table:

- Primary axis = **radix Tabs by `competitionType`** (reuse `CompetitionTabs`): `All · League · Champions League · National team · Cups`. The "Cups" tab bundles `domestic_cup + super_cup + club_world_cup` (matches the existing tab mapping).
- Within a tab, rows are **one per season** (aggregated across that tab's competitions for that season), oldest→newest, with a pinned **career/total row**.
- Result: the largest single table is the **"All" tab of one player ≈ 24 season rows**; any specific tab is ≤ ~22 rows. The H2H aligns seasons so it is also ≤ ~24 rows per tab.

**Recommendation: plain CSS sticky tables, NO virtualization.** At ≤ ~24 rows per view there is nothing to virtualize; virtualization would cost us SSR-rendered SEO content, keyboard/AT semantics, and determinism for no benefit. Server-render the full `<table>`; make the header and first column sticky in CSS.

> A **"By individual competition"** secondary view (every `competitionName`, e.g. La Liga / Copa del Rey / Supercopa separately) is offered as an *expandable* under each season row OR as a denser sub-table on the profile (§6) — this is where the remaining rows live, revealed on demand, never dumped.

### 2.2 Columns (from `METRIC_CATALOG`, in catalog order)

Two column tiers behind a **"Core / Advanced"** toggle (`SegmentedControl`), so the default table is readable and the full depth is one tap away:

| Tier | Columns (METRIC_CATALOG keys) | Header (en) |
|---|---|---|
| **Sticky** | season label / competition label | Season · Comp |
| **Core (default)** | `matches`, `starts`, `minutes`, `goals`, `assists`, `goalContributions` | MP · Starts · Min · G · A · G+A |
| **Advanced (+toggle)** | `penaltyGoals`, `freekickGoals`, `shots`, `shotsOnTarget`, `goalsPer90`, `shotConversion`, `xg`, `xa`, `hatTricks`, `yellowCards`, `redCards` | PK · FK · Sh · SoT · /90 · Conv% · xG · xA · HT · Y · R |
| **Honours cell** | `trophies` count, `ballonDor`, awards | (chips, last column / sub-row) |

- **Order = `METRIC_KEYS` order**, so columns never reshuffle between views. Labels resolve through `statLabel(t, key)` (existing) — i18n en/ru already present for most; new keys only for table-header abbreviations.
- **Career/total row:** pinned at the bottom of every table (`<tfoot>`), bold, accent-tinted, computed via `aggregate(rows, includePenalties)` over the tab's rows — the exact "totals are never stored, always summed" rule.
- **Sorting:** click a column header to sort (default = chronological by season). Sort is client-side, stable, `aria-sort` announced. The career row stays pinned in `<tfoot>` regardless of sort.

### 2.3 Number formatting

- Every numeric cell: `.tabular` (`tabular-nums`) + `Intl.NumberFormat` for thousands (`1,234`, `33,123` minutes). Reuse the formatter already in `profile-view.tsx` / `formatArenaValue`.
- Percent metrics (`shotConversion`, `shotsOnTargetPct`) → `value*100` + `%`, fixed decimals from the catalog.
- `minutesPerGoal` and other "lower is better" → marked with a subtle ↓ legend, not a different color.
- Null → **`н/д`** (see §5), never `0`, never blank.

### 2.4 Sticky behavior

- **Sticky header** (`thead` `position: sticky; top: 0`) with a solid `--color-bg-elevated` backing (no transparency, so scrolled rows don't bleed through).
- **Sticky first column** (season/competition label) `position: sticky; left: 0` — the row's identity is always visible during horizontal scroll on mobile.
- The corner cell (sticky both ways) sits at the higher z-index.

---

## 3. Cuts / segmentation (the filter rail)

One shared control rail drives both the profile and the H2H, so the mental model is identical. All controls reuse existing primitives.

| Control | Mechanism (reuse) | Applies to | Notes |
|---|---|---|---|
| **Competition** | radix `CompetitionTabs` | both | Primary axis (§2.1). Global, both players share it in H2H. |
| **Core / Advanced columns** | `SegmentedControl` | both | Switches the column tier (§2.2). |
| **View / alignment** | `SegmentedControl`: `By season · Career · Same age` | H2H | "Same age" uses `selectSeasons({kind:"age"})` — the real same-age slice the data supports (`ageDuringSeason`). |
| **Season range** | two `NeonSelect` (from / to) | both | Bounds the visible season rows; defaults to full span. Optional, collapsed by default. |
| **Metric focus** | `NeonSelect` of `MetricGroup` (`attack/creation/efficiency/discipline/trophies`) | both | Pre-selects which Advanced columns show, so a user can jump straight to "creation" without scanning 11 columns. "All" = full set. |
| **Penalties on/off** | `PenaltiesToggle` | both | Reuses the existing slice-4 toggle; subtracts `penaltyGoals` from `goals`. Off-path detail, collapsed. |

**Interaction rules:**
- Competition tab + view/alignment are the two top-level, always-visible controls. Everything else (season range, metric focus, penalties, column tier) lives in a single **"Filters" disclosure** (one `<details>`-style glass panel) so the default view is clean.
- Club is **not** a separate filter — club is a *column/label* derived per season (a season maps to one club), and the by-league strip already carries the per-competition cut. (Open Question Q4 if the manager wants an explicit club tab for e.g. Ronaldo's 5 clubs.)
- All controls serialize to URL params (`?comp=`, `?view=`, `?metric=`, `?from=`, `?to=`, `?pens=`) so a deep-dive state is shareable and restores on load — same discipline as the arena's `?cats=`.

---

## 4. Head-to-head (`/compare`) — full-metric, not 8 bars

The arena's 8 bars answer "who won." `/compare` answers "every number, every season, every competition, side by side." **Read-only — no verdict recompute here.**

### 4.1 Layout — aligned dual table (Messi LEFT, Ronaldo RIGHT per BOSS O1)

Per **season row**, the two players are aligned on the same season label with a **center delta column**:

```
        MESSI (left, blue)          Δ          RONALDO (right, red)
Season  MP  G   A   G+A    |   ΔG  ΔA   |   G+A   A   G   MP
2011/12 60  73  29  102    |  +18 +17   |   85    18  60  55   ← per-row "who leads" tint
```

- The **delta column** shows the signed difference for the *focused* metric(s) (default `goals` and `assists`); positive = leader-tinted toward whoever leads (blue if Messi, red if Ronaldo). A tiny ▲ leader marker sits on the leading side (reuse the arena crown/marker pattern), **local to the row, tallied into nothing**.
- **Career-total row** (`<tfoot>`, bold) and **per-competition-total** rows give the headline "career: Messi X – Ronaldo Y" without it being a *verdict* (no "wins" language, no score band — that lives only on `/`).
- **Per-competition** = the radix tab. So "Champions League head-to-head, season by season, with deltas" is one tab click.
- **Same-age alignment** (`view=age`) re-keys rows by `ageDuringSeason` instead of season label — the honest "at age 24 Messi had…" comparison the data supports.

### 4.2 "Who leads" treatment

- Per-row, per-metric: the higher value is rendered in that player's accent + weight; the lower is muted to `--color-text-secondary`. Ties render both neutral.
- Per-column-total (career): the leading total gets a small ▲ and accent tint.
- **Never** a cumulative scoreboard on this page. If the user wants the verdict, the page's top offers a single ghost link **"← Back to the verdict"** to `/`.

### 4.3 Charts (optional, additive)

Above the table, reuse the orphaned `season-trend-chart` (real per-season metric line via `seasonTrend`) and `comparison-radar` for the focused metric/group — a visual "shape of careers" header that scales the existing `p10-5` energy up. These are decorative depth, gated behind the same Core/Advanced idea; ship after the tables (p11-3b).

---

## 5. Sparse / illustrative data handling (tie to DATA_REPORT)

The rule from `DATA_REPORT.md`: **show what exists; flag gaps as `н/д`; never fabricate, never treat as 0.** Exact UX:

| Case | Coverage | UX |
|---|---|---|
| **xG / xA** | 24 / 222 rows (2014+ only) | Cell = **`н/д`** in muted `--color-text-muted`. Column header carries a small `ⓘ` with tooltip **"Доступно с сезона 2014/15 / Available 2014+ only"**. xG/xA live in the **Advanced** tier only, so the default Core table is never a sea of `н/д`. Career/total xG = sum over *available* rows only (the aggregator already does this) with a footnote "из N сезонов / from N seasons". |
| **National-team rows** | all 42 `verified:false`, per-season distributed | The national-team tab and any national row carry a **"распределено / distributed" badge** (small amber-muted chip) next to the season label, plus a tab-level note: "Сезонная разбивка сборных — иллюстративная; карьерные тоталы кросс-проверены." Rows render at slightly reduced emphasis (the row text one step muted) so they never read as exact match-level facts. Tooltip explains. The **career total** for national team is presented normally (it is cross-checked). |
| **hatTricks** | illustrative placeholder field | Lives in Advanced only, column header `ⓘ` tooltip **"иллюстративно / illustrative — not a sourced figure"**, value muted. Reuse the existing `illustrative-badge` component. |
| **Other unverified club rows** | 25 club rows `verified:false` | A single page-level provenance line in the footer (reuse `profileUnverified` string): "Не верифицировано до финальной сверки." No per-row badge for club rows (would be noise) — the badge is reserved for the *distributed* national split, which is the one genuinely illustrative-per-season case. |
| **Source provenance** | `source.origin = seed` (mvr) | Footer attribution line + `datasetGeneratedAt` date, as today. |

Badges/tooltips reuse `illustrative-badge.tsx` and the arena tooltip pattern; muting reuses the existing `opacity-55` loser convention. **No number is ever invented to fill a gap.**

---

## 6. Responsive / mobile (no truncation, no dump)

The non-negotiable: **all data stays reachable on a 390px phone, readable, never cut.**

- **Horizontal scroll with the season column pinned.** The table scrolls X inside a `overflow-x-auto` glass panel (the profile already does this); the sticky first column keeps the row's season/competition label in view. A subtle right-edge fade hints "more columns →".
- **Priority columns.** On mobile the **Core** tier shows only `MP · G · A · G+A` without horizontal scroll; the rest is reached via the Core/Advanced toggle or the Metric-focus select (which swaps *which* columns are present, so the user reads one stat family at a time at full width — never a 17-column squeeze).
- **Collapsible season groups.** On the profile's "by individual competition" deep view, each season is a collapsible group (one disclosure, matching the arena's single-disclosure rule) so a season's 4–6 competition rows expand on demand.
- **Tabs scroll, never truncate.** The competitionType tab bar wraps/scrolls (it already `flex-wrap`s).
- Touch targets ≥ 44px; the filter rail collapses into the single "Filters" disclosure on mobile (reuse the studio bottom-sheet pattern if a sheet is preferred).
- The H2H aligned dual table on mobile **stacks per metric, not per player**: a compact "Messi | Δ | Ronaldo" three-cell row per season for the focused metric, with the metric switched by the focus select — keeps the side-by-side comparison alive without a 12-column horizontal crush.

---

## 7. Reuse & consistency

**Reuse (do not rebuild):**
- Data: `aggregate`, `deriveMetrics`, `sliceRows`, `selectSeasons` (incl. `kind:"age"`), `metricValue`, `seasonTrend`, `METRIC_CATALOG`, `METRIC_KEYS`, `MetricGroup`, `selectLeagueSplit`, `mapLeagueLabel`.
- Model: `buildPlayerProfile` (extend `SeasonRow` to carry full `AggregateTotals` per competition, which it nearly does), `profile-model.ts`.
- Controls: `CompetitionTabs`, `NeonSelect`, `SegmentedControl`, `Field`, `PenaltiesToggle` (`control-primitives.tsx`), `competitionsForContext`/`contextFromCompetitions`.
- Charts: `season-trend-chart`, `comparison-radar`, `illustrative-badge`.
- Presentation: `Atmosphere` (quiet, single-accent on profile; arena flag-split on `/`), motion tokens (`DURATION/EASE/STAGGER/SPRING`), `glass-panel`/`gold-hairline-top`, `statLabel`, `competitionLabel`, `crestForClub`, `PLAYER_META`, the `Reveal`/`FadeIn` convention, `FOCUS_RING`.

**New (small surface):**
- `<StatTable>` (generic sticky table, single + dual mode) + an `h2h-model.ts` (aligns two players' season/age rows, computes deltas — pure, read-only).
- A handful of i18n keys: short column headers (`statColMP`, `statColStarts`, … in en+ru), tab/filter labels reusing existing `compTab*`, badge strings (`dataDistributed`, `dataNdAvailable2014`, `dataIllustrative`), H2H labels (`h2hDelta`, `h2hLeads`, `h2hSameAge`), and the arena "full stats" link band (`arenaSeeFullStats`, `arenaDeepH2H`).

**Consistency:** keep en/ru parity (the `Dictionary` type enforces it); Lucide icons only (no emoji); motion stays tasteful — entrance `Reveal` stagger on table sections, no looping animation in tables; `prefers-reduced-motion` respected; AA contrast (muted only for fine print / `н/д`).

---

## 8. Wireframes

### 8.1 `/player/[id]` — Full stat page (desktop)

```
┌────────────────────────────────────────────────────────────────────────┐
│  ◀ Back to Arena                                                         │
│  ┌── HEADER (existing) ──────────────────────────────────────────────┐  │
│  │  [photo]  MESSI · 🇦🇷 Argentina · Forward · 2004/05–2025/26         │  │
│  │           [Barça][PSG][Inter Miami] crests                          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  CAREER TOTALS  [G][A][G+A][MP][Min][G/90][Trophies][Ballon d'Or]  (grid) │
│                                                                          │
│  FULL STATS                          [ Filters ▾ ]   [Core | Advanced]   │
│  ┌ Tabs:  All · League · Champions League · National team · Cups ┐       │
│  │ ┌──────────────────────────────────────────────────────────────────┐ │
│  │ │SEASON│Comp│ MP  St  Min   G  PK FK  A  G+A xG  xA  HT  Y  R       │ │ ← sticky header
│  │ │2004/05│LL │  9   7  705   1  0  0   0   1  н/д н/д 0  1  0        │ │
│  │ │  …    │…  │ …                                                     │ │
│  │ │CAREER │all│891 …                                          (bold)  │ │ ← sticky tfoot
│  │ └──────────────────────────────────────────────────────────────────┘ │
│  │   ▸ 2011/12 expand → La Liga / Copa del Rey / UCL / Supercopa rows    │ │ ← per-competition
│  └──────────────────────────────────────────────────────────────────────┘ │
│  BY LEAGUE   La Liga 474 · Ligue 1 22 · MLS 38   (reuse selectLeagueSplit)│
│  HONOURS  [trophies chips]   [Ballon d'Or ×8]   [awards]                  │
│  ⓘ Не верифицировано до финальной сверки · accurate as of {date}         │
└────────────────────────────────────────────────────────────────────────┘
```

### 8.2 `/player/[id]` — mobile (390)

```
┌───────────────────────────┐
│ ◀ Arena                   │
│ [photo] MESSI 🇦🇷          │
│ CAREER  G 891  A 380 …    │  (2-col grid)
│ FULL STATS    [Core|Adv]  │
│ ‹All·League·UCL·Nat·Cups› │  (scroll tabs)
│ ┌Season│ MP  G  A  G+A┐   │  ← only priority cols; X-scroll for more
│ │2011/12│60 73 29 102 │   │     season col sticky-left
│ │ …                   │   │
│ │CAREER │…            │   │
│ └─────────────────────┘   │
│  → swipe for xG xA Y R    │
│ [ Metric focus: Creation▾]│
└───────────────────────────┘
```

### 8.3 `/compare` — Deep head-to-head (desktop)

```
┌────────────────────────────────────────────────────────────────────────┐
│  ← Back to the verdict        DEEP HEAD-TO-HEAD        [Filters ▾]       │
│  [ By season | Career | Same age ]            [ Core | Advanced ]        │
│  ‹ All · League · Champions League · National team · Cups ›             │
│                                                                          │
│   ◀ MESSI (blue)                  Δ                  RONALDO (red) ▶      │
│  ┌──────────┬───────────────┬───────────┬───────────────┬──────────┐    │
│  │  G+A  A  G│ MP   Season    │ ΔG   ΔA   │  MP    Season │ G  A  G+A│    │
│  │  102 29 73│ 60  2011/12 ▲M │ +18  +17  │  55  2011/12  │ 60 18 ... │    │
│  │   …                                                            …  │    │
│  │  CAREER ▲M│             …  │           │            …  │ CAREER   │    │ ← totals (no score)
│  └──────────┴───────────────┴───────────┴───────────────┴──────────┘    │
│  [ trend chart: Goals per season, two lines ]  (p11-3b, optional)        │
│  ⓘ Read-only. The verdict lives on the arena.                            │
└────────────────────────────────────────────────────────────────────────┘
```

### 8.4 `/compare` — mobile (per-metric stack)

```
┌───────────────────────────┐
│ ← Verdict   HEAD-TO-HEAD  │
│ [Season|Career|Same age]  │
│ ‹All·League·UCL·Nat·Cups› │
│ Focus: [ Goals ▾ ]        │
│ ┌Season│ M  │ Δ │  R ┐    │
│ │11/12 │73  │+18│ 55 │    │  Messi | delta | Ronaldo
│ │12/13 │60  │ +9│ 51 │    │
│ │ …                  │    │
│ │CAREER│891 │ +52│839│    │
│ └────────────────────┘    │
└───────────────────────────┘
```

### 8.5 Arena `/` — the only addition (bottom link band)

```
   … [ CATEGORY BREAKDOWN ] …
   … [ SHARE VERDICT (gold CTA) ] …
   ┌───────────── SEE THE FULL NUMBERS ─────────────┐   ← new, low-emphasis, glass
   │  Deep head-to-head →   ·   Messi →   ·  Ronaldo →│
   └─────────────────────────────────────────────────┘
```

---

## 9. Build phasing (ordered, each independently shippable)

Each sub-phase ends with gates **typecheck + lint + test + build PASS** and **Visual QA** at desktop 1440 + mobile 390, en + ru, motion on/off. Commit per sub-phase.

| Phase | Deliverable | Gate focus |
|---|---|---|
| **p11-2** | **`<StatTable>` + expanded `/player/[id]`.** Full season×competition Core/Advanced table with sticky header + sticky season column, career `<tfoot>`, per-competition tabs, sorting. Extend `profile-model` to expose per-competition full totals. Keep header/totals/honours. | tables readable, totals sum-correct vs raw rows, sticky works, a11y `aria-sort`/scope. |
| **p11-3** | **Deep head-to-head at `/compare`.** Repurpose route (keep `?cats=`→`/` redirect), `h2h-model.ts`, aligned dual table, deltas, who-leads, per-competition tabs, career/per-comp totals, "Same age" view. | alignment correct, deltas correct, NO verdict/score on page, old `?cats=` links still redirect. |
| **p11-3b** | **Trend + radar header** on `/compare` (reuse `season-trend-chart`, `comparison-radar`). Optional, additive. | charts read real `seasonTrend`, reduced-motion safe. |
| **p11-4** | **Segmentation/filters polish** across both: season-range selects, metric-focus, penalties toggle, Core/Advanced; URL param round-trip; by-league strip on profile. | params restore on load, filters compose, by-league matches `selectLeagueSplit`. |
| **p11-5** | **Sparse/illustrative UX pass:** `н/д` cells, xG/xA `ⓘ` tooltips, national "distributed" badges + muting, hatTricks illustrative badge, provenance footer. Tie strings to DATA_REPORT. | zero fabricated zeros, badges/tooltips present, en/ru parity. |
| **p11-6** | **Responsive/mobile hardening + arena link band + i18n + final Visual QA.** Priority columns, per-metric mobile stack, tab scroll, 44px targets, the `/` "full numbers" band. | no truncation at 390px, no data unreachable, money path on `/` untouched. |

Dependency: p11-2 → p11-3 (StatTable reused) → p11-4/5/6. p11-3b optional anytime after p11-3.

---

## 10. Open questions / risks for the manager

1. **Route for the H2H: repurpose `/compare` (recommended) or add a fresh `/stats`?** Repurposing reclaims the right name and the existing sitemap entry, with a `?cats=`-only redirect preserving old verdict links. A fresh `/stats` is zero-risk to legacy links but adds a route and leaves `/compare` as dead redirect forever. **Recommend repurpose.**
2. **Confirm read-only:** the deep tables (`/compare`, profile) **never** compute or display a "verdict/score" — only totals and per-row "who leads" markers. This mirrors the league-split ruling. Need a yes so Agent B builds no scoreboard there.
3. **xG/xA + hatTricks visibility:** 24/222 xG coverage means most cells are `н/д`. **Recommend:** keep them in the **Advanced** tier only (default-hidden) so the Core table is clean, with `ⓘ` tooltips. hatTricks is illustrative — same treatment. Manager to confirm we surface these at all vs. hide entirely until real sources land.
4. **Explicit club cut?** We treat club as a derived label/column (a season = one club) rather than a filter tab. For Ronaldo (Sporting/United/Real/Juve/Al-Nassr) a manager may want a "by club" tab. **Recommend defer** unless the boss's "dominated in every league" flex needs a per-club view beyond the by-league strip.

Secondary risks: (a) 34 raw `competitionName` strings include mixed/aggregate labels ("Saudi Pro League / Premier League", "Domestic Cup (mixed)") — the `competitionType` tabs are the safe primary axis; the per-`competitionName` deep view must reuse `mapLeagueLabel` and tolerate mixed labels. (b) `verified:false` covers **67** rows (all 42 national + 25 club) — we badge only the genuinely per-season-*distributed* national rows to avoid badge noise; manager to confirm that's honest enough. (c) Same-age view has gaps where only one player has a row at a given age — render the present side and `н/д` the other, never drop the row.
