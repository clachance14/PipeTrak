import { z } from "zod";
import type { ValidationError } from "../file-processing.js";
import type { FieldWeldImportData } from "./field-weld-processor.js";
import type {
	ColumnDetectionResult,
} from "./field-weld-column-detector.js";

/**
 * Validation categories for field weld import
 */
export enum ValidationCategory {
	ERROR = "error",
	WARNING = "warning",
	INFO = "info",
}

/**
 * Enhanced validation error with category and recommendations
 */
export interface FieldWeldValidationError extends ValidationError {
	category: ValidationCategory;
	recommendation?: string;
	code: string;
}

/**
 * Drawing reference data for validation and inheritance
 */
export interface DrawingReference {
	drawingNumber: string;
	exists: boolean;
	testPressure?: number;
	specCode?: string;
	projectId: string;
}

/**
 * Flexible validation context for field weld import
 */
export interface FieldWeldValidationContext {
	projectId: string;
	organizationId: string;
	userId: string;
	existingWeldIds: Set<string>;
	validDrawings: Map<string, DrawingReference>;
	maxFileSize: number;
	maxRows: number;
	strictMode: boolean;
	detectionResult?: ColumnDetectionResult; // Optional: column detection results
	flexibleMode: boolean; // New: allows import with only essential fields
}

/**
 * Flexible validation report with column detection results
 */
export interface FieldWeldValidationReport {
	isValid: boolean;
	summary: {
		totalRows: number;
		validRows: number;
		invalidRows: number;
		errorCount: number;
		warningCount: number;
		infoCount: number;
		essentialFieldsFound: number;
		priorityFieldsFound: number;
		skippedColumns: number;
	};
	errors: FieldWeldValidationError[];
	warnings: FieldWeldValidationError[];
	infos: FieldWeldValidationError[];
	validRows: FieldWeldImportData[];
	invalidRows: any[];
	duplicateWeldIds: string[];
	missingDrawings: string[];
	columnMappings: {
		detected: Record<number, string>;
		essential: string[];
		priority: string[];
		optional: string[];
		skipped: string[];
	};
	inheritanceApplied: {
		testPressure: number;
		specCode: number;
	};
	recommendations: string[];
}

/**
 * Comprehensive field weld validation engine
 * Supports up to 20,000 rows with batch processing for performance
 */
export class FieldWeldValidator {
	private context: FieldWeldValidationContext;
	private batchSize = 5000;

	constructor(context: FieldWeldValidationContext) {
		this.context = context;
	}

	/**
	 * Main validation method - flexible approach focusing on essential fields
	 */
	async validateFieldWelds(rows: any[]): Promise<FieldWeldValidationReport> {
		const startTime = Date.now();

		// Initialize flexible report structure
		const report: FieldWeldValidationReport = {
			isValid: false,
			summary: {
				totalRows: rows.length,
				validRows: 0,
				invalidRows: 0,
				errorCount: 0,
				warningCount: 0,
				infoCount: 0,
				essentialFieldsFound: 0,
				priorityFieldsFound: 0,
				skippedColumns: 0,
			},
			errors: [],
			warnings: [],
			infos: [],
			validRows: [],
			invalidRows: [],
			duplicateWeldIds: [],
			missingDrawings: [],
			columnMappings: {
				detected: {},
				essential: [],
				priority: [],
				optional: [],
				skipped: [],
			},
			inheritanceApplied: {
				testPressure: 0,
				specCode: 0,
			},
			recommendations: [],
		};

		// Add column mapping information if available
		if (this.context.detectionResult) {
			report.columnMappings.detected = this.context.detectionResult.mappings;
			report.columnMappings.essential = this.context.detectionResult.essentialFields.found;
			report.columnMappings.skipped = this.context.detectionResult.warnings;
			report.summary.essentialFieldsFound = this.context.detectionResult.essentialFields.found.length;
		}

		// Pre-validation checks
		await this.performPreValidationChecks(rows, report);

		// Process rows in batches for performance with large datasets
		for (
			let batchStart = 0;
			batchStart < rows.length;
			batchStart += this.batchSize
		) {
			const batchEnd = Math.min(batchStart + this.batchSize, rows.length);
			const batch = rows.slice(batchStart, batchEnd);

			await this.validateBatch(batch, batchStart, report);
		}

		// Post-validation analysis
		await this.performPostValidationAnalysis(report);

		// Generate recommendations
		this.generateRecommendations(report);

		// Final summary
		report.isValid = report.summary.errorCount === 0;
		report.summary.validRows = report.validRows.length;
		report.summary.invalidRows = report.invalidRows.length;

		console.log(
			`Field weld validation completed in ${Date.now() - startTime}ms`,
		);
		return report;
	}

