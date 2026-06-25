# CompareGOATs — UX (Phase 10, Agent A)

> Pure UX: users, jobs, the minimal screen set, the flow, the information
> architecture and the interaction model. **No visual/brand design here** —
> that is Agent B's job. Companion artifact: the bare wireframe route
> `/wireframe` (`src/app/wireframe/page.tsx`).

---

## 1. User & Jobs-to-be-Done

### Who lands
- **The arguer (primary).** Mid-argument with a friend ("Messi or Ronaldo?").
  Arrives from a social link, a search, or a friend's shared card. Wants
  ammunition *now*. Mostly on a phone, mostly impatient.
- **The content-maker (secondary).** Wants a clean, shareable image to post with
  their own caption. Cares about the card looking good and downloading fast.
- **The curious browser (tertiary).** No fixed agenda; pokes around categories.
  Real, but must never dictate structure — they are served *for free* by the
  same screen the arguer uses.

### The one job (JTBD)
> "When I'm arguing about who's better, I want to settle it **by the numbers**
> and **send proof**, so I win the argument without doing research."

Two sub-jobs fall out of it:
1. **Settle** — see a defensible verdict (score by categories) immediately.
2. **Share** — get that verdict out as an image/link in as few taps as possible.

"Dig into a specific category" is a *third, optional* job — supportive, never a
gate on the first two.

### Design consequence (the spine of everything below)
The product unit is the **verdict**, and the deliverable is the **card**. So the
verdict must be **on the landing screen, above the fold, with zero clicks**, and
**Share must be reachable from the verdict in one tap**. Anything that sits
*between* landing and the verdict is friction and gets cut.

---

## 2. Primary scenarios (step-by-step, counted)

### Scenario A — "Settle + share" (the money path) — measured in taps
The whole reason the product exists. Target: **fewest possible taps to a shared
card.**

| # | User action | System response |
|---|---|---|
| 0 | Lands on `/` (from link/search/social) | Verdict screen renders: both players, **VS**, **final score by categories**, breakdown list, one **Share** button — all visible, no click. |
| 1 | **Tap "Share"** | Share sheet opens with a live card preview + prefilled caption. |
| 2 | **Tap "Download"** (or a platform target / Copy link) | PNG downloads / native share sheet fires / link copied. |

