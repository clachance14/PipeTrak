import type { Metadata } from "next";

interface WeldersPageProps {
  params: Promise<{
    organizationSlug: string;
    projectId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Welders | QC | PipeTrak",
  description: "Manage welder information and qualifications",
};

export default async function WeldersPage({ params }: WeldersPageProps) {
  const { organizationSlug, projectId } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welders</h1>
          <p className="text-muted-foreground">
            Manage welder information, stencils, and project assignments
          </p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          Add Welder
        </button>
      </div>

      {/* Welder Management Interface - Coming Soon */}
      <div className="rounded-lg border bg-card p-12">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197V9a3 3 0 00-6 0v2M8 21l4-7 4 7M8 21h8" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Welder Management</h3>
          <p className="text-muted-foreground mb-6">
            This feature is being implemented. You'll be able to:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 max-w-md mx-auto">
            <li>• Add welders with stencil and name</li>
            <li>• Track welder activity and productivity</li>
            <li>• Manage active/inactive status</li>
            <li>• View welds completed by each welder</li>
            <li>• Export welder performance reports</li>
          </ul>
        </div>
      </div>
    </div>
  );
}