	/**
	 * Pre-validation checks for file-level constraints
	 */
	private async performPreValidationChecks(
		rows: any[],
		report: FieldWeldValidationReport,
	): Promise<void> {
		// Check row count limits
		if (rows.length > this.context.maxRows) {
			report.errors.push({
				row: 0,
				field: "file",
				error: `File contains ${rows.length} rows, exceeding maximum of ${this.context.maxRows} rows`,
				value: rows.length,
				category: ValidationCategory.ERROR,
				code: "FILE_TOO_LARGE",
				recommendation:
					"Split the file into smaller chunks or contact support for higher limits",
			});
		}

		if (rows.length === 0) {
			report.errors.push({
				row: 0,
				field: "file",
				error: "No data rows found in file",
				value: null,
				category: ValidationCategory.ERROR,
				code: "NO_DATA",
				recommendation:
					"Ensure the file contains data starting from row 2",
			});
		}

		// Log validation context
		report.infos.push({
			row: 0,
			field: "context",
			error: `Validating ${rows.length} field weld records for project ${this.context.projectId}`,
			value: null,
			category: ValidationCategory.INFO,
			code: "VALIDATION_START",
		});
	}

	/**
	 * Validate a batch of rows
	 */
	private async validateBatch(
		batch: any[],
		batchOffset: number,
		report: FieldWeldValidationReport,
	): Promise<void> {
		for (let i = 0; i < batch.length; i++) {
			const rowIndex = batchOffset + i;
			const excelRowNumber = rowIndex + 2; // Excel row number (1-indexed + header)
			const row = batch[i];

			const rowErrors: FieldWeldValidationError[] = [];
			const rowWarnings: FieldWeldValidationError[] = [];
			const rowInfos: FieldWeldValidationError[] = [];

			try {
				// Apply drawing inheritance
				const enrichedRow = await this.applyDrawingInheritance(
					row,
					excelRowNumber,
					rowWarnings,
					report,
				);

				// Schema validation
				const validatedData = await this.validateRowSchema(
					enrichedRow,
					excelRowNumber,
					rowErrors,
				);

				// Business rule validation
				if (validatedData) {
					await this.validateBusinessRules(
						validatedData,
						excelRowNumber,
						rowErrors,
						rowWarnings,
					);

					// Duplicate validation
					await this.validateDuplicates(
						validatedData,
						excelRowNumber,
						rowErrors,
						report,
					);

					// Drawing reference validation
					await this.validateDrawingReferences(
						validatedData,
						excelRowNumber,
						rowErrors,
						rowWarnings,
					);
				}

				// Categorize row result
				if (rowErrors.length === 0 && validatedData) {
					report.validRows.push(validatedData);
					if (rowWarnings.length > 0) {
						report.warnings.push(...rowWarnings);
					}
				} else {
					report.invalidRows.push({
						...row,
						_errors: rowErrors,
						_rowNumber: excelRowNumber,
					});
					report.errors.push(...rowErrors);
					report.warnings.push(...rowWarnings);
				}

				// Add informational messages
				report.infos.push(...rowInfos);
			} catch (error) {
				const validationError: FieldWeldValidationError = {
					row: excelRowNumber,
					field: "general",
					error: `Unexpected validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
					value: row,
					category: ValidationCategory.ERROR,
					code: "VALIDATION_EXCEPTION",
					recommendation:
						"Check row data format and contact support if issue persists",
				};

				report.errors.push(validationError);
				report.invalidRows.push({
					...row,
					_errors: [validationError],
					_rowNumber: excelRowNumber,
				});
			}
		}
	}

	/**
	 * Apply drawing inheritance for test pressure and spec code
	 */
	private async applyDrawingInheritance(
		row: any,
		rowNumber: number,
		warnings: FieldWeldValidationError[],
		report: FieldWeldValidationReport,
	): Promise<any> {
		const enrichedRow = { ...row };

		if (enrichedRow.drawingNumber) {
			const drawingRef = this.context.validDrawings.get(
				enrichedRow.drawingNumber,
			);

			if (drawingRef) {
				// Inherit test pressure if empty
				if (!enrichedRow.testPressure && drawingRef.testPressure) {
					enrichedRow.testPressure = drawingRef.testPressure;
					enrichedRow._inheritedTestPressure = true;
					report.inheritanceApplied.testPressure++;

					warnings.push({
						row: rowNumber,
						field: "testPressure",
						error: `Test pressure inherited from drawing: ${drawingRef.testPressure}`,
						value: drawingRef.testPressure,
						category: ValidationCategory.WARNING,
						code: "INHERITED_TEST_PRESSURE",
					});
				}

				// Inherit spec code if empty
				if (!enrichedRow.specCode && drawingRef.specCode) {
					enrichedRow.specCode = drawingRef.specCode;
					enrichedRow._inheritedSpecCode = true;
					report.inheritanceApplied.specCode++;

					warnings.push({
						row: rowNumber,
						field: "specCode",
						error: `Spec code inherited from drawing: ${drawingRef.specCode}`,
						value: drawingRef.specCode,
						category: ValidationCategory.WARNING,
						code: "INHERITED_SPEC_CODE",
					});
				}
			}
		}

		return enrichedRow;
	}

	/**
	 * Validate row against Zod schema
	 */
	private async validateRowSchema(
		row: any,
		rowNumber: number,
		errors: FieldWeldValidationError[],
	): Promise<FieldWeldImportData | null> {
		try {
			// Define enhanced schema with better error messages
			const FieldWeldSchema = z.object({
				// Required fields
				weldIdNumber: z
					.string()
					.min(1, "Weld ID Number is required and cannot be empty")
					.max(50, "Weld ID Number cannot exceed 50 characters"),

				drawingNumber: z
					.string()
					.min(1, "Drawing Number is required and cannot be empty")
					.max(100, "Drawing Number cannot exceed 100 characters"),

				// Optional fields with enhanced validation
				welderStencil: z
					.string()
					.max(15, "Welder Stencil cannot exceed 15 characters")
					.optional(),

				testPackageNumber: z
					.string()
					.max(50, "Test Package Number cannot exceed 50 characters")
					.optional(),

				testPressure: z
					.union([z.number(), z.string()])
					.transform((val) => this.normalizeNumericValue(val))
					.refine(
						(val) =>
							val === null ||
							(typeof val === "number" && val >= 0),
						"Test pressure must be a positive number",
					)
					.optional(),

				specCode: z
					.string()
					.max(20, "Spec Code cannot exceed 20 characters")
					.optional(),

				// Boolean fields with flexible parsing
				pmiRequired: z
					.union([z.boolean(), z.string(), z.number()])
					.transform((val) => this.parseBoolean(val))
					.optional(),

				pwhtRequired: z
					.union([z.boolean(), z.string(), z.number()])
					.transform((val) => this.parseBoolean(val))
					.optional(),

				// Date field with flexible parsing
				pmiCompleteDate: z
					.union([z.date(), z.string(), z.number()])
					.transform((val) => this.parseDate(val))
					.optional(),

				comments: z
					.string()
					.max(500, "Comments cannot exceed 500 characters")
					.optional(),

				// Additional optional fields
				weldSize: z
					.string()
					.max(20, "Weld Size cannot exceed 20 characters")
					.optional(),
				xrayPercentage: z
					.string()
					.max(10, "X-ray Percentage cannot exceed 10 characters")
					.optional(),
				weldType: z
					.string()
					.max(30, "Weld Type cannot exceed 30 characters")
					.optional(),
			});

			const validatedData = FieldWeldSchema.parse(row);
			return validatedData as FieldWeldImportData;
		} catch (error) {
			if (error instanceof z.ZodError) {
				for (const zodError of error.errors) {
					errors.push({
						row: rowNumber,
						field: zodError.path.join("."),
						error: zodError.message,
						value: zodError.path.reduce(
							(obj, key) => obj?.[key],
							row,
						),
						category: ValidationCategory.ERROR,
						code: `SCHEMA_${zodError.code.toUpperCase()}`,
						recommendation:
							this.getSchemaErrorRecommendation(zodError),
					});
				}
			}
			return null;
		}
	}

	/**
	 * Business rule validations
	 */
	private async validateBusinessRules(
		data: FieldWeldImportData,
		rowNumber: number,
		errors: FieldWeldValidationError[],
		warnings: FieldWeldValidationError[],
	): Promise<void> {
		// Weld ID format validation
		await this.validateWeldIdFormat(
			data.weldIdNumber,
			rowNumber,
			errors,
			warnings,
		);

		// Drawing number format validation
		await this.validateDrawingNumberFormat(
			data.drawingNumber,
			rowNumber,
			errors,
			warnings,
		);

		// Test pressure range validation
		if (
			data.testPressure !== undefined &&
			data.testPressure !== null &&
			typeof data.testPressure === "number"
		) {
			await this.validateTestPressureRange(
				data.testPressure,
				rowNumber,
				errors,
				warnings,
			);
		}

		// Test package format validation
		if (data.testPackageNumber) {
			await this.validateTestPackageFormat(
				data.testPackageNumber,
				rowNumber,
				warnings,
			);
		}

		// Date validation
		if (data.pmiCompleteDate) {
			await this.validateDateRange(
				data.pmiCompleteDate,
				rowNumber,
				warnings,
			);
		}

		// Cross-field validation
		await this.validateCrossFieldRules(data, rowNumber, warnings);
	}

	/**
	 * Validate weld ID format and business rules
	 */
	private async validateWeldIdFormat(
		weldId: string,
		rowNumber: number,
		_errors: FieldWeldValidationError[],
		warnings: FieldWeldValidationError[],
	): Promise<void> {
		const trimmedId = weldId.trim();

		// Check for reasonable format (alphanumeric with common separators)
		if (!/^[A-Za-z0-9._-]+$/.test(trimmedId)) {
			warnings.push({
				row: rowNumber,
				field: "weldIdNumber",
				error: "Weld ID contains special characters that may cause issues",
				value: weldId,
				category: ValidationCategory.WARNING,
				code: "WELD_ID_SPECIAL_CHARS",
				recommendation:
					"Use only alphanumeric characters, dots, underscores, and hyphens",
			});
		}

		// Check for sequential number format (common pattern)
		if (/^\d+$/.test(trimmedId)) {
			const num = Number.parseInt(trimmedId);
			if (num > 9999) {
				warnings.push({
					row: rowNumber,
					field: "weldIdNumber",
					error: "Sequential weld ID is very high (>9999)",
					value: weldId,
					category: ValidationCategory.WARNING,
					code: "WELD_ID_HIGH_NUMBER",
				});
			}
		}
	}

	/**
	 * Validate drawing number format
	 */
	private async validateDrawingNumberFormat(
		drawingNumber: string,
		rowNumber: number,
		_errors: FieldWeldValidationError[],
		warnings: FieldWeldValidationError[],
	): Promise<void> {
		const trimmed = drawingNumber.trim();

		// Check for reasonable drawing number patterns
		// Common patterns: P-26B07, P-26B07 01of01, ISO-12345-001
		if (trimmed.length < 3) {
			warnings.push({
				row: rowNumber,
				field: "drawingNumber",
				error: "Drawing number seems unusually short",
				value: drawingNumber,
				category: ValidationCategory.WARNING,
				code: "DRAWING_NUMBER_SHORT",
			});
		}

		// Check for invalid characters that might cause database issues
		if (/[<>:"/\\|?*]/.test(trimmed)) {
			warnings.push({
				row: rowNumber,
				field: "drawingNumber",
				error: "Drawing number contains characters that may cause system issues",
				value: drawingNumber,
				category: ValidationCategory.WARNING,
				code: "DRAWING_NUMBER_INVALID_CHARS",
				recommendation:
					'Avoid using <>:"/\\|?* characters in drawing numbers',
			});
		}
	}

	/**
	 * Validate test pressure ranges
	 */
	private async validateTestPressureRange(
		pressure: number,
		rowNumber: number,
		errors: FieldWeldValidationError[],
		warnings: FieldWeldValidationError[],
	): Promise<void> {
		if (pressure < 0) {
			errors.push({
				row: rowNumber,
				field: "testPressure",
				error: "Test pressure cannot be negative",
				value: pressure,
				category: ValidationCategory.ERROR,
				code: "NEGATIVE_PRESSURE",
				recommendation:
					"Enter a positive pressure value or leave blank",
			});
		} else if (pressure > 15000) {
			warnings.push({
				row: rowNumber,
				field: "testPressure",
				error: "Test pressure is unusually high (>15,000 PSI)",
				value: pressure,
				category: ValidationCategory.WARNING,
				code: "PRESSURE_VERY_HIGH",
				recommendation: "Verify the pressure value is correct",
			});
		} else if (pressure > 10000) {
			warnings.push({
				row: rowNumber,
				field: "testPressure",
				error: "Test pressure is outside typical range (>10,000 PSI)",
				value: pressure,
				category: ValidationCategory.WARNING,
				code: "PRESSURE_HIGH",
			});
		} else if (pressure > 0 && pressure < 50) {
			warnings.push({
				row: rowNumber,
				field: "testPressure",
				error: "Test pressure seems unusually low (<50 PSI)",
				value: pressure,
				category: ValidationCategory.WARNING,
				code: "PRESSURE_LOW",
			});
		}
	}

	/**
	 * Validate test package format
	 */
	private async validateTestPackageFormat(
		testPackage: string,
		rowNumber: number,
		warnings: FieldWeldValidationError[],
	): Promise<void> {
		const trimmed = testPackage.trim();

		// Check for reasonable test package patterns
		// Common patterns: TP-001, TEST-PKG-123, etc.
		if (trimmed.length < 3) {
			warnings.push({
				row: rowNumber,
				field: "testPackageNumber",
				error: "Test package number seems unusually short",
				value: testPackage,
				category: ValidationCategory.WARNING,
				code: "TEST_PACKAGE_SHORT",
			});
		}

		// Check for consistent naming conventions (project-specific)
		// This could be enhanced based on project requirements
		if (!/^[A-Za-z0-9._-]+$/.test(trimmed)) {
			warnings.push({
				row: rowNumber,
				field: "testPackageNumber",
				error: "Test package contains special characters",
				value: testPackage,
				category: ValidationCategory.WARNING,
				code: "TEST_PACKAGE_SPECIAL_CHARS",
			});
		}
	}

	/**
	 * Validate date ranges
	 */
	private async validateDateRange(
		date: Date,
		rowNumber: number,
		warnings: FieldWeldValidationError[],
	): Promise<void> {
		const now = new Date();
		const twoYearsAgo = new Date(
			now.getFullYear() - 2,
			now.getMonth(),
			now.getDate(),
		);
		const oneYearFuture = new Date(
			now.getFullYear() + 1,
			now.getMonth(),
			now.getDate(),
		);

		if (date > oneYearFuture) {
			warnings.push({
				row: rowNumber,
				field: "pmiCompleteDate",
				error: "PMI complete date is more than 1 year in the future",
				value: date,
				category: ValidationCategory.WARNING,
				code: "DATE_FUTURE",
			});
		} else if (date < twoYearsAgo) {
			warnings.push({
				row: rowNumber,
				field: "pmiCompleteDate",
				error: "PMI complete date is more than 2 years in the past",
				value: date,
				category: ValidationCategory.WARNING,
				code: "DATE_OLD",
			});
		}
	}

	/**
	 * Cross-field validation rules
	 */
	private async validateCrossFieldRules(
		data: FieldWeldImportData,
		rowNumber: number,
		warnings: FieldWeldValidationError[],
	): Promise<void> {
		// If PMI is required but no date provided, warn
		if (data.pmiRequired === true && !data.pmiCompleteDate) {
			warnings.push({
				row: rowNumber,
				field: "pmiCompleteDate",
				error: "PMI is required but no completion date provided",
				value: null,
				category: ValidationCategory.WARNING,
				code: "PMI_REQUIRED_NO_DATE",
				recommendation:
					"Provide PMI completion date or set PMI Required to false",
			});
		}

		// If PMI date provided but not marked as required, inform
		if (data.pmiCompleteDate && data.pmiRequired !== true) {
			warnings.push({
				row: rowNumber,
				field: "pmiRequired",
				error: "PMI completion date provided but PMI not marked as required",
				value: data.pmiRequired,
				category: ValidationCategory.WARNING,
				code: "PMI_DATE_NOT_REQUIRED",
			});
		}
	}

	/**
	 * Validate for duplicate weld IDs
	 */
	private async validateDuplicates(
		data: FieldWeldImportData,
		rowNumber: number,
		errors: FieldWeldValidationError[],
		report: FieldWeldValidationReport,
	): Promise<void> {
		// Check against existing welds in database
		if (this.context.existingWeldIds.has(data.weldIdNumber)) {
			errors.push({
				row: rowNumber,
				field: "weldIdNumber",
				error: "Weld ID already exists in project database",
				value: data.weldIdNumber,
				category: ValidationCategory.ERROR,
				code: "DUPLICATE_EXISTING_WELD",
				recommendation:
					"Use a unique weld ID or update the existing weld",
			});
		}

		// Check for duplicates within the current import
		const duplicateInFile = report.validRows.find(
			(existing) => existing.weldIdNumber === data.weldIdNumber,
		);

		if (duplicateInFile) {
			errors.push({
				row: rowNumber,
				field: "weldIdNumber",
				error: "Duplicate weld ID found in import file",
				value: data.weldIdNumber,
				category: ValidationCategory.ERROR,
				code: "DUPLICATE_IN_FILE",
				recommendation:
					"Ensure each weld ID appears only once in the file",
			});

			if (!report.duplicateWeldIds.includes(data.weldIdNumber)) {
				report.duplicateWeldIds.push(data.weldIdNumber);
			}
		}
	}

	/**
	 * Validate drawing references exist in database
	 */
	private async validateDrawingReferences(
		data: FieldWeldImportData,
		rowNumber: number,
		errors: FieldWeldValidationError[],
		warnings: FieldWeldValidationError[],
	): Promise<void> {
		const drawingRef = this.context.validDrawings.get(data.drawingNumber);

		if (!drawingRef || !drawingRef.exists) {
			if (this.context.strictMode) {
				errors.push({
					row: rowNumber,
					field: "drawingNumber",
					error: "Drawing number not found in project database",
					value: data.drawingNumber,
					category: ValidationCategory.ERROR,
					code: "DRAWING_NOT_FOUND",
					recommendation:
						"Verify the drawing number exists in the project or add the drawing first",
				});
			} else {
				warnings.push({
					row: rowNumber,
					field: "drawingNumber",
					error: "Drawing number not found in project database",
					value: data.drawingNumber,
					category: ValidationCategory.WARNING,
					code: "DRAWING_NOT_FOUND",
				});
			}
		}
	}

	/**
	 * Post-validation analysis and summary
	 */
	private async performPostValidationAnalysis(
		report: FieldWeldValidationReport,
	): Promise<void> {
		// Count errors by category
		report.summary.errorCount = report.errors.length;
		report.summary.warningCount = report.warnings.length;
		report.summary.infoCount = report.infos.length;

		// Identify missing drawings
		const allDrawingNumbers = new Set<string>();
		[...report.validRows, ...report.invalidRows].forEach((row) => {
			if (row.drawingNumber || row._originalRow?.drawingNumber) {
				allDrawingNumbers.add(
					row.drawingNumber || row._originalRow?.drawingNumber,
				);
			}
		});

		for (const drawingNumber of allDrawingNumbers) {
			const drawingRef = this.context.validDrawings.get(drawingNumber);
			if (!drawingRef || !drawingRef.exists) {
				report.missingDrawings.push(drawingNumber);
			}
		}
	}

	/**
	 * Generate actionable recommendations based on validation results
	 */
	private generateRecommendations(report: FieldWeldValidationReport): void {
		const recommendations: string[] = [];

		if (report.summary.errorCount > 0) {
			recommendations.push(
				`Fix ${report.summary.errorCount} critical errors before import`,
			);
		}

		if (report.duplicateWeldIds.length > 0) {
			recommendations.push(
				`Remove or rename ${report.duplicateWeldIds.length} duplicate weld IDs`,
			);
		}

		if (report.missingDrawings.length > 0) {
			recommendations.push(
				`Add ${report.missingDrawings.length} missing drawings to project or verify drawing numbers`,
			);
		}

		if (report.summary.warningCount > 5) {
			recommendations.push(
				"Review warnings for data quality improvements",
			);
		}

		if (
			report.inheritanceApplied.testPressure > 0 ||
			report.inheritanceApplied.specCode > 0
		) {
			recommendations.push(
				"Verify inherited values are correct for your field welds",
			);
		}

		if (report.summary.validRows > 10000) {
			recommendations.push(
				"Consider importing in smaller batches for better performance",
			);
		}

		report.recommendations = recommendations;
	}

	/**
	 * Helper: Parse boolean values from various formats
	 */
	private parseBoolean(val: any): boolean | undefined {
		if (val === null || val === undefined) {
			return undefined;
		}
		if (typeof val === "boolean") {
			return val;
		}
		if (typeof val === "number") {
			return val === 1;
		}
		if (typeof val === "string") {
			const lower = val.toLowerCase().trim();
			if (
				lower === "true" ||
				lower === "yes" ||
				lower === "1" ||
				lower === "x"
			) {
				return true;
			}
			if (
				lower === "false" ||
				lower === "no" ||
				lower === "0" ||
				lower === ""
			) {
				return false;
			}
		}
		return undefined;
	}

	/**
	 * Helper: Parse dates from Excel numbers and strings
	 */
	private parseDate(val: any): Date | undefined {
		if (val === null || val === undefined) {
			return undefined;
		}
		if (val instanceof Date) {
			return val;
		}

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
	}

	/**
	 * Helper: Normalize numeric values from various formats
	 */
	private normalizeNumericValue(value: any): number | null {
		if (value === null || value === undefined) {
			return null;
		}
		if (typeof value === "number") {
			return Number.isNaN(value) ? null : value;
		}

		if (typeof value === "string") {
			const trimmed = value.trim();
			if (trimmed === "") {
				return null;
			}

			// Handle common formats: "150 PSI", "150psi", "5%", etc.
			let numericPart = trimmed;

			// Remove common units
			numericPart = numericPart.replace(/\s*(psi|bar|kpa|%|")\s*/gi, "");

			// Extract numeric value
			const matches = numericPart.match(/^-?\d*\.?\d+/);
			if (matches) {
				const parsed = Number.parseFloat(matches[0]);
				return Number.isNaN(parsed) ? null : parsed;
			}
		}

		return null;
	}

	/**
	 * Helper: Get recommendation for schema validation errors
	 */
	private getSchemaErrorRecommendation(error: z.ZodIssue): string {
		switch (error.code) {
			case "too_small":
				return "Provide a longer value or ensure the field is not empty";
			case "too_big":
				return "Shorten the value to fit within allowed limits";
			case "invalid_type":
				return "Check the data format - ensure numbers are numeric and dates are valid";
			default:
				return "Check the field format and try again";
		}
	}

	/**
	 * Export validation report to CSV format
	 */
	async exportValidationReport(
		report: FieldWeldValidationReport,
	): Promise<string> {
		const csvLines: string[] = [];

		// Header
		csvLines.push("Row,Field,Category,Code,Error,Value,Recommendation");

		// Add all validation issues
		const allIssues = [
			...report.errors,
			...report.warnings,
			...report.infos,
		];

		for (const issue of allIssues) {
			const row = [
				issue.row.toString(),
				issue.field,
				issue.category,
				issue.code,
				`"${issue.error.replace(/"/g, '""')}"`, // Escape quotes
				issue.value
					? `"${issue.value.toString().replace(/"/g, '""')}"`
					: "",
				issue.recommendation
					? `"${issue.recommendation.replace(/"/g, '""')}"`
					: "",
			];
			csvLines.push(row.join(","));
		}

