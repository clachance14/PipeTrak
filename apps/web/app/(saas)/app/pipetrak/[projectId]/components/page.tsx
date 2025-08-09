import { PageHeader } from "@saas/shared/components/PageHeader";
import { Suspense } from "react";
import { LoadingState, EmptyState } from "@pipetrak/shared/components";
import { ComponentTable } from "@pipetrak/components/components/ComponentTable";
import { getComponents } from "@pipetrak/components/lib/actions";
import { getSession } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";

interface ComponentsPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ComponentsPage({ params }: ComponentsPageProps) {
  const { projectId } = await params;
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Components"
        subtitle="Track field updates, milestones, and progress for all components"
      />

      <Suspense fallback={<LoadingState variant="table" />}>
        <ComponentsContent projectId={projectId} />
      </Suspense>
    </div>
  );
}

// Server component for data fetching
async function ComponentsContent({ projectId }: { projectId: string }) {
  // Check authentication
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Fetch components data from database
  const components = await getComponents(projectId);

  if (components.length === 0) {
    return (
      <EmptyState
        title="No components yet"
        description="Import components from Excel or add them manually to get started."
        actionLabel="Import Components"
        actionHref={`/app/pipetrak/${projectId}/import`}
      />
    );
  }

  return <ComponentTable components={components} projectId={projectId} />;
}