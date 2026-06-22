/** Phase 6 visualization components + their pure, testable view-model builders. */

// Pure builders (DOM-free, unit-testable)
export { buildRadarModel, type RadarModel, type RadarAxis, type RadarStat } from "./radar-model";
export { buildTrendModel, type TrendModel } from "./trend-model";

// Shared chart utils
export {
  CHART_COLORS,
  sideColor,
  sideColorBright,
  normalizePair,
  higherIsBetter,
  clamp,
  roundTo,
  type PlayerSide,
} from "./chart-util";

// Components (prop-driven, on-brand, reduced-motion safe)
export { ComparisonRadar } from "./comparison-radar";
export { SeasonTrendChart } from "./season-trend-chart";
export { PositionalHeatmap } from "./positional-heatmap";
export { Shotmap } from "./shotmap";
export { IllustrativeBadge } from "./illustrative-badge";
export { ChartLegend } from "./chart-legend";
export { PitchHalf } from "./pitch";
