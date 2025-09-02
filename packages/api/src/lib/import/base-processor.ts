import type { z } from "zod";
import * as ExcelJS from "exceljs";
import type {
	ValidationError,
	ValidationResult,
	FileMetadata,
	ProcessingOptions,
} from "../file-processing.js";

/**
 * File format validation results
 */
export interface FormatValidationResult {
	isValid: boolean;
	detectedFormat: "WELD_LOG" | "COMPONENTS" | "UNKNOWN";
	errors: string[];
	metadata?: {
		totalRows: number;
		totalColumns: number;
		requiredColumnsFound: string[];
		missingColumns: string[];
	};
}

/**
 * Progressive validation stages
 */
export enum ValidationStage {
	FORMAT_CHECK = "format_check",
	PREVIEW_VALIDATION = "preview_validation",
	FULL_IMPORT_VALIDATION = "full_import_validation",
}

/**
 * Import processing context
 */
export interface ImportContext {
	projectId: string;
	organizationId: string;
	userId: string;
	validationStage: ValidationStage;
	options?: ProcessingOptions;
}

/**
 * Raw parsed data from file
 */
export interface ParsedFileData {
	headers: string[];
	rows: any[];
	metadata: FileMetadata;
	detectedFormat: string;
}

/**
 * Processed import data ready for database insertion
 */
export interface ProcessedImportData {
	validRows: any[];
	invalidRows: any[];
	errors: ValidationError[];
	warnings: ValidationError[];
	summary: {
		totalRows: number;
		validRows: number;
		invalidRows: number;
		detectedFormat: string;
		processingTime: number;
	};
}

/**
 * File validation utilities
 */
export class FileValidator {
	private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
	private static readonly ALLOWED_EXTENSIONS = [".xlsx", ".xls"];
	private static readonly ALLOWED_MIME_TYPES = [
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"application/vnd.ms-excel",
	];

	/**
	 * Validate file before processing
	 */
	static validateFile(
		buffer: Buffer,
		filename: string,
		mimetype?: string,
	): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		// Check file size
		if (buffer.length > FileValidator.MAX_FILE_SIZE) {
			errors.push(
				`File size ${(buffer.length / 1024 / 1024).toFixed(1)}MB exceeds maximum limit of 100MB`,
			);
		}

		// Check file extension
		const extension = filename
			.toLowerCase()
			.substring(filename.lastIndexOf("."));
		if (!FileValidator.ALLOWED_EXTENSIONS.includes(extension)) {
			errors.push(
				`File extension ${extension} not supported. Only .xlsx and .xls files are allowed.`,
			);
		}

		// Check MIME type if provided
		if (mimetype && !FileValidator.ALLOWED_MIME_TYPES.includes(mimetype)) {
			errors.push(
				`File type ${mimetype} not supported. Only Excel files are allowed.`,
			);
		}

		// Basic buffer validation
		if (buffer.length === 0) {
			errors.push("File is empty");
		}

		// Try to verify it's a valid Excel file by checking magic bytes
		if (buffer.length >= 8) {
			const signature = buffer.toString("hex", 0, 8);
			// Excel 2007+ signature: 50 4b 03 04 (ZIP format)
			// Excel 97-2003 signature: d0 cf 11 e0 a1 b1 1a e1
			if (
				!signature.startsWith("504b0304") &&
				!signature.startsWith("d0cf11e0")
			) {
				errors.push("File does not appear to be a valid Excel file");
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}
}

/**
 * Abstract base class for import processors
 */
export abstract class BaseImportProcessor<T = any> {
	protected readonly context: ImportContext;
	protected readonly options: ProcessingOptions;

	constructor(context: ImportContext) {
		this.context = context;
		this.options = {
			batchSize: 1000,
			maxRows: 20000,
			strictMode: true,
			...context.options,
		};
	}

	/**
	 * Validate file format and detect import type
	 */
	abstract validateFormat(
		buffer: Buffer,
		filename: string,
	): Promise<FormatValidationResult>;

