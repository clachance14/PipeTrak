/**
 * Intelligent column detection for field weld imports
 * Searches for essential weld log columns by name patterns rather than fixed positions
 */

export interface ColumnMappings {
	[columnIndex: number]: string;
}

export interface ColumnDetectionResult {
	mappings: ColumnMappings;
	hasEssentials: boolean;
	warnings: string[];
	essentialFields: {
		found: string[];
		missing: string[];
	};
	optionalFields: {
		found: string[];
		available: string[];
	};
}

/**
 * Column name patterns for auto-detection
 * Each field has multiple possible header variations
 */
export const COLUMN_PATTERNS = {
	// Essential fields (Priority 1)
	weldIdNumber: [
		/weld.*id/i,
		/weld.*#/i,
		/weld.*number/i,
		/^id$/i,
		/^weld$/i,
	],
	drawingNumber: [
		/drawing/i,
		/isometric/i,
		/iso.*number/i,
		/drawing.*number/i,
		/iso$/i,
		/dwg/i,
	],
	specCode: [
		/spec/i,
		/specification/i,
		/spec.*code/i,
		/^spec$/i,
	],
	xrayPercentage: [
		/x.*ray.*%/i,
		/xray.*%/i,
		/rt.*%/i,
		/nde.*%/i,
		/x-ray/i,
		/radiograph/i,
	],
	weldSize: [
		/weld.*size/i,
		/^size$/i,
		/diameter/i,
		/pipe.*size/i,
		/nominal.*size/i,
	],
	schedule: [
		/schedule/i,
		/^sch$/i,
		/wall.*thickness/i,
		/wall$/i,
		/^sched$/i,
	],
	weldType: [
		/weld.*type/i,
		/joint.*type/i,
		/^type$/i,
		/joint$/i,
		/connection/i,
	],
	baseMetal: [
		/base.*metal/i,
		/material/i,
		/base.*mat/i,
		/metal/i,
		/alloy/i,
	],

	// Optional fields (Priority 2)
	welderStencil: [
		/welder.*stencil/i,
		/welder.*id/i,
		/operator/i,
		/welder$/i,
		/stencil/i,
	],
	testPackageNumber: [
		/test.*package/i,
		/package.*number/i,
		/tie.*in/i,
		/package$/i,
		/test.*pkg/i,
	],
	testPressure: [
		/test.*pressure/i,
		/pressure/i,
		/hydro/i,
		/psi/i,
		/test.*press/i,
	],
	pmiRequired: [
		/pmi.*required/i,
		/pmi$/i,
		/positive.*material/i,
		/material.*identification/i,
	],
	pwhtRequired: [
		/pwht.*required/i,
		/pwht$/i,
		/post.*weld.*heat/i,
		/heat.*treatment/i,
	],
	pmiCompleteDate: [
		/pmi.*date/i,
		/pmi.*complete/i,
		/material.*test.*date/i,
	],
	dateWelded: [
		/date.*welded/i,
		/weld.*date/i,
		/completion.*date/i,
		/welded$/i,
	],
	comments: [
		/comments/i,
		/remarks/i,
		/notes/i,
		/description/i,
	],
} as const;

/**
 * Essential fields that must be present for a successful import
 */
export const ESSENTIAL_FIELDS = [
	'weldIdNumber',
	'drawingNumber',
] as const;

/**
 * High priority fields (essential for complete weld data)
 */
export const HIGH_PRIORITY_FIELDS = [
	'weldIdNumber',
	'drawingNumber',
	'specCode',
	'xrayPercentage',
	'weldSize',
	'schedule',
	'weldType',
	'baseMetal',
] as const;

/**
 * Auto-detect column mappings from Excel headers
 */
export function autoDetectColumns(headers: string[]): ColumnDetectionResult {
	const mappings: ColumnMappings = {};
	const foundFields = new Set<string>();
	const warnings: string[] = [];

	// Clean and normalize headers for matching
	const normalizedHeaders = headers.map((header, index) => ({
		original: header,
		normalized: header?.toString().trim() || `Column ${index + 1}`,
		index,
	}));

	// First pass: exact and high-confidence matches
	normalizedHeaders.forEach(({ normalized, index }) => {
		const cleanHeader = normalized.toLowerCase();

		// Check each field pattern
		for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
			if (foundFields.has(field)) continue; // Already mapped

			const matchFound = patterns.some(pattern => pattern.test(cleanHeader));
			if (matchFound) {
				mappings[index] = field;
				foundFields.add(field);
				break; // Found match, move to next header
			}
		}
	});

	// Check for essential fields
	const foundEssentials = ESSENTIAL_FIELDS.filter(field => foundFields.has(field));
	const missingEssentials = ESSENTIAL_FIELDS.filter(field => !foundFields.has(field));

	// Check for high priority fields
	const missingHighPriority = HIGH_PRIORITY_FIELDS.filter(field => !foundFields.has(field));

	// Generate warnings
	if (missingEssentials.length > 0) {
		warnings.push(`Missing essential fields: ${missingEssentials.join(', ')}`);
	}

	if (missingHighPriority.length > 0) {
		warnings.push(`Missing recommended fields: ${missingHighPriority.join(', ')}`);
	}

	// Check for unmapped columns that might contain useful data
	const unmappedHeaders = normalizedHeaders
		.filter(({ index }) => !mappings[index])
		.map(({ normalized }) => normalized);

	if (unmappedHeaders.length > 0) {
		warnings.push(`${unmappedHeaders.length} columns will be skipped: ${unmappedHeaders.slice(0, 3).join(', ')}${unmappedHeaders.length > 3 ? '...' : ''}`);
	}

	return {
		mappings,
		hasEssentials: missingEssentials.length === 0,
		warnings,
		essentialFields: {
			found: foundEssentials,
			missing: missingEssentials,
		},
		optionalFields: {
			found: Array.from(foundFields).filter(field => !ESSENTIAL_FIELDS.includes(field as any)),
			available: Object.keys(COLUMN_PATTERNS).filter(field => !foundFields.has(field)),
		},
	};
}

