import { dataSource, datasetGeneratedAt } from "@/lib/data";
import { buildArenaModel } from "@/components/arena/arena-model";
import { Arena } from "@/components/arena/arena";
import { buildStatsBodyModel } from "@/components/stats/stats-model";
import { StatsBody } from "@/components/stats/stats-body";

/**
 * The VERDICT ARENA home (Phase 10) — the whole product on one screen. The
 * comparison model is built on the server from the real dataset
 * (`dataSource.getAllRows()` → `buildArenaModel`) and handed to the client
 * `Arena`, which owns the floodlit atmosphere, the render-clash hero + verdict
 * score, the inline category breakdown/selection, the winner toggle and the
 * single Share CTA. The merged-away routes (/compare, /verdict) redirect here;
 * /player/[id] and the demoted /cards stay reachable off-path.
 */
export default function HomePage() {
  const rows = dataSource.getAllRows();
  const model = buildArenaModel(rows);
  // Phase 11 (p11-2): the comprehensive stats body, server-built from the same
  // rows via the existing selectors, rendered BELOW the untouched arena hook.
  const statsModel = buildStatsBodyModel(rows);

  return (
    <>
      <Arena model={model} accurateAsOf={datasetGeneratedAt} />
      <StatsBody model={statsModel} />
    </>
  );
}
