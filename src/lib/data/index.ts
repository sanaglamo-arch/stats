/** Public data-layer surface for later phases (card + UI). */
export type {
  PlayerId,
  CompetitionType,
  PlayerSeasonComp,
  DataSource,
  IngestionAdapter,
  AdapterResult,
  AdapterId,
  RowProvenance,
} from "./types";

export { dataSource, datasetGeneratedAt, JsonDataSource } from "./source";

export type {
  CompetitionFilter,
  SeasonSelection,
  SliceOptions,
  AggregateTotals,
  DerivedMetrics,
  CardStat,
  CardStatKey,
  CategoryWinner,
  ComparisonResult,
} from "./aggregate";

export {
  rowsForPlayer,
  filterByCompetition,
  selectSeasons,
  sliceRows,
  aggregate,
  deriveMetrics,
  buildCardStats,
  compare,
} from "./aggregate";
