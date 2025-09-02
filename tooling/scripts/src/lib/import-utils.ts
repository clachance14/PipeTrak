#!/usr/bin/env tsx
/**
 * PipeTrak Import Utilities
 * Flexible import system for Excel, CSV, and JSON data
 */

import { PrismaClient } from "@repo/database/client";
import { createId } from "@paralleldrive/cuid2";
import { logger } from "@repo/logs";

// ========== Type Definitions ==========

export interface ImportOptions {
	dryRun?: boolean;
	allowPartialSuccess?: boolean;
	skipDuplicates?: boolean;
	updateExisting?: boolean;
	progressCallback?: (progress: ImportProgress) => void;
	batchSize?: number;
	maxRetries?: number;
}

export interface ImportProgress {
	phase: "validating" | "transforming" | "importing" | "complete";
	batch?: number;
	totalBatches?: number;
	processed: number;
	total: number;
	errors?: number;
}

export interface ValidationError {
	row: number;
	field: string;
	code: string;
	message: string;
	severity: "error" | "warning";
	currentValue?: any;
	suggestedValue?: any;
}

export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationError[];
}

export interface ImportResult {
	success: boolean;
	totalRows: number;
	processedRows: number;
	successfulRows: number;
	errorRows: number;
	errors: ValidationError[];
	warnings: ValidationError[];
	partialSuccess?: boolean;
	importJobId?: string;
}

export interface ComponentImportData {
	componentId: string;
	type?: string;
	spec?: string;
	size?: string;
	material?: string;
	area?: string;
	system?: string;
	testPackage?: string;
	drawingNumber?: string;
	workflowType?:
		| "MILESTONE_DISCRETE"
		| "MILESTONE_PERCENTAGE"
		| "MILESTONE_QUANTITY";
	milestones?: MilestoneImportData[];
	[key: string]: any; // Allow additional fields for flexibility
}

export interface MilestoneImportData {
	name: string;
	completed?: boolean;
	isCompleted?: boolean; // Support both field names
	completedDate?: string;
	weight?: number;
	percentageValue?: number;
	quantityValue?: number;
	quantityUnit?: string;
}

export interface ProjectImportData {
	jobName: string;
	jobNumber?: string;
	name?: string; // Support legacy field name
	description?: string;
	location?: string;
	startDate?: string;
	targetDate?: string;
}

export interface DrawingImportData {
	number: string;
	title?: string;
	description?: string; // Support both field names
	revision?: string;
}

export interface ImportData {
	project?: ProjectImportData;
	milestoneTemplate?: {
		name: string;
		description?: string;
		milestones: Array<{
			name: string;
			weight: number;
			order: number;
		}>;
	};
	drawings?: DrawingImportData[];
	components: ComponentImportData[];
}

// ========== Main Importer Class ==========

export class PipeTrakImporter {
	private static readonly DEFAULT_BATCH_SIZE = 50;
	private static readonly DEFAULT_MAX_RETRIES = 3;
	private prisma: PrismaClient;
	private validator: ImportValidator;
	private transformer: ImportTransformer;

	constructor(prisma?: PrismaClient) {
		this.prisma = prisma || new PrismaClient();
		this.validator = new ImportValidator();
		this.transformer = new ImportTransformer();
	}

	/**
	 * Main import method that handles the complete import pipeline
	 */
	async import(
		data: ImportData,
		projectId: string,
		userId: string,
		options: ImportOptions = {},
	): Promise<ImportResult> {
		const {
			dryRun = false,
			allowPartialSuccess = false,
			skipDuplicates = false,
			updateExisting = false,
			progressCallback,
			batchSize = PipeTrakImporter.DEFAULT_BATCH_SIZE,
			maxRetries = PipeTrakImporter.DEFAULT_MAX_RETRIES,
		} = options;

		try {
			// Phase 1: Validation
			progressCallback?.({
				phase: "validating",
				processed: 0,
				total: data.components.length,
			});

			const validationResult = await this.validator.validateImportData(
				data,
				projectId,
				this.prisma,
			);

			if (!validationResult.isValid && !allowPartialSuccess) {
				return {
					success: false,
					totalRows: data.components.length,
					processedRows: 0,
					successfulRows: 0,
					errorRows: data.components.length,
					errors: validationResult.errors,
					warnings: validationResult.warnings,
				};
			}

			if (dryRun) {
				return {
					success: validationResult.isValid,
					totalRows: data.components.length,
					processedRows: data.components.length,
					successfulRows: validationResult.isValid
						? data.components.length
						: 0,
					errorRows: validationResult.errors.length,
					errors: validationResult.errors,
					warnings: validationResult.warnings,
				};
			}

			// Phase 2: Transformation
			progressCallback?.({
				phase: "transforming",
				processed: 0,
				total: data.components.length,
			});

			const transformedData = await this.transformer.transformImportData(
				data,
				projectId,
			);

			// Phase 3: Import with chunking
			progressCallback?.({
				phase: "importing",
				processed: 0,
				total: transformedData.components.length,
			});

			const importResult = await this.importComponentsInBatches(
				transformedData.components,
				projectId,
				userId,
				{
					batchSize,
					maxRetries,
					skipDuplicates,
					updateExisting,
					progressCallback,
				},
			);

			return importResult;
		} catch (error) {
			logger.error("Import failed", error);
			throw error;
		}
	}

