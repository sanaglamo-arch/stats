import type { Metadata } from "next";
import { dataSource } from "@/lib/data";
import { buildArenaModel } from "@/components/arena/arena-model";
import { CompareSelector } from "@/components/arena/compare-selector";

export const metadata: Metadata = {
  title: "Choose Categories — CompareGOATs",
  description:
    "Pick the categories that decide the Messi vs Ronaldo comparison, then see the verdict by the numbers.",
};

/**
 * CATEGORY SELECTION route (P9-3) — step 1 of the guided flow. The full Arena
 * model is built on the server from the real dataset (same source as the home
 * Arena); the client `CompareSelector` only needs the category list (key, label,
 * icon) to render the togglable grid. The selection is round-tripped into
 * `/verdict?cats=<keys>` on submit. Header/footer come from the app shell.
 */
export default function ComparePage() {
  const model = buildArenaModel(dataSource.getAllRows());

  return (
    <div className="relative overflow-hidden">
      <div className="studio-aura-fixed" aria-hidden />
      <CompareSelector categories={model.categories} />
    </div>
  );
}
