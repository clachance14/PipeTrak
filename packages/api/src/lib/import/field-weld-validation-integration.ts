/**
 * Integration example showing how FieldWeldValidator works with FieldWeldProcessor
 * This demonstrates the complete validation workflow for field weld imports
 */

import type { ValidationResult } from "../file-processing.js";
import type { ImportContext } from "./base-processor.js";
import { ValidationStage } from "./base-processor.js";
import { FieldWeldProcessor } from "./field-weld-processor.js";
import {
	createFieldWeldValidator,
	type FieldWeldValidationReport,
	type FieldWeldValidator,
} from "./field-weld-validator.js";

/**
 * Enhanced field weld import workflow with comprehensive validation
 */
export class EnhancedFieldWeldImportWorkflow {
	private processor: FieldWeldProcessor;
	private validator: FieldWeldValidator | null = null;

	constructor(private context: ImportContext) {
		this.processor = new FieldWeldProcessor(context);
	}

	/**
	 * Complete field weld import validation workflow
	 * 1. File format validation
	 * 2. Data parsing
	 * 3. Enhanced validation with business rules
	 * 4. Generate detailed report
	 */
	async validateFieldWeldImport(
		buffer: Buffer,
		filename: string,
		options?: {
			generateCsvReport?: boolean;
			strictMode?: boolean;
		},
	): Promise<{
		formatValidation: any;
		parsedData: any;
		validationReport: FieldWeldValidationReport;
		csvReport?: string;
		processingRecommendations: string[];
	}> {
		console.log(`Starting field weld validation for ${filename}`);
		const startTime = Date.now();

		// Step 1: Validate file format
		const formatValidation = await this.processor.validateFormat(
			buffer,
			filename,
		);

		if (!formatValidation.isValid) {
			throw new Error(
				`File format validation failed: ${formatValidation.errors.join(", ")}`,
			);
		}

		console.log(
			`✓ Format validation passed (${formatValidation.detectedFormat})`,
		);

		// Step 2: Parse file data
		const parsedData = await this.processor.parseFile(buffer, filename);
		console.log(`✓ Parsed ${parsedData.rows.length} rows from file`);

		// Step 3: Initialize enhanced validator
		this.validator = await createFieldWeldValidator(
			this.context.projectId,
			this.context.organizationId,
			this.context.userId,
			{
				maxRows: this.processor.options.maxRows,
				strictMode: options?.strictMode ?? true,
			},
		);

		// Step 4: Run comprehensive validation
		const validationReport = await this.validator.validateFieldWelds(
			parsedData.rows,
		);

		console.log(
			`✓ Validation completed: ${validationReport.summary.validRows}/${validationReport.summary.totalRows} valid rows`,
		);

		// Step 5: Generate recommendations
		const processingRecommendations =
			this.generateProcessingRecommendations(validationReport);

		// Step 6: Optional CSV export
		let csvReport: string | undefined;
		if (options?.generateCsvReport) {
			csvReport =
				await this.validator.exportValidationReport(validationReport);
			console.log("✓ CSV validation report generated");
		}

		const totalTime = Date.now() - startTime;
		console.log(`Field weld validation completed in ${totalTime}ms`);

		return {
			formatValidation,
			parsedData,
			validationReport,
			csvReport,
			processingRecommendations,
		};
	}

	/**
	 * Dry-run validation that checks data without committing
	 */
	async performDryRunValidation(
		buffer: Buffer,
		filename: string,
	): Promise<{
		canProceed: boolean;
		summary: string;
		criticalIssues: string[];
		warnings: string[];
		recommendations: string[];
	}> {
		const result = await this.validateFieldWeldImport(buffer, filename, {
			generateCsvReport: false,
			strictMode: false, // Less strict for dry run
		});

		const { validationReport } = result;

		const canProceed = validationReport.summary.errorCount === 0;
		const criticalIssues = validationReport.errors
			.map((error) => `Row ${error.row}: ${error.error}`)
			.slice(0, 10); // Limit to first 10 for display

		const warnings = validationReport.warnings
			.map((warning) => `Row ${warning.row}: ${warning.error}`)
			.slice(0, 10); // Limit to first 10 for display

		const summary = `
Validation Results for ${filename}:
- Total Records: ${validationReport.summary.totalRows}
- Valid Records: ${validationReport.summary.validRows}
- Records with Errors: ${validationReport.summary.errorCount > 0 ? validationReport.summary.invalidRows : 0}
- Warnings: ${validationReport.summary.warningCount}
- Import Ready: ${canProceed ? "YES" : "NO"}

${validationReport.duplicateWeldIds.length > 0 ? `Duplicate Weld IDs Found: ${validationReport.duplicateWeldIds.join(", ")}` : ""}
${validationReport.missingDrawings.length > 0 ? `Missing Drawings: ${validationReport.missingDrawings.slice(0, 5).join(", ")}${validationReport.missingDrawings.length > 5 ? "..." : ""}` : ""}
    `.trim();

		return {
			canProceed,
			summary,
			criticalIssues,
			warnings,
			recommendations: result.processingRecommendations,
		};
	}

