"use client";

import React, { useState } from "react";
import { Card } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Progress } from "@ui/components/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
	FileSpreadsheet,
	CheckCircle2,
	AlertCircle,
	ArrowLeft,
	ArrowRight,
	Download,
	RefreshCw,
	FileDown,
	Info,
	XCircle,
	AlertTriangle,
	Zap,
} from "lucide-react";
import { Fileload } from "./Fileload";
import { ColumnMapper } from "./ColumnMapper";
import { ValidationPreview } from "./ValidationPreview";
import { ImportStatus } from "./ImportStatus";
import { useImportProcess } from "../hooks/useImportProcess";
import { useImportProgress } from "../hooks/useImportProgress";
import { Alert, AlertDescription } from "@ui/components/alert";
import { useToast } from "@ui/hooks/use-toast";
import {
	generateImportTemplate,
	generateFieldWeldTemplate,
	generateCSVTemplate,
	downloadFile,
} from "../utils/templateGenerator";

interface ImportWizardProps {
	projectId: string;
}

type ImportType = "components" | "field_welds";
type ImportStep = "upload" | "mapping" | "validation" | "import" | "complete";

const getStepTitles = (importType: ImportType): Record<ImportStep, string> => ({
	upload: `Upload ${importType === "components" ? "Component" : "Field Weld"} File`,
	mapping: "Map Columns",
	validation: "Validate Data",
	import: "Import Progress",
	complete: "Import Complete",
});

const getStepDescriptions = (
	importType: ImportType,
): Record<ImportStep, string> => ({
	upload: `Select an Excel or CSV file to import ${importType === "components" ? "components" : "field welds"}`,
	mapping: `Map file columns to ${importType === "components" ? "component" : "field weld"} fields`,
	validation: "Review and validate data before importing",
	import: "Importing your data...",
	complete: "Import has been completed",
});

