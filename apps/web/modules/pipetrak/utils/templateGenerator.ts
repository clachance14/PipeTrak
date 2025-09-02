import * as XLSX from "xlsx";

/**
 * Generate an Excel template for field weld imports
 */
export function generateFieldWeldTemplate(): Blob {
	// Create a new workbook
	const wb = XLSX.utils.book_new();

	// Define headers for field weld imports with QC data
	const headers = [
		// Required fields
		"Weld ID", // componentId (weldIdNumber)
		"Component Type", // type (should be FIELD_WELD)
		"Drawing ID", // drawingId

		// Weld-specific fields
		"Weld Size", // weldSize
		"Schedule", // schedule
		"Weld Type Code", // weldTypeCode (e.g., BW, SW, TW)
		"Base Metal", // baseMetal

		// QC fields
		"X-ray Percent", // xrayPercent (0-100)
		"PWHT Required", // pwhtRequired (TRUE/FALSE)
		"NDE Types", // ndeTypes (comma-separated)

		// Optional QC tracking fields
		"Welder Stencil", // welderId (will be mapped to actual welder)
		"Date Welded", // dateWelded
		"Tie-In Number", // tieInNumber
		"Comments", // comments

		// Organizational attributes (inherited from drawing if not provided)
		"Area", // area
		"System", // system
		"Test Package", // testPackage
	];

	// Create sample field weld data rows
	const sampleData = [
		[
			"FW-001", // Weld ID
			"FIELD_WELD", // Component Type
			"P-35F11", // Drawing ID
			'6"', // Weld Size
			"Sch 40", // Schedule
			"BW", // Weld Type Code (Butt Weld)
			"A106 Gr B", // Base Metal
			"100", // X-ray Percent
			"TRUE", // PWHT Required
			"RT,PT", // NDE Types
			"WLD001", // Welder Stencil
			"2025-01-15", // Date Welded
			"TI-001", // Tie-In Number
			"Shop weld, full penetration", // Comments
			"Unit 1", // Area
			"Main Steam", // System
			"TP-001", // Test Package
		],
		[
			"FW-002", // Weld ID
			"FIELD_WELD", // Component Type
			"P-35F12", // Drawing ID
			'4"', // Weld Size
			"Sch 80", // Schedule
			"SW", // Weld Type Code (Socket Weld)
			"A312 SS316", // Base Metal
			"10", // X-ray Percent
			"FALSE", // PWHT Required
			"PT,MT", // NDE Types
			"WLD002", // Welder Stencil
			"2025-01-16", // Date Welded
			"", // Tie-In Number
			"Small bore connection", // Comments
			"Unit 2", // Area
			"Process Water", // System
			"TP-002", // Test Package
		],
		[
			"FW-003", // Weld ID
			"FIELD_WELD", // Component Type
			"P-35F13", // Drawing ID
			'12"', // Weld Size
			"Sch 20", // Schedule
			"BW", // Weld Type Code
			"A358 SS304L", // Base Metal
			"100", // X-ray Percent
			"TRUE", // PWHT Required
			"RT,PT,MT", // NDE Types
			"WLD001", // Welder Stencil
			"2025-01-17", // Date Welded
			"TI-002", // Tie-In Number
			"Critical service, full RT", // Comments
			"Unit 3", // Area
			"Feed Water", // System
			"TP-003", // Test Package
		],
	];

	// Create the main data sheet
	const wsData = [headers, ...sampleData];
	const ws = XLSX.utils.aoa_to_sheet(wsData);

	// Set column widths for field weld template
	const colWidths = [
		{ wch: 12 }, // Weld ID
		{ wch: 18 }, // Component Type
		{ wch: 12 }, // Drawing ID
		{ wch: 10 }, // Weld Size
		{ wch: 10 }, // Schedule
		{ wch: 15 }, // Weld Type Code
		{ wch: 15 }, // Base Metal
		{ wch: 12 }, // X-ray Percent
		{ wch: 12 }, // PWHT Required
		{ wch: 12 }, // NDE Types
		{ wch: 15 }, // Welder Stencil
		{ wch: 12 }, // Date Welded
		{ wch: 12 }, // Tie-In Number
		{ wch: 25 }, // Comments
		{ wch: 12 }, // Area
		{ wch: 15 }, // System
		{ wch: 12 }, // Test Package
	];
	ws["!cols"] = colWidths;

	// Style the header row
	const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
	for (let C = range.s.c; C <= range.e.c; ++C) {
		const address = XLSX.utils.encode_col(C) + "1";
		if (!ws[address]) continue;
		ws[address].s = {
			font: { bold: true },
			fill: { fgColor: { rgb: "E0E0E0" } },
		};
	}

	// Add the worksheet to the workbook
	XLSX.utils.book_append_sheet(wb, ws, "Field Welds");

	// Create field weld-specific instructions
	const instructions = [
		["PipeTrak Field Weld Import Template"],
		[""],
		["INSTRUCTIONS:"],
		["1. Fill in field weld data starting from row 2"],
		[
			"2. Required fields: Weld ID, Component Type (FIELD_WELD), Drawing ID",
		],
		["3. Weld ID must be unique within the project"],
		["4. Date format: YYYY-MM-DD (e.g., 2025-01-15)"],
		["5. PWHT Required: TRUE or FALSE"],
		["6. NDE Types: Comma-separated (RT, PT, MT, UT, VT)"],
		["7. Save as .xlsx or .csv before importing"],
		[""],
		["FIELD DESCRIPTIONS:"],
		[
			"Weld ID",
			"Unique identifier for this field weld (e.g., FW-001, WELD-123)",
		],
		["Component Type", 'Must be "FIELD_WELD" for dual tracking'],
		[
			"Drawing ID",
			"Drawing where this weld appears (must exist in project)",
		],
		["Weld Size", "Nominal pipe size or weld dimension"],
		["Schedule", "Pipe schedule or wall thickness designation"],
		[
			"Weld Type Code",
			"BW=Butt Weld, SW=Socket Weld, TW=Threaded Weld, etc.",
		],
		["Base Metal", "Material specification being welded"],
		[
			"X-ray Percent",
			"Percentage of weld requiring radiographic testing (0-100)",
		],
		["PWHT Required", "Post Weld Heat Treatment required (TRUE/FALSE)"],
		["NDE Types", "Non-Destructive Examination methods (RT,PT,MT,UT,VT)"],
		["Welder Stencil", "Welder identification number/stencil"],
		["Date Welded", "Date weld was completed (YYYY-MM-DD format)"],
		["Tie-In Number", "Tie-in or connection reference number"],
		["Comments", "Additional notes about the weld"],
		["Area", "Plant area (inherited from drawing if blank)"],
		["System", "Process system (inherited from drawing if blank)"],
		["Test Package", "Hydro test package assignment"],
		[""],
		["QUALITY CONTROL NOTES:"],
		[
			"- Field welds create both Component records (for milestones) and FieldWeld records (for QC)",
		],
		["- Installation progress is tracked separately from QC status"],
		["- NDE results and PWHT completion are tracked in the QC module"],
		["- Welder assignments can be updated after import"],
		["- Additional QC data can be added through the Field Welds interface"],
	];

	const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
	wsInstructions["!cols"] = [{ wch: 25 }, { wch: 60 }];

	// Style the instructions
	if (wsInstructions["A1"]) {
		wsInstructions["A1"].s = { font: { bold: true, sz: 14 } };
	}
	["A3", "A12", "A29"].forEach((cell) => {
		if (wsInstructions[cell]) {
			wsInstructions[cell].s = { font: { bold: true } };
		}
	});

	XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

	// Create validation lists for field welds
	const validationLists = [
		[
			"Weld Types",
			"NDE Methods",
			"PWHT Options",
			"Common Schedules",
			"Base Materials",
		],
		["BW", "RT", "TRUE", "Sch 10", "A106 Gr B"],
		["SW", "PT", "FALSE", "Sch 20", "A312 SS316"],
		["TW", "MT", "", "Sch 40", "A358 SS304L"],
		["FW", "UT", "", "Sch 80", "A53 Gr B"],
		["CW", "VT", "", "Sch 160", "A335 P11"],
		["", "ET", "", "XS", "A335 P22"],
		["", "AE", "", "XXS", "A335 P91"],
		["", "", "", "STD", "Inconel 625"],
		["", "", "", "", "Hastelloy C276"],
	];

	const wsValidation = XLSX.utils.aoa_to_sheet(validationLists);
	wsValidation["!cols"] = Array(5).fill({ wch: 15 });

	// Style validation headers
	for (let C = 0; C < 5; C++) {
		const address = XLSX.utils.encode_col(C) + "1";
		if (wsValidation[address]) {
			wsValidation[address].s = {
				font: { bold: true },
				fill: { fgColor: { rgb: "E0E0E0" } },
			};
		}
	}

	XLSX.utils.book_append_sheet(wb, wsValidation, "QC Options");

	// Write the workbook
	return new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});
}

