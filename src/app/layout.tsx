import type { Metadata } from "next";
import { I18nProvider } from "@/lib/i18n/provider";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { AppShell } from "@/components/shell/app-shell";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const TITLE = "CompareGOATs — Messi vs Ronaldo, GOAT by the numbers";
const DESCRIPTION =
  "Compare Lionel Messi and Cristiano Ronaldo across every season and competition — career stats, honours and a shareable verdict card. Settle the GOAT debate by the numbers.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "CompareGOATs",
  alternates: { canonical: "/" },
  // og:image + twitter:image are injected automatically from the file-based
  // app/opengraph-image.tsx + app/twitter-image.tsx routes.
  openGraph: {
    type: "website",
    siteName: "CompareGOATs",
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
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
