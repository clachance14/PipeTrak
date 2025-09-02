/**
 * Report data processing and generation utilities
 * Transforms API responses into chart data and formatted reports
 */

import type {
	ProgressReportResponse,
	ComponentDetailsResponse,
	TestPackageReadinessResponse,
	TrendAnalysisResponse,
	ProgressChartData,
	ROCChartData,
	ChartDataPoint,
	ComponentDetail,
} from "../types";

// ============================================================================
// Chart Data Transformation
// ============================================================================

/**
 * Transform progress report data into chart-friendly format
 */
export function generateProgressCharts(
	data: ProgressReportResponse,
): ProgressChartData {
	const { comprehensiveReport, rocWeightedProgress } = data.data;

	// Time series data from trends
	const timeSeriesData: ChartDataPoint[] =
		comprehensiveReport.trends?.dailyProgress.map((point) => ({
			name: point.date,
			date: point.date,
			value: point.completionPercent,
			completionPercent: point.completionPercent,
			totalComponents: point.componentsCompleted,
		})) || [];

	// Area distribution
	const areaDistribution: ChartDataPoint[] =
		comprehensiveReport.areaBreakdowns.map((area) => ({
			name: area.area,
			value: area.completionPercent,
			totalComponents: area.totalComponents,
			completedComponents: area.completedComponents,
		}));

	// System distribution
	const systemDistribution: ChartDataPoint[] =
		comprehensiveReport.systemBreakdowns.map((system) => ({
			name: system.system,
			value: system.completionPercent,
			totalComponents: system.totalComponents,
			completedComponents: system.completedComponents,
		}));

	// Status distribution (derived from area data)
	const statusDistribution: ChartDataPoint[] = [
		{
			name: "Completed",
			value: comprehensiveReport.overview.completedComponents,
		},
		{
			name: "In Progress",
			value:
				comprehensiveReport.overview.totalComponents -
				comprehensiveReport.overview.completedComponents,
		},
	];

	return {
		timeSeriesData,
		areaDistribution,
		systemDistribution,
		statusDistribution,
	};
}

/**
 * Transform ROC data into chart format
 */
export function generateROCCharts(data: ProgressReportResponse): ROCChartData {
	const { rocWeightedProgress } = data.data;

	// ROC by area
	const rocByArea: ChartDataPoint[] = rocWeightedProgress.areaBreakdowns.map(
		(area) => ({
			name: area.area,
			value: area.rocProgress,
			totalComponents: area.componentCount,
		}),
	);

	// ROC by system
	const rocBySystem: ChartDataPoint[] =
		rocWeightedProgress.systemBreakdowns.map((system) => ({
			name: system.system,
			value: system.rocProgress,
			totalComponents: system.componentCount,
		}));

	// ROC vs Standard Progress comparison (requires component details)
	const rocVsStandard: Array<{
		name: string;
		rocProgress: number;
		standardProgress: number;
	}> = rocWeightedProgress.areaBreakdowns.map((area) => ({
		name: area.area,
		rocProgress: area.rocProgress,
		standardProgress: (area.completedWeight / area.componentCount) * 100, // Approximation
	}));

	return {
		rocByArea,
		rocBySystem,
		rocVsStandard,
	};
}

/**
 * Transform trend analysis data for visualization
 */
export function generateTrendCharts(data: TrendAnalysisResponse): {
	progressTrend: ChartDataPoint[];
	velocityTrend: ChartDataPoint[];
	forecastData?: ChartDataPoint[];
} {
	const { trendData, forecast } = data.data;

	// Progress trend over time
	const progressTrend: ChartDataPoint[] = trendData.map((point) => ({
		name: point.date,
		date: point.date,
		value: point.completionPercent,
		completionPercent: point.completionPercent,
	}));

	// Velocity trend
	const velocityTrend: ChartDataPoint[] = trendData.map((point) => ({
		name: point.date,
		date: point.date,
		value: point.dailyVelocity,
	}));

	// Forecast data if available
	const forecastData: ChartDataPoint[] | undefined =
		forecast?.projectedProgress.map((point) => ({
			name: point.date,
			date: point.date,
			value: point.projectedCompletion,
			completionPercent: point.projectedCompletion,
		}));

	return {
		progressTrend,
		velocityTrend,
		forecastData,
	};
}

// ============================================================================
// Report Formatting
// ============================================================================

/**
 * Format component details for display
 */
