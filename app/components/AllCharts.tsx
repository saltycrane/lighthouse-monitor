import { MetricScatterChart } from "@/components/MetricScatterPlot";
import { TAggregatedStatsRow, TMetricsRow } from "@/lib/types";

type TProps = {
  datasets: TMetricsRow[][];
  legends: string[];
  movingAverages: TMetricsRow[][];
  stats: TAggregatedStatsRow[];
};

export function AllCharts({
  datasets,
  legends,
  movingAverages,
  stats,
}: TProps) {
  return (
    <div className="space-y-6">
      <MetricScatterChart
        datasets={datasets}
        legends={legends}
        max={100}
        metric="performance_score"
        movingAverages={movingAverages}
        stats={stats}
        title="Performance Score"
      />
      <MetricScatterChart
        datasets={datasets}
        legends={legends}
        movingAverages={movingAverages}
        metric="first_contentful_paint"
        stats={stats}
        title="First Contentful Paint (sec)"
      />
      <MetricScatterChart
        datasets={datasets}
        legends={legends}
        metric="largest_contentful_paint"
        movingAverages={movingAverages}
        stats={stats}
        title="Largest Contentful Paint (sec)"
      />
      <MetricScatterChart
        datasets={datasets}
        digits={0}
        legends={legends}
        metric="total_blocking_time"
        movingAverages={movingAverages}
        stats={stats}
        title="Total Blocking Time (ms)"
      />
      <MetricScatterChart
        datasets={datasets}
        legends={legends}
        metric="cumulative_layout_shift"
        movingAverages={movingAverages}
        stats={stats}
        title="Cumulative Layout Shift"
      />
      <MetricScatterChart
        datasets={datasets}
        legends={legends}
        metric="speed_index"
        movingAverages={movingAverages}
        stats={stats}
        title="Speed Index (sec)"
      />
    </div>
  );
}