/**
 * Generate an Excel template for component imports
 */
export function generateImportTemplate(): Blob {
	// Create a new workbook
	const wb = XLSX.utils.book_new();

	// Define headers based on actual database Component model fields
	const headers = [
		// Required fields
		"Commodity Code", // componentId (industry standard term)
		"Component Type", // type (workflowType auto-determined from this)
		"Drawing ID", // drawingId

		// Physical attributes
		"Specification", // spec
		"Size", // size
		"Material", // material
		"Pressure Rating", // pressureRating
		"Description", // description

		// Organizational attributes
		"Area", // area
		"System", // system
		"Test Package", // testPackage
		"Test Pressure", // testPressure
		"Test Required", // testRequired
	];

	// Create sample data rows with valid enum values
	// Note: Workflow Type is auto-determined from Component Type
	const sampleData = [
		[
			"VALVE001", // Component ID
			"VALVE", // Component Type (auto-determines: MILESTONE_DISCRETE)
			"P-35F11", // Drawing ID
			"ASTM A216 WCB", // Specification
			'6"', // Size
			"Carbon Steel", // Material
			"150#", // Pressure Rating
			'Gate Valve 6" CS A216 WCB 150#', // Description
			"Unit 1", // Area
			"Cooling Water", // System
			"TP-001", // Test Package
			"250 PSI", // Test Pressure
			"Hydrostatic Test", // Test Required
		],
		[
			"GASKET001", // Component ID
			"GASKET", // Component Type (auto-determines: MILESTONE_DISCRETE)
			"P-35F12", // Drawing ID
			"ASME B16.20", // Specification
			'8"', // Size
			"SS316 + Graphite", // Material
			"150#", // Pressure Rating
			'Spiral Wound Gasket 8" 150#', // Description
			"Unit 1", // Area
			"Process Steam", // System
			"TP-002", // Test Package
			"", // Test Pressure
			"", // Test Required
		],
		[
			"SPOOL001", // Component ID
			"SPOOL", // Component Type (auto-determines: MILESTONE_PERCENTAGE)
			"P-35F13", // Drawing ID
			"ASTM A106 Gr B", // Specification
			'10"', // Size
			"Carbon Steel", // Material
			"Sch 40", // Pressure Rating
			'Pipe Spool 10" Sch 40', // Description
			"Unit 2", // Area
			"Feed Water", // System
			"TP-003", // Test Package
			"300 PSI", // Test Pressure
			"Hydrostatic Test", // Test Required
		],
		[
			"FITTING001", // Component ID
			"FITTING", // Component Type (auto-determines: MILESTONE_DISCRETE)
			"P-35F14", // Drawing ID
			"ASME B16.9", // Specification
			'4"', // Size
			"Stainless Steel", // Material
			"300#", // Pressure Rating
			'90 Degree Elbow 4" SS 300#', // Description
			"Unit 2", // Area
			"Natural Gas", // System
			"TP-004", // Test Package
			"600 PSI", // Test Pressure
			"Pneumatic Test", // Test Required
		],
		[
			"SUPPORT001", // Component ID
			"SUPPORT", // Component Type (auto-determines: MILESTONE_DISCRETE)
			"P-35F15", // Drawing ID
			"MSS-SP-58", // Specification
			'6"', // Size
			"Carbon Steel", // Material
			"", // Pressure Rating
			"Pipe Support U-Bolt Type", // Description
			"Unit 3", // Area
			"Utilities", // System
			"TP-005", // Test Package
			"", // Test Pressure
			"Visual Inspection", // Test Required
		],
		[
			"FW-001", // Component ID (Weld ID)
			"FIELD_WELD", // Component Type (creates dual tracking)
			"P-35F16", // Drawing ID
			"ASME B31.3", // Specification
			'8"', // Size (Weld Size)
			"A106 Gr B", // Material (Base Metal)
			"Sch 40", // Pressure Rating (Schedule)
			'Butt Weld 8" Sch 40 CS', // Description
			"Unit 2", // Area
			"Main Steam", // System
			"TP-006", // Test Package
			"250 PSI", // Test Pressure
			"RT + PWHT", // Test Required (NDE + PWHT)
		],
	];

	// Create the main data sheet
	const wsData = [headers, ...sampleData];
	const ws = XLSX.utils.aoa_to_sheet(wsData);

	// Set column widths
	const colWidths = [
		{ wch: 18 }, // Commodity Code
		{ wch: 18 }, // Component Type
		{ wch: 12 }, // Drawing ID
		{ wch: 20 }, // Specification
		{ wch: 8 }, // Size
		{ wch: 15 }, // Material
		{ wch: 15 }, // Pressure Rating
		{ wch: 35 }, // Description
		{ wch: 12 }, // Area
		{ wch: 15 }, // System
		{ wch: 12 }, // Test Package
		{ wch: 12 }, // Test Pressure
		{ wch: 18 }, // Test Required
	];
	ws["!cols"] = colWidths;

	// Style the header row (basic styling supported by xlsx)
	const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
	for (let C = range.s.c; C <= range.e.c; ++C) {
		const address = XLSX.utils.encode_col(C) + "1";
		if (!ws[address]) continue;
		ws[address].s = {
			font: { bold: true },
			fill: { fgColor: { rgb: "E0E0E0" } },
		};
	}

	// Add the worksheet to the workbook
	XLSX.utils.book_append_sheet(wb, ws, "Components");

	// Create Instructions sheet
	const instructions = [
		["PipeTrak Component Import Template"],
		[""],
		["INSTRUCTIONS:"],
		[
			"1. Fill in component data starting from row 2 of the Components sheet",
		],
		[
			"2. Required field: Drawing ID (Commodity Code will be auto-generated if not provided)",
		],
		[
			"3. Commodity Code: Use if component has a standard commodity/catalog code, leave blank for auto-generation",
		],
		["4. Do not modify the header row (row 1)"],
		["5. Save the file as .xlsx or .csv before importing"],
		[""],
		["FIELD DESCRIPTIONS:"],
		[
			"Commodity Code",
			"Standard commodity/catalog code (e.g., A216WCB-6-150-GATE). Leave blank for auto-generation",
		],
		[
			"Component Type",
			"Type of component (e.g., Valve, Pipe, Flange). Used for auto-generating IDs",
		],
		[
			"Drawing ID",
			"Reference to the drawing where component appears (required)",
		],
		["Description", "Detailed description of the component"],
		["Area", "Plant area or unit where component is located"],
		["System", "System the component belongs to"],
		["Test Package", "Test package assignment"],
		["Material", "Material specification"],
		["Size", "Component size"],
		["Specification", "Technical specification or standard"],
		["Line Number", "Line or circuit number"],
		["Heat Number", "Material heat/lot number for traceability"],
		["P&ID", "Process & Instrumentation Diagram reference"],
		["Service", "Service description or fluid type"],
		["Insulation", "Insulation type and thickness"],
		["NDE", "Non-Destructive Examination requirements"],
		["Paint/Coating", "Surface treatment requirements"],
		["ROC/LDC Priority", "Priority level for completion"],
		["ROC Class", "Classification for progress tracking"],
		["MTO Status", "Material Take-Off status"],
		["Site Location", "Physical location on site"],
		["Comments", "Additional notes or comments"],
		[""],
		["TIPS:"],
		[
			"- Commodity Codes should match your project commodity list when available",
		],
		[
			"- For field-fabricated items without commodity codes, leave blank for auto-generation",
		],
		[
			"- Component Type helps generate meaningful IDs (e.g., VALVE-001, PIPE-001)",
		],
		[
			"- Drawing IDs must match existing drawings or will need to be created",
		],
		[
			"- Use consistent naming conventions for Area, System, and Test Package",
		],
		["- Leave cells empty for fields that don't apply"],
		["- The import wizard will help map columns if headers differ"],
	];

	const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);

	// Set column widths for instructions
	wsInstructions["!cols"] = [{ wch: 25 }, { wch: 60 }];

	// Style the title
	if (wsInstructions["A1"]) {
		wsInstructions["A1"].s = {
			font: { bold: true, sz: 14 },
		};
	}

	// Style section headers
	["A3", "A10", "A33"].forEach((cell) => {
		if (wsInstructions[cell]) {
			wsInstructions[cell].s = {
				font: { bold: true },
			};
		}
	});

	XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

	// Create validation lists sheet (for dropdown options)
	const validationLists = [
		[
			"Areas",
			"Systems",
			"Test Packages",
			"Component Types",
			"MTO Status",
			"Priorities",
		],
		[
			"Unit 1",
			"Cooling Water",
			"TP-001",
			"Pipe Spool",
			"Released",
			"Priority 1",
		],
		["Unit 2", "Process Steam", "TP-002", "Valve", "Hold", "Priority 2"],
		["Unit 3", "Feed Water", "TP-003", "Flange", "Pending", "Priority 3"],
		[
			"Unit 4",
			"Natural Gas",
			"TP-004",
			"Fitting",
			"Canceled",
			"Priority 4",
		],
		["Utilities", "Instrument Air", "TP-005", "Gasket", "", "Priority 5"],
		["Offsites", "Nitrogen", "TP-006", "Support", "", ""],
		["Tank Farm", "Fire Water", "TP-007", "Instrument", "", ""],
		["", "Process Water", "TP-008", "Field Weld", "", ""],
		["", "Chemical Feed", "TP-009", "Insulation", "", ""],
		["", "Waste Water", "TP-010", "Paint", "", ""],
		["", "", "", "FIELD_WELD", "", ""],
	];

	const wsValidation = XLSX.utils.aoa_to_sheet(validationLists);
	wsValidation["!cols"] = Array(6).fill({ wch: 15 });

	// Style headers
	for (let C = 0; C < 6; C++) {
		const address = XLSX.utils.encode_col(C) + "1";
		if (wsValidation[address]) {
			wsValidation[address].s = {
				font: { bold: true },
				fill: { fgColor: { rgb: "E0E0E0" } },
			};
		}
	}

	XLSX.utils.book_append_sheet(wb, wsValidation, "Dropdown Options");

	// Generate the Excel file as a blob
	const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
	return new Blob([wbout], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});
}

