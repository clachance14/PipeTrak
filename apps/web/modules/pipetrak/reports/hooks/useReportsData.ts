/**
 * React hooks for PipeTrak reporting data
 * Uses TanStack Query following existing patterns from dashboard module
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { toast } from "sonner";
import {
	buildComponentDetailsQuery,
	buildProgressReportQuery,
	buildTrendAnalysisQuery,
	clearReportCache,
	generateBulkReports,
	generateProgressReport,
	generateTestPackageReadiness,
	generateTrendAnalysis,
	getAuditTrailReport,
	getComponentDetailsReport,
	getReportFileFilterOptions,
	getReportStatus,
	handleReportAPIError,
	retryReportGeneration,
} from "../lib/report-api";
import type {
	AuditTrailRequest,
	BulkReportRequest,
	ComponentDetailsFileFilters,
	ReportFileFilters,
	ReportPagination,
	ReportSorting,
	TestPackageReadinessRequest,
} from "../types";

// ============================================================================
// Query Key Factories
// ============================================================================

const reportsKeys = {
	all: ["reports"] as const,
	project: (projectId: string) =>
		[...reportsKeys.all, "project", projectId] as const,
	progress: (projectId: string, filters?: ReportFileFilters) =>
		[...reportsKeys.project(projectId), "progress", filters] as const,
	components: (
		projectId: string,
		filters?: ComponentDetailsFileFilters,
		pagination?: ReportPagination,
		sorting?: ReportSorting,
	) =>
		[
			...reportsKeys.project(projectId),
			"components",
			filters,
			pagination,
			sorting,
		] as const,
	testPackages: (projectId: string, filters?: any) =>
		[...reportsKeys.project(projectId), "test-packages", filters] as const,
	trends: (
		projectId: string,
		days?: number,
		granularity?: "daily" | "weekly",
	) =>
		[
			...reportsKeys.project(projectId),
			"trends",
			days,
			granularity,
		] as const,
	audit: (projectId: string, filters?: any, pagination?: ReportPagination) =>
		[
			...reportsKeys.project(projectId),
			"audit",
			filters,
			pagination,
		] as const,
	status: (projectId: string) =>
		[...reportsKeys.project(projectId), "status"] as const,
	filters: (projectId: string) =>
		[...reportsKeys.project(projectId), "filters"] as const,
};

// ============================================================================
// Progress Report Hooks
// ============================================================================

/**
 * Hook for progress report data with ROC calculations
 */
export function useProgressReport(
	projectId: string,
	filters?: ReportFileFilters,
	options?: {
		includeTrends?: boolean;
		includeVelocity?: boolean;
		includeForecasts?: boolean;
		enabled?: boolean;
		refetchInterval?: number;
	},
) {
	return useQuery({
		queryKey: reportsKeys.progress(projectId, filters),
		queryFn: async () => {
			const request = buildProgressReportQuery(projectId, filters, {
				includeTrends: options?.includeTrends,
				includeVelocity: options?.includeVelocity,
				includeForecasts: options?.includeForecasts,
			});

			return retryReportGeneration(() => generateProgressReport(request));
		},
		enabled: !!projectId && options?.enabled !== false,
		refetchInterval: options?.refetchInterval,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
}

/**
 * Hook for refreshing progress report
 */
export function useRefreshProgressReport() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			projectId,
			filters,
		}: {
			projectId: string;
			filters?: ReportFileFilters;
		}) => {
			// Invalidate and refetch progress report
			await queryClient.invalidateQueries({
				queryKey: reportsKeys.progress(projectId, filters),
			});
			return true;
		},
		onSuccess: () => {
			toast.success("Progress report refreshed");
		},
		onError: (error) => {
			const { message } = handleReportAPIError(error);
			toast.error(`Failed to refresh report: ${message}`);
		},
	});
}

// ============================================================================
// Component Details Hooks
// ============================================================================

/**
 * Hook for component details report with pagination
 */
export function useComponentDetailsReport(
	projectId: string,
	filters?: ComponentDetailsFileFilters,
	pagination?: ReportPagination,
	sorting?: ReportSorting,
	options?: {
		enabled?: boolean;
	},
) {
	return useQuery({
		queryKey: reportsKeys.components(
			projectId,
			filters,
			pagination,
			sorting,
		),
		queryFn: async () => {
			const request = buildComponentDetailsQuery(
				filters,
				pagination,
				sorting,
			);
			request.projectId = projectId;

			return retryReportGeneration(() =>
				getComponentDetailsReport(request),
			);
		},
		enabled: !!projectId && options?.enabled !== false,
		staleTime: 2 * 60 * 1000, // 2 minutes
		gcTime: 5 * 60 * 1000, // 5 minutes
	});
}

