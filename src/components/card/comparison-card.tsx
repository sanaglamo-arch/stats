import type { Dictionary } from "@/lib/i18n/dictionaries";
import { CARD_HEIGHT, CARD_WIDTH } from "./card-dimensions";
import { PLAYER_META } from "./player-meta";
import { PhotoSlot } from "./photo-slot";
import {
  contextChips,
  formatStatValue,
  selectionLabel,
  STAT_ICONS,
  statLabel,
} from "./card-labels";
import type { CardSlice, CardStatRow, CardViewModel } from "./card-model";

/**
 * The hero artifact (SPEC §4). A self-contained, theme-tokened vertical 2:3
 * card. Pure presentational: it takes a prebuilt view-model + the slice (for
 * the period/context plaque) + a dictionary. No data fetching, no hooks — so it
 * renders identically in the live preview and in the headless PNG route.
 *
 * The card carries its own fixed 1080×1620 box; the render route screenshots it
 * at that size, the UI scales it down with CSS transform.
 */
export function ComparisonCard({
  model,
  slice,
  t,
}: {
  model: CardViewModel;
  slice: CardSlice;
  t: Dictionary;
}) {
  const messi = PLAYER_META.messi;
  const ronaldo = PLAYER_META.ronaldo;

  return (
    <div
      className="font-[family-name:var(--font-sans)] relative flex flex-col overflow-hidden text-[var(--color-text)]"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        background:
          "radial-gradient(900px 700px at 12% -8%, rgba(233,30,140,0.20), transparent 58%)," +
          "radial-gradient(900px 700px at 88% 108%, rgba(46,168,255,0.20), transparent 58%)," +
          "var(--color-bg-base)",
        padding: 56,
        gap: 36,
      }}
    >
      <CardHeader
        messiClub={model.messi.club}
        ronaldoClub={model.ronaldo.club}
      />
      <PeriodPlaque slice={slice} t={t} />
      <StatList rows={model.rows} t={t} />
      <ResultFooter score={model.score} contested={model.contested} t={t} />
      <Watermark />

      {/* hidden labels for clarity in the rendered DOM (used by name header) */}
      <span className="sr-only">
        {messi.name} vs {ronaldo.name}
      </span>
    </div>
  );
}

/* ----------------------------- Header ----------------------------- */

function CardHeader({ messiClub, ronaldoClub }: { messiClub: string; ronaldoClub: string }) {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-start gap-6">
      <PlayerHead side="messi" club={messiClub} align="left" />
      <VsBadge />
      <PlayerHead side="ronaldo" club={ronaldoClub} align="right" />
    </header>
  );
}

