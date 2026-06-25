import { redirect } from "next/navigation";

export const metadata = {
  title: "CompareGOATs",
  robots: { index: false, follow: false },
};

/**
 * MERGED ROUTE (Phase 10). The standalone verdict/result page is gone — the
 * payoff now lives on the landing (`/`). This thin redirect preserves old deep
 * links + e2e: `/verdict?cats=…` → `/?cats=…` so the exact verdict restores on
 * the single screen.
 */
export default async function VerdictPage({
  searchParams,
}: {
  searchParams: Promise<{ cats?: string }>;
}) {
  const { cats } = await searchParams;
  redirect(cats ? `/?cats=${encodeURIComponent(cats)}` : "/");
}
