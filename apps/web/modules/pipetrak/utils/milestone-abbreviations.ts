/**
 * Milestone abbreviation system for inline pill display
 * Based on actual PipeTrak milestone names from component templates
 */

// Standard milestone name to abbreviation mapping
const MILESTONE_ABBREVIATIONS: Record<string, string> = {
	// Full Milestone Set (7 milestones)
	Receive: "RCV",
	Erect: "ERC",
	Connect: "CON",
	Support: "SUP",
	Punch: "PCH",
	Test: "TST",
	Restore: "RST",

	// Reduced Milestone Set (5 milestones)
	Install: "INS",

	// Field Weld (5 milestones)
	"Fit-up Ready": "FIT",
	Weld: "WLD",
	"Weld Made": "WM",

	// Insulation (2 milestones)
	Insulate: "INS",
	"Metal Out": "MTO",

	// Paint (2 milestones)
	Primer: "PRM",
	"Finish Coat": "FIN",

	// Legacy/alternative names (case variations)
	receive: "RCV",
	erect: "ERC",
	connect: "CON",
	support: "SUP",
	punch: "PCH",
	test: "TST",
	restore: "RST",
	install: "INS",
	"fit-up ready": "FIT",
	weld: "WLD",
	"weld made": "WM",
	insulate: "INS",
	"metal out": "MTO",
	primer: "PRM",
	"finish coat": "FIN",
};

// Cache for performance
const abbreviationCache = new Map<string, string>();

/**
 * Generate smart abbreviation for milestone name
 */
export function generateAbbreviation(milestoneName: string): string {
	if (!milestoneName || typeof milestoneName !== "string") {
		return "UNK";
	}

	// Try exact match first
	const exactMatch = MILESTONE_ABBREVIATIONS[milestoneName];
	if (exactMatch) {
		return exactMatch;
	}

	// Try case-insensitive match
	const lowerMatch = MILESTONE_ABBREVIATIONS[milestoneName.toLowerCase()];
	if (lowerMatch) {
		return lowerMatch;
	}

	// Fallback: smart abbreviation generation
	return generateSmartAbbreviation(milestoneName);
}

/**
 * Get milestone abbreviation with caching
 */
export function getMilestoneAbbreviation(milestoneName: string): string {
	if (!milestoneName) return "UNK";

	// Check cache first
	if (abbreviationCache.has(milestoneName)) {
		return abbreviationCache.get(milestoneName)!;
	}

	// Generate and cache
	const abbreviation = generateAbbreviation(milestoneName);
	abbreviationCache.set(milestoneName, abbreviation);

	return abbreviation;
}

/**
 * Smart abbreviation generation for unknown milestone names
 */
function generateSmartAbbreviation(name: string): string {
	if (!name) return "UNK";

	// Clean the name
	const cleaned = name.trim();

	// Handle common patterns
	if (cleaned.includes("-")) {
		// "Fit-up Ready" -> "FIT"
		const parts = cleaned.split("-");
		return parts[0].substring(0, 3).toUpperCase();
	}

	if (cleaned.includes(" ")) {
		// "Metal Out" -> "MTO" (first letter of each word)
		const words = cleaned.split(" ").filter((w) => w.length > 0);
		if (words.length >= 2) {
			return words
				.map((w) => w.charAt(0))
				.join("")
				.toUpperCase()
				.substring(0, 3);
		}
	}

	// Single word: take first 3 characters
	return cleaned.substring(0, 3).toUpperCase();
}

/**
 * Get full milestone tooltip text
 */
export function getMilestoneTooltip(
	milestoneName: string,
	isCompleted: boolean,
): string {
	return `${milestoneName}: ${isCompleted ? "Completed" : "Not completed"}`;
}

/**
 * Clear abbreviation cache (useful when milestone templates change)
 */
export function clearAbbreviationCache(): void {
	abbreviationCache.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): {
	size: number;
	entries: Array<[string, string]>;
} {
	return {
		size: abbreviationCache.size,
		entries: Array.from(abbreviationCache.entries()),
	};
}
