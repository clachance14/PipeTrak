"use client";

import { apiClient } from "@shared/lib/api-client";
import { useState } from "react";

interface ImportJob {
	id: string;
	status: string;
	successCount: number;
	errorCount: number;
	errors?: any[];
}

interface FileParseResult {
	headers: string[];
	rowCount: number;
	preview: any[];
	uploadData?: any;
	suggestedMappings?: any[];
}

interface ValidationResult {
	isValid: boolean;
	totalRows: number;
	validRows: number;
	errorRows: number;
	warningRows: number;
	errors: ValidationError[];
	warnings: ValidationWarning[];
	preview: PreviewRow[];
	options?: any;
}

interface ValidationError {
	row: number;
	field: string;
	value: any;
	message: string;
	severity: "error" | "warning";
}

interface ValidationWarning {
	row: number;
	field: string;
	message: string;
}

interface PreviewRow {
	rowNumber: number;
	data: Record<string, any>;
	errors: ValidationError[];
	warnings: ValidationWarning[];
}

export function useImportProcess(
	projectId: string,
	importType: "components" | "field_welds" = "components",
) {
	const [importJob, setImportJob] = useState<ImportJob | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [parseResult, setParseResult] = useState<FileParseResult | null>(
		null,
	);

	const uploadFile = async (file: File): Promise<FileParseResult | null> => {
		try {
			setIsLoading(true);
			setError(null);

			// Upload file to server for parsing
			const formData = new FormData();
			formData.append("file", file);
			formData.append("projectId", projectId);

			const response = await fetch("/api/pipetrak/import/upload", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to upload file");
			}

			const uploadData = await response.json();

			const result: FileParseResult = {
				headers: uploadData.headers,
				rowCount: uploadData.metadata.rowCount,
				preview: uploadData.preview,
				uploadData, // Store for later use
				suggestedMappings: uploadData.suggestedMappings,
			};

			setParseResult(result);
			return result;
		} catch (err: any) {
			setError(err.message || "Failed to upload file");
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	const validateData = async (
		uploadData: any,
		mappings: any[],
	): Promise<ValidationResult | null> => {
		try {
			setIsLoading(true);
			setError(null);

			const response = await apiClient.pipetrak.import.validate.$post({
				json: {
					uploadId: uploadData.uploadId,
					fileData: uploadData.fileData,
					mappings,
					options: {
						skipRows: 0,
						maxRows: 10000,
					},
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					(errorData as any).error || "Failed to validate data",
				);
			}

			const validation = await response.json();
			return validation as unknown as ValidationResult;
		} catch (err: any) {
			setError(err.message || "Failed to validate data");
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	const startImport = async (
		uploadData: any,
		mappings: any[],
		options?: any,
	): Promise<ImportJob | null> => {
		try {
			setIsLoading(true);
			setError(null);

			// Route to appropriate endpoint based on import type
			if (importType === "field_welds") {
				// For field welds, use the original import-jobs system (async)
				const response = await apiClient.pipetrak.import.$post({
					json: {
						projectId,
						filename: uploadData.fileData.originalName,
						fileData: uploadData.fileData,
						mappings,
						options: {
							skipRows: options?.skipRows || 0,
							maxRows: options?.maxRows || 10000,
							rollbackOnError: options?.rollbackOnError || false,
							updateExisting: options?.updateExisting || false,
							batchSize: options?.batchSize || 100,
						},
					},
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(
						errorData.error || "Failed to start field weld import",
					);
				}

				const jobData = await response.json();

				const jobResult: ImportJob = {
					id: jobData.id,
					status: jobData.status,
					successCount: 0,
					errorCount: 0,
					errors: [],
				};

				setImportJob(jobResult);
				return jobResult;
			}

			// For components, use the bulk-import endpoint that works correctly
			const fileBuffer = uploadData.fileData.buffer;
			if (!fileBuffer) {
				throw new Error(
					"File data not available. Please re-upload the file.",
				);
			}

			console.log(
				"Frontend startImport: Starting component import with:",
				{
					projectId,
					hasFileBuffer: !!fileBuffer,
					mappingsCount: mappings.length,
					options: {
						validateOnly: false,
						skipDuplicates: options?.skipDuplicates || false,
						updateExisting: options?.updateExisting !== false,
						generateIds: true,
						rollbackOnError: options?.rollbackOnError || false,
					},
				},
			);

			// Use our new endpoint that parses the file and calls bulk-import logic
			const response = await fetch(
				"/api/pipetrak/components/import-full",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						projectId,
						fileData: uploadData.fileData,
						mappings,
						options: {
							validateOnly: false,
							skipDuplicates: options?.skipDuplicates || false,
							updateExisting: options?.updateExisting !== false,
							generateIds: true,
							rollbackOnError: options?.rollbackOnError || false,
						},
					}),
				},
			);

			console.log(
				"Frontend startImport: Response status:",
				response.status,
				response.ok,
			);

			if (!response.ok) {
				const errorData = await response.json();
				console.error(
					"Frontend startImport: Request failed:",
					errorData,
				);
				throw new Error(
					errorData.error || "Failed to start component import",
				);
			}

			const result = await response.json();

			console.log("Frontend startImport: Bulk import result:", result);

			// Convert bulk-import result to ImportJob format for consistency
			const totalProcessed =
				(result.summary?.created || 0) +
				(result.summary?.updated || 0) +
				(result.summary?.skipped || 0);
			const jobResult: ImportJob = {
				id: `bulk-${Date.now()}-${totalProcessed}-${result.summary?.errors || 0}`, // Include stats in job ID
				status: result.success ? "COMPLETED" : "FAILED",
				successCount:
					(result.summary?.created || 0) +
					(result.summary?.updated || 0),
				errorCount: result.summary?.errors || 0,
				errors: result.errors || [],
			};

			console.log("Frontend startImport: Created ImportJob:", jobResult);

			setImportJob(jobResult);
			return jobResult;
		} catch (err: any) {
			console.error("Component import error:", err);
			setError(err.message || "Failed to start component import");
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	const checkImportStatus = async (
		jobId: string,
	): Promise<ImportJob | null> => {
		try {
			// Handle bulk import job IDs - they don't exist in the import-jobs system
			if (jobId.startsWith("bulk-")) {
				// For bulk imports, return the job we already have in state
				return importJob;
			}

			const response = await apiClient.pipetrak.import[":id"].$get({
				param: { id: jobId },
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || "Failed to check import status",
				);
			}

			const jobData = await response.json();

			const jobResult: ImportJob = {
				id: jobData.id,
				status: jobData.status,
				successCount:
					(jobData.processedRows || 0) - (jobData.errorRows || 0),
				errorCount: jobData.errorRows || 0,
				errors: jobData.errors || [],
			};

			setImportJob(jobResult);
			return jobResult;
		} catch (err: any) {
			setError(err.message || "Failed to check import status");
			return null;
		}
	};

	const downloadErrorReport = async (jobId: string): Promise<void> => {
		try {
			const response = await fetch(
				`/api/pipetrak/import/${jobId}/errors`,
			);

			if (!response.ok) {
				throw new Error("Failed to download error report");
			}

			// Create download
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `import-errors-${jobId}.csv`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (err: any) {
			setError(err.message || "Failed to download error report");
		}
	};

	const resetImport = () => {
		setImportJob(null);
		setError(null);
		setParseResult(null);
	};

	return {
		uploadFile,
		validateData,
		startImport,
		checkImportStatus,
		downloadErrorReport,
		importJob,
		isLoading,
		error,
		resetImport,
		parseResult,
	};
}

// Note: All file processing is now handled server-side
// The helper functions have been removed as they're no longer needed
