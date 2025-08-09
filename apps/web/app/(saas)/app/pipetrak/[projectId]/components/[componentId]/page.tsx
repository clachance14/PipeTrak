import { PageHeader } from "@saas/shared/components/PageHeader";
import { Suspense } from "react";
import { LoadingState } from "@pipetrak/shared/components";
import { MilestoneEditor } from "@pipetrak/components/components/MilestoneEditor";
import { getComponent } from "@pipetrak/components/lib/actions";
import { getSession } from "@saas/auth/lib/server";
import { redirect, notFound } from "next/navigation";
import { Button } from "@ui/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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

  return (
    <>
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/app/pipetrak/${projectId}/components`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Components
            </Button>
          </Link>
          <PageHeader
            title={`Component ${component.componentId}`}
            subtitle={`${component.type || ''} ${component.spec || ''} ${component.size || ''}`}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Progress</p>
            <p className="text-2xl font-semibold">
              {Math.round(component.completionPercent)}%
            </p>
          </div>
        </div>
      </div>

      {/* Component Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-3">Component Information</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">{component.type || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Specification</dt>
                <dd className="font-medium">{component.spec || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Size</dt>
                <dd className="font-medium">{component.size || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Material</dt>
                <dd className="font-medium">{component.material || '-'}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-3">Location</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Area</dt>
                <dd className="font-medium">{component.area || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">System</dt>
                <dd className="font-medium">{component.system || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Test Package</dt>
                <dd className="font-medium">{component.testPackage || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Drawing</dt>
                <dd className="font-medium">
                  {component.drawing ? (
                    <Link 
                      href={`/app/pipetrak/${projectId}/drawings/${component.drawingId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {component.drawing.number}
                    </Link>
                  ) : '-'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-3">Status</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Current Status</dt>
                <dd>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    component.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    component.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {component.status.replace('_', ' ')}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Workflow Type</dt>
                <dd className="font-medium">{component.workflowType.replace(/_/g, ' ')}</dd>
              </div>
              {component.installedAt && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Installed</dt>
                  <dd className="font-medium">
                    {new Date(component.installedAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Milestone Editor */}
        <div>
          <MilestoneEditor 
            component={component} 
            milestones={component.milestones || []}
          />
        </div>
      </div>
    </>
  );
}