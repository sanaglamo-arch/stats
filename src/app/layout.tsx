import type { Metadata } from "next";
import { I18nProvider } from "@/lib/i18n/provider";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { AppShell } from "@/components/shell/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "CompareGOATs — Messi vs Ronaldo, GOAT by the numbers",
  description:
    "Compare Lionel Messi and Cristiano Ronaldo across every season and competition — career stats, honours and a shareable verdict card. Settle the GOAT debate by the numbers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <SmoothScroll>
            <AppShell>{children}</AppShell>
          </SmoothScroll>
        </I18nProvider>
      </body>
    </html>
  );
}
