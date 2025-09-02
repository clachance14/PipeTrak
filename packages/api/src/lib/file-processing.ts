import { z } from "zod";
import { parse } from "csv-parse";
import { Readable } from "stream";
import * as ExcelJS from "exceljs";
import { db as prisma } from "@repo/database";

// Types for file processing
export interface FileMetadata {
	filename: string;
	size: number;
	mimetype: string;
	headers: string[];
	rowCount: number;
}

export interface ValidationError {
	row: number;
	field: string;
	error: string;
	value: any;
}

export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationError[];
	validRows: any[];
	invalidRows: any[];
}

export interface ColumnMapping {
	sourceColumn: string;
	targetField: string;
	required: boolean;
	transform?: (value: any) => any;
}

export interface ProcessingOptions {
	batchSize?: number;
	skipRows?: number;
	maxRows?: number;
	strictMode?: boolean;
}

// Component validation schema
export const ComponentImportSchema = z.object({
	componentId: z.string().min(1, "Component ID is required"),
	type: z.string().min(1, "Component Type is required"),
	workflowType: z
		.enum([
			"MILESTONE_DISCRETE",
			"MILESTONE_PERCENTAGE",
			"MILESTONE_QUANTITY",
		])
		.optional(),
	drawingId: z.string().min(1, "Drawing ID is required"),
	milestoneTemplateId: z.string().optional(),
	spec: z.string().optional(),
	size: z.string().optional(),
	material: z.string().optional(),
	pressureRating: z.string().optional(),
	description: z.string().optional(),
	area: z.string().optional(),
	system: z.string().optional(),
	testPackage: z.string().optional(),
	testPressure: z.number().optional(),
	testRequired: z.string().optional(),
	totalLength: z.number().optional(),
	lengthUnit: z.string().optional(),
	totalQuantity: z.number().optional(),
	quantityUnit: z.string().optional(),

	// Field weld specific fields (QC data)
	weldSize: z.string().optional(),
	schedule: z.string().optional(),
	weldTypeCode: z.string().optional(),
	baseMetal: z.string().optional(),
	xrayPercent: z
		.union([z.number(), z.string()])
		.optional()
		.transform((val) => {
			if (typeof val === "string") {
				const num = Number.parseInt(val);
				return isNaN(num) ? undefined : num;
			}
			return val;
		}),
	pwhtRequired: z
		.union([z.boolean(), z.string()])
		.optional()
		.transform((val) => {
			if (typeof val === "string") {
				const lower = val.toLowerCase();
				return lower === "true" || lower === "yes" || lower === "1";
			}
			return val;
		}),
	ndeTypes: z
		.union([z.array(z.string()), z.string()])
		.optional()
		.transform((val) => {
			if (typeof val === "string") {
				return val
					.split(",")
					.map((s) => s.trim())
					.filter((s) => s.length > 0);
			}
			return val;
		}),
	welderId: z.string().optional(),
	dateWelded: z.string().optional(),
	tieInNumber: z.string().optional(),
	comments: z.string().optional(),
});

export type ComponentImportData = z.infer<typeof ComponentImportSchema>;

// CSV parsing utilities
export class CSVProcessor {
	private options: ProcessingOptions;

	constructor(options: ProcessingOptions = {}) {
		this.options = {
			batchSize: 100,
			skipRows: 0,
			maxRows: 10000,
			strictMode: true,
			...options,
		};
	}

	async parseCSV(
		buffer: Buffer,
	): Promise<{ headers: string[]; rows: any[]; metadata: FileMetadata }> {
		return new Promise((resolve, reject) => {
			const rows: any[] = [];
			let headers: string[] = [];
			let headersParsed = false;

			const parser = parse({
				columns: false,
				skip_empty_lines: true,
				trim: true,
				delimiter: [",", ";", "\t"], // Auto-detect common delimiters
			});

			parser.on("readable", () => {
				let record: any;
				while ((record = parser.read()) !== null) {
					if (!headersParsed) {
						headers = record;
						headersParsed = true;
					} else {
						if (rows.length < (this.options.maxRows || 10000)) {
							const rowData: any = {};
							headers.forEach((header, index) => {
								rowData[header] = record[index];
							});
							rows.push(rowData);
						}
					}
				}
			});

			parser.on("error", reject);

			parser.on("end", () => {
				const metadata: FileMetadata = {
					filename: "uploaded.csv",
					size: buffer.length,
					mimetype: "text/csv",
					headers,
					rowCount: rows.length,
				};
				resolve({ headers, rows, metadata });
			});

			const stream = new Readable();
			stream.push(buffer);
			stream.push(null);
			stream.pipe(parser);
		});
	}
}

