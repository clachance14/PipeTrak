import { z } from "zod";
import {
	BaseImportProcessor,
	type FormatValidationResult,
	type ParsedFileData,
	type ProcessedImportData,
	ValidationStage,
	FileValidator,
} from "./base-processor.js";
import type { ValidationError, ValidationResult } from "../file-processing.js";

/**
 * Field weld import data schema for WELD LOG.xlsx format
 * Columns A through Z plus AA (27 total columns)
 */
export const FieldWeldImportSchema = z.object({
	// Required fields
	weldIdNumber: z.string().min(1, "Weld ID Number is required"), // Column A
	drawingNumber: z.string().min(1, "Drawing Number is required"), // Column D

	// Optional standard fields
	welderStencil: z.string().optional(), // Column B
	testPackageNumber: z.string().optional(), // Column F
	testPressure: z.union([z.number(), z.string()]).optional(), // Column G
	specCode: z.string().optional(), // Column J

	// Boolean fields (R, S) - accept Yes/No, True/False, 1/0, X, or blank
	pmiRequired: z
		.union([z.boolean(), z.string(), z.number()])
		.optional()
		.transform((val) => {
			if (val === null || val === undefined) return undefined;
			if (typeof val === "boolean") return val;
			if (typeof val === "number") return val === 1;
			if (typeof val === "string") {
				const lower = val.toLowerCase().trim();
				return (
					lower === "true" ||
					lower === "yes" ||
					lower === "1" ||
					lower === "x"
				);
			}
			return undefined;
		}), // Column R

	pwhtRequired: z
		.union([z.boolean(), z.string(), z.number()])
		.optional()
		.transform((val) => {
			if (val === null || val === undefined) return undefined;
			if (typeof val === "boolean") return val;
			if (typeof val === "number") return val === 1;
			if (typeof val === "string") {
				const lower = val.toLowerCase().trim();
				return (
					lower === "true" ||
					lower === "yes" ||
					lower === "1" ||
					lower === "x"
				);
			}
			return undefined;
		}), // Column S

	// Date field (Y) - handle Excel date numbers and various formats
	pmiCompleteDate: z
		.union([z.date(), z.string(), z.number()])
		.optional()
		.transform((val) => {
			if (val === null || val === undefined) return undefined;
			if (val instanceof Date) return val;

			// Handle Excel date numbers (days since 1900-01-01)
			if (typeof val === "number" && val > 0 && val < 100000) {
				const excelEpoch = new Date(1900, 0, 1);
				const date = new Date(
					excelEpoch.getTime() + (val - 1) * 24 * 60 * 60 * 1000,
				);
				return isNaN(date.getTime()) ? undefined : date;
			}

			// Handle string dates
			if (typeof val === "string" && val.trim() !== "") {
				const date = new Date(val);
				return isNaN(date.getTime()) ? undefined : date;
			}

			return undefined;
		}), // Column Y

	comments: z.string().optional(), // Column AA

	// Additional fields that might be present in sparse data (commonly used columns)
	// These represent typical WELD LOG columns that might contain data
	weldSize: z.string().optional(), // Common field for weld dimensions
	xrayPercentage: z.string().optional(), // Common field for inspection percentage
	weldType: z.string().optional(), // Common field for weld classification
});

export type FieldWeldImportData = z.infer<typeof FieldWeldImportSchema>;

/**
 * Enhanced column mapping for WELD LOG format
 * Maps Excel column letters to field names
 * Based on real WELD LOG.xlsx analysis:
 * - Column A: "Weld ID Number" (required)
 * - Column D: "Drawing / Isometric Number" (required)
 * - Column F: "Package Number"
 * - Column G: "Test Pressure"
 * - Column J: "SPEC"
 * - Columns R,S: Boolean fields for PMI/PWHT
 * - Column Y: "PMI Date"
 * - Column AA: Comments
 */