function PlayerHead({
  side,
  club,
  align,
}: {
  side: "messi" | "ronaldo";
  club: string;
  align: "left" | "right";
}) {
  const meta = PLAYER_META[side];
  const [first, ...rest] = meta.name.split(" ");
  const last = rest.join(" ");
  const alignClass = align === "left" ? "items-start text-left" : "items-end text-right";

  return (
    <div className={`flex min-w-0 flex-col gap-4 ${alignClass}`}>
      <div className="w-full max-w-[300px]">
        <PhotoSlot src={meta.photoSrc} alt={meta.name} accentVar={meta.accentVar} />
      </div>
      <div className={`flex w-full flex-col gap-1 ${alignClass}`}>
        <span className="text-[26px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
          {first}
        </span>
        <span
          className="font-[family-name:var(--font-display)] text-[44px] font-black uppercase leading-none tracking-tight"
          style={{ color: `var(${meta.accentVar})`, textShadow: `0 0 28px color-mix(in srgb, var(${meta.accentVar}) 60%, transparent)` }}
        >
          {last}
        </span>
        <div
          className={`mt-2 flex items-center gap-3 ${align === "right" ? "flex-row-reverse" : ""}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static flag asset, headless render */}
          <img
            src={`/flags/${meta.countryCode}.svg`}
            alt={meta.nationality}
            width={40}
            height={27}
            className="rounded-[4px]"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
          />
          <span className="text-[20px] font-semibold text-[var(--color-text)]">{meta.position}</span>
        </div>
        <span className="text-[20px] font-medium text-[var(--color-text-secondary)]">{club}</span>
      </div>
    </div>
  );
}

function VsBadge() {
  return (
    <div className="flex h-full items-center pt-6">
      <div
        className="flex h-[88px] w-[88px] items-center justify-center rounded-full"
        style={{
          background: "var(--color-surface-strong)",
          border: "1px solid var(--color-border-strong)",
          boxShadow: "var(--shadow-glow-gold)",
          backdropFilter: "blur(16px)",
        }}
      >
        <span
          className="font-[family-name:var(--font-display)] text-[34px] font-black tracking-tight"
          style={{ color: "var(--color-gold)" }}
        >
          VS
        </span>
      </div>
    </div>
  );
}

/* -------------------------- Period plaque -------------------------- */

function PeriodPlaque({ slice, t }: { slice: CardSlice; t: Dictionary }) {
  const messiPeriod = selectionLabel(t, slice.messi.selection);
  const ronaldoPeriod = selectionLabel(t, slice.ronaldo.selection);
  const samePeriod = messiPeriod === ronaldoPeriod;
  const chips = [...new Set([...contextChips(t, slice.messi), ...contextChips(t, slice.ronaldo)])];

  return (
    <div
      className="glass flex flex-col gap-3 rounded-[var(--radius-lg)] px-7 py-5"
      style={{ borderColor: "var(--color-border-strong)" }}
    >
      <div className="flex items-center gap-4">
        <span className="text-[18px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          {t.period}
        </span>
        <span className="tabular font-[family-name:var(--font-display)] text-[26px] font-bold text-[var(--color-text)]">
          {samePeriod ? (
            messiPeriod
          ) : (
            <>
              <span style={{ color: "var(--color-messi)" }}>{messiPeriod}</span>
              <span className="mx-3 text-[var(--color-text-muted)]">/</span>
              <span style={{ color: "var(--color-ronaldo)" }}>{ronaldoPeriod}</span>
            </>
          )}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span
            key={chip}
            className="rounded-full px-4 py-1.5 text-[16px] font-medium text-[var(--color-text-secondary)]"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border-glass)" }}
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Stat list ----------------------------- */

function StatList({ rows, t }: { rows: CardStatRow[]; t: Dictionary }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-3.5">
      {rows.map((row) => (
        <StatRow key={row.key} row={row} t={t} />
      ))}
    </div>
  );
}

function StatRow({ row, t }: { row: CardStatRow; t: Dictionary }) {
  const Icon = STAT_ICONS[row.key];
  const messiWins = row.winner === "messi";
  const ronaldoWins = row.winner === "ronaldo";

  return (
    <div className="flex flex-col gap-1.5">
      {/* values + centered label/icon */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <span
          className={`tabular font-[family-name:var(--font-display)] text-[30px] leading-none ${messiWins ? "font-black" : "font-semibold"}`}
          style={{
            textAlign: "left",
            color: messiWins ? "var(--color-messi-bright)" : "var(--color-text)",
            textShadow: messiWins ? "0 0 18px color-mix(in srgb, var(--color-messi) 70%, transparent)" : "none",
            opacity: messiWins ? 1 : 0.82,
          }}
        >
          {formatStatValue(row.key, row.messiValue, row.decimals)}
        </span>

        <span className="flex items-center gap-2 whitespace-nowrap text-[18px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
          <Icon size={22} strokeWidth={2} className="text-[var(--color-text-muted)]" aria-hidden />
          {statLabel(t, row.key)}
        </span>

        <span
          className={`tabular font-[family-name:var(--font-display)] text-[30px] leading-none ${ronaldoWins ? "font-black" : "font-semibold"}`}
          style={{
            textAlign: "right",
            color: ronaldoWins ? "var(--color-ronaldo-bright)" : "var(--color-text)",
            textShadow: ronaldoWins ? "0 0 18px color-mix(in srgb, var(--color-ronaldo) 70%, transparent)" : "none",
            opacity: ronaldoWins ? 1 : 0.82,
          }}
        >
          {formatStatValue(row.key, row.ronaldoValue, row.decimals)}
        </span>
      </div>

      {/* double divergent bar meeting at center */}
      <div className="flex items-center gap-2">
        <Bar
          fraction={row.messiFraction}
          colorVar="--color-messi"
          brightVar="--color-messi-bright"
          win={messiWins}
          direction="rtl"
        />
        <span className="h-3 w-px shrink-0 bg-[var(--color-border-strong)]" aria-hidden />
        <Bar
          fraction={row.ronaldoFraction}
          colorVar="--color-ronaldo"
          brightVar="--color-ronaldo-bright"
          win={ronaldoWins}
          direction="ltr"
        />
      </div>
    </div>
  );
}

function Bar({
  fraction,
  colorVar,
  brightVar,
  win,
  direction,
}: {
  fraction: number;
  colorVar: string;
  brightVar: string;
  win: boolean;
  direction: "ltr" | "rtl";
}) {
  const justify = direction === "rtl" ? "flex-end" : "flex-start";
  const gradient =
    direction === "rtl"
      ? `linear-gradient(270deg, var(${brightVar}), var(${colorVar}))`
      : `linear-gradient(90deg, var(${colorVar}), var(${brightVar}))`;
  return (
    <div
      className="flex h-4 flex-1 items-center overflow-hidden rounded-full"
      style={{ background: "var(--color-surface)", justifyContent: justify, border: "1px solid var(--color-border-glass)" }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.max(fraction * 100, 5)}%`,
          background: gradient,
          opacity: win ? 1 : 0.82,
          boxShadow: win ? `0 0 16px color-mix(in srgb, var(${colorVar}) 75%, transparent)` : "none",
        }}
      />
    </div>
  );
}

