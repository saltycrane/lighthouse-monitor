import { AllPlots } from "@/app/components/AllPlots";
import { Filters } from "@/components/Filters";
import { MetricsTable } from "@/app/components/MetricsTable";
import { getAndTransformAllData } from "@/app/getAndTransformAllData";
import { Heading } from "@/components/ui/heading";

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

  const {
    combineCached,
    hideCached,
    hideUncached,
    hostRows,
    selectedHosts,
    timespan,
    plotData,
    tableData,
  } = await getAndTransformAllData({ params, searchParams });

  return (
    <>
      <Heading level={3} className="mb-6">
        Page: {pathname}
      </Heading>
      <Filters
        combineCached={combineCached}
        hideCached={hideCached}
        hideUncached={hideUncached}
        hosts={hostRows}
        selectedHosts={selectedHosts}
        selectedTimespan={timespan}
      />
      <AllPlots data={plotData} />
      <MetricsTable metricsData={tableData} />
    </>
  );
}
