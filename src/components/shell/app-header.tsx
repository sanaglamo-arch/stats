"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Star, X } from "lucide-react";
import { Logo } from "@/components/shell/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/lib/i18n/provider";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { FOCUS_RING } from "@/components/studio/control-primitives";

/**
 * App shell header (P9-1) — the on-brand top bar shared by the home and player
 * pages (NOT the /render/card route, which keeps its own chrome-free layout).
 *
 *   Logo (crown + CompareGOATs)  ·  nav  ·  myArena pill + EN/RU + mobile menu
 *
 * Nav targets: "Compare" anchors back to the studio on the home page; the other
 * sections are forward-declared as home anchors so the bar is wired and stable
 * — later phases give them dedicated routes. Glass + gold accents per the refs.
 */

type NavItem = { key: keyof Dictionary; href: string };

const NAV: readonly NavItem[] = [
  { key: "navCompare", href: "/#studio" },
  { key: "navStats", href: "/#insights" },
  { key: "navCards", href: "/cards" },
  { key: "navCareers", href: "/player/messi" },
  { key: "navAwards", href: "/#verdict" },
  { key: "navAbout", href: "/#about" },
];

export function AppHeader() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass border-b border-[var(--color-border-glass)]">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />

          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium uppercase tracking-wide text-[var(--color-text-secondary)] transition-colors duration-200 hover:text-[var(--color-text)] ${FOCUS_RING}`}
              >
                {t[item.key]}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/#studio"
              className={`hidden items-center gap-1.5 rounded-full border border-[var(--color-gold)] bg-[rgba(245,180,60,0.08)] px-3.5 py-2 text-sm font-semibold text-[var(--color-gold-bright)] transition-colors duration-200 hover:bg-[rgba(245,180,60,0.16)] sm:inline-flex ${FOCUS_RING}`}
            >
              <Star className="h-4 w-4" aria-hidden />
              {t.myArena}
            </Link>

            <div className="hidden sm:block">
              <LanguageToggle />
            </div>

            <button
              type="button"
              aria-label={open ? t.closeMenu : t.menu}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
              className={`glass inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-text)] lg:hidden ${FOCUS_RING}`}
            >
              {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="glass-panel mx-auto mt-2 flex w-[calc(100%-2rem)] max-w-6xl flex-col gap-1 rounded-2xl p-3 lg:hidden"
        >
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-3 text-base font-medium uppercase tracking-wide text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] ${FOCUS_RING}`}
            >
              {t[item.key]}
            </Link>
          ))}
          <Link
            href="/#studio"
            onClick={() => setOpen(false)}
            className={`mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--color-gold)] bg-[rgba(245,180,60,0.1)] px-3 py-3 text-base font-semibold text-[var(--color-gold-bright)] ${FOCUS_RING}`}
          >
            <Star className="h-4 w-4" aria-hidden />
            {t.myArena}
          </Link>
          <div className="mt-2 px-1">
            <LanguageToggle />
          </div>
        </nav>
      )}
    </header>
  );
}
