export type TAggregatedStatsRow = {
  host: string;
  pathname: string;
  is_cached: boolean;
  mean_performance: number;
  mean_fcp: number;
  mean_lcp: number;
  mean_tbt: number;
  mean_cls: number;
  mean_si: number;
  std_performance: number;
  std_fcp: number;
  std_lcp: number;
  std_tbt: number;
  std_cls: number;
  std_si: number;
};

export type TAggregatedStatKey = Exclude<
  keyof TAggregatedStatsRow,
  "host" | "pathname" | "is_cached"
>;

export type THostRow = {
  id: number;
  is_active: boolean;
  host: string;
};

export type TLighthouseMetrics = {
  host: string;
  pathname: string;
  runNumber: number;
  performanceScore: number | null;
  firstContentfulPaintSec: number | null;
  largestContentfulPaintSec: number | null;
  totalBlockingTimeMs: number | null;
  cumulativeLayoutShift: number | null;
  speedIndexSec: number | null;
};

export type TMetricKey = Exclude<
  keyof TMetricsRow,
  "host" | "pathname" | "is_cached" | "timestamp"
>;

export type TMetricsRow = {
  host: string;
  pathname: string;
  is_cached: boolean;
  performance_score: number;
  first_contentful_paint: number;
  largest_contentful_paint: number;
  total_blocking_time: number;
  cumulative_layout_shift: number;
  speed_index: number;
  timestamp: string;
};

export type TPathnameRow = {
  id: number;
  is_active: boolean;
  pathname: string;
};
