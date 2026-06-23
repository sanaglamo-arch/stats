import type { Dictionary } from "@/lib/i18n/dictionaries";
import { CARD_HEIGHT, CARD_WIDTH } from "./card-dimensions";
import { PLAYER_META } from "./player-meta";
import { PhotoSlot } from "./photo-slot";
import { contextChips, selectionLabel, STAT_ICONS, statLabel } from "./card-labels";
import { crestForClub } from "./club-crests";
import type { CardSlice, CardStatRow, CardViewModel } from "./card-model";
import { AnimatedBarFill, CountUpValue, CardPulse } from "./card-animations";

/**
 * The hero artifact (SPEC §4). A self-contained, theme-tokened vertical 2:3
 * card. Pure presentational: it takes a prebuilt view-model + the slice (for
 * the period/context plaque) + a dictionary. No data fetching, no hooks — so it
 * renders identically in the live preview and in the headless PNG route.
 *
 * The card carries its own fixed 1080×1620 box; the render route screenshots it
 * at that size, the UI scales it down with CSS transform.
 *
 * LAYOUT (P7-1): the body is a single CSS grid with five explicit bands —
 * header / period plaque / stat list / verdict / watermark. The stat band is
 * the only flexible row (`minmax(0, 1fr)`); every other band is `auto`. This
 * makes collisions structurally impossible: bands cannot bleed into one another
 * regardless of stat count (3→12), club-name length, or two distinct periods.
 * The stat list adapts its own internal density to the row count so 3 stats
 * read airy and 12 stats stay tight-but-legible — always inside its band.
 */
/**
 * `animated` is OFF by default — the static branch renders EXACTLY the original
 * deterministic output that the headless /render/card route screenshots into a
 * PNG. No hooks-driven animation runs when `animated` is false (the animated
 * subcomponents fall back to the plain static markup). Only the live preview
 * (CardPreview) opts in via `animated`. Nothing here reads time/random.
 */
