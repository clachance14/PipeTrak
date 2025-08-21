import { Suspense } from "react";
import { LoadingState } from "@pipetrak/shared/components";
import { getComponent } from "@pipetrak/components/lib/actions";
import { getSession } from "@saas/auth/lib/server";
import { redirect, notFound } from "next/navigation";
import { ComponentDetailClient } from "./ComponentDetailClient";

interface ComponentDetailPageProps {
  params: Promise<{
    projectId: string;
    componentId: string;
  }>;
}

export default async function ComponentDetailPage({ params }: ComponentDetailPageProps) {
  const { projectId, componentId } = await params;
  
  return (
    <div className="space-y-6">
      <Suspense fallback={<LoadingState />}>
        <ComponentDetailContent 
          projectId={projectId} 
          componentId={componentId} 
        />
      </Suspense>
    </div>
  );
}

async function ComponentDetailContent({ 
  projectId, 
  componentId 
}: { 
  projectId: string; 
  componentId: string;
}) {
  // Check authentication
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Fetch component data
  const component = await getComponent(componentId);
  
  if (!component || component.projectId !== projectId) {
    notFound();
  }

  // Get user ID for realtime
  const userId = session.user?.id || 'anonymous';

  // Render the client component with all the UI and real-time updates
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Component Detail</h1>
      <p className="text-muted-foreground">Component: {component.componentId}</p>
      <p className="text-muted-foreground">Project: {projectId}</p>
      {/* <ComponentDetailClient 
        component={component}
        projectId={projectId}
        userId={userId}
      /> */}
    </div>
  );
}