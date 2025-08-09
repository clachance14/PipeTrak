import { PageHeader } from "@saas/shared/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Suspense } from "react";
import { LoadingState } from "@pipetrak/shared/components";
import { ProgressChart } from "@pipetrak/dashboard/components/ProgressChart";
import { RecentActivity } from "@pipetrak/dashboard/components/RecentActivity";
import { getProjectDashboard } from "@pipetrak/dashboard/lib/actions";
import { getSession } from "@saas/auth/lib/server";
import { redirect, notFound } from "next/navigation";
import { 
  BarChart3, 
  Component, 
  FileSpreadsheet, 
  FolderTree,
  TrendingUp,
  Package,
  Activity,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  
  return (
    <div className="space-y-6">
      <Suspense fallback={<LoadingState variant="card" />}>
        <ProjectContent projectId={projectId} />
      </Suspense>
    </div>
  );
}

// Server component for data fetching
async function ProjectContent({ projectId }: { projectId: string }) {
  // Check authentication
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Fetch project dashboard data
  const dashboard = await getProjectDashboard(projectId);
  
  if (!dashboard) {
    notFound();
  }

  const { project, stats, areaStats, systemStats, recentMilestones } = dashboard;

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.jobName}
        subtitle={project.description || `Project tracking and progress monitoring`}
      />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Components</CardTitle>
            <Component className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalComponents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all areas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.overallProgress)}%</div>
            <div className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats.completedComponents}</span> completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressComponents}</div>
            <p className="text-xs text-muted-foreground">
              Components being worked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Started</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.notStartedComponents}</div>
            <p className="text-xs text-muted-foreground">
              Pending installation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROC Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.rocValue)}%</div>
            <p className="text-xs text-muted-foreground">
              Rate of completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ProgressChart 
          title="Progress by Area"
          data={areaStats.map(stat => ({
            label: stat.area,
            value: stat.averageProgress,
            count: stat.componentCount
          }))}
        />

        <ProgressChart 
          title="Progress by System"
          data={systemStats.map(stat => ({
            label: stat.system,
            value: stat.averageProgress,
            count: stat.componentCount
          }))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity activities={recentMilestones} />

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link href={`/app/pipetrak/${projectId}/components`}>
                <Component className="h-4 w-4 mr-2" />
                Manage Components
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/app/pipetrak/${projectId}/import`}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Import Data
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/app/pipetrak/${projectId}/drawings`}>
                <FolderTree className="h-4 w-4 mr-2" />
                View Drawings ({stats.drawingCount})
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href={`/app/pipetrak/${projectId}/reports`}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Project Status</CardTitle>
          <CardDescription>
            Current status: {project.status.replace('_', ' ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
              <p className="text-sm">{project.location || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Start Date</p>
              <p className="text-sm">
                {project.startDate 
                  ? new Date(project.startDate).toLocaleDateString() 
                  : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Target Date</p>
              <p className="text-sm">
                {project.targetDate 
                  ? new Date(project.targetDate).toLocaleDateString() 
                  : 'Not specified'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}