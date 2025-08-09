import { PageHeader } from "@saas/shared/components/PageHeader";
import { Suspense } from "react";
import { LoadingState } from "@pipetrak/shared/components";

interface ImportPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ImportPage({ params }: ImportPageProps) {
  const { projectId } = await params;
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Data"
        subtitle="Import components from Excel with validation and preview"
      />

      <Suspense fallback={<LoadingState />}>
        <ImportContent projectId={projectId} />
      </Suspense>
    </div>
  );
}

// Server component for data fetching
async function ImportContent({ projectId }: { projectId: string }) {
  // TODO: Fetch import jobs and validation rules
  // const importJobs = await getImportJobs(projectId);

  return (
    <div className="space-y-4">
      {/* TODO: Add ImportWizard component */}
      <div className="rounded-lg border p-8 text-center">
        <h3 className="text-lg font-semibold mb-2">Import wizard coming soon</h3>
        <p className="text-muted-foreground">
          Excel import with file upload, validation, preview, and commit workflow.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Project ID: {projectId}
        </p>
      </div>
    </div>
  );
}