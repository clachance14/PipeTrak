import type { Metadata } from "next";

interface QCPageProps {
  params: Promise<{
    organizationSlug: string;
    projectId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Quality Control | PipeTrak",
  description: "Field weld quality control management and tracking",
};

export default async function QCPage({ params }: QCPageProps) {
  const { organizationSlug, projectId } = await params;

  return (
    <div className="space-y-6">
      {/* QC Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quality Control</h1>
          <p className="text-muted-foreground">
            Manage field welds, welder information, and QC processes
          </p>
        </div>
      </div>

      {/* QC Overview Dashboard */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Field Welds */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-blue-500" />
            <h3 className="font-semibold">Total Field Welds</h3>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">0</div>
            <p className="text-sm text-muted-foreground">Across all packages</p>
          </div>
        </div>

        {/* Acceptance Rate */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-green-500" />
            <h3 className="font-semibold">Acceptance Rate</h3>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">--</div>
            <p className="text-sm text-muted-foreground">NDE pass rate</p>
          </div>
        </div>

        {/* PWHT Status */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-orange-500" />
            <h3 className="font-semibold">PWHT Complete</h3>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">0</div>
            <p className="text-sm text-muted-foreground">Post-weld heat treatment</p>
          </div>
        </div>

        {/* Active Welders */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-purple-500" />
            <h3 className="font-semibold">Active Welders</h3>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold">0</div>
            <p className="text-sm text-muted-foreground">Qualified welders</p>
          </div>
        </div>
      </div>

      {/* QC Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8" aria-label="QC Navigation">
          <a
            href={`/app/${organizationSlug}/pipetrak/${projectId}/qc`}
            className="border-transparent py-2 px-1 border-b-2 font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Overview
          </a>
          <a
            href={`/app/${organizationSlug}/pipetrak/${projectId}/qc/field-welds`}
            className="border-transparent py-2 px-1 border-b-2 font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Field Welds
          </a>
          <a
            href={`/app/${organizationSlug}/pipetrak/${projectId}/qc/welders`}
            className="border-transparent py-2 px-1 border-b-2 font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Welders
          </a>
          <a
            href={`/app/${organizationSlug}/pipetrak/${projectId}/qc/reports`}
            className="border-transparent py-2 px-1 border-b-2 font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            Reports
          </a>
        </nav>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-2">Add Welder</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Register a new welder for this project
            </p>
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
              Add Welder
            </button>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-2">Import Field Welds</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bulk import field weld data from Excel
            </p>
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
              Import Welds
            </button>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-2">Generate Report</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create QC status reports and summaries
            </p>
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.712-3.714M14 40v-4a9.971 9.971 0 01.712-3.714M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.712-3.714M14 40v-4a9.971 9.971 0 01.712-3.714"
                />
              </svg>
              <p className="mt-2 text-sm">No QC activity yet</p>
              <p className="text-sm">Start by adding welders or importing field weld data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}