// Excel processing utilities
export class ExcelProcessor {
	private options: ProcessingOptions;

	constructor(options: ProcessingOptions = {}) {
		this.options = {
			batchSize: 100,
			skipRows: 0,
			maxRows: 10000,
			strictMode: true,
			...options,
		};
	}

	async parseExcel(
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

		// Get headers from first row
		const headerRow = worksheet.getRow(1);
		headerRow.eachCell((cell, colNumber) => {
			headers[colNumber - 1] = cell.text.trim();
		});

		// Process data rows
		for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
			if (rows.length >= (this.options.maxRows || 10000)) break;

			const row = worksheet.getRow(rowNumber);
			const rowData: any = {};
			let hasData = false;

			headers.forEach((header, index) => {
				const cell = row.getCell(index + 1);
				const value = this.getCellValue(cell);
				if (value !== null && value !== undefined && value !== "") {
					hasData = true;
				}
				rowData[header] = value;
			});

			if (hasData) {
				rows.push(rowData);
			}
		}

		const metadata: FileMetadata = {
			filename: "uploaded.xlsx",
			size: buffer.length,
			mimetype:
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			headers,
			rowCount: rows.length,
		};

		return { headers, rows, metadata };
	}

	private getCellValue(cell: ExcelJS.Cell): any {
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

	async createExcel(
		data: any[],
		headers: string[],
		sheetName = "Sheet1",
	): Promise<Buffer> {
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet(sheetName);

		// Add headers
		worksheet.addRow(headers);

		// Style headers
		const headerRow = worksheet.getRow(1);
		headerRow.font = { bold: true };
		headerRow.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FFE6E6FA" },
		};

		// Add data
		data.forEach((row) => {
			const values = headers.map((header) => row[header] || "");
			worksheet.addRow(values);
		});

		// Auto-fit columns
		worksheet.columns.forEach((column) => {
			column.width = 15;
		});

		return workbook.xlsx.writeBuffer() as Promise<Buffer>;
	}
}

// Column mapping utilities
export class ColumnMapper {
	private standardMappings: Record<string, string[]> = {
		componentId: [
			"component_id",
			"part_number",
			"tag",
			"id",
			"component",
			"part",
			"commodity_code",
		],
		type: ["type", "component_type", "item_type", "category"],
		workflowType: ["workflow_type", "workflow", "work_type"],
		drawingId: [
			"drawing_id",
			"drawing",
			"drawing_number",
			"dwg",
			"drawing_id",
		],
		spec: ["spec", "specification", "specs"],
		size: ["size", "dimension", "diameter"],
		material: ["material", "mat", "material_type"],
		pressureRating: [
			"pressure_rating",
			"pressure",
			"rating",
			"press_rating",
		],
		description: ["description", "desc", "item_description", "details"],
		area: ["area", "plant_area", "location_area"],
		system: ["system", "plant_system", "process_system"],
		testPackage: ["test_package", "test_pkg", "package", "test_group"],
		testPressure: ["test_pressure", "test_press", "pressure_test"],
		testRequired: ["test_required", "test_req", "requires_test"],
		totalLength: ["total_length", "length", "pipe_length"],
		lengthUnit: ["length_unit", "unit", "length_uom"],
		totalQuantity: ["total_quantity", "quantity", "qty"],
		quantityUnit: ["quantity_unit", "qty_unit", "quantity_uom"],
	};

	autoMapColumns(sourceHeaders: string[]): ColumnMapping[] {
		const mappings: ColumnMapping[] = [];
		const normalizedHeaders = sourceHeaders.map((h) =>
			h
				.toLowerCase()
				.trim()
				.replace(/[^a-z0-9]/g, "_"),
		);

		for (const [targetField, variations] of Object.entries(
			this.standardMappings,
		)) {
			let bestMatch: { header: string; score: number } | null = null;

			for (let i = 0; i < normalizedHeaders.length; i++) {
				const normalizedHeader = normalizedHeaders[i];

				for (const variation of variations) {
					const score = this.calculateSimilarity(
						normalizedHeader,
						variation,
					);
					if (
						score > 0.7 &&
						(!bestMatch || score > bestMatch.score)
					) {
						bestMatch = { header: sourceHeaders[i], score };
					}
				}
			}

			if (bestMatch) {
				mappings.push({
					sourceColumn: bestMatch.header,
					targetField,
					required: ["componentId", "type", "workflowType"].includes(
						targetField,
					),
				});
			}
		}

		return mappings;
	}