	/**
	 * Process valid field welds for import (after validation passes)
	 */
	async processValidatedImport(
		validationReport: FieldWeldValidationReport,
	): Promise<any> {
		if (!validationReport.isValid) {
			throw new Error(
				"Cannot process import - validation failed. Fix errors first.",
			);
		}

		// Convert validation results to processor format
		const processorValidationResult: ValidationResult = {
			isValid: true,
			errors: [],
			warnings: validationReport.warnings,
			validRows: validationReport.validRows,
			invalidRows: [],
		};

		// Use the existing processor to handle the actual import
		const processedResult = await this.processor.processImport(
			processorValidationResult,
		);

		console.log(
			`✓ Processed ${processedResult.validRows.length} field welds for import`,
		);

		return processedResult;
	}

	/**
	 * Generate processing recommendations based on validation results
	 */
	private generateProcessingRecommendations(
		report: FieldWeldValidationReport,
	): string[] {
		const recommendations: string[] = [...report.recommendations];

		// Add performance recommendations
		if (report.summary.totalRows > 10000) {
			recommendations.push(
				"Large import detected - consider processing during off-peak hours",
			);
		}

		if (report.summary.warningCount > report.summary.totalRows * 0.1) {
			recommendations.push(
				"High number of warnings detected - review data quality before import",
			);
		}

		// Add data quality insights
		if (
			report.inheritanceApplied.testPressure >
			report.summary.totalRows * 0.5
		) {
			recommendations.push(
				"Many test pressures inherited from drawings - verify these are appropriate",
			);
		}

		if (
			report.inheritanceApplied.specCode >
			report.summary.totalRows * 0.3
		) {
			recommendations.push(
				"Significant spec code inheritance - ensure drawing specifications are current",
			);
		}

		return recommendations;
	}

	/**
	 * Generate validation summary for UI display
	 */
	generateValidationSummary(report: FieldWeldValidationReport): {
		status: "ready" | "warning" | "error";
		message: string;
		details: {
			total: number;
			valid: number;
			invalid: number;
			warnings: number;
		};
		nextSteps: string[];
	} {
		let status: "ready" | "warning" | "error";
		let message: string;

		if (report.summary.errorCount > 0) {
			status = "error";
			message = `${report.summary.errorCount} critical errors prevent import. Review and fix errors before proceeding.`;
		} else if (report.summary.warningCount > 0) {
			status = "warning";
			message = `${report.summary.validRows} records ready for import with ${report.summary.warningCount} warnings to review.`;
		} else {
			status = "ready";
			message = `All ${report.summary.validRows} field weld records validated successfully. Ready for import.`;
		}

		const nextSteps: string[] = [];

		if (status === "error") {
			nextSteps.push("Download validation report to identify errors");
			nextSteps.push("Fix data issues in source file");
			nextSteps.push("Re-upload corrected file");
		} else if (status === "warning") {
			nextSteps.push("Review warnings (optional)");
			nextSteps.push("Proceed with import if warnings are acceptable");
		} else {
			nextSteps.push("Proceed with field weld import");
		}

		return {
			status,
			message,
			details: {
				total: report.summary.totalRows,
				valid: report.summary.validRows,
				invalid: report.summary.invalidRows,
				warnings: report.summary.warningCount,
			},
			nextSteps,
		};
	}
}

/**
 * Utility function to validate field weld files quickly
 */
export async function quickValidateFieldWeldFile(
	buffer: Buffer,
	filename: string,
	context: ImportContext,
): Promise<{
	isValid: boolean;
	errorCount: number;
	warningCount: number;
	summary: string;
	recommendations: string[];
}> {
	const workflow = new EnhancedFieldWeldImportWorkflow(context);

	try {
		const result = await workflow.performDryRunValidation(buffer, filename);

		return {
			isValid: result.canProceed,
			errorCount: result.criticalIssues.length,
			warningCount: result.warnings.length,
			summary: result.summary,
			recommendations: result.recommendations,
		};
	} catch (error) {
		return {
			isValid: false,
			errorCount: 1,
			warningCount: 0,
			summary: `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			recommendations: ["Check file format and try again"],
		};
	}
}

/**
 * Example usage in API endpoint
 */
export async function exampleApiUsage(
	buffer: Buffer,
	filename: string,
	projectId: string,
	organizationId: string,
	userId: string,
) {
	// Create import context
	const context: ImportContext = {
		projectId,
		organizationId,
		userId,
		validationStage: ValidationStage.PREVIEW_VALIDATION,
		options: {
			maxRows: 20000,
			batchSize: 5000,
			strictMode: true,
		},
	};

	// Initialize workflow
	const workflow = new EnhancedFieldWeldImportWorkflow(context);

	// Step 1: Quick validation
	const quickCheck = await quickValidateFieldWeldFile(
		buffer,
		filename,
		context,
	);
	console.log("Quick validation:", quickCheck);

	if (!quickCheck.isValid) {
		return {
			success: false,
			error: "File validation failed",
			details: quickCheck,
		};
	}

	// Step 2: Full validation with report
	const validationResult = await workflow.validateFieldWeldImport(
		buffer,
		filename,
		{
			generateCsvReport: true,
			strictMode: true,
		},
	);

	// Step 3: Generate UI summary
	const uiSummary = workflow.generateValidationSummary(
		validationResult.validationReport,
	);

	// Step 4: Process if valid
	let importResult = null;
	if (validationResult.validationReport.isValid) {
		importResult = await workflow.processValidatedImport(
			validationResult.validationReport,
		);
	}

	return {
		success: validationResult.validationReport.isValid,
		validation: uiSummary,
		csvReport: validationResult.csvReport,
		importResult,
	};
}
