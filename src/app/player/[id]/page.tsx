import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dataSource, type PlayerId } from "@/lib/data";
import { PLAYER_META } from "@/components/card";
import { buildPlayerProfile } from "@/components/player/profile-model";
import { ProfileView } from "@/components/player/profile-view";

/**
 * Player profile page (P7-5) — each player's PERSONAL statistics, read-only from
 * the data layer. `id` is constrained to the two fixed players; anything else is
 * a 404 (`notFound`). The two ids are pre-rendered via `generateStaticParams`.
 */

const PLAYER_IDS: readonly PlayerId[] = ["messi", "ronaldo"];

function isPlayerId(id: string): id is PlayerId {
  return (PLAYER_IDS as readonly string[]).includes(id);
}

export function generateStaticParams(): { id: PlayerId }[] {
  return PLAYER_IDS.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isPlayerId(id)) {
    return { title: "CompareGOATs" };
  }
  const meta = PLAYER_META[id];
  return {
    title: `${meta.name} — Career stats · CompareGOATs`,
    description: `${meta.name}'s career totals, season-by-season output, competition breakdown and honours.`,
  };
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isPlayerId(id)) {
    notFound();
  }

  const rows = [...dataSource.getAllRows()];
  const profile = buildPlayerProfile(rows, id);
  return <ProfileView profile={profile} rows={rows} />;
}
