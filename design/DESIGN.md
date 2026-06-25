# CompareGOATs — DESIGN (Phase 10, Agent B · Design Lead)

> **The soul, not the skeleton.** Agent A delivered the approved IA (`design/UX.md`)
> and the bare structure (`src/app/wireframe/page.tsx`). This document dresses
> **that exact structure** in the visual identity. It is implementation-ready:
> exact hex, tokens, gradient/shadow recipes, the render-clash construction
> layer-by-layer, the type scale, the motion language, and a per-screen annotated
> art-direction brief the orchestrator can build directly from.
>
> **Scope rules (hard):** dress the approved 2 routes + Share sheet only — **no
> new screens, no IA changes**. Do **not** touch Phase-8 data. Do **not** rebuild
> app components — this is the spec; the orchestrator implements. Keep **AA text
> contrast**, **`prefers-reduced-motion`** support, and **visible focus**. The
> share-card render path (`/render/*`, `src/app/render/*`) stays **static /
> animation-free** for PNG determinism (see MEMORY: card-png-determinism).

---

## 0. The diagnosis (why the current site has no soul)

The boss is right: Phase 9 copied the references' *layout* but not their
*atmosphere*. Concretely, measured against `design-refs/`:

| Ref does this | Current site does this | Fix owned here |
|---|---|---|
| **Floodlit stadium** with volumetric haze, light shafts, depth, embers | Flat dark navy with two faint corner glows | §2 Atmosphere — layered background stack |
| **Big, near-full-height duotone renders** bleeding off the edges, *facing inward* at a blazing VS | Small head-shots in bordered boxes, no clash | §3 Render-clash (the #1 upgrade) |
| **Energy collision** at center (sparks/shockwave/gold burst) | A flat static radial bloom | §3.4 VS energy clash |
| **FUT-card energy** — gold-trimmed angular cards, red/blue tension | FUT energy lived on a *separate* `/cards` page (now cut) | §6.2 channels that energy into the **share card** |
| Premium **poster** feel — type as hero, gold crown, depth | Reads as a **dashboard/form** | §4 type scale + §5 motion |

The reference's power comes from **three stacked things**: (1) a deep,
volumetric, *lit* environment; (2) two dramatic figures in genuine confrontation;
(3) a literal energy event between them. Reproduce all three and the soul appears.

---

## 1. ui-ux-pro-max guidance applied (cited)

Queried the skill CLI (`scripts/search.py`) and pulled the following, which this
doc follows:

- **Design-system (`--design-system "sports arena versus comparison dark neon
  premium poster"`)** → recommended pattern *Comparison + CTA*, style *Vibrant &
  Block-based* ("duotone, high color contrast, energetic, gaming/entertainment"),
  effect note *large sections (48px+ gaps), large type (32px+), bold hover,
  200–300ms*. → Drives our block rhythm (§4 spacing), duotone-at-scale (§3), and
  motion durations (§5).
- **Style `Modern Dark (Cinema Mobile)`** → *avoid pure `#000000` (OLED smear),
  LinearGradient base, 2–3 animated ambient "blobs" low opacity 0.08–0.12, BlurView
  glass, `Easing.bezier(0.16,1,0.3,1)`, accent glow behind primary button, press
  scale 0.97.* → Adopted: our base stays navy not black (§2.1), the floodlights are
  the "ambient blobs", primary CTA gets an accent glow (§4.6), press = scale .97
  (§5), **standard easing `cubic-bezier(0.16,1,0.3,1)`** (§5.1).
- **Style `Glassmorphism`** → *backdrop-blur 10–20px, translucent white 0.10–0.30,
  1px light border, light-source reflection, layered Z-depth, verify 4.5:1.* →
  Our `.glass-panel` already matches; §4.7 codifies blur/opacity/border tokens and
  the top inner-highlight.
- **Style `Dark Mode (OLED)`** → *minimal glow `text-shadow:0 0 10px` used
  sparingly, vibrant neon accents, contrast 7:1.* → Glow is a *signature accent on
  headlines/CTAs only*, never on body text (§4.5, §5.5).
- **Typography `Sports/Fitness` (Barlow Condensed/Barlow)** and **`Bold
  Typography (Inter Poster)`** → *condensed display for impact headlines, regular
  sans body, type-as-hero, scale 12→72, 5:1 H1:body, `letter-spacing` negative on
  Inter heroes, tabular/mono for stats.* → We keep the **approved brand fonts
  Bebas Neue (display) + Inter (body)** from ref3's style guide, but borrow the
  scale ratios, tracking discipline, and tabular-stat rule (§4).
- **UX `Animation/Reduced Motion`, `Motion Sensitivity`, `Excessive Motion`** →
  *respect `prefers-reduced-motion`; no scroll-jacking; animate 1–2 key elements
  per view max.* → §5.6 reduced-motion contract; we animate the *clash + verdict*
  only, not "everything that moves".
- **UX `Number Formatting`** → *thousand separators / tabular.* → All stat figures
  use `.tabular` + `Intl.NumberFormat` (§4.4).

The references themselves (`design-refs/ref1/2/3`) are the primary visual source;
the skill confirms the *approach* (vibrant block duotone + cinema-dark glass +
sports-condensed type + restrained motion).

---

## 2. ATMOSPHERE — the stadium-arena background layer stack

Goal: a **floodlit stadium at night** — depth, volumetric haze, light shafts,
embers — **not** a flat dashboard. Build it as a **fixed, `aria-hidden`,
`pointer-events:none` layer stack** behind page content (`z-index:0`; content at
`z-index:1+`). It is mostly static CSS; only the embers + floodlight shimmer move
(and stop under reduced-motion). Several primitives already exist in
`globals.css` (`.stadium-bg`, `.stadium-beams`, `.studio-aura-fixed`,
`.card-halo`) — we **extend** them; do not duplicate.

### 2.1 The layer order (back → front)

```
z0  BASE WASH      deep navy vertical gradient (never pure black)
z1  FLOOR GRADIENT pitch-glow: dual red/blue wash rising from the bottom edge
z2  FLOODLIGHT CONES 4 conic light shafts raking down from top corners + a warm
                   gold crown-glow at center-top  (the "ambient blobs")
z3  VIGNETTE       radial darkening at the 4 corners → focuses the eye to center
z4  HAZE/VOLUME    one big soft blurred radial "fog" bloom mid-frame (depth)
z5  GRAIN/NOISE    a 3–4% film-grain texture over everything (kills banding,
                   adds premium "photographed" feel)
z6  EMBERS         8–14 tiny gold particles drifting up slowly (life), motion-gated
---- page content (z10+) ----
```

### 2.2 Recipes (drop into `globals.css`)

**z0 base wash** — replace the flat `body` background's reliance on base color
with an explicit vertical navy gradient (keeps depth top→bottom):

```css
.arena-atmosphere {            /* the fixed root layer container */
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    linear-gradient(180deg, #0a1124 0%, #070b16 46%, #04060e 100%); /* z0 */
}
```

**z1 floor pitch-glow + z2 floodlight cones + z3 crown** — one layered
background on a `::before` of the atmosphere root (extends existing `.stadium-bg`
+ `.stadium-beams` — use those values, tuned brighter):

```css
.arena-atmosphere::before {
  content: ""; position: absolute; inset: 0;
  background:
    /* z3 crown glow (gold, center-top) */
    radial-gradient(46% 36% at 50% -6%, rgba(245,180,60,.16), transparent 66%),
    /* z2 floodlight cones (cool white, four shafts from the top corners) */
    conic-gradient(from 202deg at 14% -12%, transparent 0deg, rgba(255,255,255,.085) 20deg, transparent 42deg),
    conic-gradient(from 138deg at 86% -12%, transparent 0deg, rgba(255,255,255,.085) 20deg, transparent 42deg),
    conic-gradient(from 210deg at 30% -12%, transparent 0deg, rgba(255,255,255,.05) 14deg, transparent 30deg),
    conic-gradient(from 150deg at 70% -12%, transparent 0deg, rgba(255,255,255,.05) 14deg, transparent 30deg),
    /* z1 floor pitch-glow (red left, blue right, rising) */
    radial-gradient(72% 46% at 22% 106%, rgba(226,16,59,.16), transparent 68%),
    radial-gradient(72% 46% at 78% 106%, rgba(44,99,219,.16), transparent 68%);
}
```

**z3 vignette + z4 haze** — on a `::after`:

```css
.arena-atmosphere::after {
  content: ""; position: absolute; inset: 0;
  background:
    /* z4 volumetric haze (soft warm fog mid-frame) */
    radial-gradient(50% 38% at 50% 52%, rgba(120,140,200,.06), transparent 70%),
    /* z3 vignette (corner darkening) */
    radial-gradient(120% 120% at 50% 38%, transparent 52%, rgba(2,4,10,.55) 100%);
}
```

**z5 grain** — a tiny inline SVG `feTurbulence` data-URI tiled at low opacity
(the single biggest "cheap → premium" upgrade; defeats gradient banding on dark):

```css
.arena-grain {
  position: fixed; inset: 0; z-index: 1; pointer-events: none;
  opacity: .045; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
```

**z6 embers** — a handful of absolutely-positioned 2–3px gold dots, each with a
slow `ember-rise` translateY+fade keyframe, randomized delays/durations
(18–34s). Decorative, **motion-gated** (hidden / static under reduced-motion).

```css
@keyframes ember-rise {
  0%   { transform: translateY(8vh) scale(.6); opacity: 0; }
  12%  { opacity: .8; }
  100% { transform: translateY(-92vh) scale(1); opacity: 0; }
}
.ember { position: fixed; bottom: -2vh; width: 3px; height: 3px; border-radius: 50%;
  background: rgba(245,180,60,.9); box-shadow: 0 0 6px 2px rgba(245,180,60,.5);
  pointer-events: none; z-index: 1; animation: ember-rise linear infinite; }
@media (prefers-reduced-motion: reduce) { .ember { display: none; } }
```

> **Floodlight life (optional, subtle):** the cones may breathe ±4% opacity on a
> 7s ease-in-out loop (`floodlight-breathe`) — gated by reduced-motion. This is
> the one thing that makes the stadium feel "on". Keep it imperceptible.

**Mobile:** drop the two inner cones and reduce embers to 5–6; keep base, floor
glow, vignette, grain. Atmosphere must never cost the score its position
(UX.md §4 — renders shrink first).

---

## 3. THE RENDER-CLASH — big duotone figures facing a central VS (headline upgrade)

This is the #1 fix. The current "photos in boxes" must become **two large,
near-full-height duotone renders, bleeding off the outer edges, turned inward,
colliding at a central VS energy event.** Built over the *real* portraits
(`public/players/ronaldo.jpg` 613×817, `public/players/messi.jpg` 750×1000) —
the "render" is a **CSS treatment over a head&shoulders photo**, not new art.

### 3.1 Hero layout (desktop ≥1024)

A full-bleed hero, target height `min(92vh, 880px)`, 3 zones on a single grid so
the figures can **bleed past the content gutters**:

```
┌───────────────────────────────────────────────────────────────┐
│  wordmark (GOAT ARENA, gold) · trust line                      │  top bar
│                                                                │
│  ◀RONALDO render          ⚡  VS  ⚡          MESSI render▶      │
│   (warm red/gold,          energy clash       (cool blue,      │
│    full height,            at center           full height,    │
│    bleeds LEFT edge,                            bleeds RIGHT   │
│    faces RIGHT/inward)                           edge, faces   │
│                                                  LEFT/inward)  │
│                                                                │
│        ┌─────────  VERDICT SCORE (the answer)  ─────────┐      │  overlaps
│        │  RONALDO  N  —  M  MESSI   ·  "M categories"   │      │  lower-center
│        └────────────────────────────────────────────────┘      │
└───────────────────────────────────────────────────────────────┘
```

Implementation grid: `grid-template-columns: minmax(0,1fr) auto minmax(0,1fr)`
with the two render columns set to `align-self: stretch` and given **negative
outer margins** (`margin-left: -6vw` left render; `-6vw` right) so the figures
*bleed off the outer edges*. The VS + score occupy the center column and a
lower-center overlay band (see §3.5).

### 3.2 The duotone-at-scale treatment

Extend the existing `.arena-render` (do not fork it). At hero scale the photo is
treated as a single-hue render with an inner edge-fade so it dissolves into the
stadium rather than sitting in a box.

```css
.render-hero { position: relative; height: 100%; overflow: visible; }
.render-hero img {
  width: 100%; height: 100%; object-fit: cover; object-position: top center;
  /* duotone base: kill color, push contrast so the figure reads as graphic */
  filter: grayscale(1) contrast(1.22) brightness(.9);
  /* dissolve the inner + bottom edges into the stadium (no photo box) */
  -webkit-mask-image:
    linear-gradient(180deg, #000 60%, transparent 100%),         /* bottom fade */
    linear-gradient(var(--inward), #000 64%, transparent 100%);  /* inner fade  */
          mask-image:
    linear-gradient(180deg, #000 60%, transparent 100%),
    linear-gradient(var(--inward), #000 64%, transparent 100%);
  -webkit-mask-composite: source-in; mask-composite: intersect;
}
/* per side: which way the figure faces + which inner edge fades */
.render-hero.is-ronaldo { --inward: 90deg;  } /* left figure faces RIGHT; inner = right edge fades */
.render-hero.is-messi   { --inward: 270deg; } /* right figure faces LEFT;  inner = left edge fades  */
.render-hero.is-messi img { transform: scaleX(-1); } /* mirror so Messi faces inward toward VS */
```

> **Facing inward:** both portraits are shot facing roughly forward/3-quarter.
> Mirror **one** side (Messi) with `scaleX(-1)` so the two figures *turn toward
> each other* and the VS. Verify against ref1 — there the figures clearly face
> center. Re-check the mirrored side for any text on the shirt reading backwards;
> if the shirt number flips wrongly, mirror Ronaldo instead — pick whichever
> keeps both shirt numbers legible / both faces inward.

**The color (duotone) overlay** — two stacked pseudo-layers, already the model in
`.arena-render::after` (multiply/`color` blend) + `::before` (screen highlight).
Keep that mechanism; the per-side gradients:

```css
/* RONALDO — warm: gold core → crimson shadow */
.render-hero.is-ronaldo::after {            /* mix-blend-mode: color */
  background: linear-gradient(155deg, var(--color-gold) 0%, var(--color-ronaldo) 66%, #7a0a20 100%);
}
.render-hero.is-ronaldo::before {           /* mix-blend-mode: screen — rim light */
  background: radial-gradient(56% 50% at 70% 26%, rgba(255,215,94,.55), transparent 70%);
}
/* MESSI — cool: electric azure core → deep blue shadow */
.render-hero.is-messi::after {
  background: linear-gradient(205deg, var(--color-messi-bright) 0%, var(--color-messi) 70%, #0a1f5c 100%);
}
.render-hero.is-messi::before {
  background: radial-gradient(56% 50% at 30% 26%, rgba(58,130,255,.55), transparent 70%);
}
```

The `::before` rim-light is positioned on the **inward-facing** side of each
figure (toward the VS) so the clash light catches their edges — this is what
sells "two fighters lit by the same explosion between them".

### 3.3 Scale, crop & the fallback

- **Scale:** the figure should fill **~85–95% of hero height**, head near the top
  ~8–12% margin, shoulders/torso filling down, bottom dissolving via the mask.
  `object-position: top center` keeps the face anchored as the box flexes.
- **Crop discipline:** Ronaldo (613×817 ≈ 0.75) and Messi (750×1000 = 0.75) are
  both 3:4 — good. At hero scale they upscale ~1.2–1.6×; the grayscale+contrast+
  duotone *hides* softening (a duotone render is forgiving of resolution; a sharp
  photo is not). This is **why duotone, not a clean photo** — it reads as
  intentional graphic art, not a blown-up snapshot.
- **Fallback when a portrait can't fill full height** (short source, or future
  players): (1) shift to a **chest-up crop** (`object-position: top center`,
  shorter container) anchored to the **bottom** of a shorter render zone, and
  fade the top into the stadium too (add a top mask stop); (2) if still
  insufficient, fall back to the existing **silhouette SVG**
  (`public/players/{id}.svg`) tinted with the same per-side duotone gradient as a
  flat graphic — never show a small boxed photo. The silhouette + duotone still
  reads as a dramatic render.

