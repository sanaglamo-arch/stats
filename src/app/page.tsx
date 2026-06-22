"use client";

import { LanguageToggle } from "@/components/language-toggle";
import { Studio } from "@/components/studio/studio";
import { useI18n } from "@/lib/i18n/provider";

export default function HomePage() {
  const { t } = useI18n();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span
            className="font-[family-name:var(--font-display)] text-lg font-bold tracking-widest"
            style={{ color: "var(--color-gold)" }}
          >
            {t.appName}
          </span>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-tight sm:text-3xl">
            <span style={{ color: "var(--color-messi)" }}>MESSI</span>
            <span className="mx-3" style={{ color: "var(--color-text-secondary)" }}>
              {t.vs}
            </span>
            <span style={{ color: "var(--color-ronaldo)" }}>RONALDO</span>
          </h1>
        </div>
        <LanguageToggle />
      </header>

      <Studio />
    </main>
  );
}
