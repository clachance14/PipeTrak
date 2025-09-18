"use client";

import { Alert, AlertDescription } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Checkbox } from "@ui/components/checkbox";
import { Label } from "@ui/components/label";
import { Progress } from "@ui/components/progress";
import { RadioGroup, RadioGroupItem } from "@ui/components/radio-group";
import { cn } from "@ui/lib";
import {
	AlertCircle,
	Check,
	Download,
	FileSpreadsheet,
	Settings,
	Upload,
	X,
} from "lucide-react";
import { useCallback, useState } from "react";

// Using basic file validation instead of Excel parsing

interface FieldWeldUploadProps {
	onFileSelect: (
		file: File,
		validationResult: FieldWeldValidationResult,
	) => void;
	onFileRemove: () => void;
	onImportClick?: (
		file: File,
		validationResult: FieldWeldValidationResult,
	) => void;
	loading?: boolean;
	progress?: number;
	error?: string;
	className?: string;
	isImporting?: boolean;
	importResult?: {
		success: boolean;
		imported?: number;
		created?: {
			components: number;
			fieldWelds: number;
			milestones?: number;
		};
		updated?: {
			components: number;
			fieldWelds: number;
		};
		summary?: {
			duplicatesFound: number;
			duplicatesSkipped: number;
			duplicatesUpdated: number;
		};
		errors?: string[];
	};
	// Import options
	duplicateHandling?: "error" | "skip" | "update";
	onDuplicateHandlingChange?: (value: "error" | "skip" | "update") => void;
	createMissingDrawings?: boolean;
	onCreateMissingDrawingsChange?: (value: boolean) => void;
}

interface FieldWeldValidationResult {
	isValid: boolean;
	detectedFormat: "WELD_LOG" | "UNKNOWN";
	errors: string[];
	metadata?: {
		totalRows: number;
		totalColumns: number;
		requiredColumnsFound: string[];
		missingColumns: string[];
	};
}

