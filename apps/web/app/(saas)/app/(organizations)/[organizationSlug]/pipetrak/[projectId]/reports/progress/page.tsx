import { Suspense } from "react";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { LoadingState } from "@pipetrak/shared/components";
import { ProgressSummaryReportContent } from "@pipetrak/reports/components/ProgressSummaryReportContent";

interface ProgressSummaryReportPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProgressSummaryReportPage({
  params,
}: ProgressSummaryReportPageProps) {
  const { projectId } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress Summary Report"
        subtitle="Weekly progress report for P6 schedule updates with Tuesday 9 AM cutoff"
      />

      <Suspense fallback={<LoadingState variant="card" />}>
        <ProgressSummaryReportContent projectId={projectId} />
      </Suspense>
    </div>
  );
}