import { Suspense } from "react";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { LoadingState } from "@pipetrak/shared/components";
import { TrendReportContent } from "@pipetrak/reports/components/TrendReportContent";

interface TrendReportPageProps {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    days?: string;
    granularity?: string;
    includeForecasting?: string;
    includeVelocity?: string;
    includeMilestones?: string;
  }>;
}

export default async function TrendReportPage({
  params,
  searchParams,
}: TrendReportPageProps) {
  const { projectId } = await params;
  const filters = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trend Analysis Report"
        subtitle="Historical progress trends and velocity forecasting"
        breadcrumbs={[
          { label: "Reports", href: `/app/pipetrak/${projectId}/reports` },
          { label: "Trends" },
        ]}
      />

      <Suspense fallback={<LoadingState variant="chart" />}>
        <TrendReportContent
          projectId={projectId}
          initialFilters={filters}
        />
      </Suspense>
    </div>
  );
}