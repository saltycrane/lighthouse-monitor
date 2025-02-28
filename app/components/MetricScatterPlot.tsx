"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Scatter } from "react-chartjs-2";

import { Card } from "@/components/ui/card";
import { formatDateTime, utcToLocal } from "@/lib/dates";
import {
  TAggregatedStatKey,
  TAggregatedStatsRow,
  TMetricKey,
  TMetricsRow,
} from "@/lib/types";

/**
 * Register
 */
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
);

/**
 * Constants
 */
const COLORS = [
  {
    backgroundColor: "rgb(255, 159, 64, 0.8)",
    borderColor: "rgb(255, 159, 64)",
  },
  {
    backgroundColor: "rgba(53, 162, 235, 0.8)",
    borderColor: "rgb(53, 162, 235)",
  },
  {
    backgroundColor: "rgba(255, 99, 132, 0.8)",
    borderColor: "rgb(255, 99, 132)",
  },
  {
    backgroundColor: "rgb(75, 192, 192, 0.8)",
    borderColor: "rgb(75, 192, 192)",
  },
  {
    backgroundColor: "rgb(153, 102, 255, 0.8)",
    borderColor: "rgb(153, 102, 255)",
  },
];

const MEAN_KEY_MAP: Record<TMetricKey, TAggregatedStatKey> = {
  performance_score: "mean_performance",
  first_contentful_paint: "mean_fcp",
  largest_contentful_paint: "mean_lcp",
  total_blocking_time: "mean_tbt",
  cumulative_layout_shift: "mean_cls",
  speed_index: "mean_si",
};

const STD_DEV_KEY_MAP: Record<TMetricKey, TAggregatedStatKey> = {
  performance_score: "std_performance",
  first_contentful_paint: "std_fcp",
  largest_contentful_paint: "std_lcp",
  total_blocking_time: "std_tbt",
  cumulative_layout_shift: "std_cls",
  speed_index: "std_si",
};

/**
 * MetricsScatterChart
 */
type TProps = {
  datasets: Array<Array<TMetricsRow>>;
  digits?: number;
  legends: string[];
  max?: number | "auto";
  metric: TMetricKey;
  min?: number;
  movingAverages: Array<Array<TMetricsRow>>;
  stats: TAggregatedStatsRow[];
  title: string;
};

export function MetricScatterChart({
  datasets,
  digits = 1,
  legends,
  max: maxFromProps = "auto",
  metric: metricFromProps,
  min,
  movingAverages,
  stats,
  title,
}: TProps) {
  let max: number;
  if (maxFromProps === "auto") {
    max = datasets.reduce((memo, metrics) => {
      const maxForDataset = Math.max(...metrics.map((m) => m[metricFromProps]));
      return Math.max(memo, maxForDataset);
    }, 0);
  } else {
    max = maxFromProps;
  }

  return (
    <Card className="h-[600px] p-4">
      <Scatter
        options={createOptions({
          max,
          min,
          title,
          yAxisPadding: maxFromProps === "auto" ? 0.1 : 0,
        })}
        data={{
          datasets: [
            ...datasets.map((metrics, i) => {
              const mean =
                stats[i][MEAN_KEY_MAP[metricFromProps]].toFixed(digits);
              const stdDev =
                stats[i][STD_DEV_KEY_MAP[metricFromProps]].toFixed(digits);
              return {
                ...COLORS[i],
                label: `${legends[i]} ${mean} ± ${stdDev}`,
                data: metrics.map((m) => ({
                  x: utcToLocal(m.timestamp),
                  y: m[metricFromProps],
                  metrics: m,
                })),
              };
            }),
            ...movingAverages.map((metrics, i) => ({
              ...COLORS[i],
              label: null, // hide moving average in legend
              data: metrics.map((m) => ({
                x: utcToLocal(m.timestamp),
                y: m[metricFromProps],
              })),
              showLine: true,
              pointRadius: 0,
              borderWidth: 2,
            })),
          ],
        }}
      />
    </Card>
  );
}

/**
 * createOptions
 */
type TCreateOptionsArg = {
  max: number;
  min?: number;
  title: string;
  yAxisPadding?: number;
};

const createOptions = ({
  max,
  min = 0,
  title,
  yAxisPadding = 0.1,
}: TCreateOptionsArg): ChartOptions<"scatter"> => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      type: "time",
      time: {
        displayFormats: {
          minute: "MM-dd HH:mm",
          hour: "MM-dd HH:mm",
          day: "MM-dd HH:mm",
          month: "MM-dd HH:mm",
          year: "MM-dd HH:mm",
        },
      },
      title: {
        display: true,
        text: "Time",
      },
    },
    y: {
      beginAtZero: true,
      min,
      max: max * (1 + yAxisPadding),
      title: {
        display: true,
        text: title,
      },
    },
  },
  plugins: {
    title: {
      display: true,
      text: `${title} (lines show 4h moving average)`,
    },
    legend: {
      position: "top",
      labels: {
        filter: (item) => !!item.text,
      },
    },
    tooltip: {
      callbacks: {
        title: (context) => formatDateTime((context[0].raw as any).x),
        label: (context) => {
          const point = context.raw as any;
          return [
            `${title}: ${point.y.toFixed(2)}`,
            `Performance: ${point.metrics.performance_score.toFixed(0)}`,
            `FCP: ${point.metrics.first_contentful_paint.toFixed(2)}s`,
            `LCP: ${point.metrics.largest_contentful_paint.toFixed(2)}s`,
            `TBT: ${point.metrics.total_blocking_time.toFixed(0)}ms`,
            `CLS: ${point.metrics.cumulative_layout_shift.toFixed(3)}`,
            `Speed Index: ${point.metrics.speed_index.toFixed(2)}s`,
            `Cached: ${point.metrics.is_cached ? "Yes" : "No"}`,
          ];
        },
      },
    },
  },
});
