#!/usr/bin/env tsx
/**
 * Universal Import Script for PipeTrak
 * Handles Excel, CSV, and JSON imports with automatic format detection
 *
 * Usage:
 *   pnpm --filter scripts import <file> --project-id <id>
 *   pnpm --filter scripts import data.xlsx --project-id abc123
 *   pnpm --filter scripts import data.json --dry-run
 *   pnpm --filter scripts import data.csv --skip-duplicates
 */

import { db as prisma } from "@repo/database";
import { logger } from "@repo/logs";
import { promises as fs } from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import { parse as parseCSV } from "csv-parse/sync";
import {
	PipeTrakImporter,
	type ImportData,
	type ImportOptions,
	type ImportResult,
	type ComponentImportData,
	type MilestoneImportData,
	type DrawingImportData,
	ImportValidator,
} from "./lib/import-utils";

// ========== File Parsers ==========

/**
 * Detect file format from extension
 */
function detectFileFormat(filePath: string): "excel" | "csv" | "json" {
	const ext = path.extname(filePath).toLowerCase();

	if (ext === ".xlsx" || ext === ".xls") return "excel";
	if (ext === ".csv") return "csv";
	if (ext === ".json") return "json";

	throw new Error(
		`Unsupported file format: ${ext}. Supported formats: .xlsx, .xls, .csv, .json`,
	);
}

/**
 * Parse Excel file
 */
async function parseExcelFile(filePath: string): Promise<ImportData> {
	logger.info(`Parsing Excel file: ${filePath}`);

	const workbook = XLSX.readFile(filePath);
	const data: ImportData = {
		components: [],
		drawings: [],
	};

	// Look for specific sheets or use the first one
	const componentSheet =
		workbook.Sheets["Components"] ||
		workbook.Sheets["Component"] ||
		workbook.Sheets[workbook.SheetNames[0]];

	if (componentSheet) {
		const rows = XLSX.utils.sheet_to_json(componentSheet);
		data.components = rows.map((row) => parseExcelComponentRow(row));
	}

	// Check for drawings sheet
	const drawingSheet =
		workbook.Sheets["Drawings"] || workbook.Sheets["Drawing"];
	if (drawingSheet) {
		const rows = XLSX.utils.sheet_to_json(drawingSheet);
		data.drawings = rows.map((row) => parseExcelDrawingRow(row));
	}

	// Check for milestones in separate sheet
	const milestoneSheet =
		workbook.Sheets["Milestones"] || workbook.Sheets["Milestone"];
	if (milestoneSheet) {
		const rows = XLSX.utils.sheet_to_json(milestoneSheet);
		mergeMilestonesIntoComponents(data.components, rows);
	}

	logger.info(`Parsed ${data.components.length} components from Excel`);
	return data;
}

/**
 * Parse a single Excel component row
 */
function parseExcelComponentRow(row: any): ComponentImportData {
	// Map various possible column names to our standard fields
	const component: ComponentImportData = {
		componentId:
			row["Component ID"] ||
			row["ComponentID"] ||
			row["ID"] ||
			row["Tag"],
		type: row["Type"] || row["Component Type"],
		spec: row["Spec"] || row["Specification"],
		size: row["Size"] || row["Diameter"],
		material: row["Material"] || row["Mat"],
		area: row["Area"] || row["Zone"],
		system: row["System"] || row["Service"],
		testPackage: row["Test Package"] || row["TP"] || row["Package"],
		drawingNumber: row["Drawing"] || row["Drawing Number"] || row["DWG"],
		workflowType: normalizeWorkflowType(
			row["Workflow Type"] || row["Workflow"],
		),
		milestones: [],
	};

	// Check for inline milestone columns (e.g., "Received", "Fit-up", etc.)
	const milestoneColumns = [
		"Received",
		"Fit-up",
		"Fitted",
		"Welded",
		"Tested",
		"Insulated",
		"Delivered",
		"Installed",
		"Connected",
		"Commissioned",
	];

	for (const milestoneName of milestoneColumns) {
		if (row[milestoneName] !== undefined) {
			const value = row[milestoneName];
			const milestone: MilestoneImportData = {
				name: milestoneName,
				completed: parseBoolean(value),
				completedDate: parseDate(row[`${milestoneName} Date`]),
			};
			component.milestones!.push(milestone);
		}
	}

	return component;
}

