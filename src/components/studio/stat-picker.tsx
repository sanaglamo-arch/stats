"use client";

import { useMemo } from "react";
import { ArrowDown, ArrowUp, Check, RotateCcw } from "lucide-react";
import {
  DEFAULT_METRICS,
  METRIC_CATALOG,
  METRIC_KEYS,
  type MetricGroup,
  type MetricKey,
} from "@/lib/data";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { FOCUS_RING } from "./control-primitives";

/**
 * The stat-selection block (P6-8). A tidy, hierarchical block — NOT a dropdown:
 *   - metrics grouped by `MetricGroup` (attack / creation / efficiency /
 *     discipline / trophies) as labeled chip clusters;
 *   - tapping a GROUP TITLE selects every metric in that group (a preset);
 *   - a "Default" preset resets to DEFAULT_METRICS;
 *   - the SELECTED stats are listed in card order with up/down reorder controls.
 * Toggling/reordering rewrites `slice.metrics` (ordered) — the card rebuilds from
 * it. Guards keep ≥3 metrics so the card always has rows. Illustrative metrics
 * (hatTricks) are marked subtly.
 */

const MIN_METRICS = 3;

const GROUP_ORDER: MetricGroup[] = [
  "attack",
  "creation",
  "efficiency",
  "discipline",
  "trophies",
];

const GROUP_LABEL_KEYS: Record<MetricGroup, keyof Dictionary> = {
  attack: "statGroupAttack",
  creation: "statGroupCreation",
  efficiency: "statGroupEfficiency",
  discipline: "statGroupDiscipline",
  trophies: "statGroupTrophies",
};

function metricsByGroup(): Record<MetricGroup, MetricKey[]> {
  const map: Record<MetricGroup, MetricKey[]> = {
    attack: [],
    creation: [],
    efficiency: [],
    discipline: [],
    trophies: [],
  };
  for (const key of METRIC_KEYS) map[METRIC_CATALOG[key].group].push(key);
  return map;
}

export function StatPicker({
  metrics,
  t,
  onChange,
}: {
  metrics: MetricKey[];
  t: Dictionary;
  onChange: (next: MetricKey[]) => void;
}) {
  const grouped = useMemo(metricsByGroup, []);
  const selected = useMemo(() => new Set(metrics), [metrics]);

  /** Toggle a single metric on/off, preserving order. Never drop below the min. */
  const toggle = (key: MetricKey) => {
    if (selected.has(key)) {
      if (metrics.length <= MIN_METRICS) return; // guard: keep ≥3 rows
      onChange(metrics.filter((m) => m !== key));
    } else {
      onChange([...metrics, key]);
    }
  };

  /** Group preset: ensure every metric in the group is selected (appended). */
  const selectGroup = (group: MetricGroup) => {
    const missing = grouped[group].filter((k) => !selected.has(k));
    if (missing.length === 0) return;
    onChange([...metrics, ...missing]);
  };

  const reset = () => onChange([...DEFAULT_METRICS]);

  /** Move a selected metric up/down in the ordered list. */
  const move = (key: MetricKey, dir: -1 | 1) => {
    const i = metrics.indexOf(key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= metrics.length) return;
    const next = [...metrics];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <section aria-label={t.statSelection} className="glass-panel flex flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-3">
        <h3 className="font-[family-name:var(--font-display)] text-sm font-black uppercase tracking-[0.12em] text-[var(--color-text)]">
          {t.statSelection}
        </h3>
        <button
          type="button"
          onClick={reset}
          className={`flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-border-glass)] bg-[var(--color-surface-strong)] px-3 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors duration-200 hover:text-[var(--color-text)] ${FOCUS_RING}`}
        >
          <RotateCcw size={13} aria-hidden />
          {t.statReset}
        </button>
      </header>
      <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
        {t.statSelectionHint}
      </p>

      <div className="flex flex-col gap-3.5">
        {GROUP_ORDER.map((group) => (
          <div key={group} className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => selectGroup(group)}
              className={`self-start text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-gold)] transition-opacity duration-200 hover:opacity-80 ${FOCUS_RING}`}
            >
              {t[GROUP_LABEL_KEYS[group]]}
            </button>
            <div className="flex flex-wrap gap-1.5">
              {grouped[group].map((key) => {
                const def = METRIC_CATALOG[key];
                const on = selected.has(key);
                const illustrative = def.availability === "illustrative";
                const lockedOff = on && metrics.length <= MIN_METRICS;
                return (
                  <button
                    key={key}
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-disabled={lockedOff}
                    onClick={() => toggle(key)}
                    title={illustrative ? t.illustrativeCaption : def.definition}
                    className={`flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors duration-200 ${FOCUS_RING} ${
                      on
                        ? "border-[var(--color-gold)] bg-[color-mix(in_srgb,var(--color-gold)_18%,transparent)] text-[var(--color-text)]"
                        : "border-[var(--color-border-glass)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    {on && <Check size={13} aria-hidden className="text-[var(--color-gold)]" />}
                    {t[def.labelKey]}
                    {illustrative && (
                      <span
                        aria-hidden
                        className="ml-0.5 rounded-sm bg-[var(--color-surface-strong)] px-1 text-[0.6rem] uppercase tracking-wide text-[var(--color-text-muted)]"
                      >
                        {t.illustrative}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Ordered, reorderable list of the selected stats (the card row order). */}
      <div className="flex flex-col gap-1.5 border-t border-[var(--color-border-glass)] pt-3">
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
          {t.statSelected} · {metrics.length}
        </span>
        <ol className="flex flex-col gap-1">
          {metrics.map((key, i) => (
            <li
              key={key}
              className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)] py-0.5 pl-2.5 pr-1"
            >
              <span className="truncate text-xs font-medium text-[var(--color-text)]">
                <span className="tabular mr-2 text-[var(--color-text-muted)]">{i + 1}</span>
                {t[METRIC_CATALOG[key].labelKey]}
              </span>
              <span className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => move(key, -1)}
                  disabled={i === 0}
                  aria-label={`${t.statMoveUp}: ${t[METRIC_CATALOG[key].labelKey]}`}
                  className={`flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] transition-colors duration-200 hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-30 ${FOCUS_RING} ${
                    i === 0 ? "" : "cursor-pointer"
                  }`}
                >
                  <ArrowUp size={14} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => move(key, 1)}
                  disabled={i === metrics.length - 1}
                  aria-label={`${t.statMoveDown}: ${t[METRIC_CATALOG[key].labelKey]}`}
                  className={`flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] transition-colors duration-200 hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-30 ${FOCUS_RING} ${
                    i === metrics.length - 1 ? "" : "cursor-pointer"
                  }`}
                >
                  <ArrowDown size={14} aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ol>
        {metrics.length <= MIN_METRICS && (
          <p className="text-xs text-[var(--color-text-muted)]">{t.statMinHint}</p>
        )}
      </div>
    </section>
  );
}