export function formatComponentDetails(data: ComponentDetailsResponse): {
	formattedComponents: Array<
		ComponentDetail & { formattedUpdatedAt: string; statusColor: string }
	>;
	summary: {
		totalComponents: number;
		completionStats: {
			completed: number;
			inProgress: number;
			notStarted: number;
		};
		stalledAnalysis: {
			count: number;
			percentage: number;
		};
	};
} {
	const formattedComponents = data.data.components.map((component) => ({
		...component,
		formattedUpdatedAt: new Date(component.updatedAt).toLocaleDateString(),
		statusColor: getStatusColor(component.status),
	}));

	// Enhanced summary
	const completionStats = {
		completed: data.data.components.filter(
			(c) => c.completionPercent >= 100,
		).length,
		inProgress: data.data.components.filter(
			(c) => c.completionPercent > 0 && c.completionPercent < 100,
		).length,
		notStarted: data.data.components.filter(
			(c) => c.completionPercent === 0,
		).length,
	};

	const stalledAnalysis = {
		count: data.data.components.filter(
			(c) => c.stalledDays && c.stalledDays > 7,
		).length,
		percentage:
			data.data.components.length > 0
				? (data.data.components.filter(
						(c) => c.stalledDays && c.stalledDays > 7,
					).length /
						data.data.components.length) *
					100
				: 0,
	};

	return {
		formattedComponents,
		summary: {
			totalComponents: data.data.components.length,
			completionStats,
			stalledAnalysis,
		},
	};
}

/**
 * Format test package readiness data
 */
export function formatTestPackageReadiness(
	data: TestPackageReadinessResponse,
): {
	formattedPackages: Array<{
		packageId: string;
		packageName: string;
		completionPercent: number;
		readinessStatus: string;
		readinessColor: string;
		estimatedDays: number | null;
		blockingCount: number;
	}>;
	readinessDistribution: ChartDataPoint[];
} {
	const formattedPackages = data.data.testPackages.map((pkg) => ({
		packageId: pkg.packageId,
		packageName: pkg.packageName,
		completionPercent: pkg.completionPercent,
		readinessStatus: pkg.readinessStatus,
		readinessColor: getReadinessColor(pkg.readinessStatus),
		estimatedDays: pkg.velocityMetrics?.daysToCompletion || null,
		blockingCount: pkg.blockingComponents.length,
	}));

	const readinessDistribution: ChartDataPoint[] = [
		{ name: "Ready", value: data.data.summary.readyPackages },
		{ name: "Nearly Ready", value: data.data.summary.nearlyReadyPackages },
		{ name: "In Progress", value: data.data.summary.inProgressPackages },
		{ name: "Not Started", value: data.data.summary.notStartedPackages },
	];

	return {
		formattedPackages,
		readinessDistribution,
	};
}

// ============================================================================
// Data Export and Formatting
// ============================================================================

/**
 * Prepare data for Excel export
 */
export function prepareExcelExport(
	reportType: "progress" | "components" | "test-packages",
	data: any,
): {
	sheets: Array<{
		name: string;
		data: Array<Record<string, any>>;
	}>;
	filename: string;
} {
	const timestamp = new Date().toISOString().split("T")[0];
	let sheets: Array<{ name: string; data: Array<Record<string, any>> }> = [];
	let filename = "";

	switch (reportType) {
		case "progress":
			filename = `progress-report-${timestamp}.xlsx`;
			sheets = [
				{
					name: "Overview",
					data: [
						{
							Metric: "Total Components",
							Value: data.data.comprehensiveReport.overview
								.totalComponents,
						},
						{
							Metric: "Completed Components",
							Value: data.data.comprehensiveReport.overview
								.completedComponents,
						},
						{
							Metric: "Overall Completion %",
							Value: data.data.comprehensiveReport.overview
								.overallCompletionPercent,
						},
						{
							Metric: "ROC-Weighted Progress %",
							Value: data.data.rocWeightedProgress
								.overallROCProgress,
						},
					],
				},
				{
					name: "Area Breakdown",
					data: data.data.comprehensiveReport.areaBreakdowns.map(
						(area: any) => ({
							Area: area.area,
							"Total Components": area.totalComponents,
							"Completed Components": area.completedComponents,
							"Completion %": area.completionPercent,
							"Stalled Components": area.stalledCount,
						}),
					),
				},
				{
					name: "System Breakdown",
					data: data.data.comprehensiveReport.systemBreakdowns.map(
						(system: any) => ({
							System: system.system,
							"Total Components": system.totalComponents,
							"Completed Components": system.completedComponents,
							"Completion %": system.completionPercent,
							"Stalled Components": system.stalledCount,
						}),
					),
				},
			];
			break;

		case "components":
			filename = `component-details-${timestamp}.xlsx`;
			sheets = [
				{
					name: "Component Details",
					data: data.data.components.map(
						(component: ComponentDetail) => ({
							"Component ID": component.componentId,
							Type: component.type,
							Area: component.area,
							System: component.system,
							"Test Package": component.testPackage,
							"Drawing Number": component.drawingNumber,
							"Completion %": component.completionPercent,
							Status: component.status,
							Updated: component.updatedAt,
							"Stalled Days": component.stalledDays || 0,
						}),
					),
				},
			];
			break;

		case "test-packages":
			filename = `test-package-readiness-${timestamp}.xlsx`;
			sheets = [
				{
					name: "Test Package Readiness",
					data: data.data.testPackages.map((pkg: any) => ({
						"Package ID": pkg.packageId,
						"Package Name": pkg.packageName,
						"Total Components": pkg.totalComponents,
						"Completed Components": pkg.completedComponents,
						"Completion %": pkg.completionPercent,
						"Readiness Status": pkg.readinessStatus,
						"Blocking Components": pkg.blockingComponents.length,
						"Estimated Ready Date": pkg.estimatedReadyDate,
					})),
				},
			];
			break;
	}

	return { sheets, filename };
}

