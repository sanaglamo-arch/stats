import { PLAYER_META } from "@/components/card/player-meta";
import { CATEGORY_ICONS } from "@/components/arena/arena-icons";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { SHARE_HEIGHT, SHARE_WIDTH } from "./share-dimensions";
import type { ShareCategoryLine, ShareModel } from "./share-model";

/**
 * The downloadable SHARE CARD (P9-6) — a compact social-format verdict card
 * (portrait 1080×1350), per ref3 screen 6 + the small "MESSI WINS 5-3" cards.
 * Pure presentational + deterministic (no hooks/RNG/clock, static <img>), so it
 * renders identically in the modal preview and in the headless PNG route.
 *
 * Layout (fixed bands so nothing collides regardless of winner/neutral state):
 *   crown wordmark → two players (duotone + nation) → WINNER banner + score →
 *   category-result list → brand/hashtag footer.
 *
 * `showWinner=false` → neutral card: no crown banner / no score, the category
 * list shows just the two numbers (no winner highlight).
 */
export function ShareCard({ model, t }: { model: ShareModel; t: Dictionary }) {
  const { showWinner, winner } = model;
  const accentVar =
    winner === "ronaldo"
      ? "--color-ronaldo-bright"
      : winner === "messi"
        ? "--color-messi-bright"
        : "--color-gold";
  const accent = `var(${accentVar})`;

  return (
    <div
      id="share-root"
      className="font-[family-name:var(--font-sans)] relative grid overflow-hidden text-[var(--color-text)]"
      style={{
        width: SHARE_WIDTH,
        height: SHARE_HEIGHT,
        gridTemplateRows: "auto auto auto minmax(0,1fr) auto",
        rowGap: 40,
        padding: 64,
        background:
          "radial-gradient(820px 620px at 0% -6%, color-mix(in srgb, var(--color-ronaldo) 26%, transparent), transparent 56%)," +
          "radial-gradient(820px 620px at 100% 106%, color-mix(in srgb, var(--color-messi) 26%, transparent), transparent 56%)," +
          "radial-gradient(1000px 1000px at 50% 40%, rgba(255,255,255,0.04), transparent 60%)," +
          "var(--color-bg-base)",
      }}
    >
      {/* premium inner hairline frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-5 rounded-[var(--radius-xl)]"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      />

      {/* Brand wordmark */}
      <header className="flex items-center justify-center gap-4">
        <CrownMark />
        <span
          className="font-[family-name:var(--font-display)] text-[42px] font-bold uppercase leading-none tracking-[0.16em]"
          style={{ color: "var(--color-gold-bright)", textShadow: "var(--shadow-glow-gold)" }}
        >
          {t.appName}
        </span>
      </header>

      {/* Two players */}
      <section className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
        <PlayerHead id="ronaldo" align="left" t={t} />
        <span
          className="flex h-[88px] w-[88px] items-center justify-center rounded-full font-[family-name:var(--font-display)] text-[34px] font-black"
          style={{
            background: "var(--color-surface-strong)",
            border: "1px solid var(--color-border-strong)",
            boxShadow: "var(--shadow-glow-gold)",
            color: "var(--color-gold)",
          }}
        >
          {t.vs}
        </span>
        <PlayerHead id="messi" align="right" t={t} />
      </section>

      {/* Winner banner + score OR neutral matchup banner */}
      {showWinner && winner ? (
        <WinnerBanner winner={winner} score={model.score} accent={accent} t={t} />
      ) : (
        <NeutralBanner t={t} />
      )}

      {/* Category result list */}
      <ul className="flex min-h-0 flex-col justify-center gap-3 overflow-hidden">
        {model.lines.map((line) => (
          <CategoryLine key={line.key} line={line} showWinner={showWinner} t={t} />
        ))}
      </ul>

      {/* Footer brand + hashtag line */}
      <footer className="flex flex-col items-center gap-2">
        <span
          aria-hidden
          className="h-px w-full max-w-[520px]"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--color-border-strong), transparent)",
          }}
        />
        <span className="text-[22px] font-semibold tracking-[0.04em] text-[var(--color-text-secondary)]">
          {t.shareFooterTag}
        </span>
        <span className="text-[19px] font-medium text-[var(--color-text-muted)]">
          #CompareGOATs · #MessiVsRonaldo · #GOATdebate
        </span>
      </footer>
    </div>
  );
}

/* ------------------------------- pieces ------------------------------- */

