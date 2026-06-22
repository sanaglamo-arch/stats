import { PLAYER_META } from "@/components/card";
import { CHART_COLORS } from "./chart-util";

/**
 * Shared player legend (Messi pink / Ronaldo blue). Each entry pairs the brand
 * color with the player NAME text, so the series are distinguishable without
 * relying on color alone (a11y `color-not-only`). The `dashed` prop matches the
 * trend chart, which draws Ronaldo as a dashed line so the two series read apart
 * even in grayscale.
 */
export function ChartLegend({ dashed = false }: { dashed?: boolean }) {
  return (
    <ul
      className="flex items-center gap-3 text-[11px]"
      style={{ color: "var(--color-text-secondary)" }}
    >
      <LegendItem name={PLAYER_META.messi.name} color={CHART_COLORS.messi} dashed={false} />
      <LegendItem name={PLAYER_META.ronaldo.name} color={CHART_COLORS.ronaldo} dashed={dashed} />
    </ul>
  );
}

function LegendItem({ name, color, dashed }: { name: string; color: string; dashed: boolean }) {
  return (
    <li className="flex items-center gap-1.5">
      <span
        aria-hidden
        className="inline-block h-0.5 w-4 rounded-full"
        style={{
          background: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)`
            : color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      <span style={{ fontWeight: 600 }}>{name}</span>
    </li>
  );
}
