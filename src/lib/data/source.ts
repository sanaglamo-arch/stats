import type { DataSource, PlayerId, PlayerSeasonComp } from "./types";
import dataset from "@/data/dataset.json";

/**
 * Default DataSource: reads the committed dataset JSON produced by the one-shot
 * ingestion (`pnpm ingest`). The frontend reads ONLY through this interface, so
 * the source can later be swapped (live API, DB) without touching the UI.
 */

type DatasetFile = {
  generatedAt: string;
  rows: PlayerSeasonComp[];
};

const file = dataset as DatasetFile;
const ROWS: readonly PlayerSeasonComp[] = Object.freeze(file.rows);

export class JsonDataSource implements DataSource {
  getAllRows(): readonly PlayerSeasonComp[] {
    return ROWS;
  }

  getPlayerRows(player: PlayerId): readonly PlayerSeasonComp[] {
    return ROWS.filter((r) => r.player === player);
  }
}

/** Shared singleton — the canonical read path for the app. */
export const dataSource: DataSource = new JsonDataSource();

/** When the dataset was generated (for footer attribution / debugging). */
export const datasetGeneratedAt: string = file.generatedAt;
