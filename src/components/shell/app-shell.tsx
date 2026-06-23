"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/shell/app-header";
import { AppFooter } from "@/components/shell/app-footer";

/**
 * Shell chrome wrapper (P9-1). Renders the on-brand header + footer around the
 * page content for the browsable app (home, player profiles, …).
 *
 * CRITICAL: the `/render/*` segment is the headless PNG target — it must stay
 * chrome-free so a Playwright screenshot is a pixel-perfect card. Because App
 * Router layouts NEST (render/layout sits inside the root layout), we can't rely
 * on the nested layout to strip the shell; instead we detect the render route
 * here and skip the chrome entirely, rendering the bare children.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRenderRoute = pathname?.startsWith("/render");

  if (isRenderRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <div className="flex-1">{children}</div>
      <AppFooter />
    </div>
  );
}