/**
 * Get user-friendly field names for display
 */
export function getFieldDisplayName(fieldKey: string): string {
	const displayNames: Record<string, string> = {
		weldIdNumber: 'Weld ID Number',
		drawingNumber: 'Drawing Number',
		specCode: 'Spec Code',
		xrayPercentage: 'X-Ray Percentage',
		weldSize: 'Weld Size',
		schedule: 'Schedule',
		weldType: 'Weld Type',
		baseMetal: 'Base Metal',
		welderStencil: 'Welder Stencil',
		testPackageNumber: 'Test Package Number',
		testPressure: 'Test Pressure',
		pmiRequired: 'PMI Required',
		pwhtRequired: 'PWHT Required',
		pmiCompleteDate: 'PMI Complete Date',
		dateWelded: 'Date Welded',
		comments: 'Comments',
	};

	return displayNames[fieldKey] || fieldKey;
}

/**
 * Get sample patterns for a field (for user guidance)
 */
export function getFieldPatterns(fieldKey: string): string[] {
	const patterns = COLUMN_PATTERNS[fieldKey as keyof typeof COLUMN_PATTERNS];
	if (!patterns) return [];

	// Convert regex patterns to readable examples
	return patterns.slice(0, 3).map(pattern => {
		const source = pattern.source;
		// Simple cleanup of regex patterns for display
		return source
			.replace(/\\\./g, '.')
			.replace(/\.\*/g, ' ')
			.replace(/\^|\$/g, '')
			.replace(/\[.*?\]/g, '')
			.replace(/\|/g, ' or ')
			.trim();
	});
}

/**
 * Validate that the detection result is sufficient for import
 */
export function validateDetectionResult(result: ColumnDetectionResult): {
	canProceed: boolean;
	status: 'ready' | 'warning' | 'error';
	message: string;
	recommendations: string[];
} {
	const { hasEssentials, essentialFields, warnings } = result;

	if (!hasEssentials) {
		return {
			canProceed: false,
			status: 'error',
			message: `Cannot proceed: Missing essential fields: ${essentialFields.missing.join(', ')}`,
			recommendations: [
				'Verify that your Excel file contains columns for Weld ID and Drawing Number',
				'Check column headers match expected patterns',
				'Consider renaming columns to standard formats',
			],
		};
	}

	const highPriorityFound = HIGH_PRIORITY_FIELDS.filter(field =>
		essentialFields.found.includes(field) ||
		result.optionalFields.found.includes(field)
	);

	if (highPriorityFound.length < HIGH_PRIORITY_FIELDS.length - 2) {
		return {
			canProceed: true,
			status: 'warning',
			message: `Can proceed but missing some recommended fields. Found ${highPriorityFound.length}/${HIGH_PRIORITY_FIELDS.length} priority fields.`,
			recommendations: [
				'Consider adding missing fields for complete weld data',
				'Review the column mapping to ensure all desired fields are captured',
			],
		};
	}

	return {
		canProceed: true,
		status: 'ready',
		message: `Ready to import! Found ${essentialFields.found.length + result.optionalFields.found.length} mapped fields.`,
		recommendations: warnings.length > 0 ? ['Review warnings before proceeding'] : [],
	};
}

/**
 * Generate a mapping summary for user display
 */
export function generateMappingSummary(
	result: ColumnDetectionResult,
	headers: string[]
): {
	mapped: Array<{ column: string; field: string; displayName: string; essential: boolean }>;
	unmapped: string[];
	summary: string;
} {
	const mapped = Object.entries(result.mappings).map(([columnIndex, field]) => ({
		column: headers[Number(columnIndex)] || `Column ${Number(columnIndex) + 1}`,
		field,
		displayName: getFieldDisplayName(field),
		essential: ESSENTIAL_FIELDS.includes(field as any),
	}));

	const unmapped = headers
		.map((header, index) => ({ header, index }))
		.filter(({ index }) => !result.mappings[index])
		.map(({ header }) => header);

	const essentialCount = mapped.filter(m => m.essential).length;
	const optionalCount = mapped.filter(m => !m.essential).length;

	const summary = `Found ${essentialCount} essential and ${optionalCount} optional fields. ${unmapped.length} columns will be skipped.`;

	return { mapped, unmapped, summary };
}