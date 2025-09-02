import * as ExcelJS from "exceljs";

export interface ParsedExcelData {
	headers: string[];
	rows: Record<string, any>[];
	metadata: {
		filename: string;
		rowCount: number;
		sheetName: string;
	};
}

export async function parseExcel(buffer: Buffer): Promise<ParsedExcelData> {
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.load(buffer);

	// Use first worksheet
	const worksheet = workbook.worksheets[0];

	if (!worksheet) {
		throw new Error("No worksheet found in Excel file");
	}

	const headers: string[] = [];
	const rows: Record<string, any>[] = [];

	// Get headers from first row
	const headerRow = worksheet.getRow(1);
	headerRow.eachCell((cell, colNumber) => {
		headers[colNumber - 1] = cell.text.trim();
	});

	// Get data rows (skip header row)
	for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
		const row = worksheet.getRow(rowNumber);
		const rowData: Record<string, any> = {};

		// Check if row has any data
		let hasData = false;

		headers.forEach((header, index) => {
			const cell = row.getCell(index + 1);
			let value = null;

			if (cell.value !== null && cell.value !== undefined) {
				// Handle different cell types
				if (typeof cell.value === "object" && "text" in cell.value) {
					value = cell.value.text;
				} else {
					value = cell.value;
				}

				// Convert to string and trim
				if (value !== null && value !== undefined) {
					value = String(value).trim();
					if (value !== "") {
						hasData = true;
					}
				}
			}

			rowData[header] = value || null;
		});

		// Only add row if it has some data
		if (hasData) {
			rows.push(rowData);
		}
	}

	return {
		headers,
		rows,
		metadata: {
			filename: "uploaded.xlsx",
			rowCount: rows.length,
			sheetName: worksheet.name,
		},
	};
}

// Helper function to calculate total instances from quantity column
export function calculateTotalInstances(rows: Record<string, any>[]): number {
	return rows.reduce((total, row) => {
		// Look for quantity column (common variations)
		const qty =
			row["QTY"] || row["Quantity"] || row["QUANTITY"] || row["Qty"];
		const quantity = qty ? Number.parseInt(String(qty)) || 1 : 1;
		return total + quantity;
	}, 0);
}

// Helper to detect common column patterns
export function detectColumnMapping(
	headers: string[],
): Record<string, string | null> {
	const mapping: Record<string, string | null> = {
		drawing: null,
		componentId: null,
		type: null,
		spec: null,
		size: null,
		description: null,
		quantity: null,
		material: null,
		comments: null,
		area: null,
		system: null,
		testPackage: null,
	};

	for (const header of headers) {
		const normalized = header.toUpperCase().trim();

		// Drawing
		if (
			/^(DRAWING|DRAWINGS|DWG|DWGS|DWGNO|DWG_NO|ISO)$/i.test(normalized)
		) {
			mapping.drawing = header;
		}

		// Component ID
		if (
			/^(CMDTY\s*CODE|COMMODITY\s*CODE|COMPONENT\s*ID|TAG|PART\s*NO)$/i.test(
				normalized,
			)
		) {
			mapping.componentId = header;
		}

		// Type
		if (/^(TYPE|COMPONENT\s*TYPE|CATEGORY)$/i.test(normalized)) {
			mapping.type = header;
		}

		// Spec
		if (/^(SPEC|SPECIFICATION)$/i.test(normalized)) {
			mapping.spec = header;
		}

		// Size
		if (/^(SIZE|NOMINAL\s*SIZE|NPS|DIA|DIAMETER)$/i.test(normalized)) {
			mapping.size = header;
		}

		// Description
		if (/^(DESCRIPTION|DESC|NAME)$/i.test(normalized)) {
			mapping.description = header;
		}

		// Quantity
		if (/^(QTY|QUANTITY|COUNT)$/i.test(normalized)) {
			mapping.quantity = header;
		}

		// Material
		if (/^(MATERIAL|MAT|GRADE)$/i.test(normalized)) {
			mapping.material = header;
		}

		// Comments
		if (/^(COMMENT|COMMENTS|NOTE|NOTES|REMARKS)$/i.test(normalized)) {
			mapping.comments = header;
		}

		// Area
		if (/^(AREA|PLANT\s*AREA|UNIT\s*AREA)$/i.test(normalized)) {
			mapping.area = header;
		}

		// System
		if (/^(SYSTEM|PIPELINE\s*SYSTEM|PIPING\s*SYSTEM)$/i.test(normalized)) {
			mapping.system = header;
		}

		// Test Package
		if (/^(TEST\s*PACKAGE|TEST\s*PKG|PACKAGE)$/i.test(normalized)) {
			mapping.testPackage = header;
		}
	}

	return mapping;
}
