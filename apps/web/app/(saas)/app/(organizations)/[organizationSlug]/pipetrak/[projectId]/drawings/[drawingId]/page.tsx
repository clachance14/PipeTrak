"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@pipetrak/shared/components";
import { ComponentTable } from "@pipetrak/components";
import { 
  DrawingBreadcrumbs,
  ComponentCountBadge,
  useDrawingDetails,
  DrawingTreeView,
  useDrawingHierarchy,
} from "@pipetrak/drawings";
import { Alert, AlertDescription } from "@ui/components/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import { Button } from "@ui/components/button";
import { ArrowLeft, AlertCircle, FileText, Download } from "lucide-react";
import { cn } from "@ui/lib";

interface DrawingDetailPageProps {
  params: Promise<{
    projectId: string;
    drawingId: string;
  }>;
}

export default async function DrawingDetailPage({ params }: DrawingDetailPageProps) {
  const { projectId, drawingId } = await params;
  
  return <DrawingDetailContent projectId={projectId} drawingId={drawingId} />;
}

function DrawingDetailContent({ 
  projectId, 
  drawingId 
}: { 
  projectId: string;
  drawingId: string;
}) {
  const router = useRouter();
  const [componentFilters, setComponentFilters] = useState({
    page: 1,
    limit: 50,
  });

  const { 
    data: detailsData, 
    isLoading: isLoadingDetails, 
    error: detailsError 
  } = useDrawingDetails(drawingId, componentFilters);

  const {
    data: hierarchyData,
    isLoading: isLoadingHierarchy,
  } = useDrawingHierarchy(projectId);

  if (detailsError) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load drawing details. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoadingDetails) {
    return <LoadingState />;
  }

  const drawing = detailsData?.drawing;
  const components = (detailsData?.components || []).map(comp => ({
    ...comp,
    milestones: comp.milestones || []
  }));
  const pagination = detailsData?.pagination;
  const drawings = hierarchyData?.data || [];

  if (!drawing) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Drawing not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate progress
  const componentCount = components.reduce((acc, comp) => {
    const status = comp.status || "NOT_STARTED";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalComponents = components.length;
  const completedComponents = componentCount.COMPLETED || 0;
  const progressPercentage = totalComponents > 0 
    ? Math.round((completedComponents / totalComponents) * 100)
    : 0;

  const handleNavigateToDrawing = (newDrawingId: string) => {
    router.push(`/app/pipetrak/${projectId}/drawings/${newDrawingId}`);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <DrawingBreadcrumbs
        projectId={projectId}
        projectName={drawing.project?.jobName}
        drawing={drawing}
        breadcrumbPath={[]} // TODO: Build from parent chain
      />

      <div className="flex gap-6 h-[calc(100vh-250px)]">
        {/* Left sidebar - Drawing tree */}
        <div className="w-80 flex-shrink-0 border rounded-lg overflow-hidden hidden lg:block">
          <DrawingTreeView
            drawings={drawings}
            selectedDrawingId={drawingId}
            onDrawingSelect={handleNavigateToDrawing}
            isLoading={isLoadingHierarchy}
            className="h-full"
          />
        </div>

        {/* Right content - Drawing details */}
        <div className="flex-1 border rounded-lg overflow-hidden">
          <Tabs defaultValue="components" className="h-full flex flex-col">
            <div className="border-b p-4">
              {/* Drawing Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <h1 className="text-2xl font-semibold">{drawing.number}</h1>
                    {drawing.revision && (
                      <Badge status="info">Rev. {drawing.revision}</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{drawing.title}</p>
                </div>
                {drawing.fileUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={drawing.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      View Drawing
                    </a>
                  </Button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span className="font-medium">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                <ComponentCountBadge
                  componentCount={{
                    total: totalComponents,
                    notStarted: componentCount.NOT_STARTED || 0,
                    inProgress: componentCount.IN_PROGRESS || 0,
                    completed: componentCount.COMPLETED || 0,
                    onHold: componentCount.ON_HOLD || 0,
                  }}
                  variant="detailed"
                  className="mt-2"
                />
              </div>

              {/* Tabs */}
              <TabsList className="mt-4">
                <TabsTrigger value="components">
                  Components ({totalComponents})
                </TabsTrigger>
                {drawing.children && drawing.children.length > 0 && (
                  <TabsTrigger value="children">
                    Child Drawings ({drawing.children.length})
                  </TabsTrigger>
                )}
                <TabsTrigger value="info">Information</TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <TabsContent value="components" className="flex-1 overflow-auto p-4">
              <ComponentTable
                components={components}
                projectId={projectId}
              />
            </TabsContent>

            {drawing.children && drawing.children.length > 0 && (
              <TabsContent value="children" className="flex-1 overflow-auto p-4">
                <div className="grid gap-3">
                  {drawing.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => handleNavigateToDrawing(child.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        "hover:bg-accent transition-colors text-left"
                      )}
                    >
                      <div>
                        <div className="font-medium">{child.number}</div>
                        <div className="text-sm text-muted-foreground">
                          {child.title}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </TabsContent>
            )}

            <TabsContent value="info" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Drawing Information</h3>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Number</dt>
                      <dd className="font-medium">{drawing.number}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Title</dt>
                      <dd className="font-medium">{drawing.title}</dd>
                    </div>
                    {drawing.revision && (
                      <div>
                        <dt className="text-muted-foreground">Revision</dt>
                        <dd className="font-medium">{drawing.revision}</dd>
                      </div>
                    )}
                    {drawing.parent && (
                      <div>
                        <dt className="text-muted-foreground">Parent Drawing</dt>
                        <dd>
                          <button
                            onClick={() => handleNavigateToDrawing(drawing.parent!.id)}
                            className="font-medium text-primary hover:underline"
                          >
                            {drawing.parent.number}
                          </button>
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted-foreground">Project</dt>
                      <dd className="font-medium">
                        {drawing.project?.jobNumber} - {drawing.project?.jobName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Last Updated</dt>
                      <dd className="font-medium">
                        {new Date(drawing.updatedAt).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}