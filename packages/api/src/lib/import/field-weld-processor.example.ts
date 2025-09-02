/**
 * Example usage of the FieldWeldProcessor
 * This file demonstrates how to use the field weld import processor
 */

import { FieldWeldProcessor } from "./field-weld-processor.js";
import { type ImportContext, ValidationStage } from "./base-processor.js";

/**
 * Example: Process a WELD LOG Excel file
 */
export async function processWeldLogFile(
	fileBuffer: Buffer,
	filename: string,
	projectId: string,
	organizationId: string,
	userId: string,
): Promise<{
	success: boolean;
	data?: any;
	errors?: string[];
	summary?: any;
}> {
	// Step 1: Create import context
	const context: ImportContext = {
		projectId,
		organizationId,
		userId,
		validationStage: ValidationStage.PREVIEW_VALIDATION,
		options: {
			batchSize: 1000,
			maxRows: 20000,
			strictMode: true,
		},
	};

	// Step 2: Create processor instance
	const processor = new FieldWeldProcessor(context);

	try {
		// Step 3: Validate file format
		console.log("Validating file format...");
		const formatValidation = await processor.validateFormat(
			fileBuffer,
			filename,
		);

		if (!formatValidation.isValid) {
			return {
				success: false,
				errors: formatValidation.errors,
			};
		}

		console.log(`Detected format: ${formatValidation.detectedFormat}`);
		console.log("Metadata:", formatValidation.metadata);

		// Step 4: Parse the file
		console.log("Parsing file...");
		const parsedData = await processor.parseFile(fileBuffer, filename);

		console.log(
			`Parsed ${parsedData.rows.length} rows from ${parsedData.headers.length} columns`,
		);

		// Step 5: Validate the data
		console.log("Validating data...");
		const validationResult = await processor.validateData(parsedData);

		console.log("Validation result:");
		console.log(`- Valid rows: ${validationResult.validRows.length}`);
		console.log(`- Invalid rows: ${validationResult.invalidRows.length}`);
		console.log(`- Errors: ${validationResult.errors.length}`);
		console.log(`- Warnings: ${validationResult.warnings.length}`);

		// Step 6: Process for import (if validation successful)
		if (validationResult.isValid || validationResult.validRows.length > 0) {
			console.log("Processing import data...");
			const processedData =
				await processor.processImport(validationResult);

			return {
				success: true,
				data: processedData,
				summary: {
					totalRows: processedData.summary.totalRows,
					validRows: processedData.summary.validRows,
					invalidRows: processedData.summary.invalidRows,
					processingTime: processedData.summary.processingTime,
					detectedFormat: processedData.summary.detectedFormat,
				},
			};
		}
		return {
			success: false,
			errors: validationResult.errors.map(
				(e) => `Row ${e.row}: ${e.error}`,
			),
		};
	} catch (error) {
		console.error("Failed to process weld log file:", error);
		return {
			success: false,
			errors: [
				`Processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			],
		};
	}
}

/**
 * Example: Preview mode validation (lighter validation for UI preview)
 */
export async function previewWeldLogFile(
	fileBuffer: Buffer,
	filename: string,
): Promise<{
	isValidFormat: boolean;
	detectedFormat: string;
	totalRows: number;
	sampleData: any[];
	formatErrors: string[];
}> {
	const context: ImportContext = {
		projectId: "preview",
		organizationId: "preview",
		userId: "preview",
		validationStage: ValidationStage.FORMAT_CHECK,
		options: {
			maxRows: 50, // Only preview first 50 rows
			strictMode: false,
		},
	};

	const processor = new FieldWeldProcessor(context);

	try {
		// Quick format validation
		const formatValidation = await processor.validateFormat(
			fileBuffer,
			filename,
		);

		if (formatValidation.isValid) {
			// Parse a limited sample
			const parsedData = await processor.parseFile(fileBuffer, filename);

			return {
				isValidFormat: true,
				detectedFormat: formatValidation.detectedFormat,
				totalRows: formatValidation.metadata?.totalRows || 0,
				sampleData: parsedData.rows.slice(0, 10), // First 10 rows as sample
				formatErrors: [],
			};
		}
		return {
			isValidFormat: false,
			detectedFormat: formatValidation.detectedFormat,
			totalRows: 0,
			sampleData: [],
			formatErrors: formatValidation.errors,
		};
	} catch (error) {
		return {
			isValidFormat: false,
			detectedFormat: "UNKNOWN",
			totalRows: 0,
			sampleData: [],
			formatErrors: [
				`Preview failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			],
		};
	}
}

