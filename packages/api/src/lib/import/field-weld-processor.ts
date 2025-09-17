import { z } from "zod";
import type { ValidationError, ValidationResult } from "../file-processing";
import {
	BaseImportProcessor,
	FileValidator,
	type FormatValidationResult,
	type ParsedFileData,
	type ProcessedImportData,
} from "./base-processor";
import {
	autoDetectColumns,
	validateDetectionResult,
	type ColumnDetectionResult,
	type ColumnMappings,
} from "./field-weld-column-detector";

/**
 * Enhanced Field weld import data schema - flexible for any column layout
 * Focus on essential fields with intelligent data parsing
 */
export const FieldWeldImportSchema = z.object({
	// Essential fields (must be present)
	weldIdNumber: z.string().min(1, "Weld ID Number is required"),
	drawingNumber: z.string().min(1, "Drawing Number is required"),

	// High priority fields (commonly needed for complete weld data)
	specCode: z.string().optional(),
	xrayPercentage: z
		.union([z.string(), z.number()])
		.optional()
		.transform((val) => {
			if (val === null || val === undefined) return undefined;
			if (typeof val === "number") return val.toString();
			if (typeof val === "string") {
				// Clean percentage strings: "5%", "0.05", "5", etc.
				const cleaned = val.trim().replace(/%/g, "");
				const num = Number.parseFloat(cleaned);
				return Number.isNaN(num) ? val : num.toString();
			}
			return String(val);
		}),
	weldSize: z.string().optional(),
	schedule: z.string().optional(),
	weldType: z.string().optional(),
	baseMetal: z.string().optional(),

	// Optional standard fields
	welderStencil: z.string().optional(),
	testPackageNumber: z.string().optional(),
	testPressure: z
		.union([z.number(), z.string()])
		.optional()
		.transform((val) => {
			if (val === null || val === undefined) return undefined;
			if (typeof val === "number") return val;
			if (typeof val === "string") {
				// Handle formats like "150 PSI", "150psi", "150"
				const cleaned = val
					.trim()
					.replace(/\s*(psi|bar|kpa|psig)\s*/gi, "");
				const num = Number.parseFloat(cleaned);
				return Number.isNaN(num) ? undefined : num;
			}
			return undefined;
		}),

	// Boolean fields - flexible parsing
	pmiRequired: z
		.union([z.boolean(), z.string(), z.number()])
		.optional()
		.transform((val) => {
			if (val === null || val === undefined) return undefined;
			if (typeof val === "boolean") return val;
			if (typeof val === "number") return val === 1;
			if (typeof val === "string") {
				const lower = val.toLowerCase().trim();
				if (
					lower === "true" ||
					lower === "yes" ||
					lower === "1" ||
					lower === "x" ||
					lower === "required"
				) {
					return true;
				}
				if (
					lower === "false" ||
					lower === "no" ||
					lower === "0" ||
					lower === "" ||
					lower === "not required"
				) {
					return false;
				}
			}
			return undefined;
		}),

	pwhtRequired: z
		.union([z.boolean(), z.string(), z.number()])
		.optional()
		.transform((val) => {
			if (val === null || val === undefined) return undefined;
			if (typeof val === "boolean") return val;
			if (typeof val === "number") return val === 1;
			if (typeof val === "string") {
				const lower = val.toLowerCase().trim();
				if (
					lower === "true" ||
					lower === "yes" ||
					lower === "1" ||
					lower === "x" ||
					lower === "required"
				) {
					return true;
				}
				if (
					lower === "false" ||
					lower === "no" ||
					lower === "0" ||
					lower === "" ||
					lower === "not required"
				) {
					return false;
				}
			}
			return undefined;
		}),

	// Date fields - enhanced Excel date handling
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
				return Number.isNaN(date.getTime()) ? undefined : date;
			}

			// Handle string dates
			if (typeof val === "string" && val.trim() !== "") {
				const date = new Date(val);
				return Number.isNaN(date.getTime()) ? undefined : date;
			}

			return undefined;
		}),

	dateWelded: z
		.union([z.date(), z.string(), z.number()])
		.optional()
		.transform((val) => {
			if (val === null || val === undefined) return undefined;
			if (val instanceof Date) return val;

			// Handle Excel date numbers
			if (typeof val === "number" && val > 0 && val < 100000) {
				const excelEpoch = new Date(1900, 0, 1);
				const date = new Date(
					excelEpoch.getTime() + (val - 1) * 24 * 60 * 60 * 1000,
				);
				return Number.isNaN(date.getTime()) ? undefined : date;
			}

			// Handle string dates
			if (typeof val === "string" && val.trim() !== "") {
				const date = new Date(val);
				return Number.isNaN(date.getTime()) ? undefined : date;
			}

			return undefined;
		}),

	comments: z.string().optional(),
});

