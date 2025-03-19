import { TMetricsRow } from "@/lib/types";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

type TProps = {
  metrics: TMetricsRow[];
};

export function MedianReportViewer({ metrics }: TProps) {
  if (metrics.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2" />
        <CardContent>
          <p>No metrics data</p>
        </CardContent>
      </Card>
    );
  }

  // Sort by performance score
  const sortedMetrics = [...metrics]
    .filter((metric) => metric.performance_score !== null)
    .sort((a, b) => a.performance_score - b.performance_score);

  if (sortedMetrics.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2" />
        <CardContent>
          <p>No performance scores</p>
        </CardContent>
      </Card>
    );
  }

  // Find the median metric row
  const medianIndex = Math.floor(sortedMetrics.length / 2);
  const medianMetric = sortedMetrics[medianIndex];

  // Check if we have an HTML report
  if (!medianMetric.html_report_s3_key) {
    return (
      <Card>
        <CardHeader className="pb-2" />
        <CardContent>
          <p>No HTML report available</p>
        </CardContent>
      </Card>
    );
  }

  const reportUrl = `http://${process.env.S3_BUCKET_NAME}.s3-website-us-west-2.amazonaws.com/${medianMetric.html_report_s3_key}`;

  return (
    <div className="w-full h-[800px] border border-gray-200 rounded-md">
      <iframe
        src={reportUrl}
        className="w-full h-full"
        title="Median Lighthouse Report"
      />
    </div>
  );
}