/**
 * Hook for component details pagination
 */
export function useComponentDetailsPagination(
	projectId: string,
	_initialFileFilters?: ComponentDetailsFileFilters,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			filters,
			pagination,
			sorting,
		}: {
			filters?: ComponentDetailsFileFilters;
			pagination?: ReportPagination;
			sorting?: ReportSorting;
		}) => {
			const request = buildComponentDetailsQuery(
				filters,
				pagination,
				sorting,
			);
			request.projectId = projectId;

			return getComponentDetailsReport(request);
		},
		onSuccess: (data, variables) => {
			// Update cache with new data
			queryClient.setQueryData(
				reportsKeys.components(
					projectId,
					variables.filters,
					variables.pagination,
					variables.sorting,
				),
				data,
			);
		},
		onError: (error) => {
			const { message } = handleReportAPIError(error);
			toast.error(`Failed to load components: ${message}`);
		},
	});
}

// ============================================================================
// Test Package Readiness Hooks
// ============================================================================

/**
 * Hook for test package readiness report
 */
export function useTestPackageReadiness(
	projectId: string,
	filters?: {
		testPackages?: string[];
		areas?: string[];
		systems?: string[];
		readinessStatus?: (
			| "ready"
			| "nearly_ready"
			| "in_progress"
			| "not_started"
		)[];
	},
	options?: {
		includeBlockingComponents?: boolean;
		includeVelocityAnalysis?: boolean;
		includeForecast?: boolean;
		enabled?: boolean;
	},
) {
	return useQuery({
		queryKey: reportsKeys.testPackages(projectId, filters),
		queryFn: async () => {
			const request: TestPackageReadinessRequest = {
				projectId,
				filters,
				options: {
					includeBlockingComponents:
						options?.includeBlockingComponents ?? true,
					includeVelocityAnalysis:
						options?.includeVelocityAnalysis ?? true,
					includeForecast: options?.includeForecast ?? true,
				},
			};

			return retryReportGeneration(() =>
				generateTestPackageReadiness(request),
			);
		},
		enabled: !!projectId && options?.enabled !== false,
		staleTime: 3 * 60 * 1000, // 3 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
}

// ============================================================================
// Trend Analysis Hooks
// ============================================================================

/**
 * Hook for trend analysis report
 */
export function useTrendAnalysis(
	projectId: string,
	days = 30,
	granularity: "daily" | "weekly" = "daily",
	options?: {
		includeForecasting?: boolean;
		includeVelocityTrends?: boolean;
		includeMilestoneBreakdown?: boolean;
		enabled?: boolean;
	},
) {
	return useQuery({
		queryKey: reportsKeys.trends(projectId, days, granularity),
		queryFn: async () => {
			const request = buildTrendAnalysisQuery(
				projectId,
				days,
				granularity,
				options,
			);
			return retryReportGeneration(() => generateTrendAnalysis(request));
		},
		enabled: !!projectId && options?.enabled !== false,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 15 * 60 * 1000, // 15 minutes
	});
}

// ============================================================================
// Audit Trail Hooks
// ============================================================================

/**
 * Hook for audit trail report
 */
export function useAuditTrail(
	projectId: string,
	filters?: {
		entityTypes?: ("Component" | "Milestone" | "Project")[];
		userIds?: string[];
		actions?: string[];
		startDate?: string;
		endDate?: string;
	},
	pagination?: ReportPagination,
	options?: {
		enabled?: boolean;
	},
) {
	return useQuery({
		queryKey: reportsKeys.audit(projectId, filters, pagination),
		queryFn: async () => {
			const request: AuditTrailRequest = {
				projectId,
				filters,
				pagination: {
					limit: 100,
					offset: 0,
					...pagination,
				},
			};

			return retryReportGeneration(() => getAuditTrailReport(request));
		},
		enabled: !!projectId && options?.enabled !== false,
		staleTime: 1 * 60 * 1000, // 1 minute
		gcTime: 5 * 60 * 1000, // 5 minutes
	});
}

// ============================================================================
// Report Status and Cache Management
// ============================================================================

/**
 * Hook for report generation status
 */
export function useReportStatus(projectId: string, limit = 20) {
	return useQuery({
		queryKey: reportsKeys.status(projectId),
		queryFn: () => getReportStatus(projectId, limit),
		enabled: !!projectId,
		refetchInterval: 30 * 1000, // Refresh every 30 seconds
		staleTime: 15 * 1000, // 15 seconds
	});
}

/**
 * Hook for clearing report cache
 */
export function useClearReportCache() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			projectId,
			reportType,
		}: {
			projectId: string;
			reportType?: string;
		}) => {
			return clearReportCache(projectId, reportType);
		},
		onSuccess: (_data, { projectId, reportType }) => {
			// Invalidate related queries
			if (reportType) {
				// Invalidate specific report type
				queryClient.invalidateQueries({
					queryKey: [...reportsKeys.project(projectId), reportType],
				});
			} else {
				// Invalidate all reports for project
				queryClient.invalidateQueries({
					queryKey: reportsKeys.project(projectId),
				});
			}

			toast.success(`Cache cleared for ${reportType || "all reports"}`);
		},
		onError: (error) => {
			const { message } = handleReportAPIError(error);
			toast.error(`Failed to clear cache: ${message}`);
		},
	});
}

