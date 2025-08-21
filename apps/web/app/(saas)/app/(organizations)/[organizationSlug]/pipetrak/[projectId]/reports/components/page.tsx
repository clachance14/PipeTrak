import { Suspense } from "react";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { LoadingState } from "@pipetrak/shared/components";
import { ComponentReportContent } from "@pipetrak/reports/components/ComponentReportContent";

interface ComponentReportPageProps {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    areas?: string;
    systems?: string;
    testPackages?: string;
    statuses?: string;
    search?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortDir?: string;
  }>;
}

export default async function ComponentReportPage({
  params,
  searchParams,
}: ComponentReportPageProps) {
  const { projectId } = await params;
  const filters = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detailed Component Report"
        subtitle="Component-level progress analysis with advanced filtering"
        breadcrumbs={[
          { label: "Reports", href: `/app/pipetrak/${projectId}/reports` },
          { label: "Component Details" },
        ]}
      />

      <Suspense fallback={<LoadingState variant="table" />}>
        <ComponentReportContent
          projectId={projectId}
          initialFilters={filters}
        />
      </Suspense>
    </div>
  );
}