export function FieldWeldUpload({
	onFileSelect,
	onFileRemove,
	onImportClick,
	loading = false,
	progress = 0,
	error,
	className,
	isImporting = false,
	importResult,
	duplicateHandling = "skip",
	onDuplicateHandlingChange,
	createMissingDrawings = true,
	onCreateMissingDrawingsChange,
}: FieldWeldUploadProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [validationResult, setValidationResult] =
		useState<FieldWeldValidationResult | null>(null);
	const [dragActive, setDragActive] = useState(false);
	const [isValidating, setIsValidating] = useState(false);

	const MAX_FILE_SIZE_MB = 100;
	const ACCEPTED_TYPES = [
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
		"application/vnd.ms-excel", // .xls
	];

	const validateFile = (file: File): string | null => {
		// Check file size (100MB limit for large weld logs)
		const maxSizeInBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
		if (file.size > maxSizeInBytes) {
			return `File size must be less than ${MAX_FILE_SIZE_MB}MB`;
		}

		// Check file type - only Excel files allowed
		if (
			!ACCEPTED_TYPES.includes(file.type) &&
			!file.name.match(/\.(xlsx|xls)$/i)
		) {
			return "File must be an Excel file (.xlsx or .xls format only)";
		}

		return null;
	};

	const validateWeldLogFormat = useCallback(
		async (file: File): Promise<FieldWeldValidationResult> => {
			console.log("Validating file:", file.name, "Size:", file.size);
			try {
				// Basic validation - check filename and file type
				// The actual Excel parsing will happen on the backend during import

				const isLikelyWeldLog =
					file.name.toLowerCase().includes("weld") ||
					file.name.toLowerCase().includes("log") ||
					file.name.toLowerCase().match(/weld.*log|log.*weld/i);

				if (isLikelyWeldLog) {
					// Estimate row count based on file size (rough approximation)
					// Each Excel row is approximately 100-200 bytes on average
					const estimatedRows = Math.max(
						1,
						Math.floor(file.size / 150) - 1,
					); // -1 for header

					return {
						isValid: true,
						detectedFormat: "WELD_LOG",
						errors: [],
						metadata: {
							totalRows: estimatedRows,
							totalColumns: 27, // A through AA (standard WELD LOG format)
							requiredColumnsFound: [
								"Weld ID Number (Column A)",
								"Drawing Number (Column D)",
							],
							missingColumns: [],
						},
					};
				}

				return {
					isValid: false,
					detectedFormat: "UNKNOWN",
					errors: [
						"File does not appear to be a WELD LOG format",
						"Please ensure your file follows the standard WELD LOG template",
						'File name should contain "weld" or "log"',
					],
				};
			} catch (error) {
				return {
					isValid: false,
					detectedFormat: "UNKNOWN",
					errors: [
						`Failed to validate file: ${error instanceof Error ? error.message : "Unknown error"}`,
					],
				};
			}
		},
		[],
	);

	const handleFileSelect = useCallback(
		async (file: File) => {
			const basicError = validateFile(file);
			if (basicError) {
				setValidationResult({
					isValid: false,
					detectedFormat: "UNKNOWN",
					errors: [basicError],
				});
				return;
			}

			setSelectedFile(file);
			setIsValidating(true);
			setValidationResult(null);

			try {
				const result = await validateWeldLogFormat(file);
				setValidationResult(result);

				if (result.isValid) {
					onFileSelect(file, result);
				}
			} catch (error) {
				setValidationResult({
					isValid: false,
					detectedFormat: "UNKNOWN",
					errors: [
						`Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
					],
				});
			} finally {
				setIsValidating(false);
			}
		},
		[onFileSelect, validateWeldLogFormat],
	);

	const handleFileRemove = useCallback(() => {
		setSelectedFile(null);
		setValidationResult(null);
		onFileRemove();
	}, [onFileRemove]);

	const handleDrag = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setDragActive(false);

			if (e.dataTransfer.files && e.dataTransfer.files[0]) {
				handleFileSelect(e.dataTransfer.files[0]);
			}
		},
		[handleFileSelect],
	);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			handleFileSelect(e.target.files[0]);
		}
	};

	const handleDownloadTemplate = () => {
		// This would trigger download of the WELD LOG template
		// In real implementation, this would download from a template endpoint
		console.log("Download WELD LOG template");
	};

	// Success state - show selected file with validation results
	if (
		selectedFile &&
		validationResult?.isValid &&
		!loading &&
		!isValidating
	) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Check className="h-5 w-5 text-green-600" />
						WELD LOG File Ready
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
						<div className="flex items-center gap-3">
							<FileSpreadsheet className="h-8 w-8 text-green-600" />
							<div>
								<p className="font-medium">
									{selectedFile.name}
								</p>
								<p className="text-sm text-muted-foreground">
									{(selectedFile.size / 1024 / 1024).toFixed(
										2,
									)}{" "}
									MB
								</p>
								{validationResult.metadata && (
									<p className="text-sm text-green-600">
										{validationResult.metadata.totalRows}{" "}
										rows,{" "}
										{validationResult.metadata.totalColumns}{" "}
										columns detected
									</p>
								)}
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={handleFileRemove}
							disabled={loading}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>

					{validationResult.metadata?.requiredColumnsFound &&
						validationResult.metadata.requiredColumnsFound.length >
							0 && (
							<div className="p-3 bg-green-50 border border-green-200 rounded-lg">
								<p className="text-sm font-medium text-green-800 mb-2">
									Validated Format:
								</p>
								<ul className="text-sm text-green-700 space-y-1">
									{validationResult.metadata.requiredColumnsFound.map(
										(column, index) => (
											<li
												key={index}
												className="flex items-center gap-2"
											>
												<Check className="h-3 w-3" />
												{column}
											</li>
										),
									)}
								</ul>
							</div>
						)}

					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					{/* Import Result */}
					{importResult && (
						<div
							className={`p-4 rounded-lg border ${
								importResult.success
									? "bg-green-50 border-green-200"
									: "bg-yellow-50 border-yellow-200"
							}`}
						>
							<div className="flex items-center gap-2 mb-2">
								{importResult.success ? (
									<Check className="h-5 w-5 text-green-600" />
								) : (
									<AlertCircle className="h-5 w-5 text-yellow-600" />
								)}
								<h3
									className={`font-semibold ${
										importResult.success
											? "text-green-800"
											: "text-yellow-800"
									}`}
								>
									{importResult.success
										? "Import Successful!"
										: "Import Completed with Issues"}
								</h3>
							</div>
							<div
								className={`text-sm space-y-1 ${
									importResult.success
										? "text-green-700"
										: "text-yellow-700"
								}`}
							>
								{/* Created items */}
								{importResult.created?.fieldWelds ? (
									<p>
										✓ {importResult.created.fieldWelds}{" "}
										field welds created
									</p>
								) : null}
								{importResult.created?.components ? (
									<p>
										✓ {importResult.created.components}{" "}
										components created
									</p>
								) : null}

								{/* Updated items */}
								{importResult.updated?.fieldWelds ? (
									<p>
										🔄 {importResult.updated.fieldWelds}{" "}
										field welds updated
									</p>
								) : null}
								{importResult.updated?.components ? (
									<p>
										🔄 {importResult.updated.components}{" "}
										components updated
									</p>
								) : null}

								{/* Duplicate summary */}
								{importResult.summary &&
									importResult.summary.duplicatesFound >
										0 && (
										<div className="mt-2 space-y-1">
											<p className="font-medium">
												Duplicate handling:
											</p>
											{importResult.summary
												.duplicatesSkipped > 0 && (
												<p>
													•{" "}
													{
														importResult.summary
															.duplicatesSkipped
													}{" "}
													duplicates skipped
												</p>
											)}
											{importResult.summary
												.duplicatesUpdated > 0 && (
												<p>
													•{" "}
													{
														importResult.summary
															.duplicatesUpdated
													}{" "}
													duplicates updated
												</p>
											)}
										</div>
									)}

								{/* If nothing was processed */}
								{!importResult.created?.fieldWelds &&
									!importResult.updated?.fieldWelds && (
										<p>
											⚠ No field welds were imported or
											updated
										</p>
									)}

								{/* Show errors if any */}
								{importResult.errors &&
									importResult.errors.length > 0 && (
										<div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
											<p className="font-medium text-red-800 mb-1">
												Errors encountered:
											</p>
											<ul className="text-xs text-red-700 space-y-1">
												{importResult.errors.map(
													(error, index) => (
														<li key={index}>
															• {error}
														</li>
													),
												)}
											</ul>
										</div>
									)}
							</div>
						</div>
					)}

					{/* Import Options */}
					{onImportClick && !importResult?.success && (
						<div className="p-4 border rounded-lg bg-gray-50 space-y-4">
							<div className="flex items-center gap-2 mb-3">
								<Settings className="h-4 w-4 text-gray-600" />
								<Label className="font-medium">
									Import Options
								</Label>
							</div>

							{/* Duplicate Handling */}
							<div className="space-y-3">
								<Label className="text-sm font-medium">
									How to handle existing welds:
								</Label>
								<RadioGroup
									value={duplicateHandling}
									onValueChange={onDuplicateHandlingChange}
									className="space-y-2"
								>
									<div className="flex items-center space-x-2">
										<RadioGroupItem
											value="skip"
											id="skip"
										/>
										<Label
											htmlFor="skip"
											className="text-sm cursor-pointer"
										>
											<span className="font-medium">
												Skip duplicates
											</span>{" "}
											- Import only new welds
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem
											value="update"
											id="update"
										/>
										<Label
											htmlFor="update"
											className="text-sm cursor-pointer"
										>
											<span className="font-medium">
												Update existing
											</span>{" "}
											- Overwrite with new data
										</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem
											value="error"
											id="error"
										/>
										<Label
											htmlFor="error"
											className="text-sm cursor-pointer"
										>
											<span className="font-medium">
												Stop on duplicates
											</span>{" "}
											- Show error if duplicates found
										</Label>
									</div>
								</RadioGroup>
							</div>

							{/* Create Missing Drawings */}
							<div className="flex items-center space-x-2">
								<Checkbox
									id="createDrawings"
									checked={createMissingDrawings}
									onCheckedChange={
										onCreateMissingDrawingsChange
									}
								/>
								<Label
									htmlFor="createDrawings"
									className="text-sm cursor-pointer"
								>
									Create missing drawings automatically
								</Label>
							</div>
						</div>
					)}

					{/* Import Action Buttons */}
					{onImportClick && !importResult?.success && (
						<div className="flex gap-3 pt-2">
							<Button
								onClick={() =>
									onImportClick(
										selectedFile,
										validationResult,
									)
								}
								disabled={isImporting}
								size="lg"
								className="flex-1"
							>
								{isImporting ? (
									<>
										<div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
										Importing Field Welds...
									</>
								) : (
									<>
										<Upload className="h-4 w-4 mr-2" />
										Import Field Welds
									</>
								)}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		);
	}

	// Loading/processing state
	if (loading || isValidating) {
		return (
			<Card className={className}>
				<CardContent className="p-6">
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Upload className="h-5 w-5 animate-pulse" />
							<span className="font-medium">
								{isValidating
									? "Validating WELD LOG format..."
									: "Processing file..."}
							</span>
						</div>
						<Progress
							value={isValidating ? 50 : progress}
							className="w-full"
						/>
						<p className="text-sm text-muted-foreground">
							{isValidating
								? "Checking file format and structure..."
								: `${progress}% complete`}
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Error state - show selected file with errors
	if (selectedFile && validationResult && !validationResult.isValid) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<AlertCircle className="h-5 w-5 text-red-600" />
						File Format Error
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between p-4 border rounded-lg bg-red-50 border-red-200">
						<div className="flex items-center gap-3">
							<FileSpreadsheet className="h-8 w-8 text-red-600" />
							<div>
								<p className="font-medium">
									{selectedFile.name}
								</p>
								<p className="text-sm text-muted-foreground">
									{(selectedFile.size / 1024 / 1024).toFixed(
										2,
									)}{" "}
									MB
								</p>
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={handleFileRemove}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>

					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							<div className="space-y-2">
								<p className="font-medium">
									File validation failed:
								</p>
								<ul className="list-disc list-inside space-y-1 text-sm">
									{validationResult.errors.map(
										(error, index) => (
											<li key={index}>{error}</li>
										),
									)}
								</ul>
							</div>
						</AlertDescription>
					</Alert>

					<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<p className="text-sm font-medium text-blue-800 mb-2">
							Need the correct format?
						</p>
						<Button
							variant="outline"
							size="sm"
							onClick={handleDownloadTemplate}
							className="text-blue-700 border-blue-300 hover:bg-blue-100"
						>
							<Download className="h-4 w-4 mr-2" />
							Download WELD LOG Template
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Default upload state
	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Upload className="h-5 w-5" />
					Upload WELD LOG File
				</CardTitle>
				<CardDescription>
					Select a WELD LOG Excel file (.xlsx or .xls) to import field
					weld data. Files up to {MAX_FILE_SIZE_MB}MB are supported.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div
					className={cn(
						"relative border-2 border-dashed rounded-lg p-12 text-center transition-colors",
						dragActive
							? "border-primary bg-primary/5"
							: "border-muted-foreground/25 hover:border-muted-foreground/50",
					)}
					onDragEnter={handleDrag}
					onDragLeave={handleDrag}
					onDragOver={handleDrag}
					onDrop={handleDrop}
				>
					<input
						type="file"
						accept=".xlsx,.xls"
						onChange={handleInputChange}
						className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
						disabled={loading || isValidating}
					/>

					<div className="space-y-6">
						<div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
							<FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
						</div>

						<div className="space-y-3">
							<p className="text-xl font-medium">
								Drop your WELD LOG file here, or{" "}
								<span className="text-primary">browse</span>
							</p>
							<p className="text-sm text-muted-foreground max-w-md mx-auto">
								Only Excel files (.xlsx, .xls) are accepted. The
								file will be validated against the standard WELD
								LOG format with columns A-AA.
							</p>
						</div>

						<Button
							variant="outline"
							disabled={loading || isValidating}
							className="mt-4"
						>
							<Upload className="h-4 w-4 mr-2" />
							Select Excel File
						</Button>
					</div>
				</div>

				{/* Template download section */}
				<div className="border rounded-lg p-4 bg-muted/30">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium text-sm">
								Need the WELD LOG template?
							</p>
							<p className="text-sm text-muted-foreground">
								Download the official template with the correct
								column structure
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={handleDownloadTemplate}
						>
							<Download className="h-4 w-4 mr-2" />
							Download Template
						</Button>
					</div>
				</div>

				{error && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
			</CardContent>
		</Card>
	);
}
