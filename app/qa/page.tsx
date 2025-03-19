import { QaFilters } from "@/components/QaFilters";
import { QaAggregatedMetrics } from "@/components/QaAggregatedMetrics";
import { QaMetricsTable } from "@/components/QaMetricsTable";
import { MedianReportViewer } from "@/components/MedianReportViewer";
import { Heading } from "@/components/ui/heading";
import { getAllHosts, getAllPathnames, getQaMetrics } from "@/lib/db";
import { TMetricsRow, TQaSearchParams } from "@/lib/types";

export const revalidate = 0;

type TProps = {
  searchParams: TQaSearchParams;
};

export default async function QaPage({ searchParams }: TProps) {
  const { host1, host2, pathname1, pathname2 } = await searchParams;

  const pathnameRows = await getAllPathnames();
  const hostRows = await getAllHosts();

  let metrics1: TMetricsRow[] = [];
  if (host1 && pathname1) {
    metrics1 = await getQaMetrics({ host: host1, pathname: pathname1 });
  }

  let metrics2: TMetricsRow[] = [];
  if (host2 && pathname2) {
    metrics2 = await getQaMetrics({ host: host2, pathname: pathname2 });
  }

  return (
    <div className="grid grid-cols-2 gap-x-4">
      <Heading className="mb-3 col-span-2" level={2}>
        Compare Lighthouse results for {metrics1.length} runs{" "}
        <small>(cached)</small>
      </Heading>
      <QaFilters
        keyHost="host1"
        keyPathname="pathname1"
        hosts={hostRows}
        pathnames={pathnameRows}
        selectedHost={host1}
        selectedPathname={pathname1}
      />
      <QaFilters
        keyHost="host2"
        keyPathname="pathname2"
        hosts={hostRows}
        pathnames={pathnameRows}
        selectedHost={host2}
        selectedPathname={pathname2}
      />

      <Heading className="mt-4 mb-1 col-span-2" level={3}>
        Statistics
      </Heading>
      <QaAggregatedMetrics metrics={metrics1} />
      <QaAggregatedMetrics metrics={metrics2} />

      <Heading className="mt-4 mb-1 col-span-2" level={3}>
        Median Report <small>(based on Performance Score)</small>
      </Heading>
      <MedianReportViewer metrics={metrics1} />
      <MedianReportViewer metrics={metrics2} />

      <Heading className="mt-4 mb-1 col-span-2" level={3}>
        Individual runs
      </Heading>
      <QaMetricsTable metrics={metrics1} />
      <QaMetricsTable metrics={metrics2} />
    </div>
  );
}
