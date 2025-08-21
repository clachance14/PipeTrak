"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@ui/hooks/use-toast";
import {
  generateProgressReport,
  getComponentDetailsReport,
  generateTestPackageReadiness,
  generateTrendAnalysis,
  getAuditTrailReport,
  generateBulkReports,
  getReportStatus,
  clearReportCache,
  handleReportAPIError,
  retryReportGeneration,
} from "../lib/report-api";
import type {
  ProgressReportRequest,
  ComponentDetailsRequest,
  TestPackageReadinessRequest,
  TrendAnalysisRequest,
  AuditTrailRequest,
  BulkReportRequest,
} from "../types";

/**
 * Hook for generating progress reports with ROC calculations
 */
export function useProgressReportGeneration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ProgressReportRequest) => {
      return retryReportGeneration(() => generateProgressReport(request));
    },
    onSuccess: (data) => {
      toast({
        title: "Progress report generated",
        description: `Report completed with ${data.data.comprehensiveReport.overview.totalComponents} components analyzed`,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["report-status", request.projectId],
      });
    },
    onError: (error) => {
      const errorInfo = handleReportAPIError(error);
      toast({
        title: "Failed to generate progress report",
        description: errorInfo.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for generating detailed component reports
 */
export function useComponentReportGeneration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ComponentDetailsRequest) => {
      return retryReportGeneration(() => getComponentDetailsReport(request));
    },
    onSuccess: (data) => {
      toast({
        title: "Component report generated",
        description: `Found ${data.data.components.length} components matching your criteria`,
      });
      
      queryClient.invalidateQueries({
        queryKey: ["report-status", request.projectId],
      });
    },
    onError: (error) => {
      const errorInfo = handleReportAPIError(error);
      toast({
        title: "Failed to generate component report",
        description: errorInfo.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for generating test package readiness reports
 */
export function useTestPackageReportGeneration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: TestPackageReadinessRequest) => {
      return retryReportGeneration(() => generateTestPackageReadiness(request));
    },
    onSuccess: (data) => {
      const { readyPackages, totalPackages } = data.data.summary;
      toast({
        title: "Test package report generated",
        description: `${readyPackages} of ${totalPackages} test packages are ready`,
      });
      
      queryClient.invalidateQueries({
        queryKey: ["report-status", request.projectId],
      });
    },
    onError: (error) => {
      const errorInfo = handleReportAPIError(error);
      toast({
        title: "Failed to generate test package report",
        description: errorInfo.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for generating trend analysis reports
 */
export function useTrendReportGeneration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: TrendAnalysisRequest) => {
      return retryReportGeneration(() => generateTrendAnalysis(request));
    },
    onSuccess: (data) => {
      const { averageDailyCompletion, projectedCompletionDate } = data.data.velocityAnalysis;
      toast({
        title: "Trend analysis completed",
        description: projectedCompletionDate 
          ? `Projected completion: ${new Date(projectedCompletionDate).toLocaleDateString()}`
          : `Average daily completion: ${averageDailyCompletion.toFixed(1)} components`,
      });
      
      queryClient.invalidateQueries({
        queryKey: ["report-status", request.projectId],
      });
    },
    onError: (error) => {
      const errorInfo = handleReportAPIError(error);
      toast({
        title: "Failed to generate trend analysis",
        description: errorInfo.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for generating audit trail reports
 */
export function useAuditReportGeneration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: AuditTrailRequest) => {
      return retryReportGeneration(() => getAuditTrailReport(request));
    },
    onSuccess: (data) => {
      toast({
        title: "Audit report generated",
        description: `Found ${data.data.auditLogs.length} audit log entries`,
      });
      
      queryClient.invalidateQueries({
        queryKey: ["report-status", request.projectId],
      });
    },
    onError: (error) => {
      const errorInfo = handleReportAPIError(error);
      toast({
        title: "Failed to generate audit report",
        description: errorInfo.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for bulk report generation
 */
export function useBulkReportGeneration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: BulkReportRequest) => {
      return generateBulkReports(request);
    },
    onSuccess: (data) => {
      const reportCount = data.data.reportGenerationIds.length;
      toast({
        title: "Bulk report generation started",
        description: `${reportCount} reports are being generated. You'll be notified when complete.`,
      });
      
      queryClient.invalidateQueries({
        queryKey: ["report-status", request.projectId],
      });
    },
    onError: (error) => {
      const errorInfo = handleReportAPIError(error);
      toast({
        title: "Failed to start bulk report generation",
        description: errorInfo.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook for getting report generation status and history
 */
export function useReportStatus(projectId: string, limit = 10) {
  return useQuery({
    queryKey: ["report-status", projectId, limit],
    queryFn: () => getReportStatus(projectId, limit),
    refetchInterval: 5000, // Refresh every 5 seconds for active report monitoring
    enabled: !!projectId,
  });
}

/**
 * Hook for clearing report cache
 */
export function useReportCacheClear() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      reportType 
    }: { 
      projectId: string; 
      reportType?: string; 
    }) => {
      return clearReportCache(projectId, reportType);
    },
    onSuccess: (data, { projectId, reportType }) => {
      const typeText = reportType ? ` for ${reportType}` : "";
      toast({
        title: "Cache cleared",
        description: `Cleared ${data.data.deletedEntries} cache entries${typeText}`,
      });
      
      // Invalidate all report queries for this project
      queryClient.invalidateQueries({
        queryKey: ["report", projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["report-status", projectId],
      });
    },
    onError: (error) => {
      const errorInfo = handleReportAPIError(error);
      toast({
        title: "Failed to clear cache",
        description: errorInfo.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Combined hook for all report generation methods
 */
export function useReportGeneration(projectId: string) {
  const progressReport = useProgressReportGeneration();
  const componentReport = useComponentReportGeneration();
  const testPackageReport = useTestPackageReportGeneration();
  const trendReport = useTrendReportGeneration();
  const auditReport = useAuditReportGeneration();
  const bulkReport = useBulkReportGeneration();
  const reportStatus = useReportStatus(projectId);
  const cacheClear = useReportCacheClear();

  const isAnyReportGenerating = 
    progressReport.isPending ||
    componentReport.isPending ||
    testPackageReport.isPending ||
    trendReport.isPending ||
    auditReport.isPending ||
    bulkReport.isPending;

  const generateReport = {
    progress: progressReport.mutate,
    components: componentReport.mutate,
    testPackages: testPackageReport.mutate,
    trends: trendReport.mutate,
    audit: auditReport.mutate,
    bulk: bulkReport.mutate,
  };

  return {
    generateReport,
    reportStatus: reportStatus.data,
    isLoading: reportStatus.isLoading,
    isGenerating: isAnyReportGenerating,
    clearCache: cacheClear.mutate,
    isClearingCache: cacheClear.isPending,
    error: 
      progressReport.error ||
      componentReport.error ||
      testPackageReport.error ||
      trendReport.error ||
      auditReport.error ||
      bulkReport.error ||
      reportStatus.error,
  };
}