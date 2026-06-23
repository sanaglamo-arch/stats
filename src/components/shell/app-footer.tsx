"use client";

import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shell/logo";
import { useI18n } from "@/lib/i18n/provider";
import { datasetGeneratedAt } from "@/lib/data";

/**
 * App shell footer (P9-1) — brand mark + the dataset-accuracy line required by
 * SPEC honesty rules:
 *
 *   "All stats accurate as of <datasetGeneratedAt> · club + country across all
 *    competitions"
 *
 * `datasetGeneratedAt` is the single source of truth from the data layer, so the
 * date never drifts from the shipped dataset. Localised, formatted per locale.
 */
export function AppFooter() {
  const { t, locale } = useI18n();

  const date = new Date(datasetGeneratedAt).toLocaleDateString(
    locale === "ru" ? "ru-RU" : "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <footer className="relative z-10 border-t border-[var(--color-border-glass)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center sm:px-6">
        <Logo />
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t.footerNote}</p>
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-[var(--color-text-secondary)]">
          <ShieldCheck className="h-4 w-4 text-[var(--color-gold)]" aria-hidden />
          <span className="tabular">{t.footerAccurate.replace("{date}", date)}</span>
          <span aria-hidden className="text-[var(--color-text-muted)]">
            ·
          </span>
          <span>{t.footerScope}</span>
        </p>
      </div>
    </footer>
  );
}