### 3.4 The VS energy clash (center)

The center is not a logo on a flat bloom — it is an **energy collision**: a gold
shockwave ring + radial sparks + a thin lightning seam where the two color fields
meet. Built in layers behind/around a gold VS medallion.

```
       ▲ gold crown spark
   \   ●  VS  ●   /        ← spark rays (gold) shooting outward
 RED  ╲  ◎◎◎  ╱  BLUE      ← shockwave rings (gold) pulsing outward
 field  ╲╲╳╱╱  field        ← lightning seam: thin vertical bolt where red meets blue
```

Reuse + extend `.arena-vs-burst` (the conic+radial bloom already exists). Add:

```css
/* shockwave ring — a single expanding gold ring on the clash, motion-gated */
@keyframes vs-shock {
  0%   { transform: translate(-50%,-50%) scale(.4); opacity: .9; }
  70%  { opacity: .25; }
  100% { transform: translate(-50%,-50%) scale(1.9); opacity: 0; }
}
.vs-shockwave {
  position: absolute; left: 50%; top: 50%; width: 180px; height: 180px;
  border-radius: 50%; border: 2px solid rgba(245,180,60,.7);
  box-shadow: 0 0 24px rgba(245,180,60,.5), inset 0 0 18px rgba(245,180,60,.35);
  pointer-events: none; animation: vs-shock 2.6s cubic-bezier(0.16,1,0.3,1) infinite;
}
/* lightning seam — a 2px vertical gradient bolt at the red/blue boundary */
.vs-seam {
  position: absolute; left: 50%; top: 8%; bottom: 8%; width: 2px;
  transform: translateX(-50%);
  background: linear-gradient(180deg, transparent, rgba(245,180,60,.9) 30%,
              rgba(255,255,255,.95) 50%, rgba(245,180,60,.9) 70%, transparent);
  filter: blur(.4px) drop-shadow(0 0 6px rgba(245,180,60,.7)); pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .vs-shockwave { animation: none; opacity: .35; } /* freeze as a static ring */
}
```

