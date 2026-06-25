"use client";

import { Logo } from "@/components/shell/logo";
import { LanguageToggle } from "@/components/language-toggle";

/**
 * App shell header (Phase 10) — quiet top bar for the browsable app (the Verdict
 * Arena `/` and the off-path player profiles). The Phase-9 multi-section nav
 * (COMPARE / STATS / CAREERS / CARDS …) is GONE: the IA is 2 routes + 1 sheet
 * (UX.md §3), so resurrecting that nav would be "skeleton, not soul" (DESIGN
 * §6.1A). All that remains is the wordmark (home) + the language toggle.
 */
export function AppHeader() {
  return (
    <header className="relative z-40 w-full">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <LanguageToggle />
      </div>
    </header>
  );
}
