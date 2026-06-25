import type { CSSProperties } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wireframe — CompareGOATs UX (Phase 10)",
  robots: { index: false, follow: false },
};

/**
 * BARE WIREFRAME (Phase 10, Agent A) — a skeleton for the manager to screenshot
 * and judge STRUCTURE, not visuals. Deliberately ugly on purpose: neutral system
 * sans, greys/white only, light-grey boxes with thin borders + black labels. NO
 * brand fonts/colors/images/icons/gradients. It imports nothing from the brand
 * codebase and uses inline styles only, so it can never drag brand styling in or
 * break the build. It renders every screen in the minimal set (UX.md §3): each
 * screen shows BOTH a desktop column-layout block and a mobile stacked block,
 * with interactions annotated inline. Self-contained static server component.
 */

// ---- primitive style tokens (greyscale only) -------------------------------
const PAGE: CSSProperties = {
  fontFamily:
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  color: "#111",
  background: "#fafafa",
  padding: "32px 24px 80px",
  lineHeight: 1.4,
};
const BOX: CSSProperties = {
  border: "1px solid #b3b3b3",
  background: "#ececec",
  color: "#111",
  borderRadius: 4,
  padding: "10px 12px",
  fontSize: 13,
};
const NOTE: CSSProperties = {
  fontSize: 11,
  color: "#444",
  fontStyle: "italic",
  marginTop: 4,
};
const MOBILE_FRAME: CSSProperties = {
  width: 390,
  border: "2px solid #888",
  borderRadius: 12,
  background: "#fff",
  padding: 12,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};
const DESKTOP_FRAME: CSSProperties = {
  width: 1100,
  maxWidth: "100%",
  border: "2px solid #888",
  borderRadius: 8,
  background: "#fff",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

/** A labelled grey block. `h` sizes it to convey hierarchy/proportion. */
function Block({
  label,
  h,
  note,
  style,
}: {
  label: string;
  h?: number;
  note?: string;
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          ...BOX,
          ...style,
          minHeight: h,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        {label}
      </div>
      {note ? <div style={NOTE}>{note}</div> : null}
    </div>
  );
}

function Row({
  children,
  cols,
  gap = 12,
}: {
  children: React.ReactNode;
  cols: string;
  gap?: number;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, gap, alignItems: "stretch" }}>
      {children}
    </div>
  );
}

function ScreenHeading({ n, title, sub }: { n: string; title: string; sub: string }) {
  return (
    <div style={{ marginTop: 48, marginBottom: 12, borderBottom: "2px solid #111", paddingBottom: 6 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
        {n} — {title}
      </h2>
      <p style={{ margin: "4px 0 0", fontSize: 13, color: "#333" }}>{sub}</p>
    </div>
  );
}

function ColLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#555", margin: "6px 0 4px" }}>
      {children}
    </div>
  );
}

// ---- breakdown row helper (reused desktop + mobile) ------------------------
// `byLeague` shows the BOSS-NOTES §3 league-split: a STATIC labelled group inside
// the already-open panel (NOT a second expander) — one row per named league, both
// values + a per-league leader marker (read-only; never recomputes the verdict).
function LeagueRow({ league }: { league: string }) {
  return (
    <div style={{ ...BOX, display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 8, alignItems: "center", fontSize: 12, background: "#f5f5f5" }}>
      <span style={{ textAlign: "left" }}>{league}</span>
      <span>val</span>
      <span style={{ color: "#777" }}>·</span>
      <span>val · [ leader ]</span>
    </div>
  );
}

function BreakdownRow({ name, expanded, byLeague }: { name: string; expanded?: boolean; byLeague?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ ...BOX, display: "grid", gridTemplateColumns: "16px 1fr auto auto", gap: 8, alignItems: "center" }}>
        <span style={{ border: "1px solid #999", width: 14, height: 14, display: "inline-block", borderRadius: 3 }} title="count toggle" />
        <span style={{ textAlign: "left" }}>[ {name} ]</span>
        <span>val · val</span>
        <span>[ leader ]</span>
      </div>
      {expanded ? (
        <div style={{ marginLeft: 24, display: "flex", flexDirection: "column", gap: 6 }}>
          <Block label="[ sub-metrics: career · international · UCL · conversion → both values + per-metric leader ]" h={44} />
          {byLeague ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <ColLabel>By league — BOSS-NOTES §3 (static group inside the open panel — read-only evidence, no extra tap)</ColLabel>
              <LeagueRow league="Premier League" />
              <LeagueRow league="La Liga" />
              <LeagueRow league="Serie A" />
              <LeagueRow league="Ligue 1" />
              <LeagueRow league="Primeira Liga · MLS · Saudi Pro League" />
              <div style={NOTE}>each league: both values + a per-league leader marker · tallies into NOTHING (verdict stays the aggregate score) · neutral mode hides markers</div>
            </div>
          ) : null}
          <div style={NOTE}>↑ tap row to expand/collapse in place (progressive disclosure — no navigation). League-split rides this SAME expand — 1 tap from landing, no new control.</div>
        </div>
      ) : null}
    </div>
  );
}

