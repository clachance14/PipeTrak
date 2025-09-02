/**
 * PipeTrak Reports Module
 * Core reporting infrastructure with ROC calculations and data visualization
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
	// Request Types
	ProgressReportRequest,
	ComponentDetailsRequest,
	TestPackageReadinessRequest,
	TrendAnalysisRequest,
	AuditTrailRequest,
	BulkReportRequest,
	// Response Types
	ProgressReportResponse,
	ComponentDetailsResponse,
	TestPackageReadinessResponse,
	TrendAnalysisResponse,
	AuditTrailResponse,
	BulkReportResponse,
	ReportStatusResponse,
	FilterOptionsResponse,
	// Data Types
	ROCWeightedProgress,
	ProgressReportData,
	ComponentDetail,
	TestPackageDetail,
	TrendDataPoint,
	AuditLogEntry,
	ReportGeneration,
	// Chart Data Types
	ProgressChartData,
	ROCChartData,
	ChartDataPoint,
	// Filter and Configuration Types
	ReportFilters,
	ComponentDetailsFilters,
	ReportPagination,
	ReportSorting,
	ProgressReportOptions,
	TestPackageOptions,
	TrendTimeframe,
	TrendOptions,
	AuditFilters,
	BulkReportOptions,
	// Export Configuration
	ExportFormat,
	PrintOptions,
	// UI State
	ReportsUIState,
} from "./types";

// ============================================================================
// ROC Calculator Exports
// ============================================================================

export {
	calculateROCWeight,
	calculateComponentROCProgress,
	calculateOverallROCProgress,
	compareROCvsStandardProgress,
	calculateROCVelocity,
	identifyCriticalPathComponents,
	calculateROCEfficiency,
} from "./lib/roc-calculator";

// ============================================================================
// Report Generator Exports
// ============================================================================

export {
	generateProgressCharts,
	generateROCCharts,
	generateTrendCharts,
	formatComponentDetails,
	formatTestPackageReadiness,
	prepareExcelExport,
	preparePDFContent,
	calculateSummaryStats,
	generateInsights,
} from "./lib/report-generator";

// ============================================================================
// API Client Exports
// ============================================================================

export {
	// Client-side API functions
	generateProgressReport,
	getComponentDetailsReport,
	generateTestPackageReadiness,
	generateTrendAnalysis,
	getAuditTrailReport,
	getReportStatus,
	clearReportCache,
	generateBulkReports,
	getReportFilterOptions,
	// Query builders
	buildProgressReportQuery,
	buildComponentDetailsQuery,
	buildTrendAnalysisQuery,
	// Utilities
	handleReportAPIError,
	retryReportGeneration,
} from "./lib/report-api";

// ============================================================================
// React Hooks Exports
// ============================================================================

export {
	// Progress report hooks
	useProgressReport,
	useRefreshProgressReport,
	// Component details hooks
	useComponentDetailsReport,
	useComponentDetailsPagination,
	// Test package readiness hooks
	useTestPackageReadiness,
	// Trend analysis hooks
	useTrendAnalysis,
	// Audit trail hooks
	useAuditTrail,
	// Cache and status management
	useReportStatus,
	useClearReportCache,
	// Bulk operations
	useBulkReportGeneration,
	// Filter options
	useReportFilterOptions,
	// Combined dashboard hooks
	useReportsDashboard,
	useReportsRealtime,
} from "./hooks/useReportsData";

// ============================================================================
// Constants and Defaults
// ============================================================================

/**
 * Default report pagination settings
 */
export const DEFAULT_REPORT_PAGINATION: ReportPagination = {
	limit: 10000,
	offset: 0,
};

/**
 * Default progress report options
 */
export const DEFAULT_PROGRESS_OPTIONS: ProgressReportOptions = {
	includeTrends: true,
	includeVelocity: true,
	includeForecasts: false,
	cacheTimeout: 300, // 5 minutes
};

/**
 * Default test package options
 */
export const DEFAULT_TEST_PACKAGE_OPTIONS: TestPackageOptions = {
	includeBlockingComponents: true,
	includeVelocityAnalysis: true,
	includeForecast: true,
};

/**
 * Default trend analysis timeframe
 */
export const DEFAULT_TREND_TIMEFRAME: TrendTimeframe = {
	days: 30,
	granularity: "daily",
};

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