**The VS medallion** (matches ref1/ref2): a circular gold-rimmed glass disc, gold
beveled "VS" in Bebas Neue, gold glow halo. On hover/entrance it gets a single
`vs-flash` (brightness pop + scale 1.04, 220ms) — never looping. The conic
`.arena-vs-burst` sits behind it; `.vs-shockwave` and `.vs-seam` frame it; the
two render `::before` rim-lights complete the "lit by the clash" effect.

> **Crucial:** the clash must read as **energy between two figures**, not a badge.
> The seam + the inward rim-lights + the shockwave are what create that. If only
> one can ship, ship the **seam** (the red↔blue boundary lit) — it's the cheapest
> "collision" signal.

### 3.5 The verdict score band (the answer — must be present at the clash)

Per UX.md §4 the **score is the hero** and must be above the fold. It overlaps
the lower-center of the hero as a glass band:

- `RONALDO  N  —  M  MESSI` in **Bebas Neue, huge** (clamp to ~`4–7rem`), each
  side tinted its accent (red / blue), the `—` and numbers in **gold**.
- Below it, small Inter caps: **"M categories won · K tied"** + crown glyph by the
  leader's name (the crown is the only "winner" embellishment; honest, per SPEC).
- Sits on `.glass-panel` with a gold hairline top edge and `--shadow-hero` lift so
  it floats off the clash.
