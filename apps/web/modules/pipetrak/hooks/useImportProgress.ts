"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { apiClient } from "@shared/lib/api-client";

// Get Supabase config from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface ImportProgressState {
  progress: number;
  status: "pending" | "processing" | "completed" | "failed" | "partial";
  logs: ImportLog[];
  isComplete: boolean;
  hasErrors: boolean;
  jobData?: any;
}

interface ImportLog {
  timestamp: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export function useImportProgress(jobId?: string, projectId?: string) {
  const [state, setState] = useState<ImportProgressState>({
    progress: 0,
    status: "pending",
    logs: [],
    isComplete: false,
    hasErrors: false,
    jobData: null
  });

  useEffect(() => {
    if (!jobId || !projectId) {
      // If no job ID, don't do anything
      return;
    }

    // Check if this is a bulk-import job (synchronous)
    if (jobId.startsWith('bulk-')) {
      console.log(`[useImportProgress] Detected bulk-import job: ${jobId}`);
      
      // Extract stats from job ID if available (format: bulk-timestamp-processed-errors)
      const jobParts = jobId.split('-');
      const processedRows = jobParts.length > 2 ? parseInt(jobParts[2]) || 0 : 0;
      const errorRows = jobParts.length > 3 ? parseInt(jobParts[3]) || 0 : 0;
      const hasErrors = errorRows > 0;
      
      // For bulk imports, set completed state immediately since they complete synchronously
      setState({
        progress: 100,
        status: hasErrors ? "partial" : "completed",
        logs: [
          {
            timestamp: new Date().toLocaleTimeString(),
            message: hasErrors 
              ? `Component import completed with ${errorRows} errors. ${processedRows} components processed successfully.`
              : `Component import completed successfully. ${processedRows} components processed.`,
            type: hasErrors ? "warning" : "success"
          }
        ],
        isComplete: true,
        hasErrors,
        jobData: {
          id: jobId,
          status: hasErrors ? "PARTIAL" : "COMPLETED",
          processedRows,
          totalRows: processedRows + errorRows,
          errorRows,
          filename: "bulk-import"
        }
      });
      return; // Exit early for bulk jobs - no polling/realtime needed
    }

    // Initial status check when component mounts (for async import-jobs)
    const checkInitialStatus = async () => {
      try {
        console.log(`[useImportProgress] Checking initial status for job: ${jobId}`);
        console.log(`[useImportProgress] Request URL: /api/pipetrak/import/${jobId}`);
        
        const response = await apiClient.pipetrak.import[":id"].$get({
          param: { id: jobId },
        });

        console.log(`[useImportProgress] Response status: ${response.status}`);

        if (response.ok) {
          const jobData = await response.json();
          console.log(`[useImportProgress] Job data:`, jobData);
          
          const progress = jobData.totalRows > 0 
            ? Math.round((jobData.processedRows / jobData.totalRows) * 100)
            : 0;
          const status = mapImportStatus(jobData.status);

          setState(prev => ({
            ...prev,
            progress,
            status,
            isComplete: status === "completed" || status === "failed",
            hasErrors: status === "failed" || jobData.errorRows > 0,
            jobData,
            logs: [{
              timestamp: new Date().toLocaleTimeString(),
              message: getStatusMessage({ 
                status: jobData.status, 
                filename: jobData.filename,
                processedRows: jobData.processedRows,
                totalRows: jobData.totalRows,
                errorRows: jobData.errorRows
              }),
              type: getLogType(jobData.status)
            }]
          }));
        } else {
          console.error(`[useImportProgress] HTTP ${response.status}: ${response.statusText}`);
          setState(prev => ({
            ...prev,
            status: "failed",
            isComplete: true,
            hasErrors: true,
            logs: [{
              timestamp: new Date().toLocaleTimeString(),
              message: `Failed to fetch import status: HTTP ${response.status}`,
              type: "error"
            }]
          }));
        }
      } catch (error) {
        console.error("[useImportProgress] Error checking initial import status:", error);
        setState(prev => ({
          ...prev,
          status: "failed",
          isComplete: true,
          hasErrors: true,
          logs: [{
            timestamp: new Date().toLocaleTimeString(),
            message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: "error"
          }]
        }));
      }
    };

    // For async import-jobs only, proceed with status checking and polling
    // Don't set up realtime/polling for bulk imports
    
    checkInitialStatus();

    let supabase: ReturnType<typeof createClient>;
    let channel: ReturnType<typeof supabase.channel>;
    let pollInterval: NodeJS.Timeout;

    const setupRealtime = async () => {
      try {
        // First, get the realtime configuration from the API
        const response = await apiClient.pipetrak.realtime.subscribe.$post({
          json: {
            projectId,
            presence: {},
          },
        });

        if (!response.ok) {
          console.warn("Failed to setup realtime subscription, falling back to polling");
          startPolling();
          return;
        }

        const realtimeConfig = await response.json();
        
        // Create Supabase client with the provided config
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Subscribe to the project channel for import progress
        channel = supabase
          .channel(`project:${projectId}`)
          .on(
            "broadcast",
            { event: "import_progress" },
            (payload) => {
              const data = payload.payload;
              
              // Only process updates for our specific job
              if (data.importJobId !== jobId) return;
              
              const progress = data.progressPercent || 0;
              const status = mapImportStatus(data.status);
              
              setState(prev => {
                const newLogs = [...prev.logs];
                
                // Add status messages to logs
                if (data.status && data.status !== prev.status) {
                  newLogs.push({
                    timestamp: new Date().toLocaleTimeString(),
                    message: getStatusMessage(data),
                    type: getLogType(data.status)
                  });
                }
                
                return {
                  ...prev,
                  progress,
                  status,
                  logs: newLogs,
                  isComplete: status === "completed" || status === "failed",
                  hasErrors: status === "failed" || data.errorRows > 0,
                  jobData: data
                };
              });
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to import progress updates');
              // Also start polling as a backup
              startPolling();
            } else if (status === 'CHANNEL_ERROR') {
              console.warn('Realtime channel error, falling back to polling only');
              startPolling();
            }
          });

      } catch (error) {
        console.warn("Realtime setup failed, using polling:", error);
        startPolling();
      }
    };

    const startPolling = () => {
      let pollCount = 0;
      let consecutiveErrors = 0;
      let lastProgress = 0;
      let stuckCounter = 0;
      const maxPollAttempts = 300; // 10 minutes maximum at 2s intervals
      const maxStuckPolls = 15; // If progress doesn't change for 30 seconds, consider stuck
      
      const getPollingInterval = (count: number, hasErrors: boolean) => {
        // Exponential backoff for errors, but keep normal interval for normal operation
        if (hasErrors && consecutiveErrors > 3) {
          return Math.min(2000 * Math.pow(1.5, consecutiveErrors - 3), 10000); // Max 10s
        }
        // Normal polling: 2s for first 30 polls, then 3s
        return count < 30 ? 2000 : 3000;
      };
      
      const scheduleNextPoll = () => {
        const interval = getPollingInterval(pollCount, consecutiveErrors > 0);
        pollInterval = setTimeout(pollFunction, interval);
      };
      
      const pollFunction = async () => {
        pollCount++;
        
        // Add timeout after 10 minutes of polling
        if (pollCount >= maxPollAttempts) {
          setState(prev => ({
            ...prev,
            status: "failed",
            isComplete: true,
            hasErrors: true,
            logs: [...prev.logs, {
              timestamp: new Date().toLocaleTimeString(),
              message: "Import timed out - taking longer than expected. Please check the import job status or try again.",
              type: "error"
            }]
          }));
          return;
        }
        
        try {
          console.log(`[useImportProgress] Polling attempt ${pollCount} for job: ${jobId}`);
          
          const response = await apiClient.pipetrak.import[":id"].$get({
            param: { id: jobId },
          });

          console.log(`[useImportProgress] Poll response status: ${response.status}`);

          if (!response.ok) {
            consecutiveErrors++;
            
            // If we get a 404, the job doesn't exist - stop polling
            if (response.status === 404) {
              console.error(`[useImportProgress] Job ${jobId} not found (404)`);
              setState(prev => ({
                ...prev,
                status: "failed",
                isComplete: true,
                hasErrors: true,
                logs: [...prev.logs, {
                  timestamp: new Date().toLocaleTimeString(),
                  message: "Import job not found - it may have been deleted or expired.",
                  type: "error"
                }]
              }));
              return; // Stop polling
            } else {
              console.error(`[useImportProgress] HTTP ${response.status}: ${response.statusText}`);
              if (consecutiveErrors < 10) { // Continue polling for up to 10 consecutive errors
                scheduleNextPoll();
              }
            }
            return;
          }

          // Reset error counter on successful response
          consecutiveErrors = 0;
          
          const jobData = await response.json();
          const progress = jobData.totalRows > 0 
            ? Math.round((jobData.processedRows / jobData.totalRows) * 100)
            : 0;
          const status = mapImportStatus(jobData.status);

          // Detect stuck jobs (progress hasn't changed and status is still processing)
          if (status === "processing" && progress === lastProgress) {
            stuckCounter++;
            if (stuckCounter >= maxStuckPolls) {
              console.warn(`[useImportProgress] Job ${jobId} appears stuck - progress hasn't changed for ${maxStuckPolls * 2} seconds`);
              setState(prev => ({
                ...prev,
                status: "failed",
                isComplete: true,
                hasErrors: true,
                logs: [...prev.logs, {
                  timestamp: new Date().toLocaleTimeString(),
                  message: "Import appears to be stuck. The job may have encountered an error. Please check the server logs or try again.",
                  type: "error"
                }]
              }));
              return; // Stop polling
            }
          } else {
            stuckCounter = 0; // Reset stuck counter if progress changed
            lastProgress = progress;
          }

          setState(prev => {
            if (prev.status !== status) {
              const newLogs = [...prev.logs, {
                timestamp: new Date().toLocaleTimeString(),
                message: getStatusMessage({ 
                  status: jobData.status, 
                  filename: jobData.filename,
                  processedRows: jobData.processedRows,
                  totalRows: jobData.totalRows,
                  errorRows: jobData.errorRows
                }),
                type: getLogType(jobData.status)
              }];

              return {
                ...prev,
                progress,
                status,
                logs: newLogs,
                isComplete: status === "completed" || status === "failed",
                hasErrors: status === "failed" || jobData.errorRows > 0,
                jobData
              };
            }

            return {
              ...prev,
              progress,
              status,
              isComplete: status === "completed" || status === "failed",
              hasErrors: status === "failed" || jobData.errorRows > 0,
              jobData
            };
          });

          // Stop polling when complete
          if (status === "completed" || status === "failed") {
            return; // Stop polling
          }
          
          // Schedule next poll
          scheduleNextPoll();
          
        } catch (error) {
          console.error("Error polling import status:", error);
          consecutiveErrors++;
          
          // Add error count and stop after too many failures
          if (pollCount % 5 === 0) { // Every 5 polls, log the error
            setState(prev => ({
              ...prev,
              logs: [...prev.logs, {
                timestamp: new Date().toLocaleTimeString(),
                message: `Connection error while checking import status (attempt ${pollCount})`,
                type: "warning"
              }]
            }));
          }
          
          // Continue polling unless too many consecutive errors
          if (consecutiveErrors < 10) {
            scheduleNextPoll();
          } else {
            setState(prev => ({
              ...prev,
              status: "failed",
              isComplete: true,
              hasErrors: true,
              logs: [...prev.logs, {
                timestamp: new Date().toLocaleTimeString(),
                message: "Too many connection errors. Please check your internet connection and try again.",
                type: "error"
              }]
            }));
          }
        }
      };
      
      // Start the first poll immediately
      pollFunction();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (pollInterval) {
        clearTimeout(pollInterval);
      }
    };
  }, [jobId, projectId]);

  return state;
}

// Helper functions
function mapImportStatus(apiStatus: string): ImportProgressState['status'] {
  switch (apiStatus) {
    case 'PENDING':
      return 'pending';
    case 'PROCESSING':
      return 'processing';
    case 'COMPLETED':
      return 'completed';
    case 'FAILED':
      return 'failed';
    default:
      return 'pending';
  }
}

function getStatusMessage(data: any): string {
  const { status, filename, processedRows, totalRows, errorRows } = data;
  
  switch (status) {
    case 'PROCESSING':
      if (processedRows && totalRows) {
        return `Processing ${filename}: ${processedRows}/${totalRows} rows completed`;
      }
      return `Processing ${filename}...`;
    case 'COMPLETED':
      if (processedRows && errorRows) {
        return `Import completed: ${processedRows - errorRows} rows imported successfully, ${errorRows} errors`;
      }
      return `Import of ${filename} completed successfully!`;
    case 'FAILED':
      return `Import of ${filename} failed`;
    default:
      return `Starting import of ${filename}...`;
  }
}

function getLogType(status: string): ImportLog['type'] {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'FAILED':
      return 'error';
    case 'PROCESSING':
      return 'info';
    default:
      return 'info';
  }
}