export function ImportWizard({ projectId }: ImportWizardProps) {
	const [importType, setImportType] = useState<ImportType>("components");
	const [currentStep, setCurrentStep] = useState<ImportStep>("upload");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadData, setUploadData] = useState<any>(null);
	const [columnMappings, setColumnMappings] = useState<
		Record<string, string>
	>({});
	const [validationResults, setValidationResults] = useState<any>(null);

	const {
		uploadFile,
		validateData,
		startImport,
		importJob,
		isLoading,
		error,
		resetImport,
	} = useImportProcess(projectId, importType);

	// Get real-time import progress and final job data
	const {
		progress,
		status: importStatus,
		isComplete,
		jobData,
	} = useImportProgress(importJob?.id, projectId);

	const { toast } = useToast();

	// Auto-transition to complete step and show toast when import finishes
	React.useEffect(() => {
		if (isComplete && currentStep === "import") {
			setCurrentStep("complete");

			// Show completion toast
			if (jobData) {
				const successCount =
					(jobData.processedRows || 0) - (jobData.errorRows || 0);
				const errorCount = jobData.errorRows || 0;

				if (importStatus === "completed") {
					toast({
						title: "Import Completed Successfully!",
						description: `${successCount} components imported successfully.`,
						variant: "success",
						duration: 5000,
					});
				} else if (importStatus === "failed") {
					toast({
						title: "Import Failed",
						description: `Import failed with ${errorCount} errors. Please check the error report.`,
						variant: "destructive",
						duration: 8000,
					});
				} else {
					toast({
						title: "Import Partially Complete",
						description: `${successCount} components imported, ${errorCount} failed. Check error report for details.`,
						variant: "default",
						duration: 8000,
					});
				}
			}
		}
	}, [isComplete, currentStep, importStatus, jobData, toast]);

	const getStepNumber = (step: ImportStep): number => {
		const steps: ImportStep[] = [
			"upload",
			"mapping",
			"validation",
			"import",
			"complete",
		];
		return steps.indexOf(step) + 1;
	};

	const currentStepNumber = getStepNumber(currentStep);
	const progressPercent = ((currentStepNumber - 1) / 4) * 100;
	const stepTitles = getStepTitles(importType);
	const stepDescriptions = getStepDescriptions(importType);

	const handleFileSelect = async (file: File) => {
		setSelectedFile(file);

		// Parse file to get headers for column mapping
		const result = await uploadFile(file);
		if (result) {
			setUploadData(result.uploadData);
			setCurrentStep("mapping");
		}
	};

	const handleMappingComplete = async (mappings: Record<string, string>) => {
		setColumnMappings(mappings);

		// Validate data with mappings
		if (uploadData) {
			// Convert mappings object to array format expected by API
			const mappingsArray = Object.entries(mappings).map(
				([targetField, sourceColumn]) => ({
					sourceColumn,
					targetField,
					required:
						targetField === "componentId" ||
						targetField === "type" ||
						targetField === "drawingId",
				}),
			);

			const validation = await validateData(uploadData, mappingsArray);
			setValidationResults(validation);
			setCurrentStep("validation");
		}
	};

	const handleStartImport = async () => {
		if (!uploadData || !columnMappings) return;

		setCurrentStep("import");

		// Convert mappings to array format expected by API
		const mappingsArray = Object.entries(columnMappings).map(
			([targetField, sourceColumn]) => ({
				sourceColumn,
				targetField,
				required:
					targetField === "componentId" ||
					targetField === "type" ||
					targetField === "drawingId",
			}),
		);

		await startImport(
			uploadData,
			mappingsArray,
			validationResults?.options,
		);

		// Note: Auto-transition to complete step is handled by useEffect when import finishes
	};

	const handleReset = () => {
		resetImport();
		setSelectedFile(null);
		setUploadData(null);
		setColumnMappings({});
		setValidationResults(null);
		setCurrentStep("upload");
	};

	const handleTabChange = (newType: ImportType) => {
		console.log("ImportWizard - handleTabChange called:", {
			newType,
			currentType: importType,
			currentStep,
			hasValidation: !!validationResults,
		});

		if (newType !== importType) {
			// Only allow tab changes at the upload step to prevent data loss
			if (currentStep === "upload") {
				console.log("ImportWizard - Changing import type to:", newType);
				setImportType(newType);
			} else {
				// Show a warning that they need to restart to change import type
				// For now, we'll just prevent the change
				// TODO: Add a confirmation dialog
				console.warn(
					"Cannot change import type after uploading. Please reset to change type.",
				);
				return;
			}
		}
	};

	const canGoBack = currentStep !== "upload" && currentStep !== "import";
	const canGoNext =
		currentStep === "validation" && validationResults?.isValid;

	return (
		<div className="space-y-6">
			{/* Import Type Tabs */}
			<Tabs
				value={importType}
				onValueChange={(value) => handleTabChange(value as ImportType)}
			>
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger
						value="components"
						className="flex items-center gap-2"
						disabled={currentStep !== "upload"}
					>
						<FileSpreadsheet className="h-4 w-4" />
						Components
					</TabsTrigger>
					<TabsTrigger
						value="field_welds"
						className="flex items-center gap-2"
						disabled={currentStep !== "upload"}
					>
						<Zap className="h-4 w-4" />
						Field Welds
					</TabsTrigger>
				</TabsList>

				{currentStep !== "upload" && (
					<div className="text-center py-2 border-t border-border/50">
						<p className="text-xs text-muted-foreground mb-2">
							To change import type, reset and start over
						</p>
						<Button
							status="info"
							size="sm"
							onClick={handleReset}
							className="text-xs h-7"
						>
							<RefreshCw className="h-3 w-3 mr-1" />
							Reset Import
						</Button>
					</div>
				)}

				<TabsContent value={importType} className="mt-6">
					{/* Progress Bar */}
					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span className="font-medium">
								Step {currentStepNumber} of 5
							</span>
							<span className="text-muted-foreground">
								{stepTitles[currentStep]}
							</span>
						</div>
						<Progress value={progressPercent} className="h-2" />
					</div>

					{/* Step Content */}
					<Card className="p-6">
						<div className="mb-6">
							<h2 className="text-2xl font-semibold mb-2">
								{stepTitles[currentStep]}
							</h2>
							<p className="text-muted-foreground">
								{stepDescriptions[currentStep]}
							</p>
						</div>

						{error && (
							<Alert variant="error" className="mb-6">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{/* Step Components */}
						<div className="min-h-[400px]">
							{currentStep === "upload" && (
								<div className="space-y-6">
									{/* Import Type Notice */}
									<Alert>
										<Info className="h-4 w-4" />
										<AlertDescription>
											<strong>
												Import Type:{" "}
												{importType === "components"
													? "Components"
													: "Field Welds"}
											</strong>
											{importType === "field_welds"
												? " - This will import field weld data with QC tracking fields."
												: " - This will import general component data with milestone tracking."}
										</AlertDescription>
									</Alert>

									{/* Template Download Section */}
									<Card className="p-6 bg-blue-50 border-blue-200">
										<div className="flex items-start gap-4">
											<div className="p-2 bg-blue-100 rounded-lg">
												<Info className="h-5 w-5 text-blue-600" />
											</div>
											<div className="flex-1">
												<h3 className="font-semibold mb-2">
													Need a template?
												</h3>
												<p className="text-sm text-muted-foreground mb-4">
													{importType === "components"
														? "Download our Excel template for component imports with the correct format and sample data."
														: "Download our Excel template for field weld imports with QC tracking fields and sample data."}
												</p>
												<div className="flex flex-wrap gap-3">
													{importType ===
													"components" ? (
														<>
															<Button
																status="info"
																size="sm"
																onClick={() => {
																	const blob =
																		generateImportTemplate();
																	downloadFile(
																		blob,
																		`PipeTrak_Component_Template_${new Date().toISOString().split("T")[0]}.xlsx`,
																	);
																}}
															>
																<FileDown className="h-4 w-4 mr-2" />
																Component
																Template (Excel)
															</Button>
															<Button
																status="info"
																size="sm"
																onClick={() => {
																	const csv =
																		generateCSVTemplate();
																	downloadFile(
																		csv,
																		`PipeTrak_Component_Template_${new Date().toISOString().split("T")[0]}.csv`,
																	);
																}}
															>
																<FileDown className="h-4 w-4 mr-2" />
																Component
																Template (CSV)
															</Button>
														</>
													) : (
														<>
															<Button
																status="info"
																size="sm"
																onClick={() => {
																	const blob =
																		generateFieldWeldTemplate();
																	downloadFile(
																		blob,
																		`PipeTrak_FieldWeld_Template_${new Date().toISOString().split("T")[0]}.xlsx`,
																	);
																}}
																className="border-orange-200 text-orange-700 hover:bg-orange-50"
															>
																<FileDown className="h-4 w-4 mr-2" />
																Field Weld
																Template (Excel)
															</Button>
														</>
													)}
												</div>
											</div>
										</div>
									</Card>

									{/* File Upload Component */}
									<Fileload
										onFileSelect={handleFileSelect}
										onFileRemove={() =>
											setSelectedFile(null)
										}
										loading={isLoading}
										error={error}
										maxSizeInMB={50}
									/>
								</div>
							)}

							{currentStep === "mapping" && selectedFile && (
								<ColumnMapper
									file={selectedFile}
									projectId={projectId}
									importType={importType}
									onMappingComplete={handleMappingComplete}
									onBack={() => setCurrentStep("upload")}
								/>
							)}

							{currentStep === "validation" &&
								validationResults && (
									<ValidationPreview
										file={selectedFile!}
										mappings={columnMappings}
										validation={validationResults}
										importType={importType}
										onConfirm={handleStartImport}
										onBack={() => setCurrentStep("mapping")}
									/>
								)}

							{currentStep === "import" && (
								<ImportStatus
									jobId={importJob?.id}
									projectId={projectId}
								/>
							)}

							{currentStep === "complete" && (
								<div className="space-y-6 py-8">
									<div className="text-center space-y-4">
										<div
											className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
												importStatus === "completed"
													? "bg-green-100"
													: importStatus === "failed"
														? "bg-red-100"
														: "bg-orange-100"
											}`}
										>
											{importStatus === "completed" ? (
												<CheckCircle2 className="h-8 w-8 text-green-600" />
											) : importStatus === "failed" ? (
												<XCircle className="h-8 w-8 text-red-600" />
											) : (
												<AlertTriangle className="h-8 w-8 text-orange-600" />
											)}
										</div>
										<h3 className="text-xl font-semibold">
											{importStatus === "completed"
												? "Import Complete!"
												: importStatus === "failed"
													? "Import Failed"
													: "Import Partially Complete"}
										</h3>
										<p className="text-muted-foreground max-w-md mx-auto">
											{jobData ? (
												<>
													Successfully imported{" "}
													{(jobData.processedRows ||
														0) -
														(jobData.errorRows ||
															0)}{" "}
													components.
													{(jobData.errorRows || 0) >
														0 && (
														<span className="block mt-2 text-orange-600">
															{jobData.errorRows}{" "}
															components had
															errors and were
															skipped.
														</span>
													)}
													<span className="block mt-2 text-sm">
														Total processed:{" "}
														{jobData.processedRows ||
															0}{" "}
														of{" "}
														{jobData.totalRows || 0}{" "}
														rows
													</span>
												</>
											) : (
												"Import completed with unknown results."
											)}
										</p>
									</div>

									<div className="flex justify-center gap-4">
										<Button
											variant="outline"
											onClick={handleReset}
										>
											<RefreshCw className="h-4 w-4 mr-2" />
											Import Another File
										</Button>
										{(jobData?.errorRows || 0) > 0 &&
											importJob && (
												<Button
													status="info"
													onClick={() =>
														window.open(
															`/api/pipetrak/import/${importJob.id}/errors`,
															"_blank",
														)
													}
												>
													<Download className="h-4 w-4 mr-2" />
													Download Error Report
												</Button>
											)}
										<Button
											onClick={() =>
												(window.location.href = `/app/pipetrak/${projectId}/components`)
											}
										>
											View Components
										</Button>
									</div>
								</div>
							)}
						</div>

						{/* Navigation Buttons */}
						{currentStep !== "import" &&
							currentStep !== "complete" && (
								<div className="flex justify-between pt-6 border-t">
									<Button
										status="info"
										onClick={() => {
											if (currentStep === "validation")
												setCurrentStep("mapping");
											if (currentStep === "mapping")
												setCurrentStep("upload");
										}}
										disabled={!canGoBack}
									>
										<ArrowLeft className="h-4 w-4 mr-2" />
										Back
									</Button>

									{currentStep === "validation" && (
										<Button
											onClick={handleStartImport}
											disabled={
												!validationResults?.isValid ||
												isLoading
											}
										>
											Start Import
											<ArrowRight className="h-4 w-4 ml-2" />
										</Button>
									)}
								</div>
							)}
					</Card>
				</TabsContent>
			</Tabs>

			{/* Recent Imports */}
			<Card className="p-6">
				<h3 className="text-lg font-semibold mb-4">Recent Imports</h3>
				<div className="text-sm text-muted-foreground">
					Recent import history will appear here...
				</div>
			</Card>
		</div>
	);
}