// ============================================================================
// Bulk Reports Hook
// ============================================================================

/**
 * Hook for bulk report generation
 */
export function useBulkReportGeneration() {
	return useMutation({
		mutationFn: async (request: BulkReportRequest) => {
			return generateBulkReports(request);
		},
		onSuccess: (data) => {
			toast.success(
				`Bulk report generation started. Estimated completion: ${data.data.estimatedCompletionTime}`,
			);
		},
		onError: (error) => {
			const { message } = handleReportAPIError(error);
			toast.error(`Failed to start bulk report generation: ${message}`);
		},
	});
}

// ============================================================================
// FileFilter Options Hook
// ============================================================================

/**
 * Hook for report filter options
 */
export function useReportFileFilterOptions(projectId: string) {
	return useQuery({
		queryKey: reportsKeys.filters(projectId),
		queryFn: () => getReportFileFilterOptions(projectId),
		enabled: !!projectId,
		staleTime: 10 * 60 * 1000, // 10 minutes - filter options change infrequently
		gcTime: 30 * 60 * 1000, // 30 minutes
	});
}

// ============================================================================
// Combined Hooks for Dashboard Views
// ============================================================================

/**
 * Hook that combines multiple report types for dashboard overview
 */
export function useReportsDashboard(
	projectId: string,
	options?: {
		includeProgress?: boolean;
		includeTestPackages?: boolean;
		includeTrends?: boolean;
		enabled?: boolean;
	},
) {
	const progressQuery = useProgressReport(
		projectId,
		{},
		{
			enabled:
				options?.includeProgress !== false &&
				options?.enabled !== false,
		},
	);

	const testPackagesQuery = useTestPackageReadiness(
		projectId,
		{},
		{
			enabled:
				options?.includeTestPackages !== false &&
				options?.enabled !== false,
		},
	);

	const trendsQuery = useTrendAnalysis(projectId, 30, "daily", {
		enabled: options?.includeTrends !== false && options?.enabled !== false,
	});

	const isLoading =
		progressQuery.isLoading ||
		testPackagesQuery.isLoading ||
		trendsQuery.isLoading;
	const isError =
		progressQuery.isError ||
		testPackagesQuery.isError ||
		trendsQuery.isError;
	const error =
		progressQuery.error || testPackagesQuery.error || trendsQuery.error;

	return {
		progress: progressQuery.data,
		testPackages: testPackagesQuery.data,
		trends: trendsQuery.data,
		isLoading,
		isError,
		error,
		refetch: () => {
			progressQuery.refetch();
			testPackagesQuery.refetch();
			trendsQuery.refetch();
		},
	};
}

// ============================================================================
// Real-time Updates Hook
// ============================================================================

/**
 * Hook for real-time report updates using WebSocket or polling
 */
export function useReportsRealtime(
	projectId: string,
	options?: {
		enabled?: boolean;
		pollInterval?: number;
	},
) {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: [...reportsKeys.project(projectId), "realtime"],
		queryFn: () => getReportStatus(projectId, 5), // Get latest 5 generations
		enabled: !!projectId && options?.enabled !== false,
		refetchInterval: options?.pollInterval || 30 * 1000, // Poll every 30 seconds
		refetchIntervalInBackground: true,
	});

	// Handle success in a useEffect
	React.useEffect(() => {
		if (query.data) {
			// Check for completed reports and refresh related queries
			const recentCompletions = query.data.data.recentGenerations.filter(
				(gen: any) =>
					gen.status === "completed" &&
					new Date(gen.completedAt || "").getTime() >
						Date.now() - 60000, // Last minute
			);

			if (recentCompletions.length > 0) {
				// Invalidate reports that were just completed
				recentCompletions.forEach((completion: any) => {
					queryClient.invalidateQueries({
						queryKey: [
							...reportsKeys.project(projectId),
							completion.reportType,
						],
					});
				});
			}
		}
	}, [query.data, queryClient, projectId]);

	return query;
}