- Numbers **count up** on entrance (§5.4); under reduced-motion they render final.

### 3.6 Mobile clash (~390)

Stack per UX.md §4, but **keep the clash energy**: Ronaldo render (≈30vh, bleeds
left), a compact VS medallion + seam, Messi render (≈30vh, bleeds right), then the
**score band** — which must land **within ≤1 short scroll**. Renders shrink before
the score does. Figures still face inward; embers reduced; seam kept (cheap, high
impact). Tap targets ≥44px.

---

## 4. DESIGN SYSTEM

### 4.1 Palette (exact hex + semantic tokens)

Tokens already live in `globals.css` `@theme` and are correct — **keep the
names** (Phase-8 surfaces depend on them). This is the canonical table; values
match the file. Additions are flagged **NEW**.

**Brand / rivalry**

| Token | Hex | Use |
|---|---|---|
| `--color-ronaldo` | `#e2103b` | Ronaldo lead (scarlet) |
| `--color-ronaldo-bright` | `#ff1b2d` | Ronaldo neon / hover |
| `--color-ronaldo-soft` | `rgba(226,16,59,.18)` | Ronaldo tint fills |
| `--color-ronaldo-accent` | `#0e6b4f` | Portugal green (crest only) |
| `--color-messi` | `#2c63db` | Messi lead (azure) |
| `--color-messi-bright` | `#3a82ff` | Messi neon / hover / focus ring |
| `--color-messi-soft` | `rgba(44,99,219,.18)` | Messi tint fills |
| `--color-messi-accent` | `#9e1b46` | Barça garnet (crest only) |
| `--color-gold` | `#f5b43c` | brand / crown / "win" / VS / wordmark |
| `--color-gold-bright` | `#ffd75e` | gold highlight / hover |

**Surfaces / text** (unchanged)