	private calculateSimilarity(str1: string, str2: string): number {
		if (str1 === str2) return 1;
		if (str1.includes(str2) || str2.includes(str1)) return 0.8;

		// Simple edit distance calculation
		const len1 = str1.length;
		const len2 = str2.length;
		const matrix = Array(len2 + 1)
			.fill(null)
			.map(() => Array(len1 + 1).fill(null));

		for (let i = 0; i <= len1; i++) matrix[0][i] = i;
		for (let j = 0; j <= len2; j++) matrix[j][0] = j;

		for (let j = 1; j <= len2; j++) {
			for (let i = 1; i <= len1; i++) {
				const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
				matrix[j][i] = Math.min(
					matrix[j - 1][i] + 1,
					matrix[j][i - 1] + 1,
					matrix[j - 1][i - 1] + cost,
				);
			}
		}

		const maxLength = Math.max(len1, len2);
		return maxLength > 0 ? 1 - matrix[len2][len1] / maxLength : 1;
	}
}

// Data validation utilities
export class DataValidator {
	async validateComponentData(
		data: any[],
		mappings: ColumnMapping[],
		validationContext?: {
			projectId: string;
			existingDrawings?: Set<string>;
			existingTemplates?: Set<string>;
		},
	): Promise<ValidationResult> {
		const errors: ValidationError[] = [];
		const warnings: ValidationError[] = [];
		const validRows: ComponentImportData[] = [];
		const invalidRows: any[] = [];

		for (let i = 0; i < data.length; i++) {
			const row = data[i];
			const rowErrors: ValidationError[] = [];

			// Map source data to target schema
			const mappedData: any = {};
			for (const mapping of mappings) {
				const sourceValue = row[mapping.sourceColumn];
				let targetValue = sourceValue;

				// Apply transformation if provided
				if (mapping.transform) {
					try {
						targetValue = mapping.transform(sourceValue);
					} catch (error) {
						rowErrors.push({
							row: i + 1,
							field: mapping.targetField,
							error: `Transformation failed: ${error}`,
							value: sourceValue,
						});
						continue;
					}
				}

				// Clean up empty values for optional fields
				if (
					targetValue === "" ||
					targetValue === null ||
					targetValue === undefined
				) {
					// For optional fields, don't include them in the mapped data
					const optionalFields = [
						"spec",
						"size",
						"material",
						"pressureRating",
						"description",
						"area",
						"system",
						"testPackage",
						"testPressure",
						"testRequired",
						"totalLength",
						"lengthUnit",
						"totalQuantity",
						"quantityUnit",
						"milestoneTemplateId",
						// Field weld specific fields
						"weldSize",
						"schedule",
						"weldTypeCode",
						"baseMetal",
						"xrayPercent",
						"pwhtRequired",
						"ndeTypes",
						"welderId",
						"dateWelded",
						"tieInNumber",
						"comments",
					];
					if (!optionalFields.includes(mapping.targetField)) {
						mappedData[mapping.targetField] = targetValue;
					}
					// Optional fields with empty values are simply omitted
				} else {
					// Convert numbers to strings for string-typed fields
					// This preserves reducer sizes (2X1) and fractions (1/2) that are already strings
					const stringFields = [
						"size",
						"spec",
						"material",
						"pressureRating",
						"description",
						"area",
						"system",
						"testPackage",
						"lengthUnit",
						"quantityUnit",
						"testRequired",
						// Field weld string fields
						"weldSize",
						"schedule",
						"weldTypeCode",
						"baseMetal",
						"welderId",
						"dateWelded",
						"tieInNumber",
						"comments",
					];

					if (
						typeof targetValue === "number" &&
						stringFields.includes(mapping.targetField)
					) {
						// Convert pure numbers (1, 2, 3) to strings ("1", "2", "3")
						mappedData[mapping.targetField] = String(targetValue);
					} else {
						// Keep strings as-is (preserves "2X1", "1/2", etc.)
						mappedData[mapping.targetField] = targetValue;
					}
				}
			}

			// Ensure critical string fields are properly converted from Excel data types
			// Excel might return numbers, booleans, or other types that need string methods
			const ensureString = (value: any): string => {
				if (value === null || value === undefined) return "";
				return String(value).trim();
			};

			// Convert key fields that must be strings
			if (mappedData.componentId !== undefined) {
				mappedData.componentId = ensureString(mappedData.componentId);
			}
			if (mappedData.drawingId !== undefined) {
				mappedData.drawingId = ensureString(mappedData.drawingId);
			}

			// Normalize component type to uppercase (required by database enum)
			if (mappedData.type) {
				mappedData.type = ensureString(mappedData.type).toUpperCase();
			}

			// Auto-determine workflowType if missing
			if (!mappedData.workflowType && mappedData.type) {
				switch (mappedData.type) {
					case "VALVE":
					case "GASKET":
					case "FITTING":
					case "FLANGE":
					case "SUPPORT":
					case "INSTRUMENT":
						mappedData.workflowType = "MILESTONE_DISCRETE";
						break;
					case "SPOOL":
					case "PIPING_FOOTAGE":
					case "THREADED_PIPE":
						mappedData.workflowType = "MILESTONE_PERCENTAGE";
						break;
					case "FIELD_WELD":
						mappedData.workflowType = "MILESTONE_QUANTITY";
						break;
					default:
						mappedData.workflowType = "MILESTONE_DISCRETE";
				}
			}

			// Field weld-specific validation
			if (mappedData.type === "FIELD_WELD") {
				// Validate weld ID format (must be unique and not empty)
				const weldId = ensureString(mappedData.componentId);
				if (!weldId || weldId === "") {
					rowErrors.push({
						row: i + 1,
						field: "componentId",
						error: "Weld ID is required for field welds",
						value: mappedData.componentId,
					});
				}

				// Validate schedule format if provided
				if (mappedData.schedule) {
					const schedule = ensureString(mappedData.schedule);
					const schedulePattern =
						/^(Sch\s*\d+|S\d+|XS|XXS|STD|XS|Sch\s*(10|20|30|40|60|80|100|120|140|160))$/i;
					if (!schedulePattern.test(schedule)) {
						warnings.push({
							row: i + 1,
							field: "schedule",
							error: "Schedule format may be incorrect (expected: Sch 40, XS, etc.)",
							value: schedule,
						});
					}
				}

				// Validate weld type code if provided
				if (mappedData.weldTypeCode) {
					const weldTypeCode = ensureString(
						mappedData.weldTypeCode,
					).toUpperCase();
					const validWeldTypes = [
						"BW",
						"SW",
						"TW",
						"FW",
						"CW",
						"BT",
						"ST",
					];
					if (!validWeldTypes.includes(weldTypeCode)) {
						warnings.push({
							row: i + 1,
							field: "weldTypeCode",
							error: `Unknown weld type code. Expected: ${validWeldTypes.join(", ")}`,
							value: weldTypeCode,
						});
					}
				}

				// Validate X-ray percentage if provided
				if (mappedData.xrayPercent !== undefined) {
					const xrayValue = Number(mappedData.xrayPercent);
					if (isNaN(xrayValue) || xrayValue < 0 || xrayValue > 100) {
						rowErrors.push({
							row: i + 1,
							field: "xrayPercent",
							error: "X-ray percentage must be a number between 0 and 100",
							value: mappedData.xrayPercent,
						});
					}
				}

				// Validate PWHT required field if provided
				if (mappedData.pwhtRequired !== undefined) {
					const pwhtValue = String(
						mappedData.pwhtRequired,
					).toUpperCase();
					if (
						!["TRUE", "FALSE", "YES", "NO", "1", "0"].includes(
							pwhtValue,
						)
					) {
						rowErrors.push({
							row: i + 1,
							field: "pwhtRequired",
							error: "PWHT Required must be TRUE/FALSE, YES/NO, or 1/0",
							value: mappedData.pwhtRequired,
						});
					} else {
						// Normalize to boolean
						mappedData.pwhtRequired = ["TRUE", "YES", "1"].includes(
							pwhtValue,
						);
					}
				}

				// Validate NDE types if provided
				if (mappedData.ndeTypes) {
					const validNdeTypes = [
						"RT",
						"PT",
						"MT",
						"UT",
						"VT",
						"ET",
						"AE",
					];
					const ndeList = String(mappedData.ndeTypes)
						.split(",")
						.map((nde) => nde.trim().toUpperCase());
					const invalidNdeTypes = ndeList.filter(
						(nde) => !validNdeTypes.includes(nde),
					);

					if (invalidNdeTypes.length > 0) {
						warnings.push({
							row: i + 1,
							field: "ndeTypes",
							error: `Unknown NDE types: ${invalidNdeTypes.join(", ")}. Valid types: ${validNdeTypes.join(", ")}`,
							value: mappedData.ndeTypes,
						});
					}

					// Convert to array format
					mappedData.ndeTypes = ndeList.filter((nde) =>
						validNdeTypes.includes(nde),
					);
				}

				// Validate date format if provided
				if (mappedData.dateWelded) {
					const dateValue = new Date(mappedData.dateWelded);
					if (isNaN(dateValue.getTime())) {
						rowErrors.push({
							row: i + 1,
							field: "dateWelded",
							error: "Invalid date format. Use YYYY-MM-DD format",
							value: mappedData.dateWelded,
						});
					} else {
						// Check if date is not in the future
						if (dateValue > new Date()) {
							warnings.push({
								row: i + 1,
								field: "dateWelded",
								error: "Weld date is in the future",
								value: mappedData.dateWelded,
							});
						}
					}
				}

				// Validate size format for field welds
				if (mappedData.size || mappedData.weldSize) {
					const sizeValue = mappedData.weldSize || mappedData.size;
					const sizePattern = /^\d+(\.\d+)?"?$|^\d+\/\d+"?$/; // Matches: 6", 1.5", 1/2"
					if (!sizePattern.test(sizeValue)) {
						warnings.push({
							row: i + 1,
							field: mappedData.weldSize ? "weldSize" : "size",
							error: 'Size format may be incorrect (expected: 6", 1.5", 1/2")',
							value: sizeValue,
						});
					}
				}
			}

			// Validate against schema
			try {
				const validatedData = ComponentImportSchema.parse(mappedData);

				// Additional business logic validation
				if (validationContext) {
					if (
						mappedData.drawingId &&
						validationContext.existingDrawings &&
						!validationContext.existingDrawings.has(
							mappedData.drawingId,
						)
					) {
						warnings.push({
							row: i + 1,
							field: "drawingId",
							error: `Drawing number '${mappedData.drawingId}' not found in project. The drawing will be auto-created during import.`,
							value: mappedData.drawingId,
						});
					}

					if (
						mappedData.milestoneTemplateId &&
						validationContext.existingTemplates &&
						!validationContext.existingTemplates.has(
							mappedData.milestoneTemplateId,
						)
					) {
						warnings.push({
							row: i + 1,
							field: "milestoneTemplateId",
							error: "Milestone template not found in system",
							value: mappedData.milestoneTemplateId,
						});
					}
				}

				if (rowErrors.length === 0) {
					validRows.push(validatedData);
				} else {
					invalidRows.push({ ...row, _errors: rowErrors });
					errors.push(...rowErrors);
				}
			} catch (error) {
				if (error instanceof z.ZodError) {
					const zodErrors = error.errors
						.filter(
							(err) => err.message && err.message.trim() !== "",
						) // Filter out empty error messages
						.map((err) => ({
							row: i + 1,
							field: err.path.join("."),
							error: err.message || "Validation error",
							value: err.path.reduce(
								(obj, key) => obj?.[key],
								mappedData,
							),
						}));

					// Only add errors if there are actual validation issues
					if (zodErrors.length > 0) {
						rowErrors.push(...zodErrors);
						errors.push(...zodErrors);
						invalidRows.push({ ...row, _errors: rowErrors });
					} else {
						// No actual errors, treat as valid
						validRows.push(mappedData);
					}
				} else {
					const generalError = {
						row: i + 1,
						field: "general",
						error: `Validation failed: ${error}`,
						value: mappedData,
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
}

// Instance tracking utilities
export class InstanceTracker {
	static async calculateInstanceNumbers(
		components: ComponentImportData[],
		existingComponents: Map<
			string,
			Array<{
				componentId: string;
				instanceNumber: number;
				drawingId?: string;
				size?: string;
			}>
		> = new Map(),
	): Promise<ComponentImportData[]> {
		console.log(
			`InstanceTracker: Starting instance calculation for ${components.length} components`,
		);

		// Step 1: Expand components based on quantity
		const expandedComponents = [];
		for (const component of components) {
			const quantity = Number(component.totalQuantity) || 1;

			for (let q = 0; q < quantity; q++) {
				expandedComponents.push({
					...component,
					_quantityIndex: q, // Track which quantity-based instance this is
				});
			}
		}

		console.log(
			`InstanceTracker: Expanded to ${expandedComponents.length} components after quantity expansion`,
		);

		// Step 2: Group by drawingId + componentId + size (PER DRAWING)
		const instanceGroups = new Map<string, ComponentImportData[]>();

		for (const component of expandedComponents) {
			if (!component.drawingId) {
				console.warn(
					`InstanceTracker: Component ${component.componentId} has no drawingId, will be handled separately`,
				);
				continue;
			}

			// Create key with size (empty string if no size) - THIS IS PER DRAWING
			const key = `${component.drawingId}|${component.componentId}|${(component as any).size || ""}`;

			if (!instanceGroups.has(key)) {
				instanceGroups.set(key, []);
			}
			instanceGroups.get(key)!.push(component);
		}

		console.log(
			`InstanceTracker: Created ${instanceGroups.size} instance groups`,
		);

		// Step 3: Assign instance numbers PER DRAWING
		const processedComponents = [];

		for (const [key, groupComponents] of instanceGroups) {
			const [drawingId, componentId, size] = key.split("|");

			console.log(
				`InstanceTracker: Processing group ${key} with ${groupComponents.length} new components`,
			);

			// Get existing instances with EXACTLY the same key (same drawing + component + size)
			const existingInstances = existingComponents.get(key) || [];
			console.log(
				`InstanceTracker: Found ${existingInstances.length} existing instances for key ${key}`,
			);

			// Calculate next instance number starting from existing + 1
			const nextInstanceNumber =
				existingInstances.length > 0
					? Math.max(
							...existingInstances.map((c) => c.instanceNumber),
						) + 1
					: 1;

			// Calculate total instances on THIS drawing
			const totalInstancesOnThisDrawing =
				existingInstances.length + groupComponents.length;

			console.log(
				`InstanceTracker: For group ${key}, starting instance number: ${nextInstanceNumber}, total instances on drawing: ${totalInstancesOnThisDrawing}`,
			);

			for (let i = 0; i < groupComponents.length; i++) {
				const component = { ...groupComponents[i] };
				const instanceNumber = nextInstanceNumber + i;

				// Validate instance number is reasonable
				if (instanceNumber > totalInstancesOnThisDrawing) {
					console.error(
						`InstanceTracker: ERROR - Instance number ${instanceNumber} exceeds total instances ${totalInstancesOnThisDrawing} for ${key}`,
					);
					console.error(
						`InstanceTracker: Debug - existingInstances: ${existingInstances.length}, newComponents: ${groupComponents.length}, starting: ${nextInstanceNumber}`,
					);
					throw new Error(
						`Invalid instance calculation: instance ${instanceNumber} > total ${totalInstancesOnThisDrawing} for component ${componentId} on drawing ${drawingId}`,
					);
				}

				// Create display ID
				let displayId = componentId;
				if (size) {
					displayId += ` ${size}`; // Include size in display
				}
				if (totalInstancesOnThisDrawing > 1) {
					displayId += ` (${instanceNumber} of ${totalInstancesOnThisDrawing})`;
				}

				(component as any).instanceNumber = instanceNumber;
				(component as any).totalInstancesOnDrawing =
					totalInstancesOnThisDrawing;
				(component as any).displayId = displayId;

				console.log(
					`InstanceTracker: Created component instance: ${displayId}, instance ${instanceNumber} of ${totalInstancesOnThisDrawing}`,
				);

				processedComponents.push(component);
			}
		}

		// Handle components without drawing IDs
		let componentsWithoutDrawing = 0;
		for (const component of expandedComponents) {
			if (!component.drawingId) {
				processedComponents.push({
					...component,
					instanceNumber: 1,
					totalInstancesOnDrawing: 1,
					displayId: component.componentId,
				} as any);
				componentsWithoutDrawing++;
			}
		}

		if (componentsWithoutDrawing > 0) {
			console.warn(
				`InstanceTracker: ${componentsWithoutDrawing} components processed without drawing IDs`,
			);
		}

		console.log(
			`InstanceTracker: Completed instance calculation. Returning ${processedComponents.length} processed components`,
		);

		return processedComponents;
	}
}

// Batch processing utilities
export class BatchProcessor {
	static async processInBatches<T, R>(
		items: T[],
		processor: (batch: T[]) => Promise<R[]>,
		batchSize = 100,
		onProgress?: (processed: number, total: number) => void,
	): Promise<R[]> {
		const results: R[] = [];

		for (let i = 0; i < items.length; i += batchSize) {
			const batch = items.slice(i, i + batchSize);
			const batchResults = await processor(batch);
			results.push(...batchResults);

			if (onProgress) {
				onProgress(Math.min(i + batchSize, items.length), items.length);
			}
		}

		return results;
	}
}

// Error reporting utilities
export class ErrorReporter {
	static generateErrorReport(
		errors: ValidationError[],
		warnings: ValidationError[],
	): {
		summary: any;
		csvData: string;
	} {
		const summary = {
			totalErrors: errors.length,
			totalWarnings: warnings.length,
			errorsByField: ErrorReporter.groupErrorsByField(errors),
			warningsByField: ErrorReporter.groupErrorsByField(warnings),
		};

		// Generate CSV for detailed error report
		const allIssues = [
			...errors.map((e) => ({ ...e, type: "ERROR" })),
			...warnings.map((w) => ({ ...w, type: "WARNING" })),
		];

		const csvHeaders = ["Row", "Type", "Field", "Error", "Value"];
		const csvRows = allIssues.map((issue) => [
			issue.row,
			issue.type,
			issue.field,
			issue.error,
			String(issue.value || ""),
		]);

		const csvData = [
			csvHeaders.join(","),
			...csvRows.map((row) =>
				row
					.map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
					.join(","),
			),
		].join("\n");

		return { summary, csvData };
	}

	private static groupErrorsByField(
		errors: ValidationError[],
	): Record<string, number> {
		return errors.reduce(
			(acc, error) => {
				acc[error.field] = (acc[error.field] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>,
		);
	}
}

// Template resolution for component imports
export class TemplateResolver {
	private static readonly COMPONENT_TYPE_MAPPING: Record<string, string> = {
		// Full Milestone Set (Spools & Piping)
		SPOOL: "Full Milestone Set",
		PIPE: "Full Milestone Set",
		PIPING: "Full Milestone Set",
		PIPING_FOOTAGE: "Full Milestone Set",
		LARGE_BORE: "Full Milestone Set",

		// Reduced Milestone Set (Valves, Gaskets, Supports, Instruments)
		GASKET: "Reduced Milestone Set",
		VALVE: "Reduced Milestone Set",
		FITTING: "Reduced Milestone Set",
		FLANGE: "Reduced Milestone Set",
		SUPPORT: "Reduced Milestone Set",
		INSTRUMENT: "Reduced Milestone Set",
		TRANSMITTER: "Reduced Milestone Set",
		GAUGE: "Reduced Milestone Set",
		SWITCH: "Reduced Milestone Set",
		ANALYZER: "Reduced Milestone Set",
		HANGER: "Reduced Milestone Set",
		CLAMP: "Reduced Milestone Set",
		GUIDE: "Reduced Milestone Set",
		ANCHOR: "Reduced Milestone Set",
		SPRING_HANGER: "Reduced Milestone Set",
		RIGID_SUPPORT: "Reduced Milestone Set",

		// Field Weld Template
		FIELD_WELD: "Field Weld",
		WELD: "Field Weld",
		FIELD_JOINT: "Field Weld",

		// Insulation Template
		INSULATION: "Insulation",
		INSUL: "Insulation",

		// Paint Template
		PAINT: "Paint",
		COATING: "Paint",
		PRIMER: "Paint",
	};

	private static readonly COMPONENT_TYPE_PATTERNS: Array<{
		pattern: RegExp;
		template: string;
	}> = [
		// Gasket patterns
		{ pattern: /^GK/i, template: "Reduced Milestone Set" },
		{ pattern: /GASKET/i, template: "Reduced Milestone Set" },
		{ pattern: /GKT/i, template: "Reduced Milestone Set" },

		// Valve patterns
		{ pattern: /^VLV/i, template: "Reduced Milestone Set" },
		{ pattern: /VALVE/i, template: "Reduced Milestone Set" },
		{ pattern: /^V-/i, template: "Reduced Milestone Set" },

		// Fitting patterns
		{ pattern: /FITTING/i, template: "Reduced Milestone Set" },
		{ pattern: /^FTG/i, template: "Reduced Milestone Set" },
		{ pattern: /ELBOW/i, template: "Reduced Milestone Set" },
		{ pattern: /TEE/i, template: "Reduced Milestone Set" },

		// Support patterns
		{ pattern: /SUPP/i, template: "Reduced Milestone Set" },
		{ pattern: /HANG/i, template: "Reduced Milestone Set" },
		{ pattern: /SPPT/i, template: "Reduced Milestone Set" },
		{ pattern: /^H-/i, template: "Reduced Milestone Set" },

		// Instrument patterns
		{ pattern: /^I-/i, template: "Reduced Milestone Set" },
		{ pattern: /INSTR/i, template: "Reduced Milestone Set" },
		{ pattern: /^FT-/i, template: "Reduced Milestone Set" },
		{ pattern: /^PT-/i, template: "Reduced Milestone Set" },
		{ pattern: /^TT-/i, template: "Reduced Milestone Set" },

		// Spool patterns
		{ pattern: /^SP/i, template: "Full Milestone Set" },
		{ pattern: /SPOOL/i, template: "Full Milestone Set" },
		{ pattern: /^P-/i, template: "Full Milestone Set" },

		// Pipe patterns
		{ pattern: /PIPE/i, template: "Full Milestone Set" },
		{ pattern: /^L-/i, template: "Full Milestone Set" },

		// Field weld patterns
		{ pattern: /^FW/i, template: "Field Weld" },
		{ pattern: /FIELD.*WELD/i, template: "Field Weld" },
		{ pattern: /^W-/i, template: "Field Weld" },

		// Insulation patterns
		{ pattern: /INSUL/i, template: "Insulation" },
		{ pattern: /^INS/i, template: "Insulation" },

		// Paint patterns
		{ pattern: /PAINT/i, template: "Paint" },
		{ pattern: /COAT/i, template: "Paint" },
	];

	/**
	 * Load milestone templates for a project
	 */
	static async loadTemplatesForProject(
		projectId: string,
	): Promise<Map<string, any>> {
		const templates = await prisma.milestoneTemplate.findMany({
			where: { projectId },
		});

		const templateMap = new Map();
		for (const template of templates) {
			templateMap.set(template.name, template);
		}

		return templateMap;
	}

	/**
	 * Resolve the appropriate milestone template for a component
	 */
	static resolveTemplateForComponent(
		componentType: string,
		componentId: string,
		templates: Map<string, any>,
	): string | null {
		// First, try exact type mapping
		const normalizedType = String(componentType || "").toUpperCase();
		let templateName =
			TemplateResolver.COMPONENT_TYPE_MAPPING[normalizedType];

		// If no exact match, try pattern matching on both type and ID
		if (!templateName) {
			for (const {
				pattern,
				template,
			} of TemplateResolver.COMPONENT_TYPE_PATTERNS) {
				if (
					pattern.test(componentType || "") ||
					pattern.test(componentId || "")
				) {
					templateName = template;
					break;
				}
			}
		}

		// Default to Full Milestone Set if nothing matches
		if (!templateName) {
			templateName = "Full Milestone Set";
		}

		// Get the actual template
		const template = templates.get(templateName);
		if (!template) {
			console.error(
				`TemplateResolver: Template "${templateName}" not found in templates map. Available: ${Array.from(templates.keys()).join(", ")}`,
			);
			// Fallback to any available template
			const fallbackTemplate = Array.from(templates.values())[0];
			return fallbackTemplate?.id || null;
		}

		return template.id;
	}

	/**
	 * Ensure all required milestone templates exist for a project
	 */
	static async ensureTemplatesExist(
		projectId: string,
	): Promise<Map<string, any>> {
		const MILESTONE_TEMPLATES = [
			{
				name: "Full Milestone Set",
				description: "For spools and piping by footage",
				milestones: [
					{ name: "Receive", weight: 5, order: 1 },
					{ name: "Erect", weight: 30, order: 2 },
					{ name: "Connect", weight: 30, order: 3 },
					{ name: "Support", weight: 15, order: 4 },
					{ name: "Punch", weight: 5, order: 5 },
					{ name: "Test", weight: 10, order: 6 },
					{ name: "Restore", weight: 5, order: 7 },
				],
			},
			{
				name: "Reduced Milestone Set",
				description: "For valves, gaskets, supports, instruments",
				milestones: [
					{ name: "Receive", weight: 10, order: 1 },
					{ name: "Install", weight: 60, order: 2 },
					{ name: "Punch", weight: 10, order: 3 },
					{ name: "Test", weight: 15, order: 4 },
					{ name: "Restore", weight: 5, order: 5 },
				],
			},
			{
				name: "Field Weld",
				description: "For field welds",
				milestones: [
					{ name: "Fit Up", weight: 10, order: 1 },
					{ name: "Weld Made", weight: 60, order: 2 },
					{ name: "Punch", weight: 10, order: 3 },
					{ name: "Test", weight: 15, order: 4 },
					{ name: "Restore", weight: 5, order: 5 },
				],
			},
			{
				name: "Insulation",
				description: "For insulation work",
				milestones: [
					{ name: "Insulate", weight: 60, order: 1 },
					{ name: "Metal Out", weight: 40, order: 2 },
				],
			},
			{
				name: "Paint",
				description: "For paint/coating work",
				milestones: [
					{ name: "Primer", weight: 40, order: 1 },
					{ name: "Finish Coat", weight: 60, order: 2 },
				],
			},
		];

		const existingTemplates =
			await TemplateResolver.loadTemplatesForProject(projectId);

		// Create missing templates
		for (const templateDef of MILESTONE_TEMPLATES) {
			if (!existingTemplates.has(templateDef.name)) {
				const template = await prisma.milestoneTemplate.create({
					data: {
						projectId,
						name: templateDef.name,
						description: templateDef.description,
						milestones: JSON.stringify(templateDef.milestones),
						isDefault: templateDef.name === "Full Milestone Set",
					},
				});

				existingTemplates.set(templateDef.name, template);
			}
		}

		return existingTemplates;
	}

	/**
	 * Process component data during import and assign the correct template
	 */
	static async processComponentsForImport(
		components: any[],
		projectId: string,
	): Promise<any[]> {
		// Ensure all templates exist
		const templates =
			await TemplateResolver.ensureTemplatesExist(projectId);

		// Assign templates to components
		return components.map((component) => {
			if (!component.milestoneTemplateId) {
				component.milestoneTemplateId =
					TemplateResolver.resolveTemplateForComponent(
						component.type,
						component.componentId,
						templates,
					);
			}

			return component;
		});
	}
}
