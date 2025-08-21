import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSession, getActiveOrganization } from "@saas/auth/lib/server";
import { getDashboardData } from "@pipetrak/dashboard/lib/data-loaders";
import { DashboardTopBar } from "@pipetrak/dashboard/components/DashboardTopBar";
import { KPIHeroBar } from "@pipetrak/dashboard/components/KPIHeroBar";
import { AreaSystemGrid } from "@pipetrak/dashboard/components/AreaSystemGrid";
import { DrawingHierarchy } from "@pipetrak/dashboard/components/DrawingHierarchy";
import { TestPackageTable } from "@pipetrak/dashboard/components/TestPackageTable";
import { ActivityFeed } from "@pipetrak/dashboard/components/ActivityFeed";
import { ResponsiveDashboard } from "@pipetrak/dashboard/components/ResponsiveDashboard";
import { Alert, AlertDescription } from "@ui/components/alert";
import { AlertTriangle } from "lucide-react";

interface DashboardPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

// Enable caching for dashboard data (60 seconds)
export const revalidate = 60;

export default async function DashboardPage({ params }: DashboardPageProps) {
  console.log('[Dashboard Page] Starting render...');
  console.log('[Dashboard Page] Raw params:', params);
  
  const { projectId } = await params;
  console.log('[Dashboard Page] Project ID:', projectId);
  
  return (
    <div className="container mx-auto px-4 lg:px-6 space-y-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent projectId={projectId} />
      </Suspense>
    </div>
  );
}

// Server component for data fetching
async function DashboardContent({ projectId }: { projectId: string }) {
  console.log('[DashboardContent] Starting data fetch for project:', projectId);
  
  // Check authentication
  console.log('[DashboardContent] Checking session...');
  const session = await getSession();
  console.log('[DashboardContent] Session:', session ? 'exists' : 'null');
  console.log('[DashboardContent] User ID:', session?.user?.id);
  
  if (!session) {
    console.log('[DashboardContent] No session - showing authentication required message');
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You must be logged in to view this dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  // For server-side data fetching, we'll get organization from the project
  // The data-loaders will handle organization validation internally
  console.log('[DashboardContent] Fetching dashboard data...');
  const dashboardData = await getDashboardData(projectId);
  console.log('[DashboardContent] Dashboard data received:', {
    hasProject: !!dashboardData.project,
    hasMetrics: !!dashboardData.metrics,
    projectId: dashboardData.project?.id,
    projectName: dashboardData.project?.jobName
  });
  
  if (!dashboardData.project) {
    console.log('[DashboardContent] No project found - calling notFound()');
    notFound();
  }

  const {
    project,
    metrics,
    areaSystemMatrix,
    drawingRollups,
    testPackageReadiness,
    recentActivity
  } = dashboardData;

  return (
    <ResponsiveDashboard
      project={project}
      metrics={metrics}
      areaSystemMatrix={areaSystemMatrix}
      drawingRollups={drawingRollups}
      testPackageReadiness={testPackageReadiness}
      recentActivity={recentActivity}
      availableProjects={[]} // TODO: Fetch user's available projects
    />
  );
}

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse px-4 lg:px-6">
      {/* Top bar skeleton */}
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="h-10 bg-gray-200 rounded w-[280px]"></div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded w-20"></div>
          ))}
        </div>
      </div>

      {/* Title skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-300 rounded w-64"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-6 border rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 bg-gray-300 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </div>

      {/* Placeholder sections skeleton */}
      <div className="space-y-6">
        <div className="h-80 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"></div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"></div>
          <div className="h-80 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"></div>
        </div>
        <div className="h-80 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300"></div>
      </div>
    </div>
  );
}