import type { Metadata } from "next";
import { TabGroup } from "@saas/shared/components/TabGroup";
import { QCMetricCard } from "@pipetrak/qc/components/QCMetricCard";
import { QCQuickActions } from "@pipetrak/qc/components/QCQuickActions";
import { QCDashboardClient } from "@pipetrak/qc/components/QCDashboardClient";
import { getQCActivityFeed } from "@pipetrak/qc/lib/activity-loader";
import { getQCMetrics, formatQCMetrics } from "@pipetrak/qc/lib/qc-metrics-loader";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";

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

	// Load real QC metrics from database
	const qcMetrics = await getQCMetrics(projectId);
	const formattedMetrics = formatQCMetrics(qcMetrics);

	// QC Navigation tabs with counts
	const qcTabs = [
		{
			label: "Overview",
			href: `/app/${organizationSlug}/pipetrak/${projectId}/qc`,
			segment: "qc",
		},
		{
			label: "Field Welds",
			href: `/app/${organizationSlug}/pipetrak/${projectId}/qc/field-welds`,
			segment: "field-welds",
			badge: qcMetrics.totalWelds.toLocaleString(),
		},
		{
			label: "Welders",
			href: `/app/${organizationSlug}/pipetrak/${projectId}/qc/welders`,
			segment: "welders",
			badge: qcMetrics.activeWelders.toString(),
		},
		{
			label: "Reports",
			href: `/app/${organizationSlug}/pipetrak/${projectId}/qc/reports`,
			segment: "reports",
		},
	];

	return (
		<div className="container mx-auto px-4 lg:px-6 space-y-6">
			{/* QC Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Quality Control
					</h1>
					<p className="text-muted-foreground">
						Manage field welds, welder information, and QC processes
					</p>
				</div>
			</div>

			{/* QC Metrics Overview */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<QCMetricCard
					title="Total Field Welds"
					value={formattedMetrics.totalWelds.value}
					label={formattedMetrics.totalWelds.label}
					color="blue"
					trend={formattedMetrics.totalWelds.trend}
				/>
				<QCMetricCard
					title="Acceptance Rate"
					value={formattedMetrics.acceptanceRate.value}
					label={formattedMetrics.acceptanceRate.label}
					color="green"
					trend={formattedMetrics.acceptanceRate.trend}
				/>
				<QCMetricCard
					title="PWHT Complete"
					value={formattedMetrics.pwhtComplete.value}
					label={formattedMetrics.pwhtComplete.label}
					color="orange"
					trend={formattedMetrics.pwhtComplete.trend}
				/>
				<QCMetricCard
					title="Active Welders"
					value={formattedMetrics.activeWelders.value}
					label={formattedMetrics.activeWelders.label}
					color="purple"
				/>
			</div>

			{/* QC Navigation Tabs */}
			<TabGroup items={qcTabs} />

			{/* Quick Actions */}
			<QCQuickActions
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>

			{/* Date Range Filter and Activity Feed */}
			<Suspense fallback={<QCActivitySkeleton />}>
				<QCActivityContentWithFilters projectId={projectId} />
			</Suspense>
		</div>
	);
}

// Server component for loading initial activity data
async function QCActivityContentWithFilters({ projectId }: { projectId: string }) {
	const initialActivities = await getQCActivityFeed(projectId, 15);
	return (
		<QCDashboardClient 
			projectId={projectId}
			initialActivities={initialActivities}
		/>
	);
}

// Loading skeleton for activity feed
function QCActivitySkeleton() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Recent Activity</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{[1, 2, 3].map((i) => (
					<div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30 animate-pulse">
						<div className="h-9 w-9 rounded-full bg-muted" />
						<div className="flex-1 space-y-2">
							<div className="h-4 bg-muted rounded w-3/4" />
							<div className="h-3 bg-muted rounded w-1/4" />
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
