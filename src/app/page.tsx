import { dataSource, datasetGeneratedAt } from "@/lib/data";
import { buildArenaModel } from "@/components/arena/arena-model";
import { Arena } from "@/components/arena/arena";

/**
 * The flagship HOME ARENA (P9-2). The comparison model is built on the server
 * from the real dataset (`dataSource.getAllRows()` → `buildArenaModel`, which
 * composes the existing aggregators) and handed to the client `Arena` for the
 * interactive shell (category tabs, the Show-winner toggle). The old hero+studio
 * home content is retired here; the Studio/card/profile routes stay intact for
 * the share-card flow.
 */
export default function HomePage() {
  const model = buildArenaModel(dataSource.getAllRows());

  return (
    <div className="relative overflow-hidden">
      <div className="studio-aura-fixed" aria-hidden />
      <Arena model={model} accurateAsOf={datasetGeneratedAt} />
    </div>
  );
}
