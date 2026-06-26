import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { dataSource } from "@/lib/data";
import { CompareView } from "@/components/compare/compare-view";

/**
 * `/compare` — the DEEP HEAD-TO-HEAD (Phase 11 p11-4). Repurposed from the old
 * Phase-10 redirect. Bare `/compare` (and the new `?comp= ?view= ?metric=`
 * params) renders the exhaustive, READ-ONLY Messi-vs-Ronaldo view.
 *
 * BACKWARD COMPAT: an old verdict-selection share link (`?cats=…`) is still
 * redirected to `/?cats=…` so every legacy link keeps working — the category
 * selection belongs on the arena, never here.
 */

export const metadata: Metadata = {
  title: "Deep head-to-head — Messi vs Ronaldo · CompareGOATs",
  description:
    "Every metric, every season and every competition for Messi and Ronaldo, side by side with deltas, who-leads markers and same-age curves. Read-only — the verdict lives on the arena.",
  alternates: { canonical: "/compare" },
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ cats?: string; comp?: string; view?: string; metric?: string }>;
}) {
  const { cats, comp, view, metric } = await searchParams;

  // Legacy verdict-selection links stay on the arena.
  if (cats) {
    redirect(`/?cats=${encodeURIComponent(cats)}`);
  }

  const rows = [...dataSource.getAllRows()];

  return (
    <CompareView
      rows={rows}
      initialComp={comp ?? "all"}
      initialView={view ?? "season"}
      initialMetric={metric ?? "goals"}
    />
  );
}