	/**
	 * Parse file into structured data
	 */
	abstract parseFile(
		buffer: Buffer,
		filename: string,
	): Promise<ParsedFileData>;

	/**
	 * Validate parsed data according to business rules
	 */
	abstract validateData(
		parsedData: ParsedFileData,
	): Promise<ValidationResult>;

	/**
	 * Process validated data for database insertion
	 */
	abstract processImport(
		validatedData: ValidationResult,
	): Promise<ProcessedImportData>;

	/**
	 * Get the expected schema for validation
	 */
	abstract getValidationSchema(): z.ZodType<T, any, any>;

	/**
	 * Common Excel parsing utility
	 */
	protected async parseExcelFile(
		buffer: Buffer,
		sheetName?: string,
	): Promise<{ headers: string[]; rows: any[]; metadata: FileMetadata }> {
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(buffer);

		const worksheet = sheetName
			? workbook.getWorksheet(sheetName)
			: workbook.worksheets[0];

		if (!worksheet) {
			throw new Error(
				`Worksheet ${sheetName || "first sheet"} not found`,
			);
		}

		const headers: string[] = [];
		const rows: any[] = [];

		// Get headers from first row, supporting columns A-Z and AA
		const headerRow = worksheet.getRow(1);

		// Excel columns: A=1, B=2, ..., Z=26, AA=27
		for (let colIndex = 1; colIndex <= 27; colIndex++) {
			const cell = headerRow.getCell(colIndex);
			const headerValue = cell.text?.trim() || "";
			headers[colIndex - 1] = headerValue;
		}

		// Process data rows (up to maxRows)
		for (
			let rowNumber = 2;
			rowNumber <=
			Math.min(worksheet.rowCount, this.options.maxRows! + 1);
			rowNumber++
		) {
			const row = worksheet.getRow(rowNumber);
			const rowData: any = {};
			let hasData = false;

			// Process all 27 columns (A-Z, AA)
			for (let colIndex = 1; colIndex <= 27; colIndex++) {
				const cell = row.getCell(colIndex);
				const value = this.getCellValue(cell);
				const header = headers[colIndex - 1];

				if (value !== null && value !== undefined && value !== "") {
					hasData = true;
				}

				if (header) {
					rowData[header] = value;
				}
			}

			if (hasData) {
				rows.push(rowData);
			}
		}

		const metadata: FileMetadata = {
			filename: "uploaded.xlsx",
			size: buffer.length,
			mimetype:
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			headers: headers.filter((h) => h), // Remove empty headers
			rowCount: rows.length,
		};

		return { headers, rows, metadata };
	}

	/**
	 * Extract cell value with proper type handling
	 */
	protected getCellValue(cell: ExcelJS.Cell): any {
		if (cell.type === ExcelJS.ValueType.Number) {
			return cell.value as number;
		}
		if (cell.type === ExcelJS.ValueType.Date) {
			return cell.value as Date;
		}
		if (cell.type === ExcelJS.ValueType.Boolean) {
			return cell.value as boolean;
		}
		if (cell.type === ExcelJS.ValueType.Error) {
			return null;
		}
		return cell.text?.trim() || null;
	}

	/**
	 * Common validation utility for batch processing
	 */
	protected async validateInBatches<U>(
		items: U[],
		validator: (batch: U[]) => Promise<ValidationError[]>,
		batchSize = 100,
	): Promise<ValidationError[]> {
		const allErrors: ValidationError[] = [];

		for (let i = 0; i < items.length; i += batchSize) {
			const batch = items.slice(i, i + batchSize);
			const batchErrors = await validator(batch);
			allErrors.push(...batchErrors);
		}

		return allErrors;
	}

	/**
	 * Generate processing summary
	 */
	protected createSummary(
		totalRows: number,
		validRows: number,
		invalidRows: number,
		detectedFormat: string,
		startTime: number,
	) {
		return {
			totalRows,
			validRows,
			invalidRows,
			detectedFormat,
			processingTime: Date.now() - startTime,
		};
	}
}
