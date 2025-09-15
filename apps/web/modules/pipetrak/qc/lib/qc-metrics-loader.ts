import { apiClient } from "@shared/lib/api-client";

export interface QCMetrics {
	totalWelds: number;
	acceptedWelds: number;
	rejectedWelds: number;
	pendingWelds: number;
	acceptanceRate: number;
	pwhtRequired: number;
	pwhtComplete: number;
	pwhtCompletionRate: number;
	activeWelders: number;
	trends: {
		weldsLastWeek: number;
		weldsWeekOverWeekChange: number;
		acceptanceRateChange: number;
		pwhtCompletionRate: number;
	};
}

export interface QCMetricsResponse {
	metrics: QCMetrics;
	project: {
		id: string;
		name: string;
	};
}

export interface QCSummary {
	totalWelds: number;
	activeWelders: number;
	acceptanceRate: number;
	totalInspected: number;
}

export interface QCSummaryResponse {
	summary: QCSummary;
}

/**
 * Load comprehensive QC metrics for a project
 * Used for detailed QC dashboard views
 */
export async function getQCMetrics(projectId: string): Promise<QCMetrics> {
	try {
		const response = await apiClient.pipetrak["qc-metrics"][":projectId"].$get({
			param: { projectId },
		});

		if (!response.ok) {
			console.error("Failed to fetch QC metrics:", response.status);
			return getDefaultMetrics();
		}

		const data = (await response.json()) as QCMetricsResponse;
		return data.metrics;
	} catch (error) {
		console.error("Error loading QC metrics:", error);
		return getDefaultMetrics();
	}
}

/**
 * Load quick QC summary for a project
 * Used for overview cards and navigation badges
 */
export async function getQCSummary(projectId: string): Promise<QCSummary> {
	try {
		const response = await apiClient.pipetrak["qc-metrics"][":projectId"]["summary"].$get({
			param: { projectId },
		});

		if (!response.ok) {
			console.error("Failed to fetch QC summary:", response.status);
			return getDefaultSummary();
		}

		const data = (await response.json()) as QCSummaryResponse;
		return data.summary;
	} catch (error) {
		console.error("Error loading QC summary:", error);
		return getDefaultSummary();
	}
}

/**
 * Default metrics to show when data cannot be loaded
 */
function getDefaultMetrics(): QCMetrics {
	return {
		totalWelds: 0,
		acceptedWelds: 0,
		rejectedWelds: 0,
		pendingWelds: 0,
		acceptanceRate: 0,
		pwhtRequired: 0,
		pwhtComplete: 0,
		pwhtCompletionRate: 0,
		activeWelders: 0,
		trends: {
			weldsLastWeek: 0,
			weldsWeekOverWeekChange: 0,
			acceptanceRateChange: 0,
			pwhtCompletionRate: 0,
		},
	};
}

/**
 * Default summary to show when data cannot be loaded
 */
function getDefaultSummary(): QCSummary {
	return {
		totalWelds: 0,
		activeWelders: 0,
		acceptanceRate: 0,
		totalInspected: 0,
	};
}

/**
 * Format QC metrics for dashboard display
 * Provides formatted strings and trend indicators
 */
export function formatQCMetrics(metrics: QCMetrics) {
	return {
		totalWelds: {
			value: metrics.totalWelds.toLocaleString(),
			label: "Across all packages",
			trend: metrics.trends.weldsWeekOverWeekChange > 0
				? {
					value: `${metrics.trends.weldsWeekOverWeekChange}%`,
					type: "increase" as const,
				}
				: undefined,
		},
		acceptanceRate: {
			value: `${metrics.acceptanceRate}%`,
			label: "NDE pass rate",
			trend: Math.abs(metrics.trends.acceptanceRateChange) > 0
				? {
					value: `${Math.abs(metrics.trends.acceptanceRateChange)}%`,
					type: metrics.trends.acceptanceRateChange > 0
						? "increase" as const
						: "decrease" as const,
				}
				: undefined,
		},
		pwhtComplete: {
			value: metrics.pwhtComplete.toLocaleString(),
			label: "Post-weld heat treatment",
			trend: metrics.pwhtCompletionRate > 0
				? {
					value: `${metrics.pwhtCompletionRate}%`,
					type: metrics.pwhtCompletionRate > 80
						? "increase" as const
						: "neutral" as const,
				}
				: undefined,
		},
		activeWelders: {
			value: metrics.activeWelders.toString(),
			label: "Qualified welders",
		},
	};
}