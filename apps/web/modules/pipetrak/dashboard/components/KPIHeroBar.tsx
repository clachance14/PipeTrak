import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	AlertTriangle,
	Check,
	FileText,
	Package,
	TrendingUp,
} from "lucide-react";
import type { DashboardMetrics, TestPackageReadiness } from "../types";

interface KPIHeroBarProps {
	metrics: DashboardMetrics | null;
	testPackages: TestPackageReadiness | null;
}

/**
 * KPI Hero Bar - React Server Component
 * Displays the 5 main dashboard metrics:
 * 1. Overall % (primary)
 * 2. Components (primary)
 * 3. Active Drawings (primary)
 * 4. Test Packages (primary)
 * 5. Stalled (secondary - smaller and muted)
 */
export function KPIHeroBar({ metrics, testPackages }: KPIHeroBarProps) {
	if (!metrics) {
		return (
			<div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
				{[1, 2, 3, 4, 5].map((i) => (
					<Card key={i} className="animate-pulse">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								<div className="h-4 bg-gray-300 rounded w-20" />
							</CardTitle>
							<div className="h-4 w-4 bg-gray-300 rounded" />
						</CardHeader>
						<CardContent>
							<div className="h-8 bg-gray-300 rounded w-16 mb-1" />
							<div className="h-3 bg-gray-200 rounded w-24" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	const readyPackages =
		testPackages?.testPackages?.filter((pkg) => pkg.isReady).length || 0;

	return (
		<div className="grid gap-4 grid-cols-2 lg:grid-cols-5 w-full">
			{/* 1. Overall Completion % - Primary Metric */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Overall %
					</CardTitle>
					<TrendingUp className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						{Math.round(metrics.overallCompletionPercent)}%
					</div>
					<p className="text-xs text-muted-foreground">
						Project completion
					</p>
				</CardContent>
			</Card>

			{/* 2. Components - Primary Metric */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Components
					</CardTitle>
					<Package className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						{metrics.completedComponents.toLocaleString()} /{" "}
						{metrics.totalComponents.toLocaleString()}
					</div>
					<p className="text-xs text-muted-foreground">
						{metrics.completedComponents} completed
					</p>
				</CardContent>
			</Card>

			{/* 3. Active Drawings - Primary Metric */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Active Drawings
					</CardTitle>
					<FileText className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						{metrics.activeDrawings}
					</div>
					<p className="text-xs text-muted-foreground">
						With components
					</p>
				</CardContent>
			</Card>

			{/* 4. Test Packages - Primary Metric */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Test Pkgs
					</CardTitle>
					<Check className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold flex items-center gap-1">
						{readyPackages} ready
						<Check className="h-4 w-4 text-green-600" />
					</div>
					<p className="text-xs text-muted-foreground">
						{testPackages?.testPackages.length || 0} total packages
					</p>
				</CardContent>
			</Card>

			{/* 5. Stalled - Secondary Metric (smaller and muted) */}
			<Card className="border-orange-200 bg-orange-50/50 col-span-2 lg:col-span-1">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium text-muted-foreground">
						Stalled
					</CardTitle>
					<AlertTriangle className="h-4 w-4 text-orange-500" />
				</CardHeader>
				<CardContent>
					<div className="text-xl font-semibold text-orange-700">
						{metrics.stalledComponents.stalled7Days}
					</div>
					<div className="text-xs text-muted-foreground space-y-0.5">
						<div>7d: {metrics.stalledComponents.stalled7Days}</div>
						<div>
							14d: {metrics.stalledComponents.stalled14Days}
						</div>
						<div>
							21d: {metrics.stalledComponents.stalled21Days}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
