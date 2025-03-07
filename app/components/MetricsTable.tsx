import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { TMetricsRow } from "@/lib/types";
import { LocalDateTime } from "./LocalDateTime";

interface MetricsTableProps {
  hideHost?: boolean;
  hidePathname?: boolean;
  metricsData: TMetricsRow[];
}

export function MetricsTable({
  hideHost = false,
  hidePathname = false,
  metricsData,
}: MetricsTableProps) {
  // Sort by timestamp in descending order (newest first)
  const metrics = metricsData.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  // Get only the number of rows we want to show
  const visibleMetrics = metrics.slice(0, 200);

  const format = (value: number | null, digits: number = 1) => {
    if (value === null) return "N/A";
    return value.toFixed(digits);
  };

  return (
    <div className="mb-4">
      <Heading level={5}>Latest Measurements</Heading>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead className="text-center">Report</TableHead>
            {!hideHost && <TableHead>Host</TableHead>}
            {!hidePathname && <TableHead>Pathname</TableHead>}
            <TableHead className="text-center">Cached?</TableHead>
            <TableHead className="text-right">Performance</TableHead>
            <TableHead className="text-right">FCP (s)</TableHead>
            <TableHead className="text-right">LCP (s)</TableHead>
            <TableHead className="text-right">TBT (ms)</TableHead>
            <TableHead className="text-right">CLS</TableHead>
            <TableHead className="text-right">SI (s)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleMetrics.map((metric, index) => (
            <TableRow key={`${metric.timestamp}-${index}`}>
              <TableCell className="text-center">
                <LocalDateTime utcDateTimeStr={metric.timestamp} />
              </TableCell>
              <TableCell className="text-center">
                {metric.html_report_s3_key && (
                  <Button size="sm" variant="link">
                    <a
                      href={`http://${process.env.S3_BUCKET_NAME}.s3-website-us-west-2.amazonaws.com/${metric.html_report_s3_key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                  </Button>
                )}
              </TableCell>
              {!hideHost && <TableCell>{metric.host}</TableCell>}
              {!hidePathname && <TableCell>{metric.pathname}</TableCell>}
              <TableCell className="text-center">
                {metric.is_cached ? "Yes" : "No"}
              </TableCell>
              <TableCell className="text-right">
                {format(metric.performance_score, 0)}
              </TableCell>
              <TableCell className="text-right">
                {format(metric.first_contentful_paint)}
              </TableCell>
              <TableCell className="text-right">
                {format(metric.largest_contentful_paint)}
              </TableCell>
              <TableCell className="text-right">
                {format(metric.total_blocking_time, 0)}
              </TableCell>
              <TableCell className="text-right">
                {format(metric.cumulative_layout_shift, 3)}
              </TableCell>
              <TableCell className="text-right">
                {format(metric.speed_index)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
