import { redirect } from "next/navigation";

export const metadata = {
  title: "CompareGOATs",
  robots: { index: false, follow: false },
};

/**
 * MERGED ROUTE (Phase 10). The standalone category-picker is gone — its function
 * is now an inline affordance on the single Verdict Arena (`/`). This thin
 * redirect preserves old deep links + e2e: `/compare?cats=…` → `/?cats=…` so the
 * selection still restores on the merged screen.
 */
export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ cats?: string }>;
}) {
  const { cats } = await searchParams;
  redirect(cats ? `/?cats=${encodeURIComponent(cats)}` : "/");
}