	/**
	 * Import components in batches for better performance and error recovery
	 */
	private async importComponentsInBatches(
		components: ComponentImportData[],
		projectId: string,
		userId: string,
		options: {
			batchSize: number;
			maxRetries: number;
			skipDuplicates: boolean;
			updateExisting: boolean;
			progressCallback?: (progress: ImportProgress) => void;
		},
	): Promise<ImportResult> {
		const results: ImportResult[] = [];
		const totalBatches = Math.ceil(components.length / options.batchSize);

		for (let i = 0; i < components.length; i += options.batchSize) {
			const batch = components.slice(i, i + options.batchSize);
			const batchNumber = Math.floor(i / options.batchSize) + 1;

			options.progressCallback?.({
				phase: "importing",
				batch: batchNumber,
				totalBatches,
				processed: i,
				total: components.length,
			});

			const batchResult = await this.processBatchWithRetry(
				batch,
				projectId,
				userId,
				batchNumber,
				options.maxRetries,
				options.skipDuplicates,
				options.updateExisting,
			);

			results.push(batchResult);

			// Brief pause between batches to avoid overwhelming the database
			await this.sleep(100);
		}

		// Consolidate results from all batches
		return this.consolidateResults(results);
	}

	/**
	 * Process a single batch with retry logic
	 */
	private async processBatchWithRetry(
		batch: ComponentImportData[],
		projectId: string,
		userId: string,
		batchNumber: number,
		maxRetries: number,
		skipDuplicates: boolean,
		updateExisting: boolean,
		attempt = 1,
	): Promise<ImportResult> {
		try {
			return await this.processBatch(
				batch,
				projectId,
				userId,
				skipDuplicates,
				updateExisting,
			);
		} catch (error) {
			if (attempt < maxRetries) {
				logger.warn(
					`Batch ${batchNumber} failed, retrying (attempt ${attempt}/${maxRetries})`,
				);
				await this.sleep(attempt * 1000); // Exponential backoff
				return this.processBatchWithRetry(
					batch,
					projectId,
					userId,
					batchNumber,
					maxRetries,
					skipDuplicates,
					updateExisting,
					attempt + 1,
				);
			}

			// Max retries exceeded, return error result
			return {
				success: false,
				totalRows: batch.length,
				processedRows: 0,
				successfulRows: 0,
				errorRows: batch.length,
				errors: [
					{
						row: 0,
						field: "batch",
						code: "BATCH_PROCESSING_FAILED",
						message: `Batch ${batchNumber} failed after ${maxRetries} attempts: ${error}`,
						severity: "error",
					},
				],
				warnings: [],
			};
		}
	}