| Token | Hex | Use |
|---|---|---|
| `--color-bg-base` | `#070b16` | page base |
| `--color-bg-elevated` | `#0c1322` | raised solid panels |
| `--color-stadium-navy` | `#0a1020` | arena backdrop base |
| `--color-surface` | `rgba(255,255,255,.04)` | glass fill |
| `--color-surface-strong` | `rgba(255,255,255,.07)` | glass fill (emphasis) |
| `--color-border-glass` | `rgba(255,255,255,.10)` | glass hairline |
| `--color-border-strong` | `rgba(255,255,255,.18)` | divider / focus border |
| `--color-text` | `#f8fafc` | primary text |
| `--color-text-secondary` | `#9aa7bd` | labels / secondary |
| `--color-text-muted` | `#64748b` | trust line / fine print |
| `--gold-hairline` **NEW** | `rgba(245,180,60,.45)` | gold top-edge on hero panels |

**Contrast (AA) guarantees:** `#f8fafc` on `#070b16` ≈ 17:1 (AAA). `#9aa7bd` on
base ≈ 7.4:1 (AAA). `#64748b` (muted) on base ≈ 4.6:1 (AA — fine print only,
never a primary label). Accent **text** must clear 4.5:1: `--color-ronaldo` on
base ≈ 4.9:1 ✓, `--color-messi` on base ≈ 4.6:1 ✓ — **but** prefer the `-bright`
variants for *small* accent text, and never put accent text on an accent fill.
Gold `#f5b43c` on base ≈ 9.6:1 ✓.

### 4.2 Typography — Bebas Neue (display) + Inter (body)

Approved fonts from ref3's style guide, already imported in `globals.css`. Bebas
ships **one weight** — hierarchy comes from **size + tracking**, never
`font-weight` (the `.font-display` helper enforces this). Inter carries weight.

**Type scale** (px / rem · weight · tracking · line-height · font):

| Role | Size | Weight | Tracking | LH | Font |
|---|---|---|---|---|---|
| Hero wordmark "GOAT ARENA" | `clamp(2.5rem, 6vw, 5rem)` / 40–80px | 400 | `.04em` | 0.95 | Bebas |
| Verdict score "N — M" | `clamp(3rem, 8vw, 7rem)` / 48–112px | 400 | `.01em` | 0.9 | Bebas |
| Player name | `clamp(1.5rem, 3.4vw, 2.5rem)` / 24–40px | 400 | `.03em` | 1.0 | Bebas |
| Section / "FINAL VERDICT" | `1.5rem` / 24px | 400 | `.12em` (caps) | 1.1 | Bebas |
| Stat figure (bars) | `1.5–2rem` / 24–32px | 700 | `0` | 1.0 | **Inter** `.tabular` |
| Category row label | `1rem` / 16px | 600 | `.01em` | 1.3 | Inter |
| Body / verdict prose | `1rem` / 16px | 400 | `0` | 1.55 | Inter |
| Button label | `0.9375rem` / 15px | 700 | `.04em` (caps) | 1 | Inter |
| Micro-label / "Categories won" | `0.75rem` / 12px | 600 | `.10em` (caps) | 1.2 | Inter |
| Trust line / fine print | `0.75rem` / 12px | 400 | `.01em` | 1.4 | Inter `--text-muted` |

**Rules:** display/headlines = Bebas; all numbers in stats/score = **Inter 700
`.tabular`** (Bebas digits read poorly for data — confirmed by ref's stat rows
which use a normal sans for figures). H1:body ratio ≥ 5:1 (hero 80px : 16px = 5:1
✓). Caps + tracking for all Bebas labels.

### 4.3 Spacing rhythm