const WELD_LOG_COLUMN_MAPPING = {
	A: "weldIdNumber", // "Weld ID Number" - REQUIRED
	B: "welderStencil", // "Welder Stencil"
	C: "", // Often empty or misc data
	D: "drawingNumber", // "Drawing / Isometric Number" - REQUIRED
	E: "", // Often empty
	F: "testPackageNumber", // "Package Number"
	G: "testPressure", // "Test Pressure"
	H: "", // Often empty
	I: "weldSize", // Common: weld size (1", 3", etc)
	J: "specCode", // "SPEC" (HC05, etc)
	K: "",
	L: "",
	M: "",
	N: "",
	O: "",
	P: "",
	Q: "", // Variable usage
	R: "pmiRequired", // Boolean field
	S: "pwhtRequired", // Boolean field
	T: "xrayPercentage", // Common: X-ray percentage (5%, 10%, etc)
	U: "weldType", // Common: weld type classification
	V: "",
	W: "",
	X: "", // Variable usage
	Y: "pmiCompleteDate", // "PMI Date" - Date field
	Z: "", // Often empty
	AA: "comments", // Comments/Notes
} as const;

/**
 * Drawing inheritance data cache
 */
interface DrawingInheritanceData {
	drawingNumber: string;
	testPressure?: string | number;
	specCode?: string;
}

/**
 * Field weld specific import processor
 */
export class FieldWeldProcessor extends BaseImportProcessor<FieldWeldImportData> {
	private drawingInheritanceCache = new Map<string, DrawingInheritanceData>();

	/**
	 * Validate that the file is a WELD LOG format
	 * Enhanced to handle up to 20,000 rows efficiently with improved column detection
	 */
	async validateFormat(
		buffer: Buffer,
		filename: string,
	): Promise<FormatValidationResult> {
		// First validate basic file constraints
		const fileValidation = FileValidator.validateFile(buffer, filename);
		if (!fileValidation.isValid) {
			return {
				isValid: false,
				detectedFormat: "UNKNOWN",
				errors: fileValidation.errors,
			};
		}

		try {
			const { headers, rows } = await this.parseExcelFile(buffer);

			const errors: string[] = [];
			const requiredColumnsFound: string[] = [];
			const missingColumns: string[] = [];

			// Enhanced WELD LOG format signature detection
			// Column A should contain "Weld ID Number" or similar variations
			const a1Header = headers[0]?.toLowerCase().trim() || "";
			const expectedA1Variations = [
				"weld id number",
				"weld id",
				"weldidnumber",
				"weld number",
				"id number",
				"weld no",
				"weld #",
			];

			const hasWeldIdHeader = expectedA1Variations.some(
				(variation) =>
					a1Header.includes(variation) ||
					variation.includes(a1Header),
			);

			if (!hasWeldIdHeader) {
				errors.push(
					`Column A header "${headers[0] || "empty"}" does not match expected "Weld ID Number". Found variations: ${expectedA1Variations.join(", ")}`,
				);
			} else {
				requiredColumnsFound.push("Weld ID Number (Column A)");
			}

			// Enhanced Drawing Number detection in column D
			const d1Header = headers[3]?.toLowerCase().trim() || "";
			const expectedD1Variations = [
				"drawing number",
				"drawing / isometric number",
				"drawing/isometric number",
				"drawing",
				"dwg number",
				"dwg no",
				"dwg",
				"isometric",
				"iso number",
			];

			const hasDrawingHeader = expectedD1Variations.some(
				(variation) =>
					d1Header.includes(variation) ||
					variation.includes(d1Header),
			);

			if (!hasDrawingHeader) {
				errors.push(
					`Column D header "${headers[3] || "empty"}" does not match expected "Drawing Number". Found variations: ${expectedD1Variations.join(", ")}`,
				);
				missingColumns.push("Drawing Number (Column D)");
			} else {
				requiredColumnsFound.push("Drawing Number (Column D)");
			}

			// Validate we have sufficient columns for WELD LOG format (A-AA = 27 columns)
			if (headers.length < 15) {
				errors.push(
					`Insufficient columns detected (${headers.length}). WELD LOG format should have columns A through AA (27 columns minimum).`,
				);
			}

			// Check for data rows within limits
			if (rows.length === 0) {
				errors.push("No data rows found in file");
			} else if (rows.length > this.options.maxRows!) {
				errors.push(
					`File contains ${rows.length} rows, exceeding maximum of ${this.options.maxRows!} rows`,
				);
			}

			// Additional format validation: check for typical WELD LOG data patterns
			if (rows.length > 0) {
				const firstDataRow = rows[0];
				const weldIdValue = firstDataRow[headers[0]];
				const drawingValue = firstDataRow[headers[3]];

				// Validate weld ID looks reasonable (numbers, alphanumeric)
				if (weldIdValue && typeof weldIdValue === "string") {
					if (!/^[A-Za-z0-9._-]+$/.test(weldIdValue.toString())) {
						errors.push(
							`First weld ID "${weldIdValue}" contains unexpected characters. Expected alphanumeric format.`,
						);
					}
				}

				// Validate drawing number looks reasonable
				if (drawingValue && typeof drawingValue === "string") {
					if (drawingValue.length > 50) {
						errors.push(
							`Drawing number "${drawingValue}" is unusually long (${drawingValue.length} characters).`,
						);
					}
				}
			}

			const isWeldLogFormat =
				hasWeldIdHeader && hasDrawingHeader && errors.length === 0;

			return {
				isValid: isWeldLogFormat,
				detectedFormat: isWeldLogFormat ? "WELD_LOG" : "UNKNOWN",
				errors,
				metadata: {
					totalRows: rows.length,
					totalColumns: headers.length,
					requiredColumnsFound,
					missingColumns,
				},
			};
		} catch (error) {
			return {
				isValid: false,
				detectedFormat: "UNKNOWN",
				errors: [
					`Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown error"}`,
				],
			};
		}
	}

