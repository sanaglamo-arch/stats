import type { CSSProperties } from "react";
import { HEATMAP_COLS, HEATMAP_ROWS, type IllustrativePositional, type PlayerId } from "@/lib/data";
import { PLAYER_META } from "@/components/card";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { sideColor, sideColorBright, roundTo } from "./chart-util";
import { PitchHalf, PITCH_VIEW, px, py } from "./pitch";
import { IllustrativeBadge } from "./illustrative-badge";

/**
 * Heatmap on a normalized half-pitch (P6-7). Renders the illustrative intensity
 * grid as soft, additively-blended cells tinted in the player's brand color —
 * hotter = brighter/more opaque, fading toward the goal in the final third.
 *
 * HARD HONESTY REQUIREMENT (SPEC §6): this consumes `illustrative:true` data, so
 * it MUST show the prominent `Illustrative` badge + caption. The badge is
 * rendered unconditionally here — not optional, not toggleable.
 */
export function PositionalHeatmap({
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
  const accent = sideColor(player);
  const accentBright = sideColorBright(player);
  const cellW = (px(1) - px(0)) / HEATMAP_COLS;
  const cellH = (py(1) - py(0)) / HEATMAP_ROWS;

  return (
    <figure className={className} style={style}>
      <figcaption className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
          {t.chartHeatmapTitle}
          <span className="ml-2 font-normal" style={{ color: accentBright }}>
            {PLAYER_META[player].name}
          </span>
        </h3>
        <IllustrativeBadge t={t} />
      </figcaption>

      <div
        role="img"
        aria-label={`${t.chartHeatmapTitle} — ${PLAYER_META[player].name}. ${t.illustrativeCaption}`}
      >
        <PitchHalf>
          <g style={{ mixBlendMode: "screen" }}>
            {data.heatmap.map((row, r) =>
              row.map((v, c) => {
                if (v <= 0.02) return null;
                const x = px(0) + c * cellW;
                const y = py(0) + r * cellH;
                return (
                  <rect
                    key={`h-${r}-${c}`}
                    x={roundTo(x, 2)}
                    y={roundTo(y, 2)}
                    width={roundTo(cellW + 0.4, 2)}
                    height={roundTo(cellH + 0.4, 2)}
                    rx="2"
                    fill={accent}
                    fillOpacity={roundTo(0.12 + v * 0.6, 2)}
                  />
                );
              }),
            )}
          </g>
          {/* subtle directional hint label baked into user-space */}
          <text
            x={PITCH_VIEW.w - 12}
            y={PITCH_VIEW.h - 4}
            textAnchor="end"
            fontSize="6"
            fill="rgba(255,255,255,0.35)"
          >
            → goal
          </text>
        </PitchHalf>
      </div>
    </figure>
  );
}
