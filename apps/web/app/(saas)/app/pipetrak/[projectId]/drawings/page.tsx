"use client";

import { PageHeader } from "@saas/shared/components/PageHeader";
import { Suspense } from "react";
import { LoadingState } from "@pipetrak/shared/components";
import { useMediaQuery } from "@saas/shared/hooks/use-media-query";
import { 
  DrawingTreeView, 
  DrawingSearchTrigger,
  DrawingMobileSheet,
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
  const isMobile = useMediaQuery("(max-width: 768px)");
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
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load drawings. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  const drawings = hierarchyData?.data || [];

  // Mobile layout
  if (isMobile) {
    return (
      <div className="space-y-4">
        <DrawingSearchTrigger projectId={projectId} className="w-full" />
        
        {drawings.length === 0 && !isLoading ? (
          <div className="rounded-lg border p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No drawings yet</h3>
            <p className="text-muted-foreground">
              Import drawings to start tracking components.
            </p>
          </div>
        ) : (
          <>
            <DrawingMobileSheet
              projectId={projectId}
              drawings={drawings}
              selectedDrawingId={navigationState.selectedDrawingId}
              onDrawingSelect={navigateToDrawing}
              isLoading={isLoading}
            />
            {navigationState.selectedDrawingId ? (
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">
                  Select a drawing from the navigation menu to view components.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">Select a drawing</h3>
                <p className="text-muted-foreground">
                  Choose a drawing from the navigation to view its components.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Left sidebar - Drawing tree */}
      <div className="w-80 flex-shrink-0 border rounded-lg overflow-hidden">
        <div className="p-3 border-b">
          <DrawingSearchTrigger projectId={projectId} className="w-full" />
        </div>
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