	/**
	 * Parse WELD LOG Excel file with enhanced mapping and efficiency for up to 20k rows
	 * Handles sparse data efficiently and maps all 27 columns (A-Z, AA)
	 */
	async parseFile(buffer: Buffer, filename: string): Promise<ParsedFileData> {
		const { headers, rows, metadata } = await this.parseExcelFile(buffer);

		// Enhanced mapping with batching for large datasets
		const batchSize = 5000; // Process in chunks to handle 20k rows efficiently
		const mappedRows: any[] = [];

		// Process rows in batches to handle large files efficiently
		for (
			let batchStart = 0;
			batchStart < rows.length;
			batchStart += batchSize
		) {
			const batchEnd = Math.min(batchStart + batchSize, rows.length);
			const batchRows = rows.slice(batchStart, batchEnd);

			const mappedBatch = batchRows.map((row, batchIndex) => {
				const index = batchStart + batchIndex;
				const mappedRow: any = {};

				// Map all 27 columns (A-Z, AA) based on position
				for (
					let colIndex = 0;
					colIndex < Math.min(headers.length, 27);
					colIndex++
				) {
					const columnLetter = this.getColumnLetter(colIndex);
					const fieldName =
						WELD_LOG_COLUMN_MAPPING[
							columnLetter as keyof typeof WELD_LOG_COLUMN_MAPPING
						];

					if (fieldName) {
						const header = headers[colIndex];
						const value = row[header];

						// Only include non-empty values to handle sparse data efficiently
						if (
							value !== null &&
							value !== undefined &&
							value !== ""
						) {
							mappedRow[fieldName] = value;
						}
					}
				}

				// Add essential metadata for validation and processing
				mappedRow._rowIndex = index + 2; // Excel row number (1-indexed + header)
				mappedRow._originalRow = row;
				mappedRow._columnMapping = {}; // Store which columns had data

				// Record which original columns contained data (for debugging/validation)
				for (
					let colIndex = 0;
					colIndex < Math.min(headers.length, 27);
					colIndex++
				) {
					const columnLetter = this.getColumnLetter(colIndex);
					const header = headers[colIndex];
					if (
						row[header] !== null &&
						row[header] !== undefined &&
						row[header] !== ""
					) {
						mappedRow._columnMapping[columnLetter] = header;
					}
				}

				return mappedRow;
			});

			mappedRows.push(...mappedBatch);
		}

		return {
			headers: headers.slice(0, 27), // Limit to 27 columns for consistent processing
			rows: mappedRows,
			metadata: {
				...metadata,
				filename,
			},
			detectedFormat: "WELD_LOG",
		};
	}