/* ---------------------------- Result footer ---------------------------- */

function ResultFooter({
  score,
  contested,
  t,
}: {
  score: { messi: number; ronaldo: number };
  contested: number;
  t: Dictionary;
}) {
  const messiLeads = score.messi > score.ronaldo;
  const ronaldoLeads = score.ronaldo > score.messi;
  const wonBy = Math.max(score.messi, score.ronaldo);

  return (
    <div
      className="flex flex-col items-center gap-3 rounded-[var(--radius-xl)] px-8 py-6"
      style={{
        background: "linear-gradient(180deg, var(--color-surface-strong), var(--color-surface))",
        border: "1px solid var(--color-border-strong)",
        boxShadow: "var(--shadow-glass)",
      }}
    >
      <span className="text-[18px] font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
        {t.overallResult}
      </span>
      <div className="flex items-baseline gap-5">
        <ScoreSide name="MESSI" value={score.messi} colorVar="--color-messi" brightVar="--color-messi-bright" lead={messiLeads} align="right" />
        <span className="font-[family-name:var(--font-display)] text-[40px] font-bold text-[var(--color-text-muted)]">
          :
        </span>
        <ScoreSide name="RONALDO" value={score.ronaldo} colorVar="--color-ronaldo" brightVar="--color-ronaldo-bright" lead={ronaldoLeads} align="left" />
      </div>
      <span className="tabular text-[20px] font-medium text-[var(--color-text-secondary)]">
        {wonBy} {t.categoriesWon} <span className="text-[var(--color-text-muted)]">/ {contested}</span>
      </span>
    </div>
  );
}

function ScoreSide({
  name,
  value,
  colorVar,
  brightVar,
  lead,
  align,
}: {
  name: string;
  value: number;
  colorVar: string;
  brightVar: string;
  lead: boolean;
  align: "left" | "right";
}) {
  return (
    <div className={`flex flex-col ${align === "right" ? "items-end" : "items-start"}`}>
      <span
        className="tabular font-[family-name:var(--font-display)] text-[68px] font-black leading-none"
        style={{
          color: lead ? `var(${brightVar})` : `var(${colorVar})`,
          textShadow: lead ? `0 0 30px color-mix(in srgb, var(${colorVar}) 80%, transparent)` : "none",
          opacity: lead ? 1 : 0.78,
        }}
      >
        {value}
      </span>
      <span className="text-[16px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
        {name}
      </span>
    </div>
  );
}

/* ------------------------------ Watermark ------------------------------ */

function Watermark() {
  return (
    <div className="flex items-center justify-center">
      <span
        className="font-[family-name:var(--font-display)] text-[20px] font-bold uppercase tracking-[0.4em]"
        style={{ color: "var(--color-gold)", opacity: 0.9, textShadow: "var(--shadow-glow-gold)" }}
      >
        FootyCompare
      </span>
    </div>
  );
}
