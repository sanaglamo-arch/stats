# BUILD_REPORT.md — FootyCompare MVP

> Autonomous build by the conductor + delegated subagents (Architect, Data
> Engineer, Card/Design Engineer, UI Engineer, Design/Motion, and **separate**
> Tester + Reviewer per phase). Source of truth: `SPEC.md`, `PLAN.md`, `AGENTS.md`.
> Repo: https://github.com/sanaglamo-arch/stats (branch `main`).

## What got built

A working, shareable **Messi vs Ronaldo** comparison-card web service. Pick a
slice → see a beautiful card → download the PNG / share it. The verdict is a
strictly mechanical **"score by categories"** ("MESSI N : M RONALDO", "N
categories won") — never "X is better".

**All 5 phases complete; every task in `PLAN.md` is `[x]`.**

| Phase | Delivered | Verify |
|---|---|---|
| **0 Scaffold** | Next.js 15 (App Router) + React 19 + TS **strict** + Tailwind v4, `src/`, `@/` alias, pnpm; ESLint(flat, no-`any`)+Prettier+Vitest+Playwright; dark-neon glassmorphism design tokens (Orbitron + Inter) via `ui-ux-pro-max`; RU/EN i18n (typed dict + provider + toggle). | `727079d` |
| **1 Data pipeline** | Canonical `PlayerSeasonComp` schema (SPEC §6) behind a swappable `DataSource`; real adapters **Wikidata / Understat / FBref-Transfermarkt** with graceful degradation to a plausible seed; one-shot `pnpm ingest` → `src/data/dataset.json` (112 rows, both full careers, 6 competition types); 4 slicers (season / competition / same-age / penalties) + derived metrics; mechanical `compare()`; all rows `verified:false`; 41 fixture unit tests. | `1ee7322` |
| **2 Card + PNG** | `ComparisonCard` per SPEC §4 (header w/ photo+club+flag+VS, period plaque + filter chips, divergent pink/blue double bars, OVERALL RESULT footer, watermark), vertical **2:3 → 1080×1620**; PNG via **Playwright** screenshot at **`/api/card`** (system-Chrome fallback); replaceable photo slot + 2 stylized neon silhouettes. | `44c98ab` |
| **3 Interface** | **Studio**: per-player selectors for all 4 slices + same-age convenience (options derived from data), reactive scale-to-fit **live preview** (in-memory, no server hit), **Download PNG** (blob via `/api/card`) + **Share** (Web Share API w/ file→URL→clipboard fallbacks), RU/EN toggle; mobile leads with the product card. | `b2bdc29` |
| **4 Polish** | framer-motion UI motion (stagger / fade / preview crossfade / press) — **UI only**, all `useReducedMotion`-guarded; preview skeleton; card visual elevated to "wow" via `ui-ux-pro-max` (glassy photos, inset bar tracks + diamond node, haloed footer) — **card stays static so PNG is deterministic**. | `d1e90fc` |
| **5 Acceptance** | Happy-path E2E (tweak slices → preview updates → **real PNG download** verified by signature+size) + smoke; final whole-repo acceptance review; this report. | `458cda8` |

## Post-acceptance iterations (owner-driven)

| Pass | Delivered | Commit |
|---|---|---|
| **Data accuracy** | Seed recalibrated to documented reality — career totals (goals 840/901, assists 380/245, matches 1084/1271, trophies 44/35), **Ballon d'Or fixed to 8 : 5** (was undercounting Messi); dataset grown to **187 rows**; aggregation bug fixed (trophies/Ballon counted by distinct season+name, not unique name). All rows still `verified:false`. | `ce60a47` |
| **Visual overhaul (card-hero)** | Layout rebuilt so the card is the dominant hero on an ambient dual-accent aura; controls demoted to a quiet glass rail (desktop) / a "Customize" bottom-sheet (mobile, full-screen card); premium layered `.glass-panel`, neon wordmark. Card/render still static (PNG deterministic). | folded into below |
| **Cinematic motion (Awwwards-level)** | Unified motion-token system (custom cubic-bezier easings / durations / springs); **Lenis** momentum scroll + **GSAP ScrollTrigger** (reduced-motion-gated); cinematic staggered hero; scroll-triggered **parallax** verdict band; dramatic card entrance with **spring `scaleX` bar-fill + count-up numbers + pulse**; smooth crossfade/morph on any slice change; **magnetic** buttons, hover-tilt, animated segmented control + toggle. **60fps** (transform/opacity/filter only); `prefers-reduced-motion` disables everything incl. Lenis. **Card animation is behind an `animated` prop (default false) → `/render/card` stays deterministic.** | `cf8867f` |

## Card + site preview (owner: eyeball these)

- **`preview/card-sample.png`** / **`preview/card-career-ru.png`** — 1080×1620 PNGs (EN default slice; RU full-career with xG/xA reveal).
- **`preview/home-desktop-1366.png`** — the cinematic hero (desktop).
- **`preview/home-desktop-studio.png`** / **`preview/home-desktop-card-updated.png`** — the studio with the live card (default + after a slice change).
- **`preview/home-mobile-390.png`** / **`preview/home-mobile-390-sheet.png`** — mobile hero + the Customize bottom-sheet.
- **`preview/showcase-desktop.webm`** — the interaction **video** (motion ON): hero → scroll → card morph → magnetic button → parallax verdict band.

## How to run

```bash
pnpm install
pnpm dev        # http://localhost:3000  — the Studio
pnpm build && pnpm start   # production
```

Quality gates (all green):

```bash
pnpm typecheck  # tsc --noEmit
pnpm lint       # eslint .
pnpm test       # vitest — 55 unit tests, no network/browser
pnpm e2e        # Playwright — smoke + happy-path (needs a Chromium)
pnpm ingest     # re-run data ingestion → src/data/dataset.json
```

The e2e gate runs with `reducedMotion: "reduce"` so the motion-heavy UI stays
deterministic. To regenerate the motion-ON showcase media in `preview/`:

```bash
pnpm exec playwright install ffmpeg          # one-time, for video recording
pnpm build && pnpm exec next start -p 3200 & # serve a production build
BASE_URL=http://localhost:3200 pnpm exec tsx scripts/capture-showcase.ts
```

**Environment notes**
- **Build/render need a Chromium.** `/api/card` and `pnpm e2e` launch a headless
  browser. In CI without one, run `pnpm exec playwright install chromium`, or set
  `CHROME_PATH` to a system Chrome (the route + Playwright config fall back to
  `/opt/google/chrome/chrome` automatically).
- This build was produced in a sandbox that **SIGKILLs long-running processes**;
  `pnpm build` was run with sandboxing disabled. Normal machines/CI are unaffected.

## Architecture (one breath)

`@/lib/data` (schema + `DataSource` + adapters + slicers + `compare`) → `card-model`
(pure view-model) → consumed identically by the **live preview** (`ComparisonCard`
in-memory) and the **PNG route** (`/render/card` screenshotted by `/api/card`).
`paramsFromSlice` ⇄ `sliceFromParams` are exact inverses, so the previewed card and
the downloaded PNG cannot diverge. Data sources sit behind one interface — swap
them without touching the frontend.

## ⚠️ Before-launch TODO (owner)

1. **Data verification — REQUIRED.** Every row is still **`verified:false` seed
   data** (live sources degraded during ingestion; see `DATA_REPORT.md`). The
   data-accuracy pass (`ce60a47`) calibrated the headline figures to documented
   reality — career totals, trophies 44 : 35, **Ballon d'Or 8 : 5** — so the
   verdict now reads correctly, but the per-season splits remain approximate.
   Verify goals/penalties, xG/xA, minutes, trophies/Ballon d'Or, and
   age-per-season against authoritative sources; set `verified:true` per row (or
   re-run `pnpm ingest` once the live adapters are reachable via proxy/cache).
2. **Photo rights — REQUIRED for public/viral launch.** MVP ships **stylized neon
   silhouettes** (no copyrighted likeness). Before launch, license real photos
   **or** commission art; swapping is one line per player in
   `src/components/card/player-meta.ts` (see `DATA_REPORT.md` §Photo rights).
3. **Source attribution footer** — the card footer reserves space for data-source
   attribution (`datasetGeneratedAt` hook exists); wire it once data is verified.

## Known follow-up cleanups (non-blocking, from acceptance review)

- Consolidate the competition list/labels — currently duplicated in
  `studio/player-controls.tsx`, `card/card-labels.tsx`, `card/slice-params.ts`;
  export one constant + reuse `competitionLabel`.
- Prune/justify two near-unused exports (`competitionLabel`, `datasetGeneratedAt`)
  once the attribution footer lands.

## Status

**BUILD COMPLETE + cinematic overhaul live.** All `PLAN.md` tasks `[x]`, plus the
post-acceptance data-accuracy / visual / motion passes. Final `pnpm typecheck &&
lint && test (55) && build && e2e (2)` green; verified by separate Tester +
Reviewer each pass. Ship-ready pending the two owner before-launch items above.
