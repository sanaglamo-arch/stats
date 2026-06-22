import type { Metadata } from "next";
import { I18nProvider } from "@/lib/i18n/provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "FootyCompare — Messi vs Ronaldo",
  description: "Generate beautiful, shareable Messi vs Ronaldo comparison cards.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
