/**
 * PipeTrak Reports Module
 * Core reporting infrastructure with ROC calculations and data visualization
 */

// ============================================================================
// Type Exports
// ============================================================================

// Export missing interface names that are used in components
export type {
	AuditFileFilters,
	AuditLogEntry,
	AuditTrailRequest,
	AuditTrailResponse,
	BulkReportOptions,
	BulkReportRequest,
	BulkReportResponse,
	ChartDataPoint,
	ComponentDetail,
	ComponentDetailsFileFilters,
	ComponentDetailsRequest,
	ComponentDetailsResponse,
	// Export Configuration
	ExportFormat,
	FileFilterOptionsResponse,
	FileFilterOptionsResponse as FilterOptionsResponse,
	PrintOptions,
	// Chart Data Types
	ProgressChartData,
	ProgressReportData,
	ProgressReportOptions,
	// Request Types
	ProgressReportRequest,
	// Response Types
	ProgressReportResponse,
	// FileFilter and Configuration Types
	ReportFileFilters,
	ReportFileFilters as ReportFilters,
	ReportGeneration,
	ReportPagination,
	ReportSorting,
	ReportStatusResponse,
	// UI State
	ReportsUIState,
	ROCChartData,
	// Data Types
	ROCWeightedProgress,
	TestPackageDetail,
	TestPackageOptions,
	TestPackageReadinessRequest,
	TestPackageReadinessResponse,
	TrendAnalysisRequest,
	TrendAnalysisResponse,
	TrendDataPoint,
	TrendOptions,
	TrendTimeframe,
} from "./types";

// ============================================================================
// ROC Calculator Exports
// ============================================================================

export {
	calculateComponentROCProgress,
	calculateOverallROCProgress,
	calculateROCEfficiency,
	calculateROCVelocity,
	calculateROCWeight,
	compareROCvsStandardProgress,
	identifyCriticalPathComponents,
} from "./lib/roc-calculator";

// ============================================================================
// Report Generator Exports
// ============================================================================

export {
	calculateSummaryStats,
	formatComponentDetails,
	formatTestPackageReadiness,
	generateInsights,
	generateProgressCharts,
	generateROCCharts,
	generateTrendCharts,
	prepareExcelExport,
	preparePDFContent,
} from "./lib/report-generator";

// ============================================================================
// API Client Exports
// ============================================================================

export {
	buildComponentDetailsQuery,
	// Query builders
	buildProgressReportQuery,
	buildTrendAnalysisQuery,
	clearReportCache,
	generateBulkReports,
	// Client-side API functions
	generateProgressReport,
	generateTestPackageReadiness,
	generateTrendAnalysis,
	getAuditTrailReport,
	getComponentDetailsReport,
	getReportFileFilterOptions,
	getReportStatus,
	// Utilities
	handleReportAPIError,
	retryReportGeneration,
} from "./lib/report-api";

// ============================================================================
// React Hooks Exports
// ============================================================================

export {
	// Audit trail hooks
	useAuditTrail,
	// Bulk operations
	useBulkReportGeneration,
	useClearReportCache,
	useComponentDetailsPagination,
	// Component details hooks
	useComponentDetailsReport,
	// Progress report hooks
	useProgressReport,
	useRefreshProgressReport,
	// FileFilter options
	useReportFileFilterOptions,
	// Cache and status management
	useReportStatus,
	// Combined dashboard hooks
	useReportsDashboard,
	useReportsRealtime,
	// Test package readiness hooks
	useTestPackageReadiness,
	// Trend analysis hooks
	useTrendAnalysis,
} from "./hooks/useReportsData";

// ============================================================================
// Constants and Defaults
// ============================================================================

/**
 * Default report pagination settings
 */
export const DEFAULT_REPORT_PAGINATION = {
	limit: 10000,
	offset: 0,
} as const;

/**
 * Default progress report options
 */
export const DEFAULT_PROGRESS_OPTIONS = {
	includeTrends: true,
	includeVelocity: true,
	includeForecasts: false,
	cacheTimeout: 300, // 5 minutes
} as const;

/**
 * Default test package options
 */
export const DEFAULT_TEST_PACKAGE_OPTIONS = {
	includeBlockingComponents: true,
	includeVelocityAnalysis: true,
	includeForecast: true,
} as const;

/**
 * Default trend analysis timeframe
 */
export const DEFAULT_TREND_TIMEFRAME = {
	days: 30,
	granularity: "daily" as const,
} as const;

/**
 * Supported report types for bulk generation
 */
export const REPORT_TYPES = [
	"progress_summary",
	"component_details",
	"test_readiness",
	"trend_analysis",
	"audit_trail",
] as const;

/**
 * Supported export formats
 */
export const EXPORT_FORMATS = ["json", "excel", "pdf"] as const;

/**
 * Report refresh intervals (in milliseconds)
 */
export const REFRESH_INTERVALS = {
	progress: 5 * 60 * 1000, // 5 minutes
	components: 2 * 60 * 1000, // 2 minutes
	testPackages: 3 * 60 * 1000, // 3 minutes
	trends: 5 * 60 * 1000, // 5 minutes
	audit: 1 * 60 * 1000, // 1 minute
	status: 30 * 1000, // 30 seconds
} as const;

/**
 * Cache timeouts (in milliseconds)
 */
export const CACHE_TIMEOUTS = {
	staleTime: {
		progress: 5 * 60 * 1000, // 5 minutes
		components: 2 * 60 * 1000, // 2 minutes
		testPackages: 3 * 60 * 1000, // 3 minutes
		trends: 5 * 60 * 1000, // 5 minutes
		audit: 1 * 60 * 1000, // 1 minute
		filters: 10 * 60 * 1000, // 10 minutes
	},
	gcTime: {
		progress: 10 * 60 * 1000, // 10 minutes
		components: 5 * 60 * 1000, // 5 minutes
		testPackages: 10 * 60 * 1000, // 10 minutes
		trends: 15 * 60 * 1000, // 15 minutes
		audit: 5 * 60 * 1000, // 5 minutes
		filters: 30 * 60 * 1000, // 30 minutes
	},
} as const;

// ============================================================================
// Utility Constants
// ============================================================================

/**
 * ROC weight categories for component types
 */
export const ROC_WEIGHT_CATEGORIES = {
	CRITICAL: 8.0, // Major equipment, safety systems
	HIGH: 5.0, // Piping, instruments
	MEDIUM: 3.0, // Fittings, flanges
	LOW: 1.5, // Gaskets, bolts
	MINIMAL: 1.0, // Supports, misc
} as const;

/**
 * System criticality multipliers
 */
export const SYSTEM_MULTIPLIERS = {
	SAFETY_CRITICAL: 1.5, // Fire safety, emergency shutdown
	PRODUCTION_CRITICAL: 1.3, // Main process, utilities
	SUPPORT: 1.1, // Instrument air, drain systems
	STANDARD: 1.0, // Other systems
} as const;

/**
 * Report status colors for UI
 */
export const REPORT_STATUS_COLORS = {
	pending: "yellow",
	processing: "blue",
	completed: "green",
	failed: "red",
} as const;

/**
 * Component status colors for UI
 */
export const COMPONENT_STATUS_COLORS = {
	COMPLETE: "green",
	IN_PROGRESS: "blue",
	NOT_STARTED: "gray",
	ON_HOLD: "orange",
	ISSUE: "red",
} as const;