	/**
	 * Process a single batch of components
	 */
	private async processBatch(
		batch: ComponentImportData[],
		projectId: string,
		userId: string,
		skipDuplicates: boolean,
		updateExisting: boolean,
	): Promise<ImportResult> {
		const errors: ValidationError[] = [];
		const warnings: ValidationError[] = [];
		let successfulRows = 0;

		// Use transaction for atomicity
		await this.prisma.$transaction(async (tx) => {
			for (const component of batch) {
				try {
					// Check for existing component
					const existingComponent = await tx.component.findFirst({
						where: {
							projectId,
							componentId: component.componentId,
						},
					});

					if (existingComponent) {
						if (skipDuplicates) {
							warnings.push({
								row: 0,
								field: "componentId",
								code: "DUPLICATE_SKIPPED",
								message: `Component ${component.componentId} already exists, skipped`,
								severity: "warning",
							});
							continue;
						}
						if (!updateExisting) {
							errors.push({
								row: 0,
								field: "componentId",
								code: "DUPLICATE_COMPONENT",
								message: `Component ${component.componentId} already exists`,
								severity: "error",
							});
							continue;
						}
					}

					// Create or update component
					const componentData = {
						projectId,
						componentId: component.componentId,
						type: component.type || "PIPE",
						spec: component.spec || "",
						size: component.size || "",
						material: component.material || "",
						area: component.area || "",
						system: component.system || "",
						testPackage: component.testPackage || "",
						workflowType:
							component.workflowType || "MILESTONE_DISCRETE",
						status: this.calculateStatus(
							component.milestones || [],
						),
						completionPercent: this.calculateCompletionPercent(
							component.milestones || [],
						),
						createdAt: new Date(),
						updatedAt: new Date(),
					};

					const createdComponent = existingComponent
						? await tx.component.update({
								where: { id: existingComponent.id },
								data: componentData,
							})
						: await tx.component.create({
								data: {
									id: createId(),
									...componentData,
								},
							});

					// Create milestones if provided
					if (
						component.milestones &&
						component.milestones.length > 0
					) {
						// Delete existing milestones if updating
						if (existingComponent) {
							await tx.componentMilestone.deleteMany({
								where: { componentId: createdComponent.id },
							});
						}

						// Create new milestones
						const totalMilestones = component.milestones.length;
						const defaultWeight = 100 / totalMilestones;

						for (let i = 0; i < component.milestones.length; i++) {
							const milestone = component.milestones[i];
							const isCompleted =
								milestone.completed ??
								milestone.isCompleted ??
								false;

							await tx.componentMilestone.create({
								data: {
									id: createId(),
									componentId: createdComponent.id,
									milestoneOrder: i,
									milestoneName: milestone.name,
									weight: milestone.weight ?? defaultWeight,
									isCompleted,
									percentageValue: milestone.percentageValue,
									quantityValue: milestone.quantityValue,
									quantityUnit: milestone.quantityUnit,
									completedAt:
										isCompleted && milestone.completedDate
											? new Date(milestone.completedDate)
											: isCompleted
												? new Date()
												: null,
									completedBy: isCompleted ? userId : null,
									createdAt: new Date(),
									updatedAt: new Date(),
								},
							});
						}
					}

					successfulRows++;
				} catch (error) {
					errors.push({
						row: 0,
						field: "component",
						code: "COMPONENT_CREATION_FAILED",
						message: `Failed to create component ${component.componentId}: ${error}`,
						severity: "error",
					});
				}
			}
		});

		return {
			success: errors.length === 0,
			totalRows: batch.length,
			processedRows: batch.length,
			successfulRows,
			errorRows: errors.length,
			errors,
			warnings,
			partialSuccess: successfulRows > 0 && errors.length > 0,
		};
	}

	/**
	 * Calculate component status based on milestones
	 */
	private calculateStatus(
		milestones: MilestoneImportData[],
	): "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" {
		if (!milestones || milestones.length === 0) {
			return "NOT_STARTED";
		}

		const completedCount = milestones.filter(
			(m) => m.completed || m.isCompleted,
		).length;

		if (completedCount === 0) {
			return "NOT_STARTED";
		}
		if (completedCount === milestones.length) {
			return "COMPLETED";
		}
		return "IN_PROGRESS";
	}

	/**
	 * Calculate completion percentage based on milestones
	 */
	private calculateCompletionPercent(
		milestones: MilestoneImportData[],
	): number {
		if (!milestones || milestones.length === 0) {
			return 0;
		}

		const completedCount = milestones.filter(
			(m) => m.completed || m.isCompleted,
		).length;

		return Math.round((completedCount / milestones.length) * 100);
	}

	/**
	 * Consolidate results from multiple batches
	 */
	private consolidateResults(results: ImportResult[]): ImportResult {
		const consolidated: ImportResult = {
			success: results.every((r) => r.success),
			totalRows: results.reduce((sum, r) => sum + r.totalRows, 0),
			processedRows: results.reduce((sum, r) => sum + r.processedRows, 0),
			successfulRows: results.reduce(
				(sum, r) => sum + r.successfulRows,
				0,
			),
			errorRows: results.reduce((sum, r) => sum + r.errorRows, 0),
			errors: results.flatMap((r) => r.errors),
			warnings: results.flatMap((r) => r.warnings),
			partialSuccess: results.some((r) => r.partialSuccess),
		};

		return consolidated;
	}