function CrownMark() {
  // Inline crown glyph (no lucide stroke dependency for the headless shot).
  return (
    <svg width={46} height={46} viewBox="0 0 24 24" aria-hidden fill="none">
      <path
        d="M3 7l4 4 5-7 5 7 4-4-1.5 11.5h-15L3 7z"
        fill="var(--color-gold)"
        stroke="var(--color-gold-bright)"
        strokeWidth={1.1}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayerHead({
  id,
  align,
  t,
}: {
  id: "ronaldo" | "messi";
  align: "left" | "right";
  t: Dictionary;
}) {
  const meta = PLAYER_META[id];
  const accent = `var(${meta.accentVar})`;
  const last = meta.name.split(" ").slice(-1)[0];
  const nationAlt = id === "messi" ? t.flagArgentina : t.flagPortugal;
  const alignClass = align === "left" ? "items-start text-left" : "items-end text-right";

  return (
    <div className={`flex min-w-0 flex-col gap-4 ${alignClass}`}>
      <div
        className={`arena-render arena-render-${id} relative h-[200px] w-[200px] rounded-[var(--radius-xl)]`}
        style={{ boxShadow: `0 0 48px color-mix(in srgb, ${accent} 40%, transparent)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- static photo, headless render */}
        <img src={meta.photoSrc} alt="" aria-hidden draggable={false} />
      </div>
      <div className={`flex min-w-0 flex-col gap-2 ${alignClass}`}>
        <span
          className="block max-w-full truncate font-[family-name:var(--font-display)] text-[52px] font-black uppercase leading-[0.9] tracking-[-0.01em]"
          style={{
            color: accent,
            textShadow: `0 0 30px color-mix(in srgb, ${accent} 60%, transparent)`,
          }}
        >
          {last}
        </span>
        <div
          className={`flex items-center gap-3 ${align === "right" ? "flex-row-reverse" : ""}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static flag asset, headless render */}
          <img
            src={`/flags/${meta.countryCode}.svg`}
            alt={nationAlt}
            width={40}
            height={27}
            className="shrink-0 rounded-[4px]"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
          />
          <span className="truncate text-[24px] font-semibold text-[var(--color-text-secondary)]">
            {meta.nationality}
          </span>
        </div>
      </div>
    </div>
  );
}

function WinnerBanner({
  winner,
  score,
  accent,
  t,
}: {
  winner: "ronaldo" | "messi";
  score: { ronaldo: number; messi: number };
  accent: string;
  t: Dictionary;
}) {
  const winnerName = PLAYER_META[winner].name.split(" ").slice(-1)[0].toUpperCase();
  return (
    <div
      className="relative flex flex-col items-center gap-3 overflow-hidden rounded-[var(--radius-xl)] px-8 py-7 text-center"
      style={{
        background:
          `radial-gradient(160% 130% at 50% 0%, color-mix(in srgb, ${accent} 18%, transparent), transparent 64%),` +
          "linear-gradient(180deg, var(--color-surface-strong), var(--color-surface))",
        border: `1px solid color-mix(in srgb, ${accent} 46%, var(--color-border-strong))`,
        boxShadow: "var(--shadow-glass)",
      }}
    >
      <span className="text-[20px] font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
        {t.shareWinnerLabel}
      </span>
      <span
        className="font-[family-name:var(--font-display)] text-[76px] font-black uppercase leading-[0.9] tracking-tight"
        style={{ color: accent, textShadow: `0 0 36px color-mix(in srgb, ${accent} 70%, transparent)` }}
      >
        {winnerName}
      </span>
      <span className="font-[family-name:var(--font-display)] text-[58px] font-black leading-none tracking-tight">
        <span style={{ color: "var(--color-ronaldo-bright)" }}>{score.ronaldo}</span>
        <span className="mx-4 text-[var(--color-text-muted)]">–</span>
        <span style={{ color: "var(--color-messi-bright)" }}>{score.messi}</span>
      </span>
      <span className="text-[19px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
        {t.shareCategoriesWon}
      </span>
    </div>
  );
}

function NeutralBanner({ t }: { t: Dictionary }) {
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-[var(--radius-xl)] px-8 py-6 text-center"
      style={{
        background: "linear-gradient(180deg, var(--color-surface-strong), var(--color-surface))",
        border: "1px solid var(--color-border-strong)",
      }}
    >
      <span className="font-[family-name:var(--font-display)] text-[44px] font-black uppercase leading-none tracking-tight text-[var(--color-text)]">
        {t.shareNeutralTitle}
      </span>
      <span className="text-[20px] font-medium text-[var(--color-text-secondary)]">
        {t.shareNeutralSubtitle}
      </span>
    </div>
  );
}

function CategoryLine({
  line,
  showWinner,
  t,
}: {
  line: ShareCategoryLine;
  showWinner: boolean;
  t: Dictionary;
}) {
  const Icon = CATEGORY_ICONS[line.key];
  const ronaldoWon = showWinner && line.winner === "ronaldo";
  const messiWon = showWinner && line.winner === "messi";

  return (
    <li
      className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[var(--radius-lg)] px-6 py-3.5"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border-glass)",
      }}
    >
      <span className="flex items-center gap-3">
        <Icon size={26} aria-hidden strokeWidth={1.75} className="text-[var(--color-text-muted)]" />
        <span className="font-[family-name:var(--font-display)] text-[26px] font-bold uppercase tracking-tight text-[var(--color-text)]">
          {t[line.labelKey]}
        </span>
      </span>
      <span className="flex items-center justify-center gap-3">
        <span
          className="tabular text-[26px] font-bold tabular-nums"
          style={{ color: ronaldoWon ? "var(--color-ronaldo-bright)" : "var(--color-text-secondary)" }}
        >
          {line.ronaldo}
        </span>
        <span className="text-[18px] text-[var(--color-text-muted)]">{t.vs}</span>
        <span
          className="tabular text-[26px] font-bold tabular-nums"
          style={{ color: messiWon ? "var(--color-messi-bright)" : "var(--color-text-secondary)" }}
        >
          {line.messi}
        </span>
      </span>
      <span
        aria-hidden
        className="h-3 w-3 rounded-full"
        style={{
          background: ronaldoWon
            ? "var(--color-ronaldo-bright)"
            : messiWon
              ? "var(--color-messi-bright)"
              : "var(--color-border-strong)",
          boxShadow:
            ronaldoWon || messiWon
              ? `0 0 12px ${ronaldoWon ? "var(--color-ronaldo)" : "var(--color-messi)"}`
              : "none",
        }}
      />
    </li>
  );
}
