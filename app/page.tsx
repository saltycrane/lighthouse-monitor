import { AllPlots } from "@/app/components/AllPlots";
import { MetricsTable } from "@/app/components/MetricsTable";
import { Filters } from "@/components/Filters";
import { TSearchParams } from "@/lib/types";
import { getAndTransformAllData } from "./getAndTransformAllData";

export const revalidate = 0;

type TProps = {
  searchParams: TSearchParams;
};

export default async function IndexPage({ searchParams }: TProps) {
  const {
    combineCached,
    hideCached,
    hideUncached,
    hostRows,
    pathnameRows,
    selectedHosts,
    selectedPathnames,
    timespan,
    plotData,
    tableData,
  } = await getAndTransformAllData({ searchParams });

  return (
    <>
      <Filters
        combineCached={combineCached}
        hideCached={hideCached}
        hideUncached={hideUncached}
        hosts={hostRows}
        pathnames={pathnameRows}
        selectedHosts={selectedHosts}
        selectedPathnames={selectedPathnames}
        selectedTimespan={timespan}
      />
      <AllPlots data={plotData} />
      <MetricsTable metricsData={tableData} />
    </>
  );
}
