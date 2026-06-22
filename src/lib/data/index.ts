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
  IllustrativePositional,
  IllustrativeShot,
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
  MetricGroup,
  MetricFormat,
  MetricAvailability,
  MetricKey,
  MetricDef,
  SeasonTrendPoint,
  SeasonTrendOptions,
} from "./aggregate";

export {
  rowsForPlayer,
  filterByCompetition,
  filterByCompetitions,
  selectSeasons,
  sliceRows,
  aggregate,
  deriveMetrics,
  buildCardStat,
  buildCardStats,
  metricValue,
  compare,
  seasonTrend,
  METRIC_CATALOG,
  METRIC_KEYS,
  DEFAULT_METRICS,
} from "./aggregate";

export { getIllustrativePositional, HEATMAP_ROWS, HEATMAP_COLS } from "./positional";