/**
 * Generate a CSV template for component imports
 */
export function generateCSVTemplate(): string {
	const headers = [
		"Commodity Code",
		"Component Type",
		"Drawing ID",
		"Specification",
		"Size",
		"Material",
		"Pressure Rating",
		"Description",
		"Area",
		"System",
		"Test Package",
		"Test Pressure",
		"Test Required",
	];

	const sampleRows = [
		[
			"VALVE001",
			"VALVE",
			"P-35F11",
			"ASTM A216 WCB",
			'6"',
			"Carbon Steel",
			"150#",
			'Gate Valve 6" CS A216 WCB 150#',
			"Unit 1",
			"Cooling Water",
			"TP-001",
			"250 PSI",
			"Hydrostatic Test",
		],
		[
			"GASKET001",
			"GASKET",
			"P-35F12",
			"ASME B16.20",
			'8"',
			"SS316 + Graphite",
			"150#",
			'Spiral Wound Gasket 8" 150#',
			"Unit 1",
			"Process Steam",
			"TP-002",
			"",
			"",
		],
	];

	// Build CSV content
	const csvContent = [
		headers.map((h) => `"${h}"`).join(","),
		...sampleRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
	].join("\n");

	return csvContent;
}

/**
 * Download a file to the user's computer
 */
export function downloadFile(blob: Blob | string, filename: string) {
	let url: string;

	if (typeof blob === "string") {
		// Create blob from string (for CSV)
		const csvBlob = new Blob([blob], { type: "text/csv;charset=utf-8;" });
		url = URL.createObjectURL(csvBlob);
	} else {
		// Use blob directly (for Excel)
		url = URL.createObjectURL(blob);
	}

	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	// Clean up the URL
	setTimeout(() => URL.revokeObjectURL(url), 100);
}
