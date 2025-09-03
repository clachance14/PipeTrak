/**
 * API client for PipeTrak reports
 * Uses Hono client pattern matching existing modules
 */

import { apiClient } from "@shared/lib/api-client";
import type {
	ProgressReportRequest,
	ProgressReportResponse,
	ComponentDetailsRequest,
	ComponentDetailsResponse,
	TestPackageReadinessRequest,
	TestPackageReadinessResponse,
	TrendAnalysisRequest,
	TrendAnalysisResponse,
	AuditTrailRequest,
	AuditTrailResponse,
	BulkReportRequest,
	BulkReportResponse,
	ReportStatusResponse,
	FilterOptionsResponse,
} from "../types";

// ============================================================================
// Client-side API Functions
// ============================================================================

/**
 * Generate progress summary report with ROC calculations
 */
export async function generateProgressReport(
	request: ProgressReportRequest,
): Promise<ProgressReportResponse> {
	const response = await apiClient.pipetrak.reports.generate.progress.$post({
		json: request,
	});

	if (!response.ok) {
		const error = await response.json() as { error?: string };
		throw new Error(error.error || "Failed to generate progress report");
	}

	return response.json();
}

/**
 * Get detailed component report with pagination
 */
export async function getComponentDetailsReport(
	request: ComponentDetailsRequest,
): Promise<ComponentDetailsResponse> {
	const response = await apiClient.pipetrak.reports.generate.components.$post(
		{
			json: request,
		},
	);

	if (!response.ok) {
		const error = await response.json() as { error?: string };
		throw new Error(
			error.error || "Failed to generate component details report",
		);
	}

	return response.json();
}

/**
 * Generate test package readiness report
 */
export async function generateTestPackageReadiness(
	request: TestPackageReadinessRequest,
): Promise<TestPackageReadinessResponse> {
	const response = await apiClient.pipetrak.reports.generate[
		"test-packages"
	].$post({
		json: request,
	});

	if (!response.ok) {
		const error = await response.json() as { error?: string };
		throw new Error(
			error.error || "Failed to generate test package readiness report",
		);
	}

	return response.json();
}

/**
 * Generate trend analysis report
 */
export async function generateTrendAnalysis(
	request: TrendAnalysisRequest,
): Promise<TrendAnalysisResponse> {
	const response = await apiClient.pipetrak.reports.generate.trends.$post({
		json: request,
	});

	if (!response.ok) {
		const error = await response.json() as { error?: string };
		throw new Error(
			error.error || "Failed to generate trend analysis report",
		);
	}

	return response.json();
}

/**
 * Get audit trail report
 */
export async function getAuditTrailReport(
	request: AuditTrailRequest,
): Promise<AuditTrailResponse> {
	const response = await apiClient.pipetrak.reports.generate.audit.$post({
		json: request,
	});

	if (!response.ok) {
		const error = await response.json() as { error?: string };
		throw new Error(error.error || "Failed to generate audit trail report");
	}

	return response.json();
}

/**
 * Get report generation status and history
 */
export async function getReportStatus(
	projectId: string,
	limit?: number,
): Promise<ReportStatusResponse> {
	const response = await apiClient.pipetrak.reports.status[":projectId"].$get(
		{
			param: { projectId },
		},
	);

	if (!response.ok) {
		const error = await response.json() as { error?: string };
		throw new Error(error.error || "Failed to get report status");
	}

	return response.json();
}

/**
 * Clear report cache
 */
export async function clearReportCache(
	projectId: string,
	reportType?: string,
): Promise<{
	success: boolean;
	data: { deletedEntries: number; reportType: string };
}> {
	const response = await apiClient.pipetrak.reports.cache[
		":projectId"
	].$delete({
		param: { projectId },
	});

	if (!response.ok) {
		const error = await response.json() as { error?: string };
		throw new Error(error.error || "Failed to clear report cache");
	}

	return response.json();
}

/**
 * Start bulk report generation (async)
 */
export async function generateBulkReports(
	request: BulkReportRequest,
): Promise<BulkReportResponse> {
	const response = await apiClient.pipetrak.reports.generate.bulk.$post({
		json: request,
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(
			error.error || "Failed to start bulk report generation",
		);
	}

	return response.json();
}

/**
 * Get available filter options for a project
 */
export async function getReportFilterOptions(
	projectId: string,
): Promise<FilterOptionsResponse> {
	const response = await apiClient.pipetrak.reports.filters[
		":projectId"
	].$get({
		param: { projectId },
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to get filter options");
	}

	return response.json();
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Build query parameters for component details with complex filters
 */
export function buildComponentDetailsQuery(
	filters: ComponentDetailsRequest["filters"] = {},
	pagination: ComponentDetailsRequest["pagination"] = {},
	sorting: ComponentDetailsRequest["sorting"] = {},
): ComponentDetailsRequest {
	return {
		projectId: "", // Will be set by caller
		filters: {
			...filters,
		},
		pagination: {
			limit: 10000,
			offset: 0,
			...pagination,
		},
		sorting: {
			field: "componentId",
			direction: "asc",
			...sorting,
		},
	};
}

/**
 * Build progress report query with default options
 */
export function buildProgressReportQuery(
	projectId: string,
	filters: ProgressReportRequest["filters"] = {},
	options: ProgressReportRequest["options"] = {},
): ProgressReportRequest {
	return {
		projectId,
		filters: {
			...filters,
		},
		options: {
			includeTrends: true,
			includeVelocity: true,
			includeForecasts: false,
			cacheTimeout: 300,
			...options,
		},
	};
}

/**
 * Build trend analysis query with timeframe
 */
export function buildTrendAnalysisQuery(
	projectId: string,
	days = 30,
	granularity: "daily" | "weekly" = "daily",
	options: TrendAnalysisRequest["options"] = {},
): TrendAnalysisRequest {
	return {
		projectId,
		timeframe: {
			days,
			granularity,
		},
		options: {
			includeForecasting: true,
			includeVelocityTrends: true,
			includeMilestoneBreakdown: false,
			...options,
		},
	};
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Handle API errors consistently across all report functions
 */
export function handleReportAPIError(error: any): {
	message: string;
	code?: string;
	details?: any;
} {
	if (error?.error) {
		return {
			message: error.error,
			code: error.code,
			details: error.details,
		};
	}

	if (error?.message) {
		return {
			message: error.message,
		};
	}

	return {
		message: "An unexpected error occurred while generating the report",
	};
}

/**
 * Retry logic for report generation with exponential backoff
 */
export async function retryReportGeneration<T>(
	operation: () => Promise<T>,
	maxRetries = 3,
	baseDelay = 1000,
): Promise<T> {
	let lastError: any;

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;

			if (attempt === maxRetries) {
				throw error;
			}

			// Exponential backoff
			const delay = baseDelay * 2 ** attempt;
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}