export type FieldWeldImportData = z.infer<typeof FieldWeldImportSchema>;

/**
 * Enhanced field weld processor with intelligent column detection
 * No longer relies on fixed column positions - adapts to any Excel layout
 */
export class FieldWeldProcessor extends BaseImportProcessor<FieldWeldImportData> {
	private columnMappings: ColumnMappings | null = null;
	private detectionResult: ColumnDetectionResult | null = null;

	/**
	 * Intelligent format validation - detects WELD LOG based on content, not position
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

			// Use intelligent column detection
			const detectionResult = autoDetectColumns(headers);
			this.detectionResult = detectionResult;

			// Validate detection results
			const validationResult = validateDetectionResult(detectionResult);

			if (!validationResult.canProceed) {
				errors.push(validationResult.message);
				if (validationResult.recommendations.length > 0) {
					errors.push(
						`Recommendations: ${validationResult.recommendations.join(", ")}`,
					);
				}
			}

			// Check for data rows within limits
			if (rows.length === 0) {
				errors.push("No data rows found in file");
			} else if (
				this.options.maxRows &&
				rows.length > this.options.maxRows
			) {
				errors.push(
					`File contains ${rows.length} rows, exceeding maximum of ${this.options.maxRows} rows`,
				);
			}

			// Additional validation: check that essential fields have reasonable data
			if (rows.length > 0 && detectionResult.hasEssentials) {
				const firstDataRow = rows[0];

				// Check weld ID field
				const weldIdColumnIndex = Object.entries(detectionResult.mappings)
					.find(([_, field]) => field === "weldIdNumber")?.[0];

				if (weldIdColumnIndex !== undefined) {
					const weldIdHeader = headers[Number(weldIdColumnIndex)];
					const weldIdValue = firstDataRow[weldIdHeader];

					if (weldIdValue && typeof weldIdValue === "string") {
						// Validate weld ID looks reasonable
						const trimmedId = weldIdValue.toString().trim();
						if (trimmedId.length === 0) {
							errors.push("First weld ID is empty");
						} else if (trimmedId.length > 50) {
							errors.push(
								`First weld ID is unusually long: ${trimmedId.length} characters`,
							);
						}
					}
				}

				// Check drawing number field
				const drawingColumnIndex = Object.entries(detectionResult.mappings)
					.find(([_, field]) => field === "drawingNumber")?.[0];

				if (drawingColumnIndex !== undefined) {
					const drawingHeader = headers[Number(drawingColumnIndex)];
					const drawingValue = firstDataRow[drawingHeader];

					if (drawingValue && typeof drawingValue === "string") {
						const trimmedDrawing = drawingValue.toString().trim();
						if (trimmedDrawing.length === 0) {
							errors.push("First drawing number is empty");
						} else if (trimmedDrawing.length > 100) {
							errors.push(
								`First drawing number is unusually long: ${trimmedDrawing.length} characters`,
							);
						}
					}
				}
			}

			const isWeldLogFormat =
				detectionResult.hasEssentials && errors.length === 0;

			if (isWeldLogFormat) {
				this.columnMappings = detectionResult.mappings;
			}

			return {
				isValid: isWeldLogFormat,
				detectedFormat: isWeldLogFormat ? "WELD_LOG" : "UNKNOWN",
				errors,
				metadata: {
					totalRows: rows.length,
					totalColumns: headers.length,
					requiredColumnsFound: detectionResult.essentialFields.found,
					missingColumns: detectionResult.essentialFields.missing,
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
	 * Parse file using intelligent column mappings
	 */
	async parseFile(
		buffer: Buffer,
		_filename: string,
		columnMappings?: ColumnMappings,
	): Promise<ParsedFileData> {
		const { headers, rows, metadata } = await this.parseExcelFile(buffer);

		// Use provided mappings or auto-detect
		let mappings = columnMappings || this.columnMappings;
		if (!mappings) {
			const detectionResult = autoDetectColumns(headers);
			mappings = detectionResult.mappings;
			this.detectionResult = detectionResult;
		}

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

				// Map columns based on intelligent detection
				if (mappings) {
					Object.entries(mappings).forEach(([columnIndex, fieldName]) => {
						const header = headers[Number(columnIndex)];
						const value = row[header];

						// Only include non-empty values to handle sparse data efficiently
						if (value !== null && value !== undefined && value !== "") {
							// Clean and normalize the value
							const cleanedValue = this.cleanValue(value, fieldName);
							if (cleanedValue !== null && cleanedValue !== undefined) {
								mappedRow[fieldName] = cleanedValue;
							}
						}
					});
				}

				// Add essential metadata for validation and processing
				mappedRow._rowIndex = index + 2; // Excel row number (1-indexed + header)
				mappedRow._originalRow = row;
				mappedRow._columnMapping = {}; // Store which columns had data

				// Record which original columns contained data (for debugging/validation)
				if (mappings) {
					Object.entries(mappings).forEach(([columnIndex, fieldName]) => {
						const header = headers[Number(columnIndex)];
						if (
							row[header] !== null &&
							row[header] !== undefined &&
							row[header] !== ""
						) {
							mappedRow._columnMapping[this.getColumnLetter(Number(columnIndex))] = {
								header,
								field: fieldName,
								value: row[header],
							};
						}
					});
				}

				return mappedRow;
			});

			mappedRows.push(...mappedBatch);
		}

		return {
			headers,
			rows: mappedRows,
			metadata: {
				...metadata,
			},
			detectedFormat: "WELD_LOG",
		};
	}

	/**
	 * Clean and normalize values based on field type
	 */
	private cleanValue(value: any, fieldName: string): any {
		if (value === null || value === undefined) return undefined;

		// Convert to string for cleaning
		const stringValue = value.toString().trim();
		if (stringValue === "") return undefined;

		// Field-specific cleaning
		switch (fieldName) {
			case "weldIdNumber":
			case "drawingNumber":
				// Essential fields - just trim whitespace
				return stringValue;

			case "testPressure": {
				// Remove units and convert to number
				const pressureClean = stringValue.replace(/\s*(psi|bar|kpa|psig)\s*/gi, "");
				const pressureNum = Number.parseFloat(pressureClean);
				return Number.isNaN(pressureNum) ? undefined : pressureNum;
			}

			case "xrayPercentage": {
				// Handle percentage formats
				const percentClean = stringValue.replace(/%/g, "");
				const percentNum = Number.parseFloat(percentClean);
				return Number.isNaN(percentNum) ? stringValue : percentNum.toString();
			}

			case "pmiRequired":
			case "pwhtRequired":
				// Boolean fields - already handled in schema transform
				return value;

			case "weldSize":
				// Clean weld size format (remove extra spaces, standardize quotes)
				return stringValue.replace(/\s+/g, " ").replace(/"/g, '"');

			case "schedule":
				// Clean schedule format
				return stringValue.toUpperCase().replace(/\s+/g, "");

			case "specCode":
				// Clean spec code format
				return stringValue.toUpperCase().replace(/\s+/g, "");

			default:
				// Default cleaning - trim and handle empty strings
				return stringValue;
		}
	}


	/**
	 * Enhanced validation with flexible column mapping
	 */
	async validateData(parsedData: ParsedFileData): Promise<ValidationResult> {
		const rows = parsedData.rows;
		const validRows: FieldWeldImportData[] = [];
		const invalidRows: any[] = [];
		const errors: ValidationError[] = [];
		const warnings: ValidationError[] = [];

		// Process in batches for performance
		const batchSize = 1000;
		for (let i = 0; i < rows.length; i += batchSize) {
			const batch = rows.slice(i, i + batchSize);

			for (let j = 0; j < batch.length; j++) {
				const rowIndex = i + j;
				const row = batch[j];
				const excelRowNumber = row._rowIndex || rowIndex + 2;

				try {
					// Validate using Zod schema
					const validatedRow = FieldWeldImportSchema.parse(row);
					validRows.push(validatedRow);

					// Add warnings for missing high-priority fields
					this.checkForMissingPriorityFields(validatedRow, excelRowNumber, warnings);
				} catch (error) {
					if (error instanceof z.ZodError) {
						// Collect all validation errors for this row
						for (const zodError of error.errors) {
							errors.push({
								row: excelRowNumber,
								field: zodError.path.join("."),
								error: zodError.message,
								value: zodError.path.reduce((obj, key) => obj?.[key], row),
							});
						}
					} else {
						errors.push({
							row: excelRowNumber,
							field: "general",
							error: `Unexpected validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
							value: row,
						});
					}

					invalidRows.push({
						...row,
						_validationErrors: error instanceof z.ZodError ? error.errors : [error],
					});
				}
			}
		}

		const isValid = errors.length === 0;

		return {
			isValid,
			errors,
			warnings,
			validRows,
			invalidRows,
		};
	}

	/**
	 * Check for missing high-priority fields and add warnings
	 */
	private checkForMissingPriorityFields(
		row: FieldWeldImportData,
		rowNumber: number,
		warnings: ValidationError[],
	): void {
		const highPriorityFields = [
			"specCode",
			"weldSize",
			"schedule",
			"weldType",
			"xrayPercentage",
		];

		for (const field of highPriorityFields) {
			if (!row[field as keyof FieldWeldImportData]) {
				warnings.push({
					row: rowNumber,
					field,
					error: `Missing recommended field: ${field}`,
					value: undefined,
				});
			}
		}
	}

	/**
	 * Convert column index to Excel column reference
	 */
	private getColumnLetter(index: number): string {
		let columnIndex = index;
		let result = "";

		while (columnIndex >= 0) {
			const remainder = columnIndex % 26;
			result = String.fromCharCode(65 + remainder) + result;
			columnIndex = Math.floor(columnIndex / 26) - 1;
		}

		return result;
	}

	/**
	 * Update column mappings (for manual override)
	 */
	public setColumnMappings(mappings: ColumnMappings): void {
		this.columnMappings = mappings;
	}

	/**
	 * Get current detection result
	 */
	public getDetectionResult(): ColumnDetectionResult | null {
		return this.detectionResult;
	}

	/**
	 * Process import data - implementation required by base class
	 */
	async processImport(validationResult: ValidationResult): Promise<ProcessedImportData> {
		if (!validationResult.isValid) {
			throw new Error("Cannot process invalid data");
		}

		return {
			validRows: validationResult.validRows,
			invalidRows: validationResult.invalidRows,
			errors: validationResult.errors,
			warnings: validationResult.warnings,
			summary: {
				totalRows: validationResult.validRows.length + validationResult.invalidRows.length,
				validRows: validationResult.validRows.length,
				invalidRows: validationResult.invalidRows.length,
				detectedFormat: "WELD_LOG",
				processingTime: 0,
			},
		};
	}

	/**
	 * Get validation schema - implementation required by base class
	 */
	getValidationSchema(): z.ZodSchema {
		return FieldWeldImportSchema;
	}

}