	/**
	 * Validate field weld data
	 */
	async validateData(parsedData: ParsedFileData): Promise<ValidationResult> {
		const errors: ValidationError[] = [];
		const warnings: ValidationError[] = [];
		const validRows: FieldWeldImportData[] = [];
		const invalidRows: any[] = [];

		// Load drawing inheritance data for the project
		await this.loadDrawingInheritanceData();

		for (let i = 0; i < parsedData.rows.length; i++) {
			const row = parsedData.rows[i];
			const rowErrors: ValidationError[] = [];
			const rowWarnings: ValidationError[] = [];

			try {
				// Apply drawing inheritance before validation
				const enrichedRow = await this.applyDrawingInheritance(row);

				// Validate against schema
				const validatedData = FieldWeldImportSchema.parse(enrichedRow);

				// Additional business rule validations
				await this.validateBusinessRules(
					validatedData,
					row._rowIndex,
					rowErrors,
					rowWarnings,
				);

				if (rowErrors.length === 0) {
					validRows.push(validatedData);
				} else {
					invalidRows.push({ ...row, _errors: rowErrors });
					errors.push(...rowErrors);
				}

				warnings.push(...rowWarnings);
			} catch (error) {
				if (error instanceof z.ZodError) {
					const zodErrors = error.errors.map((err) => ({
						row: row._rowIndex,
						field: err.path.join("."),
						error: err.message,
						value: err.path.reduce((obj, key) => obj?.[key], row),
					}));

					rowErrors.push(...zodErrors);
					errors.push(...zodErrors);
					invalidRows.push({ ...row, _errors: rowErrors });
				} else {
					const generalError = {
						row: row._rowIndex,
						field: "general",
						error: `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
						value: row,
					};
					errors.push(generalError);
					invalidRows.push({ ...row, _errors: [generalError] });
				}
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
			validRows,
			invalidRows,
		};
	}

	/**
	 * Process validated field weld data for import
	 */
	async processImport(
		validatedData: ValidationResult,
	): Promise<ProcessedImportData> {
		const startTime = Date.now();
		const { validRows, invalidRows, errors, warnings } = validatedData;

		// For field welds, each row becomes a separate component
		// No instance calculation needed as each weld is unique

		// Transform to component format expected by the database
		const processedRows = validRows.map(
			(row: FieldWeldImportData, index: number) => ({
				// Core component fields
				componentId: row.weldIdNumber,
				type: "FIELD_WELD",
				workflowType: "MILESTONE_QUANTITY" as const,
				drawingId: row.drawingNumber,

				// Field weld specific fields
				welderStencil: row.welderStencil,
				testPackageNumber: row.testPackageNumber,
				testPressure: this.normalizeNumericValue(row.testPressure),
				specCode: row.specCode,
				pmiRequired: row.pmiRequired,
				pwhtRequired: row.pwhtRequired,
				pmiCompleteDate: row.pmiCompleteDate,
				comments: row.comments,

				// Metadata
				instanceNumber: 1,
				totalInstancesOnDrawing: 1,
				displayId: row.weldIdNumber,

				// Standard fields
				totalQuantity: 1,
				quantityUnit: "EA",
				status: "NOT_STARTED",
				completionPercent: 0,

				// Processing metadata
				_importIndex: index,
				_processingStage: this.context.validationStage,
			}),
		);

		const summary = this.createSummary(
			validRows.length + invalidRows.length,
			processedRows.length,
			invalidRows.length,
			"WELD_LOG",
			startTime,
		);

		return {
			validRows: processedRows,
			invalidRows,
			errors,
			warnings,
			summary,
		};
	}

	/**
	 * Get validation schema
	 */
	getValidationSchema(): z.ZodType<FieldWeldImportData, any, any> {
		return FieldWeldImportSchema;
	}

	/**
	 * Apply drawing inheritance for test pressure and spec code
	 */
	private async applyDrawingInheritance(row: any): Promise<any> {
		const enrichedRow = { ...row };

		if (enrichedRow.drawingNumber) {
			const inheritanceData = this.drawingInheritanceCache.get(
				enrichedRow.drawingNumber,
			);

			if (inheritanceData) {
				// Inherit test pressure if empty
				if (!enrichedRow.testPressure && inheritanceData.testPressure) {
					enrichedRow.testPressure = inheritanceData.testPressure;
					enrichedRow._inheritedTestPressure = true;
				}

				// Inherit spec code if empty
				if (!enrichedRow.specCode && inheritanceData.specCode) {
					enrichedRow.specCode = inheritanceData.specCode;
					enrichedRow._inheritedSpecCode = true;
				}
			}
		}

		return enrichedRow;
	}

	/**
	 * Load drawing inheritance data from database
	 * Enhanced to validate drawing numbers exist and provide inheritance for test pressure/spec
	 */
	private async loadDrawingInheritanceData(): Promise<void> {
		try {
			// TODO: Implement Supabase query to load drawings with test pressure and spec code
			// Example query structure:
			// const { data: drawings, error } = await this.supabaseClient
			//   .from('drawings')
			//   .select('drawing_number, test_pressure, spec_code')
			//   .eq('project_id', this.context.projectId);

			// if (error) {
			//   throw new Error(`Failed to load drawing data: ${error.message}`);
			// }

			// // Populate inheritance cache
			// drawings?.forEach(drawing => {
			//   this.drawingInheritanceCache.set(drawing.drawing_number, {
			//     drawingNumber: drawing.drawing_number,
			//     testPressure: drawing.test_pressure,
			//     specCode: drawing.spec_code
			//   });
			// });

			// For now, create a minimal cache for testing
			// In production, this will be populated from the database
			this.drawingInheritanceCache.clear();

			console.log(
				`Field weld processor: Loaded ${this.drawingInheritanceCache.size} drawing inheritance records for project ${this.context.projectId}`,
			);
		} catch (error) {
			console.error("Failed to load drawing inheritance data:", error);
			// Don't throw - inheritance is optional, validation will catch missing drawings
		}
	}

	/**
	 * Enhanced business rule validations with drawing number verification
	 */
	private async validateBusinessRules(
		data: FieldWeldImportData,
		rowNumber: number,
		errors: ValidationError[],
		warnings: ValidationError[],
	): Promise<void> {
		// Validate weld ID format - sequential numbers (1,2,3...) or alphanumeric
		if (data.weldIdNumber) {
			const weldId = data.weldIdNumber.toString().trim();

			// Check for reasonable weld ID format
			if (weldId.length === 0) {
				errors.push({
					row: rowNumber,
					field: "weldIdNumber",
					error: "Weld ID cannot be empty",
					value: data.weldIdNumber,
				});
			} else if (weldId.length > 50) {
				warnings.push({
					row: rowNumber,
					field: "weldIdNumber",
					error: "Weld ID is unusually long (>50 characters)",
					value: data.weldIdNumber,
				});
			}

			// Allow sequential numbers (1,2,3) or alphanumeric with common separators
			if (!/^[A-Za-z0-9._-]+$/.test(weldId)) {
				warnings.push({
					row: rowNumber,
					field: "weldIdNumber",
					error: "Weld ID contains special characters that may cause issues",
					value: data.weldIdNumber,
				});
			}
		}

		// Validate drawing number format and existence
		if (data.drawingNumber) {
			const drawingNum = data.drawingNumber.toString().trim();

			// Check format - should look like "P-26B07 01of01" or similar
			if (drawingNum.length === 0) {
				errors.push({
					row: rowNumber,
					field: "drawingNumber",
					error: "Drawing number cannot be empty",
					value: data.drawingNumber,
				});
			} else if (drawingNum.length > 100) {
				warnings.push({
					row: rowNumber,
					field: "drawingNumber",
					error: "Drawing number is unusually long (>100 characters)",
					value: data.drawingNumber,
				});
			}

			// TODO: Validate drawing exists in database when inheritance cache is populated
			// if (!this.drawingInheritanceCache.has(drawingNum)) {
			//   warnings.push({
			//     row: rowNumber,
			//     field: 'drawingNumber',
			//     error: 'Drawing number not found in project database',
			//     value: data.drawingNumber
			//   });
			// }
		}

		// Validate welder stencil format if provided
		if (data.welderStencil && data.welderStencil.length > 15) {
			warnings.push({
				row: rowNumber,
				field: "welderStencil",
				error: "Welder stencil is unusually long (>15 characters)",
				value: data.welderStencil,
			});
		}

		// Enhanced test pressure validation
		if (data.testPressure) {
			const pressure = this.normalizeNumericValue(data.testPressure);
			if (pressure !== null) {
				if (pressure < 0) {
					errors.push({
						row: rowNumber,
						field: "testPressure",
						error: "Test pressure cannot be negative",
						value: data.testPressure,
					});
				} else if (pressure > 15000) {
					warnings.push({
						row: rowNumber,
						field: "testPressure",
						error: "Test pressure seems unusually high (>15,000 PSI)",
						value: data.testPressure,
					});
				} else if (pressure > 10000) {
					warnings.push({
						row: rowNumber,
						field: "testPressure",
						error: "Test pressure is outside typical range (>10,000 PSI)",
						value: data.testPressure,
					});
				}
			}
		}

		// Validate spec code format if provided (HC05, etc)
		if (data.specCode) {
			const spec = data.specCode.toString().trim();
			if (spec.length > 20) {
				warnings.push({
					row: rowNumber,
					field: "specCode",
					error: "Spec code is unusually long (>20 characters)",
					value: data.specCode,
				});
			}
		}

		// Validate PMI complete date is reasonable if provided
		if (data.pmiCompleteDate) {
			const pmiDate = data.pmiCompleteDate;
			const now = new Date();
			const oneYearAgo = new Date(
				now.getFullYear() - 1,
				now.getMonth(),
				now.getDate(),
			);
			const oneYearFuture = new Date(
				now.getFullYear() + 1,
				now.getMonth(),
				now.getDate(),
			);

			if (pmiDate > oneYearFuture) {
				warnings.push({
					row: rowNumber,
					field: "pmiCompleteDate",
					error: "PMI complete date is more than 1 year in the future",
					value: data.pmiCompleteDate,
				});
			} else if (pmiDate < oneYearAgo) {
				warnings.push({
					row: rowNumber,
					field: "pmiCompleteDate",
					error: "PMI complete date is more than 1 year in the past",
					value: data.pmiCompleteDate,
				});
			}
		}

		// Validate additional fields if present
		if (data.weldSize && data.weldSize.length > 20) {
			warnings.push({
				row: rowNumber,
				field: "weldSize",
				error: "Weld size description is unusually long",
				value: data.weldSize,
			});
		}

		if (data.xrayPercentage) {
			const xrayStr = data.xrayPercentage.toString().toLowerCase();
			if (!xrayStr.includes("%") && !xrayStr.match(/^\d+$/)) {
				warnings.push({
					row: rowNumber,
					field: "xrayPercentage",
					error: "X-ray percentage should be a number or include % symbol",
					value: data.xrayPercentage,
				});
			}
		}

		// Enhanced validation for full import stage
		if (
			this.context.validationStage ===
			ValidationStage.FULL_IMPORT_VALIDATION
		) {
			// Stricter requirements for production import
			if (!data.testPackageNumber) {
				warnings.push({
					row: rowNumber,
					field: "testPackageNumber",
					error: "Test package number is recommended for field welds",
					value: data.testPackageNumber,
				});
			}

			if (!data.specCode) {
				warnings.push({
					row: rowNumber,
					field: "specCode",
					error: "Spec code is recommended for field welds",
					value: data.specCode,
				});
			}
		}
	}

	/**
	 * Convert column index to Excel column letter(s)
	 * Enhanced to handle A-Z plus AA (27 columns total)
	 */
	private getColumnLetter(index: number): string {
		if (index < 0) {
			throw new Error(`Column index ${index} is negative`);
		}
		if (index < 26) {
			return String.fromCharCode(65 + index); // A-Z
		}
		if (index === 26) {
			return "AA"; // Column AA
		}

		// For future extension beyond AA if needed (AB, AC, etc.)
		throw new Error(
			`Column index ${index} exceeds supported range (A-AA, 0-26)`,
		);
	}

	/**
	 * Enhanced numeric value normalization for WELD LOG data
	 * Handles Excel numbers, strings with units, percentages, etc.
	 */
	private normalizeNumericValue(value: any): number | null {
		if (value === null || value === undefined) {
			return null;
		}

		if (typeof value === "number") {
			return isNaN(value) ? null : value;
		}

		if (typeof value === "string") {
			const trimmed = value.trim();
			if (trimmed === "") return null;

			// Handle common formats in WELD LOG:
			// "150 PSI", "150psi", "150", "5%", "1"" (weld size), "3"" (weld size)

			// First, try to extract numeric part from complex formats
			let numericPart = trimmed;

			// Handle percentage values (5% -> 5)
			if (trimmed.includes("%")) {
				numericPart = trimmed.replace("%", "").trim();
			}

			// Handle pressure units (150 PSI -> 150, 150psi -> 150)
			if (/psi|bar|kpa/i.test(trimmed)) {
				numericPart = trimmed
					.replace(/\s*(psi|bar|kpa)\s*/gi, "")
					.trim();
			}

			// Handle weld size formats (1" -> 1, 3" -> 3)
			if (trimmed.includes('"')) {
				numericPart = trimmed.replace('"', "").trim();
			}

			// Extract numeric value (allowing decimal points and negative numbers)
			const matches = numericPart.match(/^-?\d*\.?\d+/);
			if (matches) {
				const parsed = Number.parseFloat(matches[0]);
				return isNaN(parsed) ? null : parsed;
			}
		}

		return null;
	}

	/**
	 * Create validation summary for parsed field weld data
	 */
	private _createValidationSummary(validatedData: ValidationResult): {
		validationSummary: string;
		recommendedActions: string[];
	} {
		const { validRows, invalidRows, errors, warnings } = validatedData;
		const totalRows = validRows.length + invalidRows.length;

		const summary = [
			`Processed ${totalRows} field weld records`,
			`✓ ${validRows.length} valid records`,
			`✗ ${invalidRows.length} invalid records`,
			`⚠ ${warnings.length} warnings`,
		].join("\n");

		const actions: string[] = [];

		if (invalidRows.length > 0) {
			actions.push("Review and fix invalid records before import");
		}

		if (warnings.length > 0) {
			actions.push("Review warnings for data quality improvements");
		}

		// Specific recommendations based on error patterns
		const missingDrawings = errors.filter(
			(e) => e.field === "drawingNumber",
		).length;
		if (missingDrawings > 0) {
			actions.push(
				`Verify ${missingDrawings} drawing numbers exist in project`,
			);
		}

		const invalidWeldIds = errors.filter(
			(e) => e.field === "weldIdNumber",
		).length;
		if (invalidWeldIds > 0) {
			actions.push(`Fix ${invalidWeldIds} invalid weld ID formats`);
		}

		return {
			validationSummary: summary,
			recommendedActions: actions,
		};
	}
}
