import { PageHeader } from "@saas/shared/components/PageHeader";
import { Suspense } from "react";
import { LoadingState } from "@pipetrak/shared/components";

interface ReportsPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { projectId } = await params;
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Progress dashboards, ROC calculations, and data exports"
      />

      <Suspense fallback={<LoadingState variant="card" />}>
        <ReportsContent projectId={projectId} />
      </Suspense>
    </div>
  );
}

// Server component for data fetching
async function ReportsContent({ projectId }: { projectId: string }) {
  // TODO: Fetch project progress data
  // const projectSummary = await getProjectSummary(projectId);

  return (
    <div className="space-y-4">
      {/* TODO: Add ProgressDashboard and charts */}
      <div className="rounded-lg border p-8 text-center">
        <h3 className="text-lg font-semibold mb-2">Progress dashboard coming soon</h3>
        <p className="text-muted-foreground">
          Progress tracking, ROC calculations, and export functionality.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Project ID: {projectId}
        </p>
      </div>
    </div>
  );
}