**= 2 taps from cold landing to a shared card.** Reading the verdict itself is
**0 taps** (it's the landing). This is the number the whole IA is optimised for.

> If the arena home still funnels through `/compare → /verdict` before a verdict
> is visible, the same job costs **3+ taps and 2 full page loads** before the
> user even *sees* a score. That is the core waste this redesign removes.

### Scenario B — "Settle, then dig, then share" (the engaged path)
The arguer wants to challenge one specific claim ("but his Champions League
record…").

| # | User action | System response |
|---|---|---|
| 0 | Lands on `/` | Verdict + category breakdown visible. |
| 1 | Tap a **category** in the breakdown | That category expands in place (progressive disclosure): the metric rows + the two values + who leads. No navigation. |
| 2 | (optional) Tap **"Hide winner"** | Score/crowns/leaders hide → neutral number-only mode (lets the user make their *own* point, screenshot-safe). |
| 3 | Tap **Share** → **Download** | Card (respecting the current category selection + winner toggle) is produced. |

Still terminates in the **same 2-tap share**. Digging is *additive*, never a
detour off the path.

---

## 3. Minimal screen set + flow

### The cut — current 5–6 destinations → **2 screens + 1 sheet**

```
                         BEFORE (Phase 9)                         AFTER (Phase 10)
   ┌───────────────────────────────────────────┐      ┌──────────────────────────────┐
   │ /  arena home  (renders, tabs, partial     │      │ /  VERDICT ARENA              │
   │    verdict, "Start comparison" CTA)        │      │   renders + VS + full verdict │
   │            │  ▼                            │      │   + category breakdown        │
   │ /compare   category picker (gate)          │      │   (expand in place)           │
   │            │  ▼                            │      │   + Show/Hide-winner toggle   │
   │ /verdict   the actual score                │ ───▶ │   + Share                     │
   │            │  ▼                            │      │           │ tap Share         │
   │ /cards     FUT collectible battle          │      │           ▼                   │
   │ share modal (from 3 places)               │      │   ┌─────────────────────┐     │
   │ /player/[id]  profile pages               │      │   │  SHARE SHEET (modal) │     │
   └───────────────────────────────────────────┘      │   │  preview + caption + │     │
                                                       │   │  download/targets    │     │
                                                       │   └─────────────────────┘     │
                                                       │ /player/[id]  PROFILE (kept,  │
                                                       │   off-path reference)         │
                                                       └──────────────────────────────┘
```

### Flow diagram (kept set)

```mermaid
flowchart LR
    L[Inbound link / search / shared card] --> H["SCREEN 1 — Verdict Arena  (/)"]
    H -- "tap category" --> H
    H -- "Show/Hide winner" --> H
    H -- "tap Share (1)" --> S[["Share Sheet (modal over /)"]]
    S -- "Download / target / copy (2)" --> OUT([Card / link out the door])
    H -. "player name (optional)" .-> P["SCREEN 2 — Player Profile  (/player/[id])"]
    P -. back .-> H
    S -. close .-> H
```

### Screen-by-screen verdict: keep / cut / merge

| Screen (Phase 9) | Decision | Why |
|---|---|---|
| **`/` arena home** | **KEEP — promoted to the whole product.** | It already has the renders, VS and tabs. We pull the *real verdict* (score, breakdown, share) up onto it so the job is done on first paint. It stops being a teaser and becomes the answer. |
| **`/compare` category picker** | **CUT as a screen → MERGE inline.** | A dedicated screen whose only output is a URL param is a gate in front of the verdict — it adds a page load and a decision before the user has seen anything. Sensible default = **all categories on**; refinement becomes an *optional* inline control on Screen 1 (tap categories in the breakdown to include/exclude, or "Hide winner"). 99% of users never needed to pick categories to get value. |
| **`/verdict` result page** | **CUT as a screen → MERGE into `/`.** | This *was* the payoff, hidden two clicks deep. The payoff belongs on the landing. Its content (crowned score, breakdown, final score, share/download) moves onto Screen 1. The shareable `?cats=` deep link is preserved on `/` so links keep working. |
| **`/cards` FUT battle** | **CUT.** | The brief's product is "settle by the **numbers** + share." FUT cards carry **cosmetic, non-real ratings** (explicitly labelled as decorative) — they dilute the core promise ("neutral by facts"), add a whole screen, and split Share across three origins. It's the clearest "лишнее" (excess) to remove. The *card aesthetic* energy Agent B wants belongs in the **share card output**, not as a separate destination. |
| **Share modal** | **KEEP — single source of truth.** | The terminal step of the only job. Now triggered from exactly **one** place (Screen 1's Share button) instead of three, so behaviour is consistent. Stays a modal/sheet over `/`, not a route — it's a terminal action, not navigation. |
| **`/player/[id]` profiles** | **KEEP — but demoted to off-path reference.** | Not part of the settle+share spine, so it earns its place only as *optional depth* for the curious browser (full career stats). Reachable by tapping a player's name on `/`; never blocks or appears in the main flow. Could be cut for a pure-MVP, but it costs the core path nothing (it's a leaf) and answers real follow-up questions ("what were his actual league goals?"). **If forced to one screen, this is the next to go.**

**Counts: kept = 2 screens (`/`, `/player/[id]`) + 1 sheet (Share). Cut = 2 screens (`/compare`, `/cards`). Merged-into-`/` = 1 (`/verdict`).**
Net: from **5 routed destinations + modal** down to **2 routes + 1 sheet** — the
settle+share job now lives entirely on one screen.

---

## 4. Information architecture + interaction model

### SCREEN 1 — Verdict Arena (`/`) — does the whole job

**Content blocks, top → bottom (hierarchy = importance to the job):**

1. **Clash header (identity + verdict, the hero).** The two player renders facing
   a central **VS**, and *immediately* the **score by categories** ("RONALDO N — M
   MESSI" + "M categories won"). This is the answer; it is the single most
   important block and must be above the fold on mobile. Each player's
   name/club/flag sits with their render.
2. **Category breakdown (the evidence).** A vertical list, one row per category
   (Goals, Assists, Trophies, Ballon d'Or, Champions League, World Cup,
   Playmaking, Longevity). Each row: category label + the two headline values +
   who leads (a small leader marker). Default: **all categories counted.**
   - **Interaction — tap a row → expands in place** (progressive disclosure)
     to show that category's sub-metrics (e.g. career goals, intl goals, league
     goals, conversion) with both values and per-metric leader. Tap again to
     collapse. No navigation, no page load.
   - **Interaction — toggle a row's "count this" checkbox** (the merged-in
     `/compare` function): excluding/including a category **recomputes the score
     live** and updates the URL `?cats=`. Minimum sensible count enforced
     (fall back to all if too few). This is the *only* remnant of the old picker —
     now inline and optional.
3. **Winner toggle: "Show winner / Hide winner".** A single switch governing all
   verdict-ish UI. **Default ON.** OFF → hide score, crowns, leaders, "why" →
   neutral number-only mode (so a user can present raw numbers and draw their own
   conclusion, or screenshot a neutral card). Mirrors the existing
   `showWinner` model so it flows straight into the share card.
4. **Share (the exit).** One primary action: **"Share verdict"**. Opens the Share
   Sheet. This is the screen's single primary CTA; everything else is secondary.
5. **Trust line (small print).** "Accurate as of {date} · {scope}" + a quiet note
   that figures are by category, never "X is better" (honesty per SPEC §3).

**Control behaviour:**

| Control | On tap/click | State it changes |
|---|---|---|
| Category row (label area) | Expand/collapse its sub-metrics in place | local: which row is open |
| Category row "count" checkbox | Include/exclude from score; recompute; update `?cats=` | verdict score + URL |
| Show/Hide-winner switch | Toggle verdict visibility everywhere on screen + in the would-be card | `showWinner` |
| **Share verdict** (primary) | Open Share Sheet, seeded with current `cats` + `showWinner` | opens sheet |
| Player name / render | Navigate to that player's profile (off-path) | route → `/player/[id]` |

**Key states:**
- **Default:** all categories counted, winner shown, no row expanded.
- **Winner-hidden:** neutral mode (numbers only, no leader/score language).
- **Refined selection:** subset of categories counted; score reflects subset; URL
  carries it so the link is shareable and restores on load.
- **Deep-linked (`/?cats=…` / `/?share=1`):** restore the selection from URL; if
  `share=1`, auto-open the Share Sheet (preserves existing behaviour so old
  shared links keep working).
- **Loading:** verdict is computed server-side from the dataset → first paint is
  the real answer; no client spinner needed for the verdict. Only the *card
  preview/PNG* in the sheet has an async/loading state.
- **Empty / error:** verdict is deterministic from bundled data, so "no data" is
  not a normal state; if the dataset ever fails, show a single honest message in
  place of the breakdown rather than a broken score. Card download failure shows
  an inline retry message in the sheet (already implemented).
- **Mobile (~390) vs desktop (1440):**
  - *Desktop:* renders flank the VS in a 3-column clash; the breakdown can sit
    below full-width; toggle + Share sit together under the verdict.
  - *Mobile:* everything **stacks** — Player A, VS, Player B, then score, then
    breakdown, then toggle, then Share. The clash header must compress so the
    **score is reachable with ≤1 short scroll**; renders shrink before the score
    does. Category rows are full-width, tap targets ≥44px. Share is a full-width
    button; on devices with the Web Share API it can fire the native sheet.

### SHARE SHEET (modal over `/`) — the terminal action

**Content blocks:**
1. **Live card preview** — the real share card, scaled (the actual output, not a
   mockup), reflecting current `cats` + `showWinner`.
2. **Editable caption** — prefilled (winner + score, or neutral), with hashtags;
   user can edit before sending.
3. **Primary: Download PNG.** The MVP's main export (SPEC §9).
4. **Targets row:** native/Web-Share, X, copy-link (deep link back to `/?share=1&cats=…`).
5. **Close (X / Esc / scrim).**

**Interaction & states:** focus-trapped dialog, Esc/scrim/X to close, focus
restored on close (already implemented); Copy → transient "Copied" confirmation;
Download → loading → success (file) or inline error+retry; caption re-seeds when
the underlying selection/locale changes. **Mobile:** the sheet is full-width and
scrollable; preview on top, controls below (single column). **Desktop:** preview
left, controls right.

**Why a sheet, not a route:** it's a *terminal action* on the verdict, not a
place you navigate "to" and "back" from. A modal keeps the user anchored on the
verdict (UX rule: don't use modals for primary *navigation* — but a one-shot
terminal action is exactly what a sheet is for) and keeps Share behaviour
single-sourced.

### SCREEN 2 — Player Profile (`/player/[id]`) — optional depth (off-path)

**Content blocks:** player identity header; career totals; season-by-season
output; competition breakdown; honours. Read-only.
**Role in IA:** a *leaf* off Screen 1, reached by tapping a player. Never part of
the settle+share spine; never linked into the main CTA chain. Has a clear,
predictable **back to `/`**. Exists to answer "show me the actual numbers behind
this" for the curious/skeptical user without bloating the core path.
**States:** default (data), 404 for any non-{messi,ronaldo} id (already handled).

---

## 5. Rationale — why this is *considered*, not a skeleton-copy of refs

1. **The verdict is the landing, not a reward two clicks away.** The biggest flaw
   of the Phase-9 structure is that it *copied the reference's screen sequence*
   (arena → pick → result → cards) without asking what the user actually needs
   first. The user needs the *answer*. Putting the score on `/` collapses the job
   from 3+ navigations to **2 taps total** (both of which are the *share*, not
   the *settle*). Settling is now instantaneous.

2. **Category selection was a gate; it's now an affordance.** Forcing every user
   through a picker to produce a URL param optimised for the rare power-user at
   the expense of everyone. Defaulting to "all categories" and exposing refine +
   winner-toggle *inline* serves the power-user **without** taxing the majority —
   progressive disclosure instead of an upfront wall.

3. **Cutting `/cards` sharpens the promise.** The product's moat is "**neutral by
   facts** + frictionless share." A whole screen of *cosmetic* FUT ratings
   undercuts the neutrality and forks the Share path three ways. Removing it
   makes the message singular and the codebase's Share behaviour single-sourced.
   The card *energy* the boss wants is redirected to where it actually ships —
   the **share-card image** — which is the real viral artifact.

4. **One primary action per screen.** Screen 1 has exactly one primary CTA
   (Share); the toggle, category taps and profile links are clearly secondary.
   This is the opposite of the current home, which competes "Start comparison" vs
   "View cards" vs an in-page Share before the user has a reason to choose.

5. **State lives in the URL, so sharing is lossless and the back button is
   honest.** `?cats=` and `?share=1` keep every verdict deep-linkable (a shared
   link reopens the *exact* verdict, even auto-opening the sheet) and keep
   browser Back predictable — no modal-as-route, no stack resets.

6. **Honesty is structural, not decorative.** "By N categories", never "X is
   better"; the Hide-winner mode and the trust line are first-class blocks, not
   afterthoughts — they're what makes the card *credible* enough to actually win
   an argument.

7. **"Без лишнего" taken literally.** Every kept element maps to a line in §1's
   job: renders+VS+score = *settle*; breakdown = *evidence*; toggle = *honesty /
   own-point*; Share = *exit*; profile = *optional proof*. Nothing on the path
   exists "because the reference had it."

---

## 6. Open questions for the manager / Agent B
- **Profiles in or out?** Kept as off-path depth; if the manager wants the
  absolute minimum, `/player/[id]` is the one screen left to cut (it costs the
  core path nothing, so the recommendation is keep).
- **Inline category refine vs. a small "advanced" disclosure?** Proposed as
  per-row checkboxes inside the breakdown; if that feels heavy, it can hide behind
  a single "Customise categories" expander to keep the default view dead simple.
- **Mobile clash compression:** Agent B must ensure the renders never push the
  score below ~1 short scroll on a 390px screen — the score is the hero.

---

## League-split (BOSS-NOTES §3)

> Scoped follow-up. Boss §3: stats must be viewable **broken down by league**
> (Premier League / La Liga / Serie A / Ligue 1 / international …) — both a
> feature and an argument ("dominated in 3 top leagues" is a *fact to show*, not
> just aggregate totals). Goal: "a person with eyes can **see** that Ronaldo
> delivered in *every* league — by facts, neutrally." The data already exists
> (player × season × competition; each `league` row carries a real
> `competitionName`). This is presentation/IA, **not** parsing.

### TL;DR — the recommendation (decisive)
League-split is **read-only evidence revealed *inside* the already-existing
expanded category row** — it is **not** a new screen, **not** a global tab, and
it does **not** recompute the verdict. The current "League" sub-metric (one line)
is **upgraded in place** into a small *per-league strip* that fans the league
buckets out as named rows (Premier League · La Liga · Serie A · …), so the same
single tap that already opens a category now also surfaces "he scored in *every*
league." One disclosure mechanism (the row expand) carries both jobs; nothing new
competes with it; the default view is untouched.

I considered and **rejected** a global "All / PL / La Liga / Serie A …" filter on
`/` that re-scopes the whole verdict (see §"What I cut" for why — it breaks the
verdict's honesty and bloats the minimal default). The progressive-disclosure
route is the one that satisfies "без лишнего."

### Why "inside the expanded row", not a global tab (the core reasoning)
1. **It reuses the one disclosure the IA already approved.** §4 already says: tap
   a category → it expands in place to show sub-metrics, *and one of those
   sub-metrics is literally "League goals"*. League-split is therefore not a new
   idea bolted on — it's the **natural depth of a sub-metric that already exists**.
   The user already taps once to ask "show me the breakdown"; league-split is just
   *what that breakdown should have been*. No second mental model.
2. **It keeps the verdict honest.** The boss's framing is an *argument by fact*
   ("dominated in 3 leagues"), shown **neutrally**. The moment a league filter
   re-scopes the score, the headline "RONALDO N–M MESSI" starts meaning different
   things in different states ("in La Liga only Messi 5–0"), which is (a) a gotcha,
   not neutral, and (b) confusing as a shareable verdict. League-split as
   *evidence under a category* lets the fact speak ("scored in every league:
   PL 103 · Serie A 81 · …") without ever forking the single, defensible score.
3. **It protects the minimal default.** A league tab-bar on `/` adds a persistent
   control to the hero before the user asked for any depth — the exact "gate in
   front of the verdict" §3 spent its budget removing. League depth must be
   *opt-in*, reached only by users who went digging.
4. **The data shape fits it perfectly.** The existing arena model buckets
   `competitionType` into `all / league / champions_league / national_team`. The
   *named* leagues live one level down, in `competitionName` **within** the
   `league` bucket. So "split the League row by league name" is exactly a
   sub-grouping of the bucket we already read — a local refinement of one row, not
   a new global axis. (See §"Data + labels".)

### Primary placement + interaction (default → league view, counted)
- **Default state (0 taps):** unchanged from §4. The breakdown shows one row per
  category with the headline values; **no league anything is visible.** The
  default verdict stays the clean aggregate (all competitions).
- **Reaching the league view (1 tap):** tap a category whose evidence *has* a
  league dimension (Goals, Assists, Trophies — the metrics that exist per league).
  The row expands (existing 240 ms in-place animation) and its sub-metrics now
  include a **"By league" strip**: the per-named-league rows. So **league-split is
  exactly 1 tap from the default landing** — the *same* tap that already opens the
  category. No extra control, no navigation, no page load.
- **Mobile vs desktop:**
  - *Desktop:* the by-league strip sits as indented rows under the category's
    other sub-metrics; both values flank the existing dual bar, league name on the
    left gutter. Comfortable width → all leagues visible at once.
  - *Mobile:* same rows, full-width, stacked; league name on its own line above
    the values+bar (the existing sub-metric mobile pattern). Tap targets ≥44 px.
    If a player has many leagues, the strip scrolls within the expanded panel —
    it never pushes a *second* category's content; the expand is still local.

**Counted flow — "see he delivered in every league":**

| # | User action | System response |
|---|---|---|
| 0 | Lands on `/` | Aggregate verdict + breakdown (no league UI). |
| 1 | **Tap "Goals"** (a category) | Row expands → sub-metrics incl. the **By-league strip**: La Liga · Ligue 1 · MLS (Messi) vs Premier League · Serie A · Primeira Liga · Saudi Pro League · La Liga (Ronaldo), each with both numbers + a per-league leader marker. |
| — | (read) | The fact is now visible: each player scored across every league he played. |

**= 1 tap from cold landing to the league breakdown.** (It's the same tap that
opens the category, so league depth costs *zero extra taps* over the already-
designed "dig into a category" path.)

### Reconciling with the existing category breakdown + per-row expand
There must be **exactly one** progressive-disclosure mechanism. It is the
**category-row expand** (§4). League-split does **not** introduce a second
expander, a second tab system, or a nested accordion. Concretely:

- The expanded category panel today lists flat sub-metric rows (e.g. Goals →
  Career · International · **League** · UCL · Conversion). We **replace the single
  "League" line with a small labelled "By league" group** of named-league rows
  (a sub-section *within the already-open panel*, not a new collapsible). The
  sibling sub-metrics (Career / International / UCL / Conversion) are unchanged.
- This means: tap once → see *everything* about that category, including the
  per-league fan-out, in one open panel. No "expand the league sub-section"
  second click. (A nested expander would be the two-competing-disclosures trap;
  we avoid it by making "by league" a *static labelled group*, always shown when
  the row is open.)
- Categories whose evidence has **no** league dimension (Ballon d'Or, Champions
  League [single competition], World Cup / international, Longevity) show **no**
  by-league strip — the group simply doesn't render for them. League-split appears
  only where a real per-league number exists, so it never pads a row with empty
  league rows.

### Score / verdict decision — **read-only, never recomputes**
**Recommendation: league-split is read-only evidence and does NOT change the
score or the category verdict. There is no per-league verdict.** Reasoning:
- The verdict's whole credibility (§6.6 "honesty is structural") rests on it being
  **one stable, defensible number**: "by N categories, all competitions." Letting
  a league selection recompute it creates many contradictory "verdicts"
  (Messi wins La Liga, Ronaldo wins the Premier League) — which is cherry-picking,
  the opposite of "neutrally, by facts."
- The category winner shown in the breakdown stays computed over the **aggregate**
  (as today). The per-league rows carry their **own tiny leader marker per league
  row** ("who scored more *in this league*") — that is the honest, granular fact
  the boss wants ("сравнить в разрезе лиг") — but those markers are **local to the
  row and are tallied into nothing.** They inform; they do not vote.
- Net: picking/expanding a league changes **what evidence you see**, never the
  score. The `?cats=` selection (which *does* recompute) and league-split (which
  never does) stay cleanly separated — one is "which categories count," the other
  is "show me the proof under this category."

### Share card decision — **off by default; one optional "by-league" line**
**Recommendation: the default share card is unchanged (aggregate verdict).** Do
**not** add a league tab/filter to the card and do **not** auto-expand every
category by league (it would overload the fixed-band layout and break PNG
determinism by making height data-dependent). Instead, offer **one optional,
single-line "league-dominance strip"** the user can toggle on in the Share Sheet:

- It renders as **one extra fixed band** (so the layout stays deterministic — the
  band is either present at a fixed height or absent), reading e.g.
  **"Scored in every league he played — PL · La Liga · Serie A · Ligue 1 · MLS"**
  as a neutral *fact line*, not a second scoreboard. No per-league numbers on the
  card (numbers belong in the on-screen breakdown; the card is the headline).
- Determinism is preserved because the strip is a **static, precomputed string**
  (leagues are known at build from the dataset), no clock/RNG, same input → same
  PNG (honours `card-png-determinism` memory: the card stays a pure function of
  `{cats, showWinner, byLeague}`).
- It is **opt-in** (a checkbox in the Share Sheet, default OFF) so the default
  card stays clean and the boss's "dominated in every league" flex is available
  for the content-maker who wants exactly that argument. In **neutral / Hide-
  winner** mode the strip drops the "dominated" verb and reads as a plain
  enumeration ("Played & scored across: PL · La Liga · …").

### Data → user-facing label mapping
The named leagues live in `competitionName` on each `competitionType:"league"`
row. They map cleanly to user labels (1:1, just display the name). The **only**
nuance is that two clubs share a league (Real Madrid + Barcelona → La Liga; for
Ronaldo, Juventus → Serie A is its own), so per-league rows are grouped by
`competitionName`, **not** by club. Mapping:

| Bucket / `competitionName` | Player(s) | User-facing label | Notes |
|---|---|---|---|
| `league` · "Premier League" | Ronaldo (Man Utd) | **Premier League** | clean 1:1 |
| `league` · "La Liga" | Messi (Barça), Ronaldo (Real) | **La Liga** | both played it — grouped by name, not club |
| `league` · "Serie A" | Ronaldo (Juventus) | **Serie A** | clean 1:1 |
| `league` · "Ligue 1" | Messi (PSG) | **Ligue 1** | clean 1:1 |
| `league` · "Primeira Liga" | Ronaldo (Sporting) | **Primeira Liga** | clean 1:1 |
| `league` · "Saudi Pro League" | Ronaldo (Al-Nassr) | **Saudi Pro League** | clean 1:1; not a "top-5" league — still shown (honesty: show all, don't hide) |
| `league` · "Major League Soccer" | Messi (Inter Miami) | **MLS** | abbreviate for width |
| `champions_league` | both | **Champions League** | single competition, *not* a "league split" — stays its own sub-metric/category, no fan-out |
| `national_team` | both | **International** | the "межд. сборная" line; one bucket, no per-tournament fan-out (World Cup/Euro/Copa live as the existing intl sub-metrics, not as leagues) |
| `domestic_cup` / `super_cup` / `club_world_cup` | both | *(not surfaced as leagues)* | cup competitions, not leagues — excluded from the by-league strip to keep "by league" meaning *league* |

**Labels that don't map cleanly / decisions:** none are ambiguous, but note (a)
"International" is a single bucket presented alongside leagues in the boss's list
even though it isn't a league — keep it as its own clearly-separated line, not
inside the "By league" group, so "by league" stays literally true; (b) cup
buckets are deliberately **out** of the league strip; (c) Saudi Pro League / MLS
are kept (showing *every* league is the honest version of "delivered in every
league" — silently dropping the weaker leagues would be the dishonest flex).

### Key states
- **Default (`/`):** aggregate verdict, breakdown collapsed, **no** league UI.
- **Category expanded:** by-league strip visible *for league-bearing categories
  only*; each league row shows both values + a per-league leader marker.
- **Neutral / Hide-winner:** per-league leader markers hide (numbers only),
  exactly like the rest of the breakdown — league rows become a neutral
  enumeration. Card strip (if on) drops the "dominated" verb.
- **Score-affecting controls:** unaffected. `?cats=` still governs the score;
  league-split governs only what evidence is shown.
- **Deep-link:** because league-split never changes the score, it needs **no new
  URL param by default** — a shared `/?cats=…` link restores the same verdict and
  the user re-opens any category to see leagues. *Optional* nicety (recommend
  deferring): `?open=goals` to deep-link a pre-expanded category for a "look at
  his league record" share; only add if a real share flow needs it. The share-
  card "by-league" toggle, if shipped, serialises as `?league=1` purely for the
  card (does not touch the verdict).

### What I cut / avoided (to protect minimalism)
1. **A global "All / PL / La Liga / Serie A …" filter/tab on `/`.** Biggest
   temptation, biggest cost: a persistent control on the hero before any depth is
   requested, *and* it implies re-scoping the verdict — the dishonest, confusing
   path. Cut entirely.
2. **A per-league recomputed verdict / per-league score.** Forks the single
   defensible number into many cherry-picked ones. Cut.
3. **A nested accordion** ("expand category → expand 'By league'"). Two competing
   disclosures. Cut — by-league is a *static group inside the already-open panel*.
4. **Per-league numbers on the share card.** Overloads the fixed layout, threatens
   PNG determinism. Cut down to *one optional fixed-height fact line*.
5. **Per-tournament international fan-out** (World Cup vs Euro vs Copa as
   "leagues"). Out of scope of "by league"; the existing intl sub-metrics already
   carry it. Kept simple.
6. **Surfacing cups as leagues.** "By league" must mean league. Cups excluded.

### Manager review hooks
- **Confirm:** league-split = read-only evidence, verdict never recomputes by
  league (the central decision — everything else follows from it).
- **Decide:** ship the optional share-card "by-league" line now, or defer to a
  later card iteration? (Recommendation: ship — it's the boss's headline flex and
  it's one deterministic band.)
- **Decide:** add `?open=<category>` deep-link now or defer? (Recommendation:
  defer until a share flow needs a pre-expanded category.)

*(The `/wireframe` route is extended with a bare greyscale sketch of the
expanded-row by-league strip at desktop + mobile — see Screen 1 in
`src/app/wireframe/page.tsx`.)*
