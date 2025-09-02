/**
 * Utility functions for converting drawing patterns between different formats
 * Used to normalize WELD LOG format to PipeTrak standard format
 */

export interface DrawingPatternConversion {
	original: string;
	converted: string;
	hasSheetNotation: boolean;
	baseDrawing: string;
	sheetNumber?: number;
	totalSheets?: number;
}

/**
 * Converts WELD LOG drawing pattern to PipeTrak standard format
 *
 * Examples:
 * - "P-94011_2 (1/3)" → "P-94011_2 01of03"
 * - "P-94011_3 (1/28)" → "P-94011_3 01of28"
 * - "P-26B07" → "P-26B07 01of01"
 *
 * @param weldLogPattern - Drawing pattern from WELD LOG format
 * @returns Converted drawing pattern in PipeTrak format
 */
export function convertWeldLogDrawingPattern(
	weldLogPattern: string,
): DrawingPatternConversion {
	if (!weldLogPattern || typeof weldLogPattern !== "string") {
		throw new Error("Invalid drawing pattern provided");
	}

	const trimmedPattern = weldLogPattern.trim();

	// Regex to match patterns like "P-94011_2 (1/3)" or "P-94011_3 (1/28)"
	const sheetNotationRegex = /^(.+?)\s*\((\d+)\/(\d+)\)$/;
	const match = trimmedPattern.match(sheetNotationRegex);

	if (match) {
		// Has sheet notation - convert from (X/Y) to XXofYY format
		const [, baseDrawing, currentSheet, totalSheets] = match;
		const paddedCurrent = currentSheet.padStart(2, "0");
		const paddedTotal = totalSheets.padStart(2, "0");
		const converted = `${baseDrawing.trim()} ${paddedCurrent}of${paddedTotal}`;

		return {
			original: weldLogPattern,
			converted,
			hasSheetNotation: true,
			baseDrawing: baseDrawing.trim(),
			sheetNumber: Number.parseInt(currentSheet),
			totalSheets: Number.parseInt(totalSheets),
		};
	}
	// No sheet notation - add default "01of01"
	const converted = `${trimmedPattern} 01of01`;

	return {
		original: weldLogPattern,
		converted,
		hasSheetNotation: false,
		baseDrawing: trimmedPattern,
		sheetNumber: 1,
		totalSheets: 1,
	};
}

/**
 * Batch convert multiple WELD LOG drawing patterns
 *
 * @param patterns - Array of drawing patterns to convert
 * @returns Array of conversion results
 */
export function batchConvertWeldLogPatterns(
	patterns: string[],
): DrawingPatternConversion[] {
	return patterns.map((pattern) => {
		try {
			// Only convert if it looks like a valid drawing pattern (starts with P-)
			if (!pattern.trim().match(/^P-[A-Z0-9]/)) {
				return {
					original: pattern,
					converted: pattern, // Fallback to original for non-drawing patterns
					hasSheetNotation: false,
					baseDrawing: pattern,
				};
			}
			return convertWeldLogDrawingPattern(pattern);
		} catch (error) {
			console.warn(`Failed to convert pattern "${pattern}":`, error);
			return {
				original: pattern,
				converted: pattern, // Fallback to original
				hasSheetNotation: false,
				baseDrawing: pattern,
			};
		}
	});
}

/**
 * Extract unique base drawing numbers from converted patterns
 * Useful for finding components that match the base drawing
 *
 * @param conversions - Array of conversion results
 * @returns Array of unique base drawing numbers
 */
export function extractUniqueBaseDrawings(
	conversions: DrawingPatternConversion[],
): string[] {
	const baseDrawings = conversions.map((c) => c.baseDrawing);
return Array.from(new Set(baseDrawings));
}

/**
 * Validate that a drawing pattern follows PipeTrak format
 * Format: "P-XXXXX 01of01" or "P-XXXXX_X 01of28"
 *
 * @param pattern - Drawing pattern to validate
 * @returns true if pattern is valid PipeTrak format
 */
export function isValidPipeTrakDrawingPattern(pattern: string): boolean {
	if (!pattern || typeof pattern !== "string") {
		return false;
	}

	// Regex for PipeTrak format: base drawing + single space + XXofYY
	const pipeTrakRegex = /^P-[A-Z0-9]+(?:_\d+)?\s\d{2}of\d{2}$/;
	return pipeTrakRegex.test(pattern.trim());
}

/**
 * Parse a PipeTrak drawing pattern into its components
 *
 * @param pattern - PipeTrak format pattern like "P-94011_2 01of03"
 * @returns Parsed components or null if invalid
 */
export function parsePipeTrakDrawingPattern(pattern: string): {
	baseDrawing: string;
	sheetNumber: number;
	totalSheets: number;
} | null {
	if (!isValidPipeTrakDrawingPattern(pattern)) {
		return null;
	}

	const parts = pattern.trim().split(" ");
	if (parts.length !== 2) {
		return null;
	}

	const [baseDrawing, sheetPart] = parts;
	const sheetMatch = sheetPart.match(/^(\d{2})of(\d{2})$/);

	if (!sheetMatch) {
		return null;
	}

	return {
		baseDrawing,
		sheetNumber: Number.parseInt(sheetMatch[1]),
		totalSheets: Number.parseInt(sheetMatch[2]),
	};
}
