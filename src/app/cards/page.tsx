import type { Metadata } from "next";
import { dataSource } from "@/lib/data";
import { buildArenaModel } from "@/components/arena/arena-model";
import { CardsBattle } from "@/components/cards/cards-battle";

/**
 * The FUT COLLECTIBLE-CARD BATTLE SCREEN (P9-5, /cards). The comparison model is
 * built on the server from the real dataset (`buildArenaModel`) and handed to the
 * client `CardsBattle` shell. The two FUT cards carry FIFA-style COSMETIC ratings
 * (clearly labelled); every other figure (the category detail panel, the final
 * score) is REAL Phase-8 data via the same arena-model used by the home arena.
 */
export const metadata: Metadata = {
  title: "FUT Cards — Messi vs Ronaldo | CompareGOATs",
  description:
    "The collectible-card battle: two FUT-style cards face off, then the real numbers settle it category by category.",
};

export default function CardsPage() {
  const model = buildArenaModel(dataSource.getAllRows());

  return (
    <div className="relative overflow-hidden">
      <div className="stadium-bg studio-aura-fixed" aria-hidden />
      <CardsBattle model={model} />
    </div>
  );
}