/**
 * Example: Full import validation (complete validation before database insert)
 */
export async function validateWeldLogForImport(
	fileBuffer: Buffer,
	filename: string,
	projectId: string,
	organizationId: string,
	userId: string,
): Promise<{
	isValid: boolean;
	validWeldCount: number;
	invalidWeldCount: number;
	errors: Array<{ row: number; field: string; error: string; value: any }>;
	warnings: Array<{ row: number; field: string; error: string; value: any }>;
	readyForImport: boolean;
}> {
	const context: ImportContext = {
		projectId,
		organizationId,
		userId,
		validationStage: ValidationStage.FULL_IMPORT_VALIDATION,
		options: {
			batchSize: 1000,
			maxRows: 20000,
			strictMode: true,
		},
	};

	const processor = new FieldWeldProcessor(context);

	try {
		// Full validation pipeline
		const formatValidation = await processor.validateFormat(
			fileBuffer,
			filename,
		);
		if (!formatValidation.isValid) {
			throw new Error(
				`Format validation failed: ${formatValidation.errors.join(", ")}`,
			);
		}

		const parsedData = await processor.parseFile(fileBuffer, filename);
		const validationResult = await processor.validateData(parsedData);

		return {
			isValid: validationResult.isValid,
			validWeldCount: validationResult.validRows.length,
			invalidWeldCount: validationResult.invalidRows.length,
			errors: validationResult.errors,
			warnings: validationResult.warnings,
			readyForImport: validationResult.validRows.length > 0,
		};
	} catch (error) {
		return {
			isValid: false,
			validWeldCount: 0,
			invalidWeldCount: 0,
			errors: [
				{
					row: 0,
					field: "general",
					error: `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
					value: null,
				},
			],
			warnings: [],
			readyForImport: false,
		};
	}
}

/**
 * Example column mapping for WELD LOG format
 * This shows how the processor maps Excel columns to field names
 */
export const WELD_LOG_COLUMN_REFERENCE = {
	A: {
		field: "weldIdNumber",
		required: true,
		description: "Unique weld identifier",
	},
	B: {
		field: "welderStencil",
		required: false,
		description: "Welder identification stencil",
	},
	C: { field: null, required: false, description: "Unused column" },
	D: {
		field: "drawingNumber",
		required: true,
		description: "Drawing or isometric number",
	},
	E: { field: null, required: false, description: "Unused column" },
	F: {
		field: "testPackageNumber",
		required: false,
		description: "Test package identifier",
	},
	G: {
		field: "testPressure",
		required: false,
		description: "Test pressure (PSI), inherits from drawing if empty",
	},
	H: { field: null, required: false, description: "Unused column" },
	I: { field: null, required: false, description: "Unused column" },
	J: {
		field: "specCode",
		required: false,
		description: "Specification code, inherits from drawing if empty",
	},
	"K-Q": { field: null, required: false, description: "Unused columns" },
	R: {
		field: "pmiRequired",
		required: false,
		description:
			"PMI (Positive Material Identification) required (boolean)",
	},
	S: {
		field: "pwhtRequired",
		required: false,
		description: "PWHT (Post Weld Heat Treatment) required (boolean)",
	},
	"T-X": { field: null, required: false, description: "Unused columns" },
	Y: {
		field: "pmiCompleteDate",
		required: false,
		description: "PMI completion date",
	},
	Z: { field: null, required: false, description: "Unused column" },
	AA: {
		field: "comments",
		required: false,
		description: "Additional comments or notes",
	},
} as const;
