/**
 * File parser utilities for Excel and CSV files
 */
import * as XLSX from "xlsx";

export async function parseFileHeaders(
	file: File,
): Promise<{ headers: string[]; sampleData?: any[] }> {
	const extension = file.name.split(".").pop()?.toLowerCase();

	if (extension === "csv") {
		return parseCSVHeadersAndSample(file);
	}
	if (extension === "xlsx" || extension === "xls") {
		return parseExcelHeadersAndSample(file);
	}
	throw new Error(
		"Unsupported file type. Please upload a CSV or Excel file.",
	);
}

async function parseCSVHeadersAndSample(
	file: File,
): Promise<{ headers: string[]; sampleData?: any[] }> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const text = e.target?.result as string;
				const lines = text.split("\n").filter((line) => line.trim());

				if (lines.length === 0) {
					throw new Error("File is empty");
				}

				// Parse the first line as headers
				const headers = parseCSVLine(lines[0]);

				if (headers.length === 0) {
					throw new Error("No headers found in file");
				}

				// Parse first few data rows for type detection
				const sampleData: any[] = [];
				for (let i = 1; i < Math.min(6, lines.length); i++) {
					const values = parseCSVLine(lines[i]);
					const row: any = {};
					headers.forEach((header, index) => {
						row[header] = values[index] || "";
					});
					sampleData.push(row);
				}

				resolve({ headers, sampleData });
			} catch (error: any) {
				reject(new Error(`Failed to parse CSV: ${error.message}`));
			}
		};

		reader.onerror = () => reject(new Error("Failed to read file"));
		reader.readAsText(file);
	});
}

async function parseExcelHeadersAndSample(
	file: File,
): Promise<{ headers: string[]; sampleData?: any[] }> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const data = e.target?.result;
				const workbook = XLSX.read(data, { type: "array" });

				// Get the first worksheet
				const sheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[sheetName];

				// Convert to array of arrays
				const sheetData = XLSX.utils.sheet_to_json(worksheet, {
					header: 1,
				}) as any[][];

				if (sheetData.length === 0) {
					throw new Error("Excel file is empty");
				}

				// First row should contain headers
				const headers = sheetData[0].filter(
					(header) =>
						header !== undefined &&
						header !== null &&
						header !== "",
				);

				if (headers.length === 0) {
					throw new Error("No headers found in Excel file");
				}

				// Get sample data for type detection
				const sampleData: any[] = [];
				for (let i = 1; i < Math.min(6, sheetData.length); i++) {
					const row: any = {};
					headers.forEach((header, index) => {
						row[header] = sheetData[i][index] || "";
					});
					sampleData.push(row);
				}

				resolve({
					headers: headers.map((h) => String(h).trim()),
					sampleData,
				});
			} catch (error: any) {
				reject(
					new Error(`Failed to parse Excel file: ${error.message}`),
				);
			}
		};

		reader.onerror = () => reject(new Error("Failed to read Excel file"));
		reader.readAsArrayBuffer(file);
	});
}


/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		const nextChar = line[i + 1];

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				// Escaped quote
				current += '"';
				i++; // Skip next quote
			} else {
				// Toggle quote mode
				inQuotes = !inQuotes;
			}
		} else if (char === "," && !inQuotes) {
			// End of field
			result.push(current.trim());
			current = "";
		} else {
			current += char;
		}
	}

	// Add last field
	if (current || line.endsWith(",")) {
		result.push(current.trim());
	}

	return result;
}

/**
 * Parse complete file data
 */
export async function parseFileData(file: File): Promise<any[]> {
	const extension = file.name.split(".").pop()?.toLowerCase();

	if (extension === "csv") {
		return parseCSVData(file);
	}
	if (extension === "xlsx" || extension === "xls") {
		return parseExcelData(file);
	}
	throw new Error("Unsupported file type");
}

async function parseCSVData(file: File): Promise<any[]> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const text = e.target?.result as string;
				const lines = text.split("\n").filter((line) => line.trim());

				if (lines.length <= 1) {
					resolve([]);
					return;
				}

				const headers = parseCSVLine(lines[0]);
				const data = lines.slice(1).map((line, idx) => {
					const values = parseCSVLine(line);
					const row: any = { _rowNumber: idx + 2 };

					headers.forEach((header, i) => {
						row[header] = values[i] || "";
					});

					return row;
				});

				resolve(data);
			} catch (error: any) {
				reject(new Error(`Failed to parse CSV: ${error.message}`));
			}
		};

		reader.onerror = () => reject(new Error("Failed to read file"));
		reader.readAsText(file);
	});
}

async function parseExcelData(file: File): Promise<any[]> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			try {
				const data = e.target?.result;
				const workbook = XLSX.read(data, { type: "array" });

				// Get the first worksheet
				const sheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[sheetName];

				// Convert to JSON with first row as headers
				const sheetData = XLSX.utils.sheet_to_json(worksheet, {
					header: 1,
				}) as any[][];

				if (sheetData.length <= 1) {
					resolve([]); // No data rows, just headers
					return;
				}

				const headers = sheetData[0];
				const dataRows = sheetData.slice(1);

				const result = dataRows.map((row, index) => {
					const rowData: any = { _rowNumber: index + 2 }; // Excel row number

					headers.forEach((header, colIndex) => {
						if (header) {
							rowData[header] = row[colIndex] || "";
						}
					});

					return rowData;
				});

				resolve(result);
			} catch (error: any) {
				reject(
					new Error(`Failed to parse Excel data: ${error.message}`),
				);
			}
		};

		reader.onerror = () => reject(new Error("Failed to read Excel file"));
		reader.readAsArrayBuffer(file);
	});
}
