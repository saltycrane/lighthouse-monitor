import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { TMetricsRow, TMetricKey } from "@/lib/types";
import { LocalDateTime } from "./LocalDateTime";

type TProps = {
  metrics: TMetricsRow[];
};

// Helper function to calculate statistics
const calculateStats = (values: number[]) => {
  // Sort values for percentile calculations
  const sortedValues = [...values].sort((a, b) => a - b);

  // Calculate median (50th percentile)
  const medianIndex = Math.floor(sortedValues.length / 2);
  const median =
    sortedValues.length % 2 === 0
      ? (sortedValues[medianIndex - 1] + sortedValues[medianIndex]) / 2
      : sortedValues[medianIndex];

  // Calculate 75th percentile
  const p75Index = Math.floor(sortedValues.length * 0.75);
  const p75 = sortedValues[p75Index];

  // Calculate 25th percentile
  const p25Index = Math.floor(sortedValues.length * 0.25);
  const p25 = sortedValues[p25Index];

  // Calculate mean
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;

  // Calculate standard deviation
  const squaredDifferences = values.map((val) => Math.pow(val - mean, 2));
  const variance =
    squaredDifferences.reduce((acc, val) => acc + val, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Min and max
  const min = sortedValues[0];
  const max = sortedValues[sortedValues.length - 1];

  // Count
  const count = values.length;

  return {
    median,
    p25,
    p75,
    stdDev,
    min,
    max,
    count,
  };
};

// Format numbers for display
const formatValue = (value: number, metric: TMetricKey) => {
  if (metric === "performance_score" || metric === "total_blocking_time") {
    return value.toFixed(0);
  } else if (metric === "cumulative_layout_shift") {
    return value.toFixed(3);
  } else {
    return value.toFixed(1);
  }
};

export function QaAggregatedMetrics({ metrics }: TProps) {
  // Define the metrics we want to show statistics for
  const metricKeys: TMetricKey[] = [
    "performance_score",
    "first_contentful_paint",
    "largest_contentful_paint",
    "total_blocking_time",
    "cumulative_layout_shift",
    "speed_index",
  ];

  // Display names for the metrics
  const metricDisplayNames: Record<TMetricKey, string> = {
    performance_score: "Performance Score",
    first_contentful_paint: "First Contentful Paint (s)",
    largest_contentful_paint: "Largest Contentful Paint (s)",
    total_blocking_time: "Total Blocking Time (ms)",
    cumulative_layout_shift: "Cumulative Layout Shift",
    speed_index: "Speed Index (s)",
    interaction_to_next_paint: "INP (ms)",
  };

  // Calculate statistics for each metric
  const stats = metricKeys.reduce(
    (acc, metric) => {
      const values = metrics
        .map((row) => row[metric])
        .filter((val): val is number => val !== null && !isNaN(val));

      if (values.length > 0) {
        acc[metric] = calculateStats(values);
      } else {
        acc[metric] = null;
      }

      return acc;
    },
    {} as Record<TMetricKey, ReturnType<typeof calculateStats> | null>,
  );

  // Get time span of the data
  const timeSpanInfo =
    metrics.length > 0
      ? (() => {
          const timestamps = metrics.map((m) => m.timestamp).sort();
          return {
            earliest: timestamps[0],
            latest: timestamps[timestamps.length - 1],
          };
        })()
      : null;

  if (metrics.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-2" />
        <CardContent>
          <p>No metrics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2" />
      <CardContent>
        <div className="flex justify-between">
          {timeSpanInfo && (
            <div className="">
              Timespan:{" "}
              <LocalDateTime
                format="EEE M/d h:mm aaa"
                utcDateTimeStr={timeSpanInfo.earliest}
              />{" "}
              &ndash;{" "}
              <LocalDateTime
                format="EEE M/d h:mm aaa (OOOO)"
                utcDateTimeStr={timeSpanInfo.latest}
              />
            </div>
          )}
          <div className="mb-4">Count: {metrics.length}</div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead>Median</TableHead>
              <TableHead>75th %</TableHead>
              <TableHead>Std Dev</TableHead>
              <TableHead>Min</TableHead>
              <TableHead>Max</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metricKeys.map((metric) => {
              const metricStats = stats[metric];
              if (!metricStats) {
                return null;
              }
              return (
                <TableRow key={metric}>
                  <TableCell>{metricDisplayNames[metric]}</TableCell>
                  <TableCell>
                    {formatValue(metricStats.median, metric)}
                  </TableCell>
                  <TableCell>
                    {formatValue(
                      metric === "performance_score"
                        ? metricStats.p25
                        : metricStats.p75,
                      metric,
                    )}
                    {metric === "performance_score" ? " *" : ""}
                  </TableCell>
                  <TableCell>
                    {formatValue(metricStats.stdDev, metric)}
                  </TableCell>
                  <TableCell>{formatValue(metricStats.min, metric)}</TableCell>
                  <TableCell>{formatValue(metricStats.max, metric)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="mt-2">
          <small>* Performance score shows 25th %</small>
        </div>
      </CardContent>
    </Card>
  );
}
