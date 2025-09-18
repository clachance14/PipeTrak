import { ReportCard } from "@pipetrak/reports/components/ReportCard";
import { LoadingState } from "@pipetrak/shared/components";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { Suspense } from "react";

interface ReportsPageProps {
	params: Promise<{
		projectId: string;
	}>;
}

export default async function ReportsPage({ params }: ReportsPageProps) {
	const { projectId } = await params;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Reports & Analytics"
				subtitle="Comprehensive project insights, ROC calculations, and data exports"
			/>

			<Suspense fallback={<LoadingState variant="card" />}>
				<ReportsContent projectId={projectId} />
			</Suspense>
		</div>
	);
}

// Server component for data fetching
async function ReportsContent({ projectId }: { projectId: string }) {
	const reportTypes = [
		{
			title: "Progress Summary",
			description:
				"ROC-weighted progress analysis with completion tracking across areas and systems. Includes velocity metrics and forecasting.",
			href: `/app/pipetrak/${projectId}/reports/progress`,
			icon: "progress" as const,
			badge: "ROC Analysis",
			isPopular: true,
			estimatedTime: "2-3 min",
		},
		{
			title: "Component Details",
			description:
				"Detailed component-level analysis with advanced filtering, milestone tracking, and completion status for every component.",
			href: `/app/pipetrak/${projectId}/reports/components`,
			icon: "components" as const,
			badge: "Detailed View",
			estimatedTime: "1-2 min",
		},
		{
			title: "Test Package Readiness",
			description:
				"Test package completion status, readiness forecasting, and blocking component identification for testing coordination.",
			href: `/app/pipetrak/${projectId}/reports/test-packages`,
			icon: "test-packages" as const,
			badge: "Testing Focus",
			isNew: true,
			estimatedTime: "1 min",
		},
		{
			title: "Trend Analysis",
			description:
				"Historical progress trends, velocity analysis, and completion forecasting with milestone breakdown over time.",
			href: `/app/pipetrak/${projectId}/reports/trends`,
			icon: "trends" as const,
			badge: "Forecasting",
			estimatedTime: "2-4 min",
		},
		{
			title: "Audit Trail",
			description:
				"Complete audit log of system changes, user actions, and milestone updates for compliance and troubleshooting.",
			href: `/app/pipetrak/${projectId}/reports/audit`,
			icon: "audit" as const,
			badge: "Compliance",
			estimatedTime: "30s - 1 min",
		},
	];

	return (
		<div className="space-y-6">
			{/* Report Type Cards */}
			<div>
				<h3 className="text-lg font-semibold mb-4">
					Available Reports
				</h3>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{reportTypes.map((report) => (
						<ReportCard
							key={report.title}
							title={report.title}
							description={report.description}
							href={report.href}
							icon={report.icon}
							badge={report.badge}
							isNew={report.isNew}
							isPopular={report.isPopular}
							estimatedTime={report.estimatedTime}
							className="h-full"
						/>
					))}
				</div>
			</div>

			{/* Quick Actions */}
			<div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border">
				<h3 className="text-lg font-semibold mb-2 text-gray-900">
					Quick Actions
				</h3>
				<p className="text-muted-foreground text-sm mb-4">
					Common reporting tasks and batch operations
				</p>
				<div className="flex flex-wrap gap-3">
					<a
						href={`/app/pipetrak/${projectId}/reports/progress?includeTrends=true&includeVelocity=true`}
						className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
					>
						📊 Executive Summary
					</a>
					<a
						href={`/app/pipetrak/${projectId}/reports/components?completionMin=0&completionMax=0`}
						className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
					>
						🔍 Not Started Components
					</a>
					<a
						href={`/app/pipetrak/${projectId}/reports/trends?days=30&granularity=daily&includeForecasting=true`}
						className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
					>
						📈 30-Day Trend Analysis
					</a>
					<a
						href={`/app/pipetrak/${projectId}/reports/test-packages?readinessStatus=ready,nearly_ready`}
						className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
					>
						✅ Ready Test Packages
					</a>
				</div>
			</div>

			{/* Tips and Information */}
			<div className="bg-gray-50 rounded-lg p-6 border">
				<h3 className="text-lg font-semibold mb-2 text-gray-900">
					Report Tips
				</h3>
				<div className="grid gap-4 md:grid-cols-2">
					<div>
						<h4 className="font-medium text-gray-900 mb-1">
							ROC Progress vs Standard Progress
						</h4>
						<p className="text-sm text-muted-foreground">
							ROC (Rate of Completion) considers component
							complexity and criticality, providing more accurate
							project completion metrics than simple component
							counts.
						</p>
					</div>
					<div>
						<h4 className="font-medium text-gray-900 mb-1">
							Export Options
						</h4>
						<p className="text-sm text-muted-foreground">
							All reports support Excel, PDF, and CSV export
							formats with customizable options including charts,
							raw data, and email delivery.
						</p>
					</div>
					<div>
						<h4 className="font-medium text-gray-900 mb-1">
							Real-time Data
						</h4>
						<p className="text-sm text-muted-foreground">
							Reports are generated from live data with
							intelligent caching. Data is automatically refreshed
							when changes are detected.
						</p>
					</div>
					<div>
						<h4 className="font-medium text-gray-900 mb-1">
							Filtering and Search
						</h4>
						<p className="text-sm text-muted-foreground">
							Use advanced filters to focus on specific areas,
							systems, or date ranges. Filters persist in URLs for
							easy sharing and bookmarking.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
