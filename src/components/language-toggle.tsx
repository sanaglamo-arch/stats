"use client";

import { LOCALES, type Locale } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/provider";
import { FOCUS_RING } from "@/components/studio/control-primitives";

const LABELS: Record<Locale, string> = {
  en: "EN",
  ru: "RU",
};

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className="glass inline-flex items-center gap-1 rounded-full p-1"
      role="group"
      aria-label={t.language}
    >
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            className={`min-h-[44px] min-w-[44px] cursor-pointer rounded-full px-3 text-sm font-semibold transition-colors duration-200 ${FOCUS_RING} ${
              active
                ? "bg-[var(--color-surface-strong)] text-[var(--color-text)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            {LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
