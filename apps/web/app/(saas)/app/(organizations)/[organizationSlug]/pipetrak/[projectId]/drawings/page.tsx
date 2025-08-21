"use client";

import { PageHeader } from "@saas/shared/components/PageHeader";
import { Suspense } from "react";
import { LoadingState } from "@pipetrak/shared/components";
import { 
  DrawingTreeView,
  useDrawingHierarchy,
  useDrawingNavigation
} from "@pipetrak/drawings";
import { Alert, AlertDescription } from "@ui/components/alert";
import { AlertCircle } from "lucide-react";

interface DrawingsPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function DrawingsPage({ params }: DrawingsPageProps) {
  const { projectId } = await params;
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Drawings"
        subtitle="Navigate drawings hierarchy and view associated components"
      />

      <Suspense fallback={<LoadingState variant="list" />}>
        <DrawingsContent projectId={projectId} />
      </Suspense>
    </div>
  );
}

// Client component for drawing navigation
function DrawingsContent({ projectId }: { projectId: string }) {
  const { 
    data: hierarchyData, 
    isLoading, 
    error 
  } = useDrawingHierarchy(projectId);
  
  const {
    navigationState,
    navigateToDrawing,
  } = useDrawingNavigation(projectId);

  if (error) {
    return (
      <Alert variant="error">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load drawings. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const drawings = hierarchyData?.data || [];
  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Left sidebar - Drawing tree */}
      <div className="w-80 flex-shrink-0 border rounded-lg overflow-hidden">
        <DrawingTreeView
          drawings={drawings}
          selectedDrawingId={navigationState.selectedDrawingId}
          onDrawingSelect={navigateToDrawing}
          isLoading={isLoading}
          className="h-full"
        />
      </div>

      {/* Right content - Drawing details */}
      <div className="flex-1 border rounded-lg overflow-auto">
        {navigationState.selectedDrawingId ? (
          <div className="p-6">
            <p className="text-sm text-muted-foreground">
              Navigate to a specific drawing to view its components and details.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Select a drawing</h3>
              <p className="text-muted-foreground">
                Choose a drawing from the tree to view its components.
              </p>
              {hierarchyData?.metadata && (
                <p className="text-sm text-muted-foreground mt-4">
                  {hierarchyData.metadata.totalDrawings} total drawings • {hierarchyData.metadata.rootDrawings} root drawings
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}