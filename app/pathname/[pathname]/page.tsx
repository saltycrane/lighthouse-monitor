import { AllCharts } from "@/app/components/AllCharts";
import { Filters } from "@/components/Filters";
import { Heading } from "@/components/ui/heading";
import {
  getAggregatedStats,
  getAllHosts,
  getLatestMetrics,
  getMovingAverages,
} from "@/lib/db";
import { TAggregatedStatsRow, TMetricsRow } from "@/lib/types";

export const revalidate = 0;

type TProps = {
  params: Promise<{ pathname: string }>;
  searchParams: Promise<{ hosts?: string; timespan?: string }>;
};

export default async function PathnameRoutePage({
  params,
  searchParams,
}: TProps) {
  const pathname = decodeURIComponent((await params).pathname);
  const { hosts, timespan = "24" } = await searchParams;
  const selectedHosts = hosts?.split(",").map(decodeURIComponent) || [];
  const timespanHours = parseInt(timespan, 10);
  const hostRows = await getAllHosts();

  const datasets: TMetricsRow[][] = [];
  const movingAverages: TMetricsRow[][] = [];
  const stats: TAggregatedStatsRow[] = [];
  const legends: string[] = [];

  if (selectedHosts.length === 0) {
    for (const isCached of [true, false]) {
      const filters = { isCached, pathname, timespanHours };
      const metrics = await getLatestMetrics(filters);
      const averages = await getMovingAverages(filters);
      const statsRow = await getAggregatedStats(filters);
      datasets.push(metrics);
      movingAverages.push(averages);
      stats.push(statsRow);
      legends.push(isCached ? "All hosts (cached)" : "All hosts (uncached)");
    }
  } else if (selectedHosts.length === 1) {
    for (const host of selectedHosts) {
      for (const isCached of [true, false]) {
        const cacheStatus = isCached ? "cached" : "uncached";
        const filters = { isCached, pathname, host, timespanHours };
        const metrics = await getLatestMetrics(filters);
        const averages = await getMovingAverages(filters);
        const statsRow = await getAggregatedStats(filters);
        datasets.push(metrics);
        movingAverages.push(averages);
        stats.push(statsRow);
        legends.push(`${host} (${cacheStatus})`);
      }
    }
  } else {
    for (const host of selectedHosts) {
      const filters = { pathname, host, timespanHours };
      const metrics = await getLatestMetrics(filters);
      const averages = await getMovingAverages(filters);
      const statsRow = await getAggregatedStats(filters);
      datasets.push(metrics);
      movingAverages.push(averages);
      stats.push(statsRow);
      legends.push(host);
    }
  }

  return (
    <>
      <Heading level={3} className="mb-6">
        {pathname}
      </Heading>
      <Filters
        hosts={hostRows}
        selectedHosts={selectedHosts}
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
