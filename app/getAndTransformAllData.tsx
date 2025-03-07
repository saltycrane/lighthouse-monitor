import {
  getAggregatedStats,
  getAllHosts,
  getAllPathnames,
  getLatestMetrics,
  getMovingAverages,
} from "@/lib/db";
import {
  TMetricsRow,
  TPlotData,
  TRouteParams,
  TSearchParams,
} from "@/lib/types";

export const revalidate = 0;

type TProps = {
  params?: TRouteParams;
  searchParams: TSearchParams;
};

export async function getAndTransformAllData({ params, searchParams }: TProps) {
  // If on the `/host` or `/pathname` page, get the host or pathname from the route segment
  let host: string | null = null;
  let pathname: string | null = null;
  if (params) {
    const params2 = await params;
    if ("host" in params2) {
      host = decodeURIComponent(params2.host);
    }
    if ("pathname" in params2) {
      pathname = decodeURIComponent(params2.pathname);
    }
  }

  const {
    combineCached,
    hideCached,
    hideUncached,
    hosts,
    pathnames,
    timespan = "24",
  } = await searchParams;
  const selectedHosts = host
    ? [host]
    : hosts?.split(",").map(decodeURIComponent) || ["all"];
  const selectedPathnames = pathname
    ? [pathname]
    : pathnames?.split(",").map(decodeURIComponent) || ["all"];

  // Determine which cache statuses to display
  let cacheStatuses = [];
  const combineCacheResults = combineCached === "true";
  const hideCachedResults = hideCached === "true";
  const hideUncachedResults = hideUncached === "true";
  if (combineCacheResults) {
    cacheStatuses = ["combined"];
  } else if (!hideCachedResults && !hideUncachedResults) {
    cacheStatuses = ["cached", "uncached"];
  } else if (!hideCachedResults) {
    cacheStatuses = ["cached"];
  } else if (!hideUncachedResults) {
    cacheStatuses = ["uncached"];
  } else {
    cacheStatuses = [];
  }

  const timespanHours = parseInt(timespan, 10);
  const pathnameRows = await getAllPathnames();
  const hostRows = await getAllHosts();
  const plotData: TPlotData = {};
  const tableData: TMetricsRow[] = [];

  for (const host of selectedHosts) {
    plotData[host] = {};

    for (const pathname of selectedPathnames) {
      plotData[host][pathname] = {};

      for (const cacheStatus of cacheStatuses) {
        const filterParams = {
          host: host === "all" ? undefined : host,
          isCached:
            cacheStatus === "combined" ? undefined : cacheStatus === "cached",
          pathname: pathname === "all" ? undefined : pathname,
          timespanHours,
        };
        const metrics = await getLatestMetrics(filterParams);
        const averages = await getMovingAverages(filterParams);
        const stats = await getAggregatedStats(filterParams);

        plotData[host][pathname][cacheStatus] = {
          averages,
          metrics,
          stats,
        };
        tableData.push(...metrics);
      }
    }
  }

  return {
    combineCached: combineCacheResults,
    hideCached: hideCachedResults,
    hideUncached: hideUncachedResults,
    hostRows,
    pathnameRows,
    plotData,
    selectedHosts,
    selectedPathnames,
    tableData,
    timespan,
  };
}