4px base unit. Scale: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`. Section gaps
**≥48px** (per skill's "large sections"). Card inner padding 16–24px. Mobile
section gaps 24–32px. Touch targets ≥44px. Content max-width 1200px; hero is
full-bleed.

### 4.4 Numerals

All figures: `.tabular` (`font-variant-numeric: tabular-nums`) +
`Intl.NumberFormat` for thousands (`890`, `1,234`, `67.3%`). Already have
`.tabular`; apply it everywhere a number appears so columns align and count-ups
don't jitter.

### 4.5 Radius

| Token | px | Use |
|---|---|---|
| `--radius-sm` | 8 | chips, checkboxes, small controls |
| `--radius-md` | 14 | buttons, category rows, inputs |
| `--radius-lg` | 22 | glass panels, score band, sheet |
| `--radius-xl` | 28 | hero containers / large cards |

(All exist. The **share card** uses its own angular FUT silhouette — §6.2 — not
these radii.)

### 4.6 Glow & shadow scale

| Token | Value | Use |
|---|---|---|
| `--shadow-glass` | `0 8px 32px rgba(0,0,0,.45)` | base panel lift |
| `--shadow-hero` | (3-stop deep stack, existing) | hero/score band float |
| `--shadow-glow-ronaldo` | `0 0 24px rgba(226,16,59,.5)` | red halo |
| `--shadow-glow-messi` | `0 0 24px rgba(44,99,219,.5)` | blue halo |
| `--shadow-glow-gold` | `0 0 24px rgba(245,180,60,.5)` | gold halo / CTA |
| `--glow-cta` **NEW** | `0 0 0 1px var(--gold-hairline), 0 8px 24px rgba(245,180,60,.35), 0 0 40px rgba(245,180,60,.22)` | the primary Share CTA accent glow (skill: "accent glow behind primary button") |
| `--text-glow-gold` (class) | `text-shadow: 0 0 18px rgba(245,180,60,.45)` | gold headline self-glow |

**Glow discipline (skill: minimal/sparingly):** glow is reserved for the
**wordmark, the VS, the verdict numbers, the leader crown, and the primary CTA**.
Body text, labels, category rows get **none**. This restraint is what keeps it
premium instead of "neon soup".

### 4.7 Glassmorphism spec

Two tiers, both already in `globals.css` — codified:

- **`.glass`** (light): `background var(--color-surface)`, `1px
  --color-border-glass`, `backdrop-filter: blur(16px)`, `--shadow-glass`. Use:
  small chips, the trust strip.
- **`.glass-panel`** (premium): gradient fill (top-light → bottom-dark),
  `backdrop-filter: blur(22px) saturate(140%)`, **inset top highlight**
  `inset 0 1px 0 rgba(255,255,255,.12)` + **inset base darkening**, `--radius-lg`.
  Use: score band, category list container, control rail, share sheet, player
  panels. (Skill glassmorphism checklist: blur 10–20px ✓ here 16–22, translucent
  0.04–0.07 ✓, 1px light border ✓, light-source top reflection ✓, verify 4.5:1 —
  text sits on the dark-biased lower half, contrast holds.)

> **Performance:** cap concurrent `backdrop-filter` panels; the atmosphere layer
> is plain gradients (no blur). One big blur for the hero atmosphere haze is fine;
> don't stack blurs.

---

## 5. MOTION LANGUAGE

Premium = **choreographed restraint**. Skill rule: *animate 1–2 key elements per
view; respect reduced-motion; 200–300ms.* The signature beat is the **entrance
clash → verdict reveal**; everything else is micro-feedback.

### 5.1 Tokens

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | the standard "expo-out" for entrances/popovers (matches existing `.neon-popover`) |
| `--ease-spring` | spring `damping:20 stiffness:90` (Framer) | the VS pop, score band settle |
| `--dur-fast` | 150ms | hover/press feedback |
| `--dur-base` | 240ms | most transitions, sheet open |
| `--dur-slow` | 420ms | hero entrance pieces |
| `--dur-count` | 900ms | number count-up |

### 5.2 Entrance choreography (hero, on load / first in-view)

A single staged sequence (stagger ~80ms), `--ease-out`:

1. **Atmosphere** fades in (0ms, opacity only).
2. **Ronaldo render** slides in from the left edge (`translateX(-24px)+fade`),
   **Messi** from the right — they *arrive into the confrontation* (`--dur-slow`).
3. **VS medallion** pops (scale `.6 → 1.04 → 1`, `--ease-spring`) with a one-shot
   `vs-flash` + the shockwave's first pulse — the "clash" beat.
4. **Score band** rises (`translateY(16px)+fade`) and the **numbers count up**.
5. **Category list** rows stagger in (40ms each, `translateY(8px)+fade`).
6. **Share CTA** fades last with its gold glow easing on.

This is the "poster comes alive" moment. Total ~1.1s. One sequence, not a zoo.

### 5.3 VS energy (continuous, subtle)

`.vs-shockwave` slow pulse (2.6s loop) + `.vs-seam` static glow + optional
floodlight breathe. All gated by reduced-motion. No other looping animation
anywhere.

### 5.4 Count-up

Verdict numbers and the headline stat figures animate from 0 → value over
`--dur-count`, `--ease-out`, **once** on entrance / when the value changes
(category toggle recompute → quick 400ms re-count). Reduced-motion → final value
instantly. Always `.tabular` so width never shifts.

### 5.5 Hover / press

- **Hover** (pointer devices): category row → surface lifts to
  `--color-surface-strong` + 1px border brightens, 150ms; player render → inward
  rim-light intensifies + faint `--shadow-glow-{side}`, 240ms; CTA → gold glow
  intensifies + `translateY(-1px)`.
- **Press** (all): `transform: scale(.97)`, 120ms (skill cinema-dark rule).
- **Focus-visible**: `outline: 2px solid var(--color-ring); outline-offset: 2px`
  on every interactive element — **never** removed (AA keyboard nav).
- All clickable elements: `cursor: pointer`.

### 5.6 Page / sheet transitions + reduced-motion contract

- **Share sheet:** scrim fades (240ms); panel — desktop: scale `.97→1`+fade from
  center; mobile: **slides up** from the bottom (`translateY(100%)→0`, `--ease-out`,
  280ms). Focus-trapped; Esc/scrim/X close; focus restored (already implemented).
- **Category expand:** height/opacity reveal in place, 240ms `--ease-out` (no
  layout jump — animate a wrapper's grid-rows/`max-height`+opacity).
- **Reduced-motion (`@media (prefers-reduced-motion: reduce)`):** all entrances
  become instant fades or no-ops; count-ups show final; embers hidden; shockwave
  frozen to a static ring; floodlight breathe off; sheet appears without
  slide/scale. (The global reduce block in `globals.css` already neutralizes
  durations — extend it to cover the new ember/shockwave/breathe classes.)

> **PNG determinism:** the share-card render path (`src/app/render/*`,
> `/render/card`) must contain **zero** of the above — it is rendered headless for
> the PNG. Any clash/glow there must be **static gradients/shadows only** (the
> `animated` prop pattern from card-animations stays OFF for the render route).

---

## 6. PER-SCREEN ART DIRECTION

### 6.1 Screen 1 — Verdict Arena (`/`) — dresses the wireframe's Screen 1

The whole product. Top→bottom (hierarchy = UX.md §4):

**A. Top bar.** Left: **"GOAT ARENA"** wordmark — Bebas, "GOAT" in
gold (`--color-gold`→`--color-gold-bright` gradient text) with `.text-glow-gold`,
"ARENA" in light `--color-text` with wide tracking (mirror ref1's gold/silver
wordmark). Right: a single quiet element only (no nav menu — the IA has 2 routes;
do **not** resurrect the ref's `COMPARE / STATS / CAREERS…` nav, that's skeleton
not soul). Below: the **trust line** in `--text-muted` 12px: "Accurate as of
{date} · club & country, all competitions · by category, never 'X is better'".

**B. The clash hero** (§3). Full-bleed. Two full-height duotone renders facing the
central VS energy clash; the **verdict score band** overlaps lower-center. This is
the above-the-fold answer. Player name·club·flag sits at the **base** of each
render on a faint glass chip (Bebas name + Inter caps club + flag svg), tinted the
player's accent. Tapping a render/name → `/player/[id]` (off-path).

**C. Category breakdown** (the evidence). A `.glass-panel` container. Header row:
"CATEGORY BREAKDOWN" (Bebas caps) on the left; the **Show/Hide winner toggle** on
the right (a glass pill switch, gold when ON). Then one row per category
(Goals, Assists, Trophies, Ballon d'Or, Champions League, World Cup, Playmaking,
Longevity):

- **Collapsed row:** `[count checkbox] · category-icon · LABEL · Ronaldo value
  ——bar—— Messi value · leader-marker`. The **dual stat bar** is the ref's
  signature: a single track split center, Ronaldo red fill growing **left→center**,
  Messi blue fill growing **center→right**, the larger value's fill brighter +
  faint accent glow; values in Inter 700 `.tabular`, each side its accent color;
  a small gold leader-marker (▲ / crown) on the winning side. Icons: **Lucide
  SVG**, never emoji (skill checklist).
- **Expanded (tap label):** the wrapper reveals sub-metric rows (career · intl ·
  league · UCL · conversion) each as a mini dual-bar with per-metric leader. 240ms
  `--ease-out` height+opacity. Tap again collapses. (Wireframe `BreakdownRow`
  `expanded` → this.)
- **Count checkbox:** include/exclude → live recompute of the score band (quick
  re-count §5.4) + update `?cats=`. Excluded rows dim to ~50% with a strike on the
  bar. Min-count fallback per UX.md.

**D. Winner toggle behavior.** ON (default): score, crowns, leader-markers, accent
emphasis all visible. OFF: neutral mode — hide score language/crowns/leaders, bars
become **neutral gold/white**, score band shows numbers only ("RONALDO N · M
MESSI" with no "wins", no crown). Mirrors `showWinner`; flows into the share card.

**E. Share — the single primary CTA.** Full-width on mobile, prominent on desktop,
**directly under the verdict**. Gold-filled (gradient `--color-gold` →
`--color-gold-bright`), navy text for contrast (gold-on-navy is the inverse; navy
`#070b16` on gold ≈ 9.6:1 ✓), Bebas/Inter-caps label **"SHARE VERDICT"** + a
Lucide share icon, `--glow-cta` accent glow, press scale .97. It is the only gold
**solid** button on the page (everything else is glass/ghost), so it's
unmistakably *the* action.

**F. Footer.** Quiet: the wordmark mark + the watermark note (SPEC §3 — every card
carries the logo). `--text-muted`.

**Desktop vs mobile:** desktop = 3-column clash with score band overlapping
center, breakdown full-width below, toggle+CTA grouped under the verdict. Mobile =
stacked per §3.6; score within ≤1 short scroll; rows full-width ≥44px; CTA
full-width, fires Web-Share where available.

### 6.2 Share Sheet — and channeling ref2's FUT energy into the card output

**The sheet** (modal over `/`, focus-trapped). Backdrop: the dimmed arena +
heavier scrim. The sheet is a `.glass-panel`, `--radius-lg`, `--shadow-hero`,
gold top-hairline. Desktop: preview left, controls right. Mobile: full-width,
**slides up from bottom**, preview on top, controls below (single column).

- **Live card preview:** the *real* share-card component (the PNG output),
  scaled, reflecting current `cats` + `showWinner`. Has a loading state for the
  async PNG.
- **Editable caption:** prefilled ("Messi wins 5–3 by categories — who's the
  GOAT? #MessiVsRonaldo …" or neutral), Inter, glass input, gold focus ring.
- **Primary: "DOWNLOAD PNG"** — same gold CTA treatment as Screen 1's Share
  (consistency). Loading → success / inline error+retry.
- **Targets row:** Native/Web-Share · X · Copy-link (→ `/?share=1&cats=…`) — glass
  ghost buttons with Lucide icons; "Copied" transient confirm.
- Close: X (top-right) / Esc / scrim.

**Channeling FUT energy (the boss's explicit ask) — INTO the share card, not as a
screen.** `/cards` is cut; ref2's collectible-card *energy* is reflected in the
**share-card output** so the viral artifact carries it:

- **Format:** vertical ~2:3 (SPEC §2 — Stories/Telegram/X), dark stadium
  background (same atmosphere recipe, *static* — no motion, per PNG determinism).
- **Two figures + central gold VS** echoing ref2: the same duotone renders
  (red/gold Ronaldo, blue Messi) facing a gold VS, on a deep navy field with the
  red↔blue tension and a gold energy seam (static).
- **FUT cues, tastefully:** a **gold-trimmed angular frame** around the card edge
  (the `--gold-hairline` + a subtle beveled gold border — *evoke* ref2's
  chamfered card without the literal FIFA octagon clip; the existing
  `.fut-card-shape` clip-path is available if a stronger nod is wanted, but keep it
  classy, "a light nod not the focus" per UX.md). Gold corner flourishes; the
  CompareGOATs gold wordmark top; tabular stat rows with dual red/blue bars; the
  big gold **"N — M"** score + "CATEGORIES WON"; a crown by the leader (hidden in
  neutral mode); source/"accurate as of" footer + watermark.
- **Result:** the card *looks like* a premium FUT collectible (gold, angular,
  dramatic renders, score) but its numbers are **real & neutral** — exactly the
  moat (SPEC §1: prettiest card + neutral facts). The FUT soul ships where it
  actually goes viral.

### 6.3 Player Profile (`/player/[id]`) — off-path, calmer

Dress the wireframe's Screen 2 but **dial the drama down** — this is reference
reading, not the arena. Same atmosphere base but **quieter** (fewer/no embers,
gentler floodlights, no VS, no shockwave). One large duotone render of *that*
player as a hero strip (single side accent), then identity header (Bebas name +
Inter meta), then `.glass-panel` blocks: career totals, competition breakdown,
season-by-season table (`.tabular`, dual not needed — single player), honours.
Calm spacing, no count-up theatrics (or a single subtle one on the hero totals).
Clear **"◀ Back to Arena"** ghost button top-left. No primary gold CTA here (it's
a leaf, not a conversion screen) — keeps the gold Share button meaning singular.

### 6.4 Demoted `/cards` — kept off-path / out of nav (a light nod)

Per UX.md the FUT battle screen is **cut from the spine and out of nav**. If a
route is kept at all, it is an **unlinked, off-path** light nod (not in any nav,
not in the flow); its real energy now lives in the share card (§6.2). Do **not**
add nav entries, home CTAs, or flow steps pointing to it. It is "a light nod, not
the focus" — treat it as deprecated decoration, never a destination the IA relies
on.

---

## 7. DEFINITION OF DONE / VIBE CHECKLIST (for Visual QA / Pixel-Critic)

Judge `/` and `/player/[id]` + Share sheet at desktop 1440 **and** true mobile
390 (CDP), motion ON, against `design-refs/`. **PASS only at 0 defects.** "Soul"
means:

**Atmosphere (vs ref1)**
- [ ] Background reads as a **floodlit stadium** with depth — floodlight cones
      from the top corners, a gold crown-glow center-top, a red/blue floor wash,
      a corner vignette, and **visible film-grain** (no flat dashboard, no banding).
- [ ] Base is **navy, never pure black**; embers drift (motion ON) and vanish
      under reduced-motion.

**Render-clash (vs ref1/ref2 — the headline)**
- [ ] Two **large, near-full-height duotone renders**, bleeding off the outer
      edges, **facing inward** toward the center (NOT small photos in boxes).
- [ ] Ronaldo = warm red/gold duotone; Messi = cool blue; inner edges **dissolve**
      into the stadium (no hard photo box); inward rim-lights catch the clash.
- [ ] A real **energy clash** at center: gold VS medallion + shockwave + a lit
      **red↔blue seam** (an *event*, not a flat badge on a bloom).
- [ ] Fallback verified: where a portrait can't fill height it crops chest-up /
      falls back to a duotone silhouette — **never** a tiny boxed photo.

**Verdict / hierarchy (vs UX.md)**
- [ ] The **score is the hero**, above the fold, at the clash; count-up on entrance.
- [ ] On mobile the score is reachable in **≤1 short scroll**; renders shrink first.
- [ ] Dual red/blue stat bars present; leader crown only on the winner; Hide-winner
      → genuine neutral mode (no score language, neutral bars).

**System / polish**
- [ ] Bebas Neue for all display/score; **Inter 700 `.tabular`** for every number;
      H1:body ≥ 5:1; tracking applied to Bebas caps.
- [ ] Glow used **only** on wordmark / VS / score / crown / CTA — body text clean.
- [ ] Exactly **one solid gold CTA** ("SHARE VERDICT") on `/`; everything else
      glass/ghost; `--glow-cta` behind it.
- [ ] Glass panels show the top inner-highlight + depth (not flat translucent
      rectangles); section gaps ≥48px desktop.
- [ ] All icons are **Lucide SVG** (no emoji); `cursor:pointer` on all clickables;
      hover transitions 150–300ms; press scale .97.

**Share card (FUT energy, vs ref2)**
- [ ] The **share-card output** reads as a premium FUT-style collectible — gold
      angular frame, two duotone figures + gold VS, big "N — M" score — but with
      **real, neutral** numbers. Energy of ref2 is present **in the card**, not as
      a separate screen.

**Accessibility / determinism (non-negotiable)**
- [ ] AA text contrast everywhere (accent text ≥4.5:1; muted only for fine print).
- [ ] `prefers-reduced-motion`: entrances instant, count-ups final, embers off,
      shockwave frozen, sheet no-slide — and **still looks like a poster**.
- [ ] Visible `:focus-visible` ring on every interactive element; sheet
      focus-trapped, Esc/scrim/X close, focus restored.
- [ ] `/render/*` (share-card PNG path) contains **zero animation** — static
      gradients/shadows only (PNG determinism).

> **The one-line test:** screenshot `/` next to `design-refs/ref1`. If a stranger
> can't tell which is the reference and which is ours — *because both are floodlit
> arenas with two dramatic duotone fighters colliding over a gold VS and a verdict
> score* — the soul is in. If ours still looks like a dark form with photos in
> boxes, it's not done.
