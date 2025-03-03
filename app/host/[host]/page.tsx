import { AllCharts } from "@/app/components/AllCharts";
import { Filters } from "@/components/Filters";
import { Heading } from "@/components/ui/heading";
import {
  getAggregatedStats,
  getAllPathnames,
  getLatestMetrics,
  getMovingAverages,
} from "@/lib/db";
import { TAggregatedStatsRow, TMetricsRow } from "@/lib/types";

export const revalidate = 0;

type TProps = {
  params: Promise<{ host: string }>;
  searchParams: Promise<{ pathnames?: string; timespan?: string }>;
};

export default async function PathnameRoutePage({
  params,
  searchParams,
}: TProps) {
  const host = decodeURIComponent((await params).host);
  const { pathnames, timespan = "24" } = await searchParams;
  const selectedPathnames = pathnames?.split(",").map(decodeURIComponent) || [];
  const timespanHours = parseInt(timespan, 10);
  const pathnameRows = await getAllPathnames();

  const datasets: TMetricsRow[][] = [];
  const movingAverages: TMetricsRow[][] = [];
  const stats: TAggregatedStatsRow[] = [];
  const legends: string[] = [];

  if (selectedPathnames.length === 0) {
    for (const isCached of [true, false]) {
      const filters = { host, isCached, timespanHours };
      const metrics = await getLatestMetrics(filters);
      const averages = await getMovingAverages(filters);
      const statsRow = await getAggregatedStats(filters);
      datasets.push(metrics);
      movingAverages.push(averages);
      stats.push(statsRow);
      legends.push(isCached ? "All pages (cached)" : "All pages (uncached)");
    }
  } else if (selectedPathnames.length === 1) {
    for (const pathname of selectedPathnames) {
      for (const isCached of [true, false]) {
        const cacheStatus = isCached ? "cached" : "uncached";
        const filters = { host, isCached, pathname, timespanHours };
        const metrics = await getLatestMetrics(filters);
        const averages = await getMovingAverages(filters);
        const statsRow = await getAggregatedStats(filters);
        datasets.push(metrics);
        movingAverages.push(averages);
        stats.push(statsRow);
        legends.push(`${pathname} (${cacheStatus})`);
      }
    }
  } else {
    for (const pathname of selectedPathnames) {
      const filters = { host, pathname, timespanHours };
      const metrics = await getLatestMetrics(filters);
      const averages = await getMovingAverages(filters);
      const statsRow = await getAggregatedStats(filters);
      datasets.push(metrics);
      movingAverages.push(averages);
      stats.push(statsRow);
      legends.push(pathname);
    }
  }

  return (
    <>
      <Heading level={3} className="mb-6">
        {host}
      </Heading>
      <Filters
        pathnames={pathnameRows}
        selectedPathnames={selectedPathnames}
        selectedTimespan={timespan}
      />
      <AllCharts
        datasets={datasets}
        legends={legends}
        movingAverages={movingAverages}
        stats={stats}
      />
    </>
  );
}
