"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@ui/hooks/use-toast";
import type { ExportFormat, PrintOptions } from "../types";

interface ExportOptions extends ExportFormat {
  data: any;
  reportType: string;
  projectId: string;
  reportTitle?: string;
}

interface EmailOptions {
  recipients: string[];
  subject: string;
  message?: string;
  attachmentFormat: ExportFormat['type'];
}

/**
 * Hook for handling report exports in multiple formats
 */
export function useReportExport() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Excel export mutation
  const excelExport = useMutation({
    mutationFn: async (options: ExportOptions) => {
      if (options.type !== 'excel') {
        throw new Error('Invalid format for Excel export');
      }

      // Simulate Excel export - replace with actual API call
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = options.filename || `${options.reportType}-report-${timestamp}.xlsx`;
      
      // In real implementation, call export API
      // const response = await apiClient.reports.export.excel.$post({
      //   json: {
      //     data: options.data,
      //     projectId: options.projectId,
      //     reportType: options.reportType,
      //     includeCharts: options.includeCharts,
      //     includeRawData: options.includeRawData,
      //   }
      // });

      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
      
      return {
        filename,
        url: `/api/exports/excel/${options.projectId}/${filename}`,
        format: 'excel' as const,
      };
    },
    onSuccess: (result) => {
      toast({
        title: "Excel export completed",
        description: `Downloaded: ${result.filename}`,
      });
      
      // Trigger download
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onError: (error: any) => {
      toast({
        title: "Excel export failed",
        description: error.message || "Failed to export to Excel format",
        variant: "destructive",
      });
    },
  });

  // PDF export mutation
  const pdfExport = useMutation({
    mutationFn: async (options: ExportOptions) => {
      if (options.type !== 'pdf') {
        throw new Error('Invalid format for PDF export');
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = options.filename || `${options.reportType}-report-${timestamp}.pdf`;
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        filename,
        url: `/api/exports/pdf/${options.projectId}/${filename}`,
        format: 'pdf' as const,
      };
    },
    onSuccess: (result) => {
      toast({
        title: "PDF export completed",
        description: `Downloaded: ${result.filename}`,
      });
      
      // Trigger download
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onError: (error: any) => {
      toast({
        title: "PDF export failed",
        description: error.message || "Failed to export to PDF format",
        variant: "destructive",
      });
    },
  });

  // CSV export mutation
  const csvExport = useMutation({
    mutationFn: async (options: ExportOptions) => {
      if (options.type !== 'csv') {
        throw new Error('Invalid format for CSV export');
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = options.filename || `${options.reportType}-report-${timestamp}.csv`;
      
      // Convert data to CSV format
      const csvData = convertToCSV(options.data);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      
      return {
        filename,
        blob,
        format: 'csv' as const,
      };
    },
    onSuccess: (result) => {
      toast({
        title: "CSV export completed",
        description: `Downloaded: ${result.filename}`,
      });
      
      // Trigger download
      const link = document.createElement('a');
      const url = URL.createObjectURL(result.blob);
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    onError: (error: any) => {
      toast({
        title: "CSV export failed",
        description: error.message || "Failed to export to CSV format",
        variant: "destructive",
      });
    },
  });

  // Email report mutation
  const emailReport = useMutation({
    mutationFn: async (options: EmailOptions & { data: any; reportType: string; projectId: string }) => {
      // Simulate email API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        recipients: options.recipients,
        subject: options.subject,
        format: options.attachmentFormat,
      };
    },
    onSuccess: (result) => {
      toast({
        title: "Report emailed successfully",
        description: `Sent to ${result.recipients.length} recipient(s)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to email report",
        description: error.message || "Failed to send report via email",
        variant: "destructive",
      });
    },
  });

  // Export function dispatcher
  const exportReport = async (options: ExportOptions) => {
    setIsExporting(true);
    
    try {
      switch (options.type) {
        case 'excel':
          await excelExport.mutateAsync(options);
          break;
        case 'pdf':
          await pdfExport.mutateAsync(options);
          break;
        case 'csv':
          await csvExport.mutateAsync(options);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.type}`);
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Email report function
  const sendReportByEmail = async (options: EmailOptions & { data: any; reportType: string; projectId: string }) => {
    setIsExporting(true);
    try {
      await emailReport.mutateAsync(options);
    } finally {
      setIsExporting(false);
    }
  };

  // Print function
  const printReport = (options: PrintOptions) => {
    // Configure print styles
    const printCSS = `
      @media print {
        @page {
          size: ${options.paperSize} ${options.orientation};
          margin: 0.5in;
        }
        
        body {
          font-size: 12px;
          line-height: 1.4;
          color: black !important;
          background: white !important;
        }
        
        .no-print {
          display: none !important;
        }
        
        ${!options.includeCharts ? '.recharts-wrapper { display: none !important; }' : ''}
        
        ${options.includeHeader ? '' : '.print-header { display: none !important; }'}
        ${options.includeFooter ? '' : '.print-footer { display: none !important; }'}
      }
    `;
    
    // Add temporary print styles
    const styleSheet = document.createElement("style");
    styleSheet.textContent = printCSS;
    document.head.appendChild(styleSheet);
    
    // Print
    window.print();
    
    // Clean up
    document.head.removeChild(styleSheet);
    
    toast({
      title: "Print dialog opened",
      description: "Use your browser's print dialog to complete printing.",
    });
  };

  return {
    exportReport,
    sendReportByEmail,
    printReport,
    isExporting: isExporting || excelExport.isPending || pdfExport.isPending || csvExport.isPending,
    isEmailing: emailReport.isPending,
    error: excelExport.error || pdfExport.error || csvExport.error || emailReport.error,
  };
}

/**
 * Utility function to convert data to CSV format
 */
function convertToCSV(data: any): string {
  if (!data || typeof data !== 'object') {
    return '';
  }

  // Handle different data structures
  let rows: any[] = [];
  
  if (Array.isArray(data)) {
    rows = data;
  } else if (data.components && Array.isArray(data.components)) {
    rows = data.components;
  } else if (data.data && Array.isArray(data.data)) {
    rows = data.data;
  } else {
    // Convert single object to array
    rows = [data];
  }

  if (rows.length === 0) {
    return '';
  }

  // Extract headers from first row
  const headers = Object.keys(rows[0]);
  
  // Create CSV content
  const csvContent = [
    // Headers
    headers.map(header => `"${header}"`).join(','),
    // Data rows
    ...rows.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) {
          return '""';
        }
        // Escape quotes and wrap in quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
}

/**
 * Hook for quick export actions
 */
export function useQuickExport() {
  const { exportReport, isExporting } = useReportExport();

  const quickExport = (data: any, reportType: string, projectId: string, format: ExportFormat['type']) => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    return exportReport({
      data,
      reportType,
      projectId,
      type: format,
      filename: `${reportType}-report-${timestamp}.${format}`,
      includeCharts: true,
      includeRawData: true,
    });
  };

  return {
    exportExcel: (data: any, reportType: string, projectId: string) => 
      quickExport(data, reportType, projectId, 'excel'),
    exportPDF: (data: any, reportType: string, projectId: string) => 
      quickExport(data, reportType, projectId, 'pdf'),
    exportCSV: (data: any, reportType: string, projectId: string) => 
      quickExport(data, reportType, projectId, 'csv'),
    isExporting,
  };
}