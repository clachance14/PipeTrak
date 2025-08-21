/**
 * TypeScript interfaces for PipeTrak reporting module
 * Based on backend schema from packages/api/src/routes/pipetrak/reports.ts
 */

// ============================================================================
// Request Types (matching backend schemas)
// ============================================================================

export interface ReportFilters {
  areas?: string[];
  systems?: string[];
  testPackages?: string[];
  componentTypes?: string[];
  statuses?: string[];
  completionRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ComponentDetailsFilters {
  areas?: string[];
  systems?: string[];
  testPackages?: string[];
  statuses?: string[];
  componentTypes?: string[];
  completionMin?: number;
  completionMax?: number;
  stalledDays?: number;
  searchQuery?: string;
}

export interface ReportPagination {
  limit: number;
  offset: number;
}

export interface ReportSorting {
  field: 'componentId' | 'type' | 'area' | 'system' | 'completionPercent' | 'status' | 'updatedAt' | 'testPackage';
  direction: 'asc' | 'desc';
}

export interface ProgressReportOptions {
  includeTrends?: boolean;
  includeVelocity?: boolean;
  includeForecasts?: boolean;
  cacheTimeout?: number;
}

export interface TestPackageOptions {
  includeBlockingComponents?: boolean;
  includeVelocityAnalysis?: boolean;
  includeForecast?: boolean;
}

export interface TrendTimeframe {
  days: number;
  granularity: 'daily' | 'weekly';
}

export interface TrendOptions {
  includeForecasting?: boolean;
  includeVelocityTrends?: boolean;
  includeMilestoneBreakdown?: boolean;
}

export interface AuditFilters {
  entityTypes?: ('Component' | 'Milestone' | 'Project')[];
  userIds?: string[];
  actions?: string[];
  startDate?: string;
  endDate?: string;
}

export interface BulkReportOptions {
  combineReports?: boolean;
  includeCharts?: boolean;
  emailRecipients?: string[];
}

// ============================================================================
// Request Payload Types
// ============================================================================

export interface ProgressReportRequest {
  projectId: string;
  filters?: ReportFilters;
  options?: ProgressReportOptions;
}

export interface ComponentDetailsRequest {
  projectId: string;
  filters?: ComponentDetailsFilters;
  pagination?: ReportPagination;
  sorting?: ReportSorting;
}

export interface TestPackageReadinessRequest {
  projectId: string;
  filters?: {
    testPackages?: string[];
    areas?: string[];
    systems?: string[];
    readinessStatus?: ('ready' | 'nearly_ready' | 'in_progress' | 'not_started')[];
  };
  options?: TestPackageOptions;
}

export interface TrendAnalysisRequest {
  projectId: string;
  timeframe?: TrendTimeframe;
  options?: TrendOptions;
}

export interface AuditTrailRequest {
  projectId: string;
  filters?: AuditFilters;
  pagination?: ReportPagination;
}

export interface BulkReportRequest {
  projectId: string;
  reportTypes: ('progress_summary' | 'component_details' | 'test_readiness' | 'trend_analysis' | 'audit_trail')[];
  outputFormat?: 'json' | 'excel' | 'pdf';
  deliveryMethod?: 'download' | 'email';
  options?: BulkReportOptions;
}

// ============================================================================
// Response Types (ROC and Report Data)
// ============================================================================

export interface ROCWeightedProgress {
  overallROCProgress: number;
  totalROCWeight: number;
  completedROCWeight: number;
  areaBreakdowns: Array<{
    area: string;
    rocProgress: number;
    totalWeight: number;
    completedWeight: number;
    componentCount: number;
  }>;
  systemBreakdowns: Array<{
    system: string;
    rocProgress: number;
    totalWeight: number;
    completedWeight: number;
    componentCount: number;
  }>;
  generatedAt: string;
}

export interface ProgressReportData {
  overview: {
    totalComponents: number;
    completedComponents: number;
    overallCompletionPercent: number;
    activeDrawings: number;
    testPackagesReady: number;
  };
  trends?: {
    dailyProgress: Array<{
      date: string;
      completionPercent: number;
      componentsCompleted: number;
    }>;
    velocityMetrics: {
      averageDailyCompletion: number;
      projectedCompletionDate: string | null;
    };
  };
  areaBreakdowns: Array<{
    area: string;
    totalComponents: number;
    completedComponents: number;
    completionPercent: number;
    stalledCount: number;
  }>;
  systemBreakdowns: Array<{
    system: string;
    totalComponents: number;
    completedComponents: number;
    completionPercent: number;
    stalledCount: number;
  }>;
  generatedAt: string;
}

export interface ProgressReportResponse {
  success: boolean;
  data: {
    rocWeightedProgress: ROCWeightedProgress;
    comprehensiveReport: ProgressReportData;
    generatedAt: string;
    projectInfo: {
      id: string;
      jobNumber: string;
      jobName: string;
      organization: string;
    };
  };
}

export interface ComponentDetail {
  componentId: string;
  type: string;
  area: string | null;
  system: string | null;
  testPackage: string | null;
  drawingNumber: string | null;
  completionPercent: number;
  status: string;
  updatedAt: string;
  stalledDays: number | null;
  milestones: Array<{
    name: string;
    isCompleted: boolean;
    completedAt: string | null;
  }>;
}

export interface ComponentDetailsResponse {
  success: boolean;
  data: {
    components: ComponentDetail[];
    pagination: {
      totalCount: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    summary: {
      totalComponents: number;
      completedComponents: number;
      averageCompletion: number;
      stalledComponents: number;
    };
  };
}

export interface TestPackageDetail {
  packageId: string;
  packageName: string;
  totalComponents: number;
  completedComponents: number;
  completionPercent: number;
  readinessStatus: 'ready' | 'nearly_ready' | 'in_progress' | 'not_started';
  blockingComponents: ComponentDetail[];
  estimatedReadyDate: string | null;
  velocityMetrics?: {
    averageDailyCompletion: number;
    daysToCompletion: number | null;
  };
}

export interface TestPackageReadinessResponse {
  success: boolean;
  data: {
    testPackages: TestPackageDetail[];
    summary: {
      totalPackages: number;
      readyPackages: number;
      nearlyReadyPackages: number;
      inProgressPackages: number;
      notStartedPackages: number;
    };
    generatedAt: string;
  };
  options: TestPackageOptions;
}

export interface TrendDataPoint {
  date: string;
  completionPercent: number;
  componentsCompleted: number;
  dailyVelocity: number;
  milestoneBreakdown?: Record<string, number>;
}

export interface TrendAnalysisResponse {
  success: boolean;
  data: {
    trendData: TrendDataPoint[];
    velocityAnalysis: {
      averageDailyCompletion: number;
      currentVelocity: number;
      velocityTrend: 'increasing' | 'decreasing' | 'stable';
      projectedCompletionDate: string | null;
    };
    forecast?: {
      projectedProgress: Array<{
        date: string;
        projectedCompletion: number;
        confidence: number;
      }>;
    };
    generatedAt: string;
  };
  timeframe: TrendTimeframe;
  options: TrendOptions;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  entityType: string;
  entityId: string;
  action: string;
  changes: any;
  user: {
    name: string;
    email?: string;
  };
  metadata: any;
}

export interface AuditTrailResponse {
  success: boolean;
  data: {
    auditLogs: AuditLogEntry[];
    pagination: {
      totalCount: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    filters: AuditFilters;
  };
}

export interface ReportGeneration {
  id: string;
  reportType: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  resultRowCount: number | null;
  outputFormat: string;
  deliveryMethod: string;
  cacheHit: boolean | null;
  errorMessage: string | null;
}

export interface ReportStatusResponse {
  success: boolean;
  data: {
    recentGenerations: ReportGeneration[];
    cacheStatistics: Array<{
      reportType: string;
      cache_entries: number;
      avg_calculation_time: number;
      last_cached: string;
    }>;
    projectId: string;
  };
}

export interface BulkReportResponse {
  success: boolean;
  data: {
    reportGenerationIds: string[];
    status: 'pending';
    estimatedCompletionTime: string;
    deliveryMethod: 'download' | 'email';
    outputFormat: 'json' | 'excel' | 'pdf';
  };
}

export interface FilterOptionsResponse {
  success: boolean;
  data: {
    areas: string[];
    systems: string[];
    testPackages: string[];
    componentTypes: string[];
    statuses: string[];
  };
}

// ============================================================================
// Chart Data Types (for visualization)
// ============================================================================

export interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  completionPercent?: number;
  totalComponents?: number;
  completedComponents?: number;
}

export interface ProgressChartData {
  timeSeriesData: ChartDataPoint[];
  areaDistribution: ChartDataPoint[];
  systemDistribution: ChartDataPoint[];
  statusDistribution: ChartDataPoint[];
}

export interface ROCChartData {
  rocByArea: ChartDataPoint[];
  rocBySystem: ChartDataPoint[];
  rocVsStandard: Array<{
    name: string;
    rocProgress: number;
    standardProgress: number;
  }>;
}

// ============================================================================
// Export Configuration Types
// ============================================================================

export interface ExportFormat {
  type: 'excel' | 'pdf' | 'csv';
  filename?: string;
  includeCharts?: boolean;
  includeRawData?: boolean;
}

export interface PrintOptions {
  orientation: 'portrait' | 'landscape';
  paperSize: 'a4' | 'letter';
  includeCharts: boolean;
  includeHeader: boolean;
  includeFooter: boolean;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface ReportsUIState {
  activeReportType: 'progress' | 'components' | 'test-packages' | 'trends' | 'audit';
  filters: ReportFilters;
  isLoading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}