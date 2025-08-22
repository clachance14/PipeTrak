import { Suspense } from "react";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { LoadingState } from "@pipetrak/shared/components";
import { TestPackageReportContent } from "@pipetrak/reports/components/TestPackageReportContent";

interface TestPackageReportPageProps {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    testPackages?: string;
    areas?: string;
    systems?: string;
    readinessStatus?: string;
    includeBlocking?: string;
    includeVelocity?: string;
    includeForecast?: string;
  }>;
}

export default async function TestPackageReportPage({
  params,
  searchParams,
}: TestPackageReportPageProps) {
  const { projectId } = await params;
  const filters = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Package Readiness Report"
        subtitle="Test package completion status and readiness forecasting"
      />

      <Suspense fallback={<LoadingState variant="card" />}>
        <TestPackageReportContent
          projectId={projectId}
          initialFilters={filters}
        />
      </Suspense>
    </div>
  );
}