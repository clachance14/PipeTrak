import type { Metadata } from "next";

interface QCReportsPageProps {
	params: Promise<{
		organizationSlug: string;
		projectId: string;
	}>;
}

export const metadata: Metadata = {
	title: "QC Reports | PipeTrak",
	description: "Generate quality control reports and analytics",
};

export default async function QCReportsPage({ params }: QCReportsPageProps) {
	// Note: params available for future implementation
	await params;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						QC Reports
					</h1>
					<p className="text-muted-foreground">
						Generate comprehensive quality control reports and
						analytics
					</p>
				</div>
				<button
					type="button"
					className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
				>
					Generate Report
				</button>
			</div>

			{/* QC Reports Interface - Coming Soon */}
			<div className="rounded-lg border bg-card p-12">
				<div className="text-center">
					<div className="mx-auto h-12 w-12 text-gray-400 mb-4">
						<svg
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-label="Reports icon"
						>
							<title>QC Reports</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<h3 className="text-lg font-medium mb-2">QC Reporting</h3>
					<p className="text-muted-foreground mb-6">
						This feature is being implemented. You'll be able to
						generate:
					</p>
					<ul className="text-sm text-muted-foreground space-y-2 max-w-md mx-auto">
						<li>• Field weld summary reports by package</li>
						<li>• NDE status and acceptance rate reports</li>
						<li>• Welder productivity and performance reports</li>
						<li>• PWHT completion tracking reports</li>
						<li>• QC metrics and trending analysis</li>
						<li>• Client turnover documentation</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