export function ComparisonCard({
  model,
  slice,
  t,
  animated = false,
}: {
  model: CardViewModel;
  slice: CardSlice;
  t: Dictionary;
  animated?: boolean;
}) {
  const messi = PLAYER_META.messi;
  const ronaldo = PLAYER_META.ronaldo;

  return (
    <div
      className="font-[family-name:var(--font-sans)] relative grid overflow-hidden leading-normal text-[var(--color-text)]"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        // Five-band poster grid. Only the stat band flexes; the rest are auto,
        // so no band can ever overlap another (P7-1 no-collision invariant).
        gridTemplateRows: "auto auto minmax(0, 1fr) auto auto",
        rowGap: 44,
        padding: 72,
        background:
          "radial-gradient(900px 680px at 8% -8%, color-mix(in srgb, var(--color-messi) 24%, transparent), transparent 56%)," +
          "radial-gradient(900px 680px at 92% 108%, color-mix(in srgb, var(--color-ronaldo) 24%, transparent), transparent 56%)," +
          "radial-gradient(1100px 1100px at 50% 42%, rgba(255,255,255,0.04), transparent 60%)," +
          "var(--color-bg-base)",
      }}
    >
      {/* hairline inner frame for a finished, premium edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-6 rounded-[var(--radius-xl)]"
        style={{ border: "1px solid rgba(255,255,255,0.06)" }}
      />
      {animated && <CardPulse />}
      <CardHeader messiClub={model.messi.club} ronaldoClub={model.ronaldo.club} />
      <PeriodPlaque slice={slice} t={t} />
      <StatList rows={model.rows} t={t} animated={animated} />
      <ResultFooter
        score={model.score}
        contested={model.contested}
        t={t}
        animated={animated}
      />
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
    <header className="relative grid grid-cols-[1fr_auto_1fr] items-start gap-7">
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
  const crest = crestForClub(club);

  return (
    <div className={`flex min-w-0 flex-col gap-5 ${alignClass}`}>
      <div className="w-full max-w-[296px]">
        <PhotoSlot src={meta.photoSrc} alt={meta.name} accentVar={meta.accentVar} />
      </div>
      {/* fixed-height identity block → header height is stable across slices,
          so a long club name can never push into the plaque below */}
      <div className={`flex w-full min-w-0 flex-col gap-1.5 ${alignClass}`}>
        <span className="text-[22px] font-medium uppercase tracking-[0.34em] text-[var(--color-text-muted)]">
          {first}
        </span>
        <span
          className="block w-full truncate font-[family-name:var(--font-display)] text-[48px] font-black uppercase leading-[0.95] tracking-[-0.01em]"
          style={{
            color: `var(${meta.accentVar})`,
            textShadow: `0 0 34px color-mix(in srgb, var(${meta.accentVar}) 60%, transparent)`,
          }}
        >
          {last}
        </span>
        <div
          className={`mt-2.5 flex min-w-0 items-center gap-3 ${align === "right" ? "flex-row-reverse" : ""}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- static flag asset, headless render */}
          <img
            src={`/flags/${meta.countryCode}.svg`}
            alt={meta.nationality}
            width={40}
            height={27}
            className="shrink-0 rounded-[4px]"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
          />
          <span className="truncate text-[20px] font-semibold text-[var(--color-text)]">
            {meta.position}
          </span>
        </div>
        {/* club can be long ("Paris Saint-Germain") → crest is shrink-0, the
            label truncates inside min-w-0; row mirrors header alignment so it
            never collides in the grid-cols-[1fr_auto_1fr] header */}
        <div
          className={`mt-1 flex w-full min-w-0 items-center gap-2.5 ${align === "right" ? "flex-row-reverse" : ""}`}
        >
          {crest && (
            // light chip so any crest — incl. dark/monochrome marks (e.g. Juventus'
            // black "J") — reads on the dark card. Static, deterministic (PNG-safe).
            <span
              aria-hidden
              className="flex shrink-0 items-center justify-center rounded-full"
              style={{
                width: 40,
                height: 40,
                background: "rgba(255,255,255,0.94)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static crest asset, headless render */}
              <img src={crest} alt="" width={30} height={30} className="object-contain" />
            </span>
          )}
          <span className="min-w-0 truncate text-[20px] font-medium text-[var(--color-text-secondary)]">
            {club}
          </span>
        </div>
      </div>
    </div>
  );
}

function VsBadge() {
  return (
    <div className="flex h-full items-center pt-7">
      <div
        className="flex h-[92px] w-[92px] items-center justify-center rounded-full"
        style={{
          background: "var(--color-surface-strong)",
          border: "1px solid var(--color-border-strong)",
          boxShadow: "var(--shadow-glow-gold)",
          backdropFilter: "blur(16px)",
        }}
      >
        <span
          className="font-[family-name:var(--font-display)] text-[36px] font-black tracking-tight"
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
      className="glass relative flex flex-col gap-3.5 overflow-hidden rounded-[var(--radius-lg)] px-8 py-6"
      style={{ borderColor: "var(--color-border-strong)" }}
    >
      <span
        aria-hidden
        className="absolute inset-y-5 left-0 w-1 rounded-full"
        style={{ background: "linear-gradient(180deg, var(--color-messi), var(--color-ronaldo))" }}
      />
      <div className="flex min-w-0 items-center gap-4 pl-3">
        <span className="shrink-0 text-[18px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          {t.period}
        </span>
        {samePeriod ? (
          <span className="tabular truncate font-[family-name:var(--font-display)] text-[28px] font-bold text-[var(--color-text)]">
            {messiPeriod}
          </span>
        ) : (
          // Two distinct periods: stack into two color-coded plaques so long
          // labels ("LAST 5 YEARS" / "AT AGE 25") never collide on one line.
          <div className="flex min-w-0 flex-1 items-stretch gap-3">
            <PeriodPill label={messiPeriod} colorVar="--color-messi" align="left" />
            <PeriodPill label={ronaldoPeriod} colorVar="--color-ronaldo" align="right" />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 pl-3">
        {chips.map((chip) => (
          <span
            key={chip}
            className="rounded-full px-4 py-1.5 text-[16px] font-medium text-[var(--color-text-secondary)]"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border-glass)",
            }}
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function PeriodPill({
  label,
  colorVar,
  align,
}: {
  label: string;
  colorVar: string;
  align: "left" | "right";
}) {
  return (
    <span
      className={`tabular min-w-0 flex-1 truncate font-[family-name:var(--font-display)] text-[26px] font-bold ${align === "right" ? "text-right" : "text-left"}`}
      style={{ color: `var(${colorVar})` }}
    >
      {label}
    </span>
  );
}

/* ----------------------------- Stat list ----------------------------- */

/**
 * Density tiers keep the whole stat list inside its grid band for any row count
 * (3→12). Fewer rows → larger figures, fatter bars, more breathing room; more
 * rows → tighter rhythm but still legible. The band itself is `min-h-0` +
 * `overflow-hidden`, so even an unexpected count can never spill into the
 * verdict footer. All values are static (no time/random) → PNG-deterministic.
 */
function densityFor(count: number): {
  valuePx: number;
  labelPx: number;
  iconPx: number;
  barPx: number;
  rowGapPx: number;
} {
  if (count <= 4) return { valuePx: 34, labelPx: 19, iconPx: 23, barPx: 20, rowGapPx: 22 };
  if (count <= 6) return { valuePx: 31, labelPx: 18, iconPx: 22, barPx: 18, rowGapPx: 16 };
  if (count <= 8) return { valuePx: 29, labelPx: 17, iconPx: 21, barPx: 16, rowGapPx: 12 };
  if (count <= 10) return { valuePx: 27, labelPx: 16, iconPx: 20, barPx: 14, rowGapPx: 9 };
  return { valuePx: 25, labelPx: 15, iconPx: 19, barPx: 13, rowGapPx: 7 };
}

function StatList({
  rows,
  t,
  animated,
}: {
  rows: CardStatRow[];
  t: Dictionary;
  animated: boolean;
}) {
  const density = densityFor(rows.length);
  return (
    <div
      className="flex min-h-0 flex-col justify-center overflow-hidden"
      style={{ gap: density.rowGapPx }}
    >
      {rows.map((row) => (
        <StatRow key={row.key} row={row} t={t} animated={animated} density={density} />
      ))}
    </div>
  );
}

function StatRow({
  row,
  t,
  animated,
  density,
}: {
  row: CardStatRow;
  t: Dictionary;
  animated: boolean;
  density: ReturnType<typeof densityFor>;
}) {
  const Icon = STAT_ICONS[row.key];
  const messiWins = row.winner === "messi";
  const ronaldoWins = row.winner === "ronaldo";

  return (
    <div className="flex flex-col gap-1.5">
      {/* values + centered label/icon */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <span
          className={`tabular font-[family-name:var(--font-display)] leading-none ${messiWins ? "font-black" : "font-semibold"}`}
          style={{
            fontSize: density.valuePx,
            textAlign: "left",
            color: messiWins ? "var(--color-messi-bright)" : "var(--color-text)",
            textShadow: messiWins
              ? "0 0 18px color-mix(in srgb, var(--color-messi) 70%, transparent)"
              : "none",
            opacity: messiWins ? 1 : 0.82,
          }}
        >
          <CountUpValue
            statKey={row.key}
            value={row.messiValue}
            decimals={row.decimals}
            animated={animated}
          />
        </span>

        <span
          className="flex items-center justify-center gap-2 whitespace-nowrap font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]"
          style={{ fontSize: density.labelPx }}
        >
          <Icon
            size={density.iconPx}
            strokeWidth={2}
            className="shrink-0 text-[var(--color-text-muted)]"
            aria-hidden
          />
          {statLabel(t, row.key)}
        </span>

        <span
          className={`tabular font-[family-name:var(--font-display)] leading-none ${ronaldoWins ? "font-black" : "font-semibold"}`}
          style={{
            fontSize: density.valuePx,
            textAlign: "right",
            color: ronaldoWins ? "var(--color-ronaldo-bright)" : "var(--color-text)",
            textShadow: ronaldoWins
              ? "0 0 18px color-mix(in srgb, var(--color-ronaldo) 70%, transparent)"
              : "none",
            opacity: ronaldoWins ? 1 : 0.82,
          }}
        >
          <CountUpValue
            statKey={row.key}
            value={row.ronaldoValue}
            decimals={row.decimals}
            animated={animated}
          />
        </span>
      </div>

      {/* double divergent bar meeting at center */}
      <div className="flex items-center gap-2.5">
        <Bar
          fraction={row.messiFraction}
          colorVar="--color-messi"
          brightVar="--color-messi-bright"
          win={messiWins}
          direction="rtl"
          heightPx={density.barPx}
          animated={animated}
        />
        <span
          aria-hidden
          className="w-1.5 shrink-0 rotate-45 rounded-[2px]"
          style={{ height: density.barPx * 0.6, background: "var(--color-border-strong)" }}
        />
        <Bar
          fraction={row.ronaldoFraction}
          colorVar="--color-ronaldo"
          brightVar="--color-ronaldo-bright"
          win={ronaldoWins}
          direction="ltr"
          heightPx={density.barPx}
          animated={animated}
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
  heightPx,
  animated,
}: {
  fraction: number;
  colorVar: string;
  brightVar: string;
  win: boolean;
  direction: "ltr" | "rtl";
  heightPx: number;
  animated: boolean;
}) {
  const justify = direction === "rtl" ? "flex-end" : "flex-start";
  const gradient =
    direction === "rtl"
      ? `linear-gradient(270deg, var(${brightVar}), var(${colorVar}))`
      : `linear-gradient(90deg, var(${colorVar}), var(${brightVar}))`;
  const fillStyle = {
    width: `${Math.max(fraction * 100, 5)}%`,
    background: gradient,
    opacity: win ? 1 : 0.78,
    boxShadow: win
      ? `0 0 18px color-mix(in srgb, var(${colorVar}) 80%, transparent), inset 0 1px 0 rgba(255,255,255,0.35)`
      : "inset 0 1px 0 rgba(255,255,255,0.12)",
  } as const;
  return (
    <div
      className="flex flex-1 items-center overflow-hidden rounded-full"
      style={{
        height: heightPx,
        background: "var(--color-surface)",
        justifyContent: justify,
        border: "1px solid var(--color-border-glass)",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.35)",
      }}
    >
      <AnimatedBarFill
        className="h-full rounded-full"
        style={fillStyle}
        direction={direction}
        animated={animated}
      />
    </div>
  );
}

/* ---------------------------- Result footer ---------------------------- */

function ResultFooter({
  score,
  contested,
  t,
  animated,
}: {
  score: { messi: number; ronaldo: number };
  contested: number;
  t: Dictionary;
  animated: boolean;
}) {
  const messiLeads = score.messi > score.ronaldo;
  const ronaldoLeads = score.ronaldo > score.messi;
  const wonBy = Math.max(score.messi, score.ronaldo);

  const leadColorVar = messiLeads
    ? "--color-messi"
    : ronaldoLeads
      ? "--color-ronaldo"
      : "--color-gold";

  return (
    <div
      className="relative flex flex-col items-center gap-5 overflow-hidden rounded-[var(--radius-xl)] px-8 py-8"
      style={{
        background:
          `radial-gradient(140% 120% at 50% 0%, color-mix(in srgb, var(${leadColorVar}) 12%, transparent), transparent 62%),` +
          "linear-gradient(180deg, var(--color-surface-strong), var(--color-surface))",
        border: "1px solid var(--color-border-strong)",
        boxShadow: "var(--shadow-glass)",
      }}
    >
      {/* gold accent hairline crowning the verdict */}
      <span
        aria-hidden
        className="absolute inset-x-10 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, var(--color-gold), transparent)",
          opacity: 0.7,
        }}
      />
      <span className="text-[18px] font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)]">
        {t.overallResult}
      </span>
      <div className="flex items-baseline justify-center gap-5">
        <ScoreSide
          name="MESSI"
          value={score.messi}
          colorVar="--color-messi"
          brightVar="--color-messi-bright"
          lead={messiLeads}
          align="right"
          animated={animated}
        />
        <span className="font-[family-name:var(--font-display)] text-[40px] font-bold text-[var(--color-text-muted)]">
          :
        </span>
        <ScoreSide
          name="RONALDO"
          value={score.ronaldo}
          colorVar="--color-ronaldo"
          brightVar="--color-ronaldo-bright"
          lead={ronaldoLeads}
          align="left"
          animated={animated}
        />
      </div>
      <span className="tabular text-[20px] font-medium text-[var(--color-text-secondary)]">
        {wonBy} {t.categoriesWon}{" "}
        <span className="text-[var(--color-text-muted)]">/ {contested}</span>
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
  animated,
}: {
  name: string;
  value: number;
  colorVar: string;
  brightVar: string;
  lead: boolean;
  align: "left" | "right";
  animated: boolean;
}) {
  return (
    <div className={`flex flex-col ${align === "right" ? "items-end" : "items-start"}`}>
      <span
        className="tabular font-[family-name:var(--font-display)] text-[68px] font-black leading-none"
        style={{
          color: lead ? `var(${brightVar})` : `var(${colorVar})`,
          textShadow: lead
            ? `0 0 30px color-mix(in srgb, var(${colorVar}) 80%, transparent)`
            : "none",
          opacity: lead ? 1 : 0.78,
        }}
      >
        <CountUpValue value={value} decimals={0} animated={animated} />
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
    <div className="flex items-center justify-center gap-5">
      <span
        aria-hidden
        className="h-px w-20"
        style={{ background: "linear-gradient(90deg, transparent, var(--color-border-strong))" }}
      />
      <span
        className="font-[family-name:var(--font-display)] text-[20px] font-bold uppercase tracking-[0.42em]"
        style={{ color: "var(--color-gold)", opacity: 0.92, textShadow: "var(--shadow-glow-gold)" }}
      >
        CompareGOATs
      </span>
      <span
        aria-hidden
        className="h-px w-20"
        style={{ background: "linear-gradient(90deg, var(--color-border-strong), transparent)" }}
      />
    </div>
  );
}
