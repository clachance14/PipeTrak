/**
 * TypeScript interfaces for PipeTrak dashboard data
 * Matches the JSONB structure returned by Supabase RPC functions
 */

export interface DashboardMetrics {
	overallCompletionPercent: number;
	totalComponents: number;
	completedComponents: number;
	activeDrawings: number;
	testPackagesReady: number;
	stalledComponents: {
		stalled7Days: number;
		stalled14Days: number;
		stalled21Days: number;
	};
	generatedAt: number;
}

export interface DrawingRollup {
	drawingId: string;
	drawingNumber: string;
	drawingName: string | null;
	parentDrawingId: string | null;
	componentCount: number;
	completedCount: number;
	completionPercent: number;
	stalledCount: number;
}

export interface DrawingRollups {
	drawings: DrawingRollup[];
	generatedAt: number;
}

export interface TestPackage {
	packageId: string;
	packageName: string;
	totalComponents: number;
	completedComponents: number;
	completionPercent: number;
	isReady: boolean;
	stalledCount: number;
}

export interface TestPackageReadiness {
	testPackages: TestPackage[];
	generatedAt: number;
}

export interface ActivityItem {
	activityType: "milestone_completed" | "component_updated";
	timestamp: number;
	userId: string | null;
	userName: string;
	componentId: string;
	componentType: string;
	milestoneName: string | null;
	details: {
		componentId: string;
		componentType: string;
		milestoneName?: string;
		completionPercent?: number;
		action?: string;
		changes?: any;
	};
}

export interface RecentActivity {
	activities: ActivityItem[];
	generatedAt: number;
	limit: number;
}

export interface DashboardData {
	metrics: DashboardMetrics | null;
	drawingRollups: DrawingRollups | null;
	testPackageReadiness: TestPackageReadiness | null;
	recentActivity: RecentActivity | null;
	project: {
		id: string;
		jobName: string;
		description: string | null;
		status: string;
		organizationId: string;
	} | null;
}

export interface KPICardData {
	title: string;
	value: string | number;
	subtitle?: string;
	icon?: React.ComponentType<any>;
	variant?: "primary" | "secondary";
	trend?: {
		direction: "up" | "down" | "neutral";
		value: string;
		period: string;
	};
}
