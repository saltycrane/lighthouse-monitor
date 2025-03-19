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
  mean_inp: number;
  std_performance: number;
  std_fcp: number;
  std_lcp: number;
  std_tbt: number;
  std_cls: number;
  std_si: number;
  std_inp: number;
};

export type TAggregatedStatKey = Exclude<
  keyof TAggregatedStatsRow,
  "host" | "pathname" | "is_cached"
>;

export type TBrowserEnv = "puppeteer" | "chrome-launcher";

export type TCacheStatus = "combined" | "cached" | "uncached";

export type TFilterParams = {
  host?: string;
  isCached?: boolean;
  pathname?: string;
  timespanHours?: number;
};

export type THostRow = {
  id: number;
  is_active: boolean;
  host: string;
};

export type TLighthouseMetrics = {
  host: string;
  pathname: string;
  isCached: boolean;
  browserEnv: string | null;
  performanceScore: number | null;
  firstContentfulPaintSec: number | null;
  largestContentfulPaintSec: number | null;
  totalBlockingTimeMs: number | null;
  cumulativeLayoutShift: number | null;
  speedIndexSec: number | null;
  interactionToNextPaintMs: number | null;
  htmlReportS3Key: string | null;
};

export type TMetricKey = Exclude<
  keyof TMetricsRow,
  | "host"
  | "pathname"
  | "is_cached"
  | "timestamp"
  | "browser_env"
  | "html_report_s3_key"
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
  interaction_to_next_paint: number;
  browser_env: string | null;
  timestamp: string;
  html_report_s3_key: string | null;
};

export type TPathnameRow = {
  id: number;
  is_active: boolean;
  pathname: string;
};

export type TPlotData = {
  [host: string | null]: {
    [pathname: string | null]: {
      [K in TCacheStatus]?: {
        averages: TMetricsRow[];
        metrics: TMetricsRow[];
        stats: TAggregatedStatsRow;
      };
    };
  };
};

export type TRouteParams = Promise<{ host: string } | { pathname: string }>;

export type TQaSearchParams = Promise<{
  host1?: string;
  host2?: string;
  pathname1?: string;
  pathname2?: string;
}>;

export type TSearchParams = Promise<{
  combineCached?: string;
  hideCached?: string;
  hideUncached?: string;
  hosts?: string;
  pathnames?: string;
  timespan?: string;
}>;
