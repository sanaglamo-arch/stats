import type { CSSProperties } from "react";
import type { IllustrativePositional, IllustrativeShot, PlayerId } from "@/lib/data";
import { PLAYER_META } from "@/components/card";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { CHART_COLORS, roundTo } from "./chart-util";
import { PitchHalf, px, py } from "./pitch";
import { IllustrativeBadge } from "./illustrative-badge";

/**
 * Shotmap on a normalized half-pitch (P6-7). Each shot is a marker whose SIZE
 * scales with xG (when present) and whose STYLE encodes the outcome distinctly —
 * goal (filled gold), saved (hollow blue ring), missed (faded × cross). Outcome
 * is never color-only: the three shapes differ so it reads in grayscale too
 * (a11y `color-not-only`).
 *
 * HARD HONESTY REQUIREMENT (SPEC §6): illustrative data → the prominent
 * `Illustrative` badge + caption are rendered unconditionally.
 */

const OUTCOME_STYLE: Record<
  IllustrativeShot["outcome"],
  { color: string; labelKey: "shotGoal" | "shotSaved" | "shotMissed" }
> = {
  goal: { color: CHART_COLORS.gold, labelKey: "shotGoal" },
  saved: { color: CHART_COLORS.ronaldoBright, labelKey: "shotSaved" },
  missed: { color: CHART_COLORS.axisText, labelKey: "shotMissed" },
};

/** Marker radius from xG (0.02..0.95) → 1.6..4.2 user units. */
function shotRadius(shot: IllustrativeShot): number {
  const xg = shot.xg ?? 0.2;
  return roundTo(1.6 + xg * 2.6, 2);
}

function ShotMarker({ shot }: { shot: IllustrativeShot }) {
  const cx = px(shot.x);
  const cy = py(shot.y);
  const r = shotRadius(shot);
  const { color } = OUTCOME_STYLE[shot.outcome];
  if (shot.outcome === "goal") {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        fillOpacity="0.85"
        stroke={color}
        strokeWidth="0.6"
      />
    );
  }
  if (shot.outcome === "saved") {
    return <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="1.1" />;
  }
  // missed → faded × cross
  const d = r * 0.8;
  return (
    <g stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.7">
      <line x1={cx - d} y1={cy - d} x2={cx + d} y2={cy + d} />
      <line x1={cx - d} y1={cy + d} x2={cx + d} y2={cy - d} />
    </g>
  );
}

function OutcomeLegend({ t }: { t: Dictionary }) {
  return (
    <ul
      className="flex flex-wrap items-center gap-3 text-[11px]"
      style={{ color: "var(--color-text-secondary)" }}
    >
      {(Object.keys(OUTCOME_STYLE) as IllustrativeShot["outcome"][]).map((o) => (
        <li key={o} className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            {o === "goal" && <circle cx="6" cy="6" r="4" fill={OUTCOME_STYLE[o].color} />}
            {o === "saved" && (
              <circle
                cx="6"
                cy="6"
                r="4"
                fill="none"
                stroke={OUTCOME_STYLE[o].color}
                strokeWidth="1.5"
              />
            )}
            {o === "missed" && (
              <g stroke={OUTCOME_STYLE[o].color} strokeWidth="1.4" strokeLinecap="round">
                <line x1="3" y1="3" x2="9" y2="9" />
                <line x1="3" y1="9" x2="9" y2="3" />
              </g>
            )}
          </svg>
          <span style={{ fontWeight: 600 }}>{t[OUTCOME_STYLE[o].labelKey]}</span>
        </li>
      ))}
    </ul>
  );
}

export function Shotmap({
  player,
  data,
  t,
  className,
  style,
}: {
  player: PlayerId;
  data: IllustrativePositional;
  t: Dictionary;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <figure className={className} style={style}>
      <figcaption className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
          {t.chartShotmapTitle}
          <span className="ml-2 font-normal" style={{ color: "var(--color-text-secondary)" }}>
            {PLAYER_META[player].name}
          </span>
        </h3>
        <IllustrativeBadge t={t} />
      </figcaption>

      <div
        role="img"
        aria-label={`${t.chartShotmapTitle} — ${PLAYER_META[player].name}. ${t.illustrativeCaption}`}
      >
        <PitchHalf>
          {data.shotmap.map((shot, i) => (
            <ShotMarker key={`shot-${i}`} shot={shot} />
          ))}
        </PitchHalf>
      </div>

      <div className="mt-2">
        <OutcomeLegend t={t} />
      </div>
    </figure>
  );
}
