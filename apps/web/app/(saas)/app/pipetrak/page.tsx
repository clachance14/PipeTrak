import { PageHeader } from "@saas/shared/components/PageHeader";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ui/components/card";
import { Plus, FolderOpen, Upload, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function PipeTrakPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="PipeTrak Projects"
        subtitle="Manage your pipeline construction components and track progress"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Components
            </CardTitle>
            <CardDescription>
              Manage field updates, milestone tracking, and bulk edits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/app/pipetrak/demo/components">
                View Components
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data
            </CardTitle>
            <CardDescription>
              Import components from Excel with validation and preview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/app/pipetrak/demo/import">
                Import Excel
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Reports
            </CardTitle>
            <CardDescription>
              Progress dashboards, ROC calculations, and exports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/app/pipetrak/demo/reports">
                View Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Start by creating a new project or importing your existing component data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Project
            </Button>
            <Button asChild variant="outline">
              <Link href="/app/pipetrak/demo/import">
                <Upload className="h-4 w-4 mr-2" />
                Import Existing Data
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}