/**
 * Parse a single Excel drawing row
 */
function parseExcelDrawingRow(row: any): DrawingImportData {
	return {
		number: row["Drawing Number"] || row["Number"] || row["DWG"],
		title: row["Title"] || row["Description"] || row["Name"],
		revision: row["Revision"] || row["Rev"],
	};
}

/**
 * Merge milestone data from separate sheet
 */
function mergeMilestonesIntoComponents(
	components: ComponentImportData[],
	milestoneRows: any[],
): void {
	const milestonesByComponent = new Map<string, MilestoneImportData[]>();

	for (const row of milestoneRows) {
		const componentId = row["Component ID"] || row["ComponentID"];
		if (!componentId) continue;

		const milestone: MilestoneImportData = {
			name: row["Milestone"] || row["Name"],
			completed: parseBoolean(row["Completed"] || row["Status"]),
			completedDate: parseDate(row["Completed Date"] || row["Date"]),
			weight: parseNumber(row["Weight"]),
			percentageValue: parseNumber(row["Percentage"]),
			quantityValue: parseNumber(row["Quantity"]),
			quantityUnit: row["Unit"],
		};

		if (!milestonesByComponent.has(componentId)) {
			milestonesByComponent.set(componentId, []);
		}
		milestonesByComponent.get(componentId)!.push(milestone);
	}

	// Merge milestones into components
	for (const component of components) {
		const milestones = milestonesByComponent.get(component.componentId);
		if (milestones) {
			component.milestones = milestones;
		}
	}
}

/**
 * Parse CSV file
 */
async function parseCSVFile(filePath: string): Promise<ImportData> {
	logger.info(`Parsing CSV file: ${filePath}`);

	const content = await fs.readFile(filePath, "utf-8");
	const rows = parseCSV(content, {
		columns: true,
		skip_empty_lines: true,
		trim: true,
	});

	const components = rows.map((row: any) => parseExcelComponentRow(row));

	logger.info(`Parsed ${components.length} components from CSV`);
	return { components };
}

/**
 * Parse JSON file
 */
async function parseJSONFile(filePath: string): Promise<ImportData> {
	logger.info(`Parsing JSON file: ${filePath}`);

	const content = await fs.readFile(filePath, "utf-8");
	const data = JSON.parse(content);

	// Check if it's already in our format
	if (data.components && Array.isArray(data.components)) {
		logger.info(`Parsed ${data.components.length} components from JSON`);
		return data as ImportData;
	}

	// Try to parse as array of components
	if (Array.isArray(data)) {
		logger.info(`Parsed ${data.length} components from JSON array`);
		return { components: data };
	}

	throw new Error(
		"Invalid JSON format. Expected either {components: [...]} or an array of components",
	);
}

// ========== Helper Functions ==========

function normalizeWorkflowType(
	value: any,
):
	| "MILESTONE_DISCRETE"
	| "MILESTONE_PERCENTAGE"
	| "MILESTONE_QUANTITY"
	| undefined {
	if (!value) return undefined;

	const str = String(value).toUpperCase();
	if (str.includes("DISCRETE") || str.includes("CHECKBOX"))
		return "MILESTONE_DISCRETE";
	if (str.includes("PERCENT")) return "MILESTONE_PERCENTAGE";
	if (str.includes("QUANTITY")) return "MILESTONE_QUANTITY";

	return "MILESTONE_DISCRETE";
}

function parseBoolean(value: any): boolean {
	if (typeof value === "boolean") return value;
	if (typeof value === "number") return value > 0;
	if (typeof value === "string") {
		const lower = value.toLowerCase();
		return (
			lower === "true" ||
			lower === "yes" ||
			lower === "y" ||
			lower === "1" ||
			lower === "x"
		);
	}
	return false;
}

function parseDate(value: any): string | undefined {
	if (!value) return undefined;

	// If it's already a date string, return it
	if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
		return value;
	}

	// Try to parse Excel date number
	if (typeof value === "number") {
		const date = XLSX.SSF.parse_date_code(value);
		return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
	}

	// Try to parse as Date
	try {
		const date = new Date(value);
		if (!isNaN(date.getTime())) {
			return date.toISOString().split("T")[0];
		}
	} catch {
		// Invalid date
	}

	return undefined;
}

function parseNumber(value: any): number | undefined {
	if (value === null || value === undefined || value === "") return undefined;
	const num = Number(value);
	return isNaN(num) ? undefined : num;
}

// ========== Main Import Function ==========

async function importFile(
	filePath: string,
	projectId: string,
	userId: string,
	options: ImportOptions = {},
): Promise<ImportResult> {
	try {
		// Verify file exists
		const stats = await fs.stat(filePath);
		if (!stats.isFile()) {
			throw new Error(`${filePath} is not a file`);
		}

		const fileName = path.basename(filePath);
		logger.info(`Starting import from: ${fileName}`);

		if (options.dryRun) {
			logger.info("DRY RUN MODE - No data will be saved");
		}

		// Detect and parse file
		const format = detectFileFormat(filePath);
		let data: ImportData;

		switch (format) {
			case "excel":
				data = await parseExcelFile(filePath);
				break;
			case "csv":
				data = await parseCSVFile(filePath);
				break;
			case "json":
				data = await parseJSONFile(filePath);
				break;
			default:
				throw new Error(`Unsupported format: ${format}`);
		}

		// Use the importer
		const importer = new PipeTrakImporter(prisma);

		// Add progress callback
		const progressCallback = (progress: any) => {
			if (progress.phase === "importing" && progress.batch) {
				logger.info(
					`Processing batch ${progress.batch}/${progress.totalBatches}`,
				);
			} else {
				logger.info(
					`${progress.phase}: ${progress.processed}/${progress.total}`,
				);
			}
		};

		const result = await importer.import(data, projectId, userId, {
			...options,
			progressCallback,
		});

		// Log results
		logger.info("Import completed");
		logger.info(`  Total rows: ${result.totalRows}`);
		logger.info(`  Successful: ${result.successfulRows}`);
		logger.info(`  Errors: ${result.errorRows}`);
		logger.info(`  Warnings: ${result.warnings.length}`);

		if (result.errors.length > 0) {
			logger.error("Import errors:");
			const validator = new ImportValidator();
			const report = validator.generateRemediationReport(result.errors);
			console.log(report);
		}

		await prisma.$disconnect();
		return result;
	} catch (error) {
		logger.error("Import failed", error);
		throw error;
	}
}

// ========== CLI Execution ==========

async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.error(
			"Usage: pnpm --filter scripts import <file> --project-id <id> [options]",
		);
		console.error("\nOptions:");
		console.error(
			"  --project-id <id>      Project ID to import into (required)",
		);
		console.error(
			"  --user-id <id>         User ID for audit (optional, uses default)",
		);
		console.error(
			"  --dry-run              Validate without saving to database",
		);
		console.error(
			"  --skip-duplicates      Skip components that already exist",
		);
		console.error("  --update-existing      Update existing components");
		console.error("  --allow-partial        Continue on errors");
		console.error("\nExamples:");
		console.error(
			"  pnpm --filter scripts import data.xlsx --project-id abc123",
		);
		console.error(
			"  pnpm --filter scripts import data.csv --project-id abc123 --dry-run",
		);
		console.error(
			"  pnpm --filter scripts import data.json --project-id abc123 --skip-duplicates",
		);
		process.exit(1);
	}

	const filePath = args[0];

	// Parse command line options
	const projectIdIndex = args.indexOf("--project-id");
	const projectId =
		projectIdIndex > -1 ? args[projectIdIndex + 1] : undefined;

	if (!projectId) {
		console.error("Error: --project-id is required");
		process.exit(1);
	}

	const userIdIndex = args.indexOf("--user-id");
	const userId = userIdIndex > -1 ? args[userIdIndex + 1] : "system-import";

	const options: ImportOptions = {
		dryRun: args.includes("--dry-run"),
		skipDuplicates: args.includes("--skip-duplicates"),
		updateExisting: args.includes("--update-existing"),
		allowPartialSuccess: args.includes("--allow-partial"),
	};

	try {
		const result = await importFile(filePath, projectId, userId, options);

		if (result.success) {
			console.log("\n✅ Import completed successfully!");
			process.exit(0);
		} else {
			console.error("\n❌ Import completed with errors");
			process.exit(1);
		}
	} catch (error) {
		console.error("\n❌ Import failed:", error);
		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	main();
}

// Export for use as a module
export { importFile, parseExcelFile, parseCSVFile, parseJSONFile };