export default function WireframePage() {
  return (
    <div style={PAGE}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>CompareGOATs — Bare Wireframe (Phase 10)</h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "#333", maxWidth: 760 }}>
          Skeleton only — no color, fonts, images or icons. Grey boxes = blocks; black text = labels; italics =
          interaction notes. Minimal set per design/UX.md: <strong>2 screens + 1 share sheet</strong>. Cut from Phase 9:
          <strong> /compare</strong> (merged inline), <strong>/verdict</strong> (merged into /), <strong>/cards</strong> (removed).
          Primary &ldquo;settle + share&rdquo; path = <strong>2 taps</strong> from cold landing (reading the verdict = 0 taps).
        </p>
      </header>

      {/* ===================== SCREEN 1 ===================== */}
      <ScreenHeading
        n="SCREEN 1"
        title="Verdict Arena ( / )  — does the whole job"
        sub="Landing = the answer. Renders + VS + score-by-categories above the fold, breakdown, winner toggle, one Share CTA."
      />

      <ColLabel>Desktop — 1440 (3-column clash)</ColLabel>
      <div style={DESKTOP_FRAME}>
        <Block label="[ trust line: 'Accurate as of {date} · {scope}' · 'by N categories, never X is better' ]" h={28} />

        {/* clash header: A | VS+score | B */}
        <Row cols="1fr 0.9fr 1fr">
          <Block label="[ Player A render ]&#10;name · club · flag" h={220} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Block label="[ VS ]" h={70} />
            <Block
              label="[ VERDICT: RONALDO  N — M  MESSI ]&#10;'M categories won'"
              h={130}
              note="THE ANSWER — zero clicks, above the fold"
              style={{ background: "#dcdcdc", fontWeight: 700 }}
            />
          </div>
          <Block label="[ Player B render ]&#10;name · club · flag" h={220} />
        </Row>

        <Row cols="1fr auto">
          <Block label="[ category breakdown — heading ]" h={30} style={{ background: "#f3f3f3" }} />
          <Block label="[ ⌧ Show / Hide winner toggle ] (default ON)" h={30} note="OFF → neutral, numbers-only" />
        </Row>

        <BreakdownRow name="Goals" expanded byLeague />
        <BreakdownRow name="Assists" />
        <BreakdownRow name="Trophies" />
        <BreakdownRow name="Ballon d'Or" />
        <Block label="[ … Champions League · World Cup · Playmaking · Longevity ]" h={34} />
        <div style={NOTE}>each row: [count toggle] include/exclude → recompute score + update ?cats= · tap label → expand sub-metrics</div>

        <Row cols="1fr">
          <Block
            label="[ ► SHARE VERDICT ]  (single primary CTA)"
            h={52}
            note="tap → opens Share Sheet (Scenario A step 1 of 2)"
            style={{ background: "#cfcfcf", fontWeight: 700 }}
          />
        </Row>
        <div style={NOTE}>player name / render → /player/[id] (optional, off-path) · deep link /?cats=… &amp; /?share=1 restore state</div>
      </div>

      <ColLabel>Mobile — ~390 (stacked; score reachable in ≤1 short scroll)</ColLabel>
      <div style={MOBILE_FRAME}>
        <Block label="[ trust line (compact) ]" h={22} />
        <Block label="[ Player A render ]" h={120} note="renders shrink before the score does" />
        <Block label="[ VS ]" h={40} />
        <Block label="[ Player B render ]" h={120} />
        <Block
          label="[ VERDICT: RON  N — M  MESSI ]&#10;'M categories won'"
          h={96}
          style={{ background: "#dcdcdc", fontWeight: 700 }}
          note="THE ANSWER — keep above ~1 scroll"
        />
        <Block label="[ ⌧ Show / Hide winner ] (full width, ≥44px)" h={40} />
        <Block label="[ category breakdown heading ]" h={26} style={{ background: "#f3f3f3" }} />
        <BreakdownRow name="Goals" expanded byLeague />
        <BreakdownRow name="Assists" />
        <Block label="[ … remaining categories, full-width rows, tap to expand ]" h={40} />
        <Block
          label="[ ► SHARE VERDICT ] full-width primary"
          h={50}
          style={{ background: "#cfcfcf", fontWeight: 700 }}
          note="tap → Share Sheet (or native Web-Share where available)"
        />
      </div>

      {/* ===================== SHARE SHEET ===================== */}
      <ScreenHeading
        n="SHARE SHEET"
        title="Modal over /  — the terminal action (NOT a route)"
        sub="The exit of the only job. Single-sourced (opened only from Screen 1). Step 2 of the 2-tap settle+share path."
      />

      <ColLabel>Desktop — 1440 (preview left, controls right)</ColLabel>
      <div style={{ ...DESKTOP_FRAME, background: "#f0f0f0", border: "2px dashed #888" }}>
        <div style={NOTE}>— rendered as a focus-trapped dialog over a dimmed Screen 1 (Esc / scrim / X to close, focus restored) —</div>
        <Row cols="auto 1fr 40px">
          <Block label="[ LIVE card preview ]&#10;the real share-card, scaled&#10;(reflects current cats + winner toggle)" h={300} style={{ width: 220 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Block label="[ editable caption — prefilled winner+score / neutral + hashtags ]" h={70} />
            <Block label="[ ☐ Add 'by league' line ] (default OFF — BOSS-NOTES §3)" h={34} note="one fixed-height fact band: 'Scored in every league — PL · La Liga · Serie A · …' → ?league=1 · deterministic PNG, no per-league numbers on card" />
            <Block label="[ ► DOWNLOAD PNG ] (primary export — MVP)" h={48} style={{ background: "#cfcfcf", fontWeight: 700 }} note="loading → success (file) / inline error + retry" />
            <Row cols="1fr 1fr 1fr">
              <Block label="[ Native / Web-Share ]" h={40} />
              <Block label="[ X / post ]" h={40} />
              <Block label="[ Copy link ]" h={40} note="→ /?share=1&amp;cats=…" />
            </Row>
          </div>
          <Block label="[ X ]" h={40} note="close" />
        </Row>
      </div>

      <ColLabel>Mobile — ~390 (full-width sheet, single column: preview on top)</ColLabel>
      <div style={{ ...MOBILE_FRAME, background: "#f0f0f0", border: "2px dashed #888" }}>
        <Block label="[ X close ]" h={28} />
        <Block label="[ LIVE card preview (scaled) ]" h={220} />
        <Block label="[ editable caption + hashtags ]" h={56} />
        <Block label="[ ► DOWNLOAD PNG ] full-width primary" h={48} style={{ background: "#cfcfcf", fontWeight: 700 }} />
        <Row cols="1fr 1fr 1fr">
          <Block label="[ Share ]" h={40} />
          <Block label="[ X ]" h={40} />
          <Block label="[ Copy ]" h={40} />
        </Row>
      </div>

      {/* ===================== SCREEN 2 ===================== */}
      <ScreenHeading
        n="SCREEN 2"
        title="Player Profile ( /player/[id] )  — optional depth, OFF-PATH"
        sub="A leaf off Screen 1 (tap a player). Never in the settle+share spine. Read-only. Predictable back to /. First candidate to cut for absolute minimum."
      />

      <ColLabel>Desktop — 1440</ColLabel>
      <div style={DESKTOP_FRAME}>
        <Block label="[ ◀ back to / ]" h={28} style={{ width: 160 }} note="predictable back; never blocks main flow" />
        <Block label="[ Player identity header — name · club · position · flag ]" h={70} />
        <Row cols="1fr 1fr">
          <Block label="[ Career totals ]" h={110} />
          <Block label="[ Competition breakdown ]" h={110} />
        </Row>
        <Block label="[ Season-by-season output (table/list) ]" h={150} />
        <Block label="[ Honours ]" h={80} />
      </div>

      <ColLabel>Mobile — ~390 (stacked)</ColLabel>
      <div style={MOBILE_FRAME}>
        <Block label="[ ◀ back to / ]" h={28} />
        <Block label="[ Player identity header ]" h={60} />
        <Block label="[ Career totals ]" h={90} />
        <Block label="[ Competition breakdown ]" h={90} />
        <Block label="[ Season-by-season (scrollable) ]" h={140} />
        <Block label="[ Honours ]" h={70} />
      </div>

      {/* ===================== CUT ===================== */}
      <ScreenHeading
        n="CUT FROM PHASE 9"
        title="Removed / merged — what is gone and why"
        sub="Shown as crossed-out skeletons so the manager can see the reduction explicitly."
      />
      <div style={DESKTOP_FRAME}>
        <Block
          label="✕ /compare (category picker screen)"
          h={40}
          style={{ background: "#f4f4f4", textDecoration: "line-through", color: "#777" }}
          note="MERGED inline into Screen 1 (per-row count toggles). Was a gate in front of the verdict; default = all categories on."
        />
        <Block
          label="✕ /verdict (separate result page)"
          h={40}
          style={{ background: "#f4f4f4", textDecoration: "line-through", color: "#777" }}
          note="MERGED into / — the payoff now IS the landing. ?cats= deep link preserved on /."
        />
        <Block
          label="✕ /cards (FUT collectible battle)"
          h={40}
          style={{ background: "#f4f4f4", textDecoration: "line-through", color: "#777" }}
          note="REMOVED. Cosmetic non-real ratings dilute 'neutral by facts' and fork Share 3 ways. Card energy → the share-card output instead."
        />
      </div>
    </div>
  );
}
