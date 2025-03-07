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
import { orderBy } from "lodash";
import { Scatter } from "react-chartjs-2";

import { Card } from "@/components/ui/card";
import { formatDateTime, utcToLocal } from "@/lib/dates";
import {
  TAggregatedStatKey,
  TCacheStatus,
  TMetricKey,
  TPlotData,
} from "@/lib/types";
import { addAlphaToRgb, darkenRgbColor } from "@/lib/style";

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
  "rgb(53, 162, 235)",
  "rgb(255, 159, 64)",
  "rgb(75, 192, 192)",
  "rgb(255, 99, 132)",
  "rgb(153, 102, 255)",
];

const MEAN_KEY_MAP: Record<TMetricKey, TAggregatedStatKey> = {
  performance_score: "mean_performance",
  first_contentful_paint: "mean_fcp",
  largest_contentful_paint: "mean_lcp",
  total_blocking_time: "mean_tbt",
  cumulative_layout_shift: "mean_cls",
  speed_index: "mean_si",
  interaction_to_next_paint: "mean_inp",
};

const STD_DEV_KEY_MAP: Record<TMetricKey, TAggregatedStatKey> = {
  performance_score: "std_performance",
  first_contentful_paint: "std_fcp",
  largest_contentful_paint: "std_lcp",
  total_blocking_time: "std_tbt",
  cumulative_layout_shift: "std_cls",
  speed_index: "std_si",
  interaction_to_next_paint: "std_inp",
};

/**
 * MetricsScatterChart
 */
type TProps = {
  data: TPlotData;
  digits?: number;
  metric: TMetricKey;
  title: string;
};

export function MetricScatterChart({
  data,
  digits = 1,
  metric: metricFromProps,
  title,
}: TProps) {
  const hosts = orderBy(Object.keys(data));

  return (
    <Card className="h-[800px] p-4">
      <Scatter
        options={createOptions({ title })}
        data={{
          datasets: [
            ...hosts.flatMap((host, i) => {
              const dataByPathname = data[host];
              const pathnames = orderBy(Object.keys(dataByPathname));

              return pathnames.flatMap((pathname, j) => {
                const index = (i + 1) * (j + 1) - 1;
                const dataByCacheStatus = dataByPathname[pathname];
                const cacheStatuses = orderBy(Object.keys(dataByCacheStatus));

                return cacheStatuses.flatMap((cacheStatus: TCacheStatus) => {
                  const { averages, metrics, stats } =
                    dataByCacheStatus[cacheStatus];
                  const mean =
                    stats[MEAN_KEY_MAP[metricFromProps]]?.toFixed(digits);
                  const stdDev =
                    stats[STD_DEV_KEY_MAP[metricFromProps]]?.toFixed(digits);
                  const legend = [
                    host,
                    pathname,
                    cacheStatus !== "combined" && `(${cacheStatus})`,
                    `${mean} ± ${stdDev}`,
                  ]
                    .filter(Boolean)
                    .filter((part) => part !== "all")
                    .join(" ");
                  const colorSettings = getColorSettings(index, cacheStatus);

                  return [
                    // Individual data points
                    {
                      ...colorSettings,
                      label: legend,
                      data: metrics.map((m) => {
                        const x = utcToLocal(m.timestamp);
                        const y = m[metricFromProps];
                        const hostLabel =
                          hosts.length === 1 && hosts[0] !== "all"
                            ? null
                            : `Host: ${m.host}`;
                        const pathnameLabel =
                          pathnames.length === 1 && pathnames[0] !== "all"
                            ? null
                            : `Page: ${m.pathname}`;

                        const tooltipTitle = `(${formatDateTime(x)}, ${y.toFixed(digits)})`;
                        const tooltipLabel = [
                          hostLabel,
                          pathnameLabel,
                          `Cached: ${m.is_cached ? "Yes" : "No"}`,
                          `Performance: ${m.performance_score.toFixed(0)}`,
                          `FCP: ${m.first_contentful_paint.toFixed(1)}s`,
                          `LCP: ${m.largest_contentful_paint.toFixed(1)}s`,
                          `TBT: ${m.total_blocking_time.toFixed(0)}ms`,
                          `CLS: ${m.cumulative_layout_shift.toFixed(3)}`,
                          `Speed Index: ${m.speed_index.toFixed(1)}s`,
                        ].filter(Boolean);

                        return { x, y, tooltipTitle, tooltipLabel };
                      }),
                    },
                    // Moving average lines
                    {
                      ...colorSettings,
                      label: null, // hide moving average in legend
                      data: averages.map((m) => ({
                        x: utcToLocal(m.timestamp),
                        y: m[metricFromProps],
                      })),
                      showLine: true,
                      pointRadius: 0,
                      borderWidth: 2,
                    },
                  ];
                });
              });
            }),
          ],
        }}
      />
    </Card>
  );
}

/**
 * getColorSettings
 */
function getColorSettings(datasetIndex: number, cacheStatus: TCacheStatus) {
  const color = COLORS[datasetIndex % COLORS.length];
  const borderColor =
    cacheStatus === "cached" ? darkenRgbColor(color, 40) : color;
  return {
    backgroundColor: addAlphaToRgb(borderColor, 0.8),
    borderColor,
  };
}

/**
 * createOptions
 */
type TCreateOptionsArg = {
  title: string;
};

const createOptions = ({
  title,
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
      min: 0,
      title: {
        display: true,
        text: title,
      },
    },
  },
  plugins: {
    title: {
      display: true,
      text: title,
    },
    legend: {
      position: "top",
      labels: {
        filter: (item) => !!item.text,
      },
    },
    tooltip: {
      callbacks: {
        title: (context) => (context[0].raw as any).tooltipTitle,
        label: (context) => (context.raw as any).tooltipLabel,
      },
    },
  },
});
