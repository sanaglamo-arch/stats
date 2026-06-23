"use client";

import { useRef } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { CATEGORY_ICONS } from "./arena-icons";
import type { ArenaCategory, CategoryKey } from "./arena-model";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]";

/**
 * The category tab bar — a real WAI-ARIA tablist (roving focus, Arrow/Home/End
 * keys, `aria-selected`). Each tab is icon + label, one consistent icon family.
 * Selecting a tab swaps the comparison panel below (managed by the parent).
 */
export function CategoryTabs({
  categories,
  active,
  onSelect,
}: {
  categories: ArenaCategory[];
  active: CategoryKey;
  onSelect: (key: CategoryKey) => void;
}) {
  const { t } = useI18n();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function focusAt(index: number) {
    const clamped = (index + categories.length) % categories.length;
    const key = categories[clamped].key;
    tabRefs.current[key]?.focus();
    onSelect(key);
  }

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusAt(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusAt(index - 1);
        break;
      case "Home":
        e.preventDefault();
        focusAt(0);
        break;
      case "End":
        e.preventDefault();
        focusAt(categories.length - 1);
        break;
    }
  }

  return (
    <div
      role="tablist"
      aria-label={t.arenaCategories}
      className="glass-panel flex flex-wrap items-stretch gap-1 p-2"
    >
      {categories.map((cat, i) => {
        const Icon = CATEGORY_ICONS[cat.icon];
        const selected = cat.key === active;
        return (
          <button
            key={cat.key}
            ref={(el) => {
              tabRefs.current[cat.key] = el;
            }}
            role="tab"
            id={`arena-tab-${cat.key}`}
            aria-selected={selected}
            aria-controls={`arena-panel-${cat.key}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(cat.key)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`group flex flex-1 basis-[5.5rem] flex-col items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-2.5 text-center transition-colors duration-200 ${FOCUS_RING} ${
              selected
                ? "bg-[var(--color-surface-strong)] text-[var(--color-text)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
            }`}
            style={
              selected
                ? { boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-gold) 55%, transparent)" }
                : undefined
            }
          >
            <Icon
              size={22}
              aria-hidden
              strokeWidth={1.75}
              style={selected ? { color: "var(--color-gold)" } : undefined}
            />
            <span className="text-[11px] font-semibold leading-tight">{t[cat.labelKey]}</span>
          </button>
        );
      })}
    </div>
  );
}
