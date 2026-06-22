import type { ReactNode } from "react";
import { CHART_COLORS } from "./chart-util";

/**
 * A normalized half-pitch backdrop used by the heatmap and shotmap. The pitch
 * runs LEFT (own half / midline) → RIGHT (attacking goal). Coordinates inside
 * are 0..1 on both axes: x toward goal, y across the pitch — matching the
 * illustrative data contract (`IllustrativeShot` / heatmap grid).
 *
 * Pure SVG markings (no motion, no images) so it renders identically in the
 * preview and the headless PNG route. `children` are drawn in the same 0..100
 * user-space the lines use (10 units padding on each side → playable 0..1 maps
 * to 10..90 horizontally and vertically via the helper exports below).
 */

export const PITCH_VIEW = { w: 200, h: 130 } as const;
const PAD = 8;
const LEFT = PAD;
const RIGHT = PITCH_VIEW.w - PAD;
const TOP = PAD;
const BOTTOM = PITCH_VIEW.h - PAD;

/** Map normalized x (0=midline,1=goal-line) to user-space. */
export function px(x: number): number {
  return LEFT + x * (RIGHT - LEFT);
}
/** Map normalized y (0..1 across the pitch) to user-space. */
export function py(y: number): number {
  return TOP + y * (BOTTOM - TOP);
}

const LINE = "rgba(255,255,255,0.22)";

export function PitchHalf({ children }: { children?: ReactNode }) {
  const boxH = (BOTTOM - TOP) * 0.62;
  const sixH = (BOTTOM - TOP) * 0.3;
  const boxW = (RIGHT - LEFT) * 0.26;
  const sixW = (RIGHT - LEFT) * 0.1;
  const midY = (TOP + BOTTOM) / 2;
  return (
    <svg
      viewBox={`0 0 ${PITCH_VIEW.w} ${PITCH_VIEW.h}`}
      className="block h-auto w-full"
      aria-hidden
    >
      {/* turf */}
      <rect
        x={LEFT}
        y={TOP}
        width={RIGHT - LEFT}
        height={BOTTOM - TOP}
        rx="6"
        fill="rgba(46,168,255,0.04)"
        stroke={LINE}
        strokeWidth="1"
      />
      {/* midline (left edge of the half) + centre arc */}
      <line x1={LEFT} y1={TOP} x2={LEFT} y2={BOTTOM} stroke={LINE} strokeWidth="1" />
      <path
        d={`M ${LEFT} ${midY - 14} A 14 14 0 0 1 ${LEFT} ${midY + 14}`}
        fill="none"
        stroke={LINE}
        strokeWidth="1"
      />
      {/* penalty box (attacking, right) */}
      <rect
        x={RIGHT - boxW}
        y={midY - boxH / 2}
        width={boxW}
        height={boxH}
        fill="none"
        stroke={LINE}
        strokeWidth="1"
      />
      {/* six-yard box */}
      <rect
        x={RIGHT - sixW}
        y={midY - sixH / 2}
        width={sixW}
        height={sixH}
        fill="none"
        stroke={LINE}
        strokeWidth="1"
      />
      {/* penalty spot + goal */}
      <circle cx={RIGHT - boxW * 0.62} cy={midY} r="1.2" fill={LINE} />
      <line
        x1={RIGHT}
        y1={midY - 7}
        x2={RIGHT}
        y2={midY + 7}
        stroke={CHART_COLORS.gold}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {children}
    </svg>
  );
}