		return csvLines.join("\n");
	}
}

/**
 * Enhanced factory function with flexible validation options
 */
export async function createFieldWeldValidator(
	projectId: string,
	organizationId: string,
	userId: string,
	options?: {
		maxRows?: number;
		strictMode?: boolean;
		flexibleMode?: boolean;
		detectionResult?: ColumnDetectionResult;
		supabaseClient?: any;
	},
): Promise<FieldWeldValidator> {
	// Load existing weld IDs and drawing references from database
	// This would be implemented with actual Supabase queries
	const existingWeldIds = new Set<string>();
	const validDrawings = new Map<string, DrawingReference>();

	// TODO: Implement database queries when Supabase client is available
	// const { data: existingWelds } = await supabaseClient
	//   .from('components')
	//   .select('component_id')
	//   .eq('project_id', projectId)
	//   .eq('type', 'FIELD_WELD');

	// const { data: drawings } = await supabaseClient
	//   .from('drawings')
	//   .select('drawing_number, test_pressure, spec_code')
	//   .eq('project_id', projectId);

	const context: FieldWeldValidationContext = {
		projectId,
		organizationId,
		userId,
		existingWeldIds,
		validDrawings,
		maxFileSize: 100 * 1024 * 1024, // 100MB
		maxRows: options?.maxRows || 20000,
		strictMode: options?.strictMode ?? false, // Default to flexible mode
		flexibleMode: options?.flexibleMode ?? true, // Enable flexible mode by default
		detectionResult: options?.detectionResult,
	};

	return new FieldWeldValidator(context);
}
