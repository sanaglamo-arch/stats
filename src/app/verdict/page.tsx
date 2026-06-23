import type { Metadata } from "next";
import { dataSource } from "@/lib/data";
import {
  buildArenaModel,
  parseCategoryParam,
  selectVerdict,
} from "@/components/arena/arena-model";
import { VerdictResult } from "@/components/arena/verdict-result";

export const metadata: Metadata = {
  title: "Final Verdict — CompareGOATs",
  description:
    "The Messi vs Ronaldo verdict by the numbers — category breakdown, final score and a shareable summary.",
};

/**
 * VERDICT / RESULT route (P9-4) — step 2 of the guided flow. Reads `?cats=`
 * (comma-separated category keys), validates it against the known keys
 * (unknown/empty/too-few falls back to ALL), then recomputes the verdict over
 * EXACTLY that subset from the same real Arena model. The selection stays
 * round-trippable/sharable in the URL. Header/footer come from the app shell.
 */
export default async function VerdictPage({
  searchParams,
}: {
  searchParams: Promise<{ cats?: string }>;
}) {
  const { cats } = await searchParams;
  const selectedKeys = parseCategoryParam(cats ?? null);

  const model = buildArenaModel(dataSource.getAllRows());
  const { categories, verdict } = selectVerdict(model, selectedKeys);

  return (
    <div className="relative overflow-hidden">
      <div className="studio-aura-fixed" aria-hidden />
      <VerdictResult categories={categories} verdict={verdict} selectedKeys={selectedKeys} />
    </div>
  );
}
