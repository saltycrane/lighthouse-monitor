import { MetricScatterChart } from "@/components/MetricScatterPlot";
import { TPlotData } from "@/lib/types";

type TProps = {
  data: TPlotData;
};

export function AllPlots({ data }: TProps) {
  return (
    <div className="space-y-6 mb-6">
      <MetricScatterChart
        data={data}
        digits={0}
        metric="performance_score"
        title="Performance Score"
      />
      <MetricScatterChart
        data={data}
        metric="first_contentful_paint"
        title="First Contentful Paint (s)"
      />
      <MetricScatterChart
        data={data}
        metric="largest_contentful_paint"
        title="Largest Contentful Paint (s)"
      />
      <MetricScatterChart
        data={data}
        digits={0}
        metric="total_blocking_time"
        title="Total Blocking Time (ms)"
      />
      <MetricScatterChart
        data={data}
        digits={3}
        metric="cumulative_layout_shift"
        title="Cumulative Layout Shift"
      />
      <MetricScatterChart
        data={data}
        metric="speed_index"
        title="Speed Index (s)"
      />
    </div>
  );
}