/**
 * Generate PDF report content
 */
export function preparePDFContent(
	reportType: "progress" | "components" | "test-packages",
	data: any,
	projectInfo: { jobNumber: string; jobName: string; organization: string },
): {
	title: string;
	content: Array<{
		type: "header" | "paragraph" | "table" | "chart";
		data: any;
	}>;
} {
	const title = `${projectInfo.jobNumber} - ${reportType.replace("-", " ").toUpperCase()} Report`;
	const content: Array<{
		type: "header" | "paragraph" | "table" | "chart";
		data: any;
	}> = [];

	// Add header
	content.push({
		type: "header",
		data: {
			title,
			subtitle: `${projectInfo.jobName} | ${projectInfo.organization}`,
			generatedAt: new Date().toLocaleDateString(),
		},
	});

	switch (reportType) {
		case "progress":
			content.push(
				{
					type: "paragraph",
					data: `Project progress summary for ${projectInfo.jobName}. This report includes both standard completion metrics and ROC-weighted progress calculations.`,
				},
				{
					type: "table",
					data: {
						headers: ["Metric", "Value"],
						rows: [
							[
								"Total Components",
								data.data.comprehensiveReport.overview
									.totalComponents,
							],
							[
								"Completed Components",
								data.data.comprehensiveReport.overview
									.completedComponents,
							],
							[
								"Overall Completion %",
								`${data.data.comprehensiveReport.overview.overallCompletionPercent}%`,
							],
							[
								"ROC-Weighted Progress %",
								`${data.data.rocWeightedProgress.overallROCProgress.toFixed(1)}%`,
							],
						],
					},
				},
			);
			break;

		case "components":
			content.push({
				type: "paragraph",
				data: "Detailed component listing with completion status and milestone tracking.",
			});
			break;

		case "test-packages":
			content.push({
				type: "paragraph",
				data: "Test package readiness analysis showing preparation status for testing phases.",
			});
			break;
	}

	return { title, content };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get status color for component status
 */
function getStatusColor(status: string): string {
	const colorMap: Record<string, string> = {
		COMPLETE: "green",
		IN_PROGRESS: "blue",
		NOT_STARTED: "gray",
		ON_HOLD: "orange",
		ISSUE: "red",
	};
	return colorMap[status] || "gray";
}

/**
 * Get readiness color for test package status
 */
function getReadinessColor(readinessStatus: string): string {
	const colorMap: Record<string, string> = {
		ready: "green",
		nearly_ready: "yellow",
		in_progress: "blue",
		not_started: "gray",
	};
	return colorMap[readinessStatus] || "gray";
}

/**
 * Calculate summary statistics for any numeric array
 */
export function calculateSummaryStats(values: number[]): {
	min: number;
	max: number;
	avg: number;
	median: number;
	stdDev: number;
} {
	if (values.length === 0) {
		return { min: 0, max: 0, avg: 0, median: 0, stdDev: 0 };
	}

	const sorted = [...values].sort((a, b) => a - b);
	const min = sorted[0];
	const max = sorted[sorted.length - 1];
	const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
	const median = sorted[Math.floor(sorted.length / 2)];

	const variance =
		values.reduce((sum, val) => sum + (val - avg) ** 2, 0) / values.length;
	const stdDev = Math.sqrt(variance);

	return { min, max, avg, median, stdDev };
}

/**
 * Generate insights and recommendations based on report data
 */
export function generateInsights(
	reportType: "progress" | "components" | "test-packages",
	data: any,
): string[] {
	const insights: string[] = [];

	switch (reportType) {
		case "progress": {
			const rocProgress =
				data.data.rocWeightedProgress.overallROCProgress;
			const standardProgress =
				data.data.comprehensiveReport.overview.overallCompletionPercent;

			if (rocProgress > standardProgress + 5) {
				insights.push(
					"Project is ahead of schedule on critical path components.",
				);
			} else if (rocProgress < standardProgress - 5) {
				insights.push(
					"Focus needed on high-priority components to maintain schedule.",
				);
			}

			if (
				data.data.comprehensiveReport.trends?.velocityMetrics
					?.averageDailyCompletion < 1
			) {
				insights.push(
					"Current completion velocity is below optimal. Consider resource reallocation.",
				);
			}
			break;
		}

		case "components": {
			const stalledCount = data.data.components.filter(
				(c: ComponentDetail) => c.stalledDays && c.stalledDays > 14,
			).length;
			const totalCount = data.data.components.length;

			if (stalledCount > totalCount * 0.15) {
				insights.push(
					"High number of stalled components detected. Review resource allocation.",
				);
			}
			break;
		}
	}

	return insights;
}
