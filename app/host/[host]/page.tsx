import { AllPlots } from "@/app/components/AllPlots";
import { MetricsTable } from "@/app/components/MetricsTable";
import { getAndTransformAllData } from "@/app/getAndTransformAllData";
import { Filters } from "@/components/Filters";
import { Heading } from "@/components/ui/heading";

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

  const {
    combineCached,
    hideCached,
    hideUncached,
    pathnameRows,
    selectedPathnames,
    timespan,
    plotData,
    tableData,
  } = await getAndTransformAllData({ params, searchParams });

  return (
    <>
      <Heading level={3} className="mb-6">
        Host: {host}
      </Heading>
      <Filters
        combineCached={combineCached}
        hideCached={hideCached}
        hideUncached={hideUncached}
        pathnames={pathnameRows}
        selectedPathnames={selectedPathnames}
        selectedTimespan={timespan}
      />
      <AllPlots data={plotData} />
      <MetricsTable metricsData={tableData} />
    </>
  );
}