	/**
	 * Helper function for delays
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

// ========== Validator Class ==========

export class ImportValidator {
	async validateImportData(
		data: ImportData,
		projectId: string,
		prisma: PrismaClient,
	): Promise<ValidationResult> {
		const errors: ValidationError[] = [];
		const warnings: ValidationError[] = [];

		// Validate project exists
		const project = await prisma.project.findUnique({
			where: { id: projectId },
		});

		if (!project) {
			errors.push({
				row: 0,
				field: "projectId",
				code: "PROJECT_NOT_FOUND",
				message: `Project with ID ${projectId} not found`,
				severity: "error",
			});
			return { isValid: false, errors, warnings };
		}

		// Validate components
		for (let i = 0; i < data.components.length; i++) {
			const component = data.components[i];
			const rowNumber = i + 2; // Assuming header row

			// Required field validation
			if (!component.componentId) {
				errors.push({
					row: rowNumber,
					field: "componentId",
					code: "REQUIRED_FIELD_MISSING",
					message: "Component ID is required",
					severity: "error",
				});
			}

			// Workflow type validation
			if (
				component.workflowType &&
				![
					"MILESTONE_DISCRETE",
					"MILESTONE_PERCENTAGE",
					"MILESTONE_QUANTITY",
				].includes(component.workflowType)
			) {
				errors.push({
					row: rowNumber,
					field: "workflowType",
					code: "INVALID_WORKFLOW_TYPE",
					message: `Invalid workflow type: ${component.workflowType}`,
					severity: "error",
					suggestedValue: "MILESTONE_DISCRETE",
				});
			}

			// Drawing reference validation if provided
			if (component.drawingNumber && data.drawings) {
				const drawingExists = data.drawings.some(
					(d) => d.number === component.drawingNumber,
				);
				if (!drawingExists) {
					warnings.push({
						row: rowNumber,
						field: "drawingNumber",
						code: "DRAWING_NOT_FOUND",
						message: `Drawing ${component.drawingNumber} not found in import data`,
						severity: "warning",
					});
				}
			}

			// Duplicate detection within import data
			const duplicates = data.components.filter(
				(c, idx) =>
					idx !== i && c.componentId === component.componentId,
			);
			if (duplicates.length > 0) {
				errors.push({
					row: rowNumber,
					field: "componentId",
					code: "DUPLICATE_IN_IMPORT",
					message: `Component ID ${component.componentId} appears multiple times in import`,
					severity: "error",
				});
			}

			// Milestone validation
			if (component.milestones) {
				for (let j = 0; j < component.milestones.length; j++) {
					const milestone = component.milestones[j];

					if (!milestone.name) {
						errors.push({
							row: rowNumber,
							field: `milestone[${j}].name`,
							code: "MILESTONE_NAME_MISSING",
							message: "Milestone name is required",
							severity: "error",
						});
					}

					// Validate workflow-specific fields
					if (
						component.workflowType === "MILESTONE_PERCENTAGE" &&
						milestone.percentageValue === undefined
					) {
						warnings.push({
							row: rowNumber,
							field: `milestone[${j}].percentageValue`,
							code: "PERCENTAGE_MISSING",
							message:
								"Percentage value expected for percentage workflow",
							severity: "warning",
						});
					}

					if (
						component.workflowType === "MILESTONE_QUANTITY" &&
						milestone.quantityValue === undefined
					) {
						warnings.push({
							row: rowNumber,
							field: `milestone[${j}].quantityValue`,
							code: "QUANTITY_MISSING",
							message:
								"Quantity value expected for quantity workflow",
							severity: "warning",
						});
					}
				}
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Generate remediation suggestions for validation errors
	 */
	generateRemediationReport(errors: ValidationError[]): string {
		const report: string[] = ["Import Validation Report", "=".repeat(50)];

		const errorsByType = errors.reduce(
			(acc, error) => {
				if (!acc[error.code]) {
					acc[error.code] = [];
				}
				acc[error.code].push(error);
				return acc;
			},
			{} as Record<string, ValidationError[]>,
		);

		for (const [code, codeErrors] of Object.entries(errorsByType)) {
			report.push(`\n${code} (${codeErrors.length} occurrences)`);
			report.push("-".repeat(30));

			for (const error of codeErrors.slice(0, 5)) {
				// Show first 5 of each type
				report.push(`  Row ${error.row}: ${error.message}`);
				if (error.suggestedValue) {
					report.push(`    Suggested: ${error.suggestedValue}`);
				}
			}

			if (codeErrors.length > 5) {
				report.push(`  ... and ${codeErrors.length - 5} more`);
			}
		}

		report.push("\nRemediation Steps:");
		report.push("1. Fix required fields marked as missing");
		report.push(
			"2. Correct invalid workflow types to one of: MILESTONE_DISCRETE, MILESTONE_PERCENTAGE, MILESTONE_QUANTITY",
		);
		report.push("3. Remove or consolidate duplicate component IDs");
		report.push("4. Ensure all milestone names are provided");

		return report.join("\n");
	}
}

