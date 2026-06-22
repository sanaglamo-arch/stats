"use client";

import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/lib/i18n/provider";

export default function HomePage() {
  const { t } = useI18n();

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <header className="flex w-full items-center justify-between">
        <span
          className="font-[family-name:var(--font-display)] text-lg font-bold tracking-widest"
          style={{ color: "var(--color-gold)" }}
        >
          {t.appName}
        </span>
        <LanguageToggle />
      </header>

      <div className="flex flex-col items-center gap-6">
        <h1 className="font-[family-name:var(--font-display)] text-5xl font-black tracking-tight sm:text-6xl">
          <span style={{ color: "var(--color-messi)" }}>MESSI</span>
          <span className="mx-4" style={{ color: "var(--color-text-secondary)" }}>
            {t.vs}
          </span>
          <span style={{ color: "var(--color-ronaldo)" }}>RONALDO</span>
        </h1>
        <p className="max-w-md text-lg text-[var(--color-text-secondary)]">{t.tagline}</p>
      </div>

      <section className="glass tabular w-full max-w-sm rounded-[var(--radius-xl)] p-8">
        <p className="text-[var(--color-text-secondary)]">{t.buildingSoon}</p>
      </section>
    </main>
  );
}