// ========== Transformer Class ==========

export class ImportTransformer {
	/**
	 * Transform import data to match database schema
	 */
	async transformImportData(
		data: ImportData,
		projectId: string,
	): Promise<ImportData> {
		const transformed: ImportData = {
			...data,
			components: data.components.map((component) =>
				this.transformComponent(component),
			),
		};

		// Transform project data if present
		if (transformed.project) {
			transformed.project = this.transformProject(transformed.project);
		}

		// Transform drawings if present
		if (transformed.drawings) {
			transformed.drawings = transformed.drawings.map((drawing) =>
				this.transformDrawing(drawing),
			);
		}

		return transformed;
	}

	/**
	 * Transform component data
	 */
	private transformComponent(
		component: ComponentImportData,
	): ComponentImportData {
		const transformed: ComponentImportData = {
			...component,
			// Normalize field names
			componentId:
				component.componentId ||
				component["Component ID"] ||
				component["component_id"],
			type:
				component.type ||
				component["Type"] ||
				component["type"] ||
				"PIPE",
			spec:
				component.spec ||
				component["Spec"] ||
				component["specification"] ||
				"",
			size: component.size || component["Size"] || "",
			material: component.material || component["Material"] || "",
			area: component.area || component["Area"] || "",
			system: component.system || component["System"] || "",
			testPackage:
				component.testPackage ||
				component["Test Package"] ||
				component["test_package"] ||
				"",
			drawingNumber:
				component.drawingNumber ||
				component["Drawing"] ||
				component["drawing_number"],
			workflowType: this.normalizeWorkflowType(
				component.workflowType ||
					component["Workflow Type"] ||
					"MILESTONE_DISCRETE",
			),
		};

		// Transform milestones if present
		if (component.milestones) {
			transformed.milestones = component.milestones.map((milestone) =>
				this.transformMilestone(milestone),
			);
		}

		return transformed;
	}

	/**
	 * Transform milestone data
	 */
	private transformMilestone(
		milestone: MilestoneImportData,
	): MilestoneImportData {
		return {
			name: milestone.name || milestone["Milestone"] || "",
			// Handle both field name variations
			completed: milestone.completed ?? milestone.isCompleted ?? false,
			isCompleted: milestone.completed ?? milestone.isCompleted ?? false,
			completedDate:
				milestone.completedDate || milestone["Completed Date"],
			weight: milestone.weight || milestone["Weight"],
			percentageValue:
				milestone.percentageValue || milestone["Percentage"],
			quantityValue: milestone.quantityValue || milestone["Quantity"],
			quantityUnit: milestone.quantityUnit || milestone["Unit"],
		};
	}

	/**
	 * Transform project data
	 */
	private transformProject(project: ProjectImportData): ProjectImportData {
		return {
			jobName: project.jobName || project.name || "",
			jobNumber: project.jobNumber || "",
			description: project.description || "",
			location: project.location || "",
			startDate: project.startDate || "",
			targetDate: project.targetDate || "",
		};
	}

	/**
	 * Transform drawing data
	 */
	private transformDrawing(drawing: DrawingImportData): DrawingImportData {
		return {
			number: drawing.number || drawing["Drawing Number"] || "",
			title:
				drawing.title || drawing.description || drawing["Title"] || "",
			revision: drawing.revision || drawing["Revision"] || "",
		};
	}

	/**
	 * Normalize workflow type to match enum values
	 */
	private normalizeWorkflowType(
		workflowType: string,
	): "MILESTONE_DISCRETE" | "MILESTONE_PERCENTAGE" | "MILESTONE_QUANTITY" {
		const normalized = workflowType.toUpperCase().replace(/\s+/g, "_");

		if (
			normalized.includes("DISCRETE") ||
			normalized.includes("CHECKBOX")
		) {
			return "MILESTONE_DISCRETE";
		}
		if (
			normalized.includes("PERCENTAGE") ||
			normalized.includes("PERCENT")
		) {
			return "MILESTONE_PERCENTAGE";
		}
		if (normalized.includes("QUANTITY") || normalized.includes("QTY")) {
			return "MILESTONE_QUANTITY";
		}

		return "MILESTONE_DISCRETE"; // Default
	}
}

// ========== Export Utilities ==========

export { PrismaClient, createId, logger };
