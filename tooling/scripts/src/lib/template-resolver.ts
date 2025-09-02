/**
 * Template Resolution Logic for PipeTrak Components
 * Maps component types to appropriate milestone templates based on ROC matrix
 */

interface MilestoneTemplate {
	id: string;
	name: string;
	description: string;
	milestones: string; // JSON string
}

// Component type to milestone template mapping based on ROC matrix
const COMPONENT_TYPE_MAPPING: Record<string, string> = {
	// Full Milestone Set (Spools & Piping)
	SPOOL: "Full Milestone Set",
	PIPE: "Full Milestone Set",
	PIPING: "Full Milestone Set",
	PIPING_FOOTAGE: "Full Milestone Set",
	LARGE_BORE: "Full Milestone Set",

	// Reduced Milestone Set (Valves, Gaskets, Supports, Instruments)
	GASKET: "Reduced Milestone Set",
	VALVE: "Reduced Milestone Set",
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

// Alternative patterns for component type detection
const COMPONENT_TYPE_PATTERNS: Array<{ pattern: RegExp; template: string }> = [
	// Gasket patterns (various naming conventions)
	{ pattern: /^GK/i, template: "Reduced Milestone Set" },
	{ pattern: /GASKET/i, template: "Reduced Milestone Set" },
	{ pattern: /GKT/i, template: "Reduced Milestone Set" },

	// Valve patterns
	{ pattern: /^VLV/i, template: "Reduced Milestone Set" },
	{ pattern: /VALVE/i, template: "Reduced Milestone Set" },
	{ pattern: /^V-/i, template: "Reduced Milestone Set" },

	// Support patterns
	{ pattern: /SUPP/i, template: "Reduced Milestone Set" },
	{ pattern: /HANG/i, template: "Reduced Milestone Set" },
	{ pattern: /SPPT/i, template: "Reduced Milestone Set" },
	{ pattern: /^H-/i, template: "Reduced Milestone Set" },

	// Instrument patterns
	{ pattern: /^I-/i, template: "Reduced Milestone Set" },
	{ pattern: /INSTR/i, template: "Reduced Milestone Set" },
	{ pattern: /^FT-/i, template: "Reduced Milestone Set" }, // Flow transmitter
	{ pattern: /^PT-/i, template: "Reduced Milestone Set" }, // Pressure transmitter
	{ pattern: /^TT-/i, template: "Reduced Milestone Set" }, // Temperature transmitter

	// Spool patterns
	{ pattern: /^SP/i, template: "Full Milestone Set" },
	{ pattern: /SPOOL/i, template: "Full Milestone Set" },
	{ pattern: /^P-/i, template: "Full Milestone Set" },

	// Pipe patterns
	{ pattern: /PIPE/i, template: "Full Milestone Set" },
	{ pattern: /^L-/i, template: "Full Milestone Set" }, // Line designation

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
 * Resolves the appropriate milestone template for a component
 * @param componentType - The component type string
 * @param componentId - The component ID for pattern matching
 * @param workflowType - The workflow type (optional)
 * @param templates - Map of available templates by name
 * @returns The template ID to use
 */
export function resolveTemplateForComponent(
	componentType: string,
	componentId: string,
	workflowType: string | undefined,
	templates: Map<string, MilestoneTemplate>,
): string {
	// First, try exact type mapping
	const normalizedType = componentType?.toUpperCase() || "";
	let templateName = COMPONENT_TYPE_MAPPING[normalizedType];

	// If no exact match, try pattern matching on both type and ID
	if (!templateName) {
		for (const { pattern, template } of COMPONENT_TYPE_PATTERNS) {
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
		console.log(
			`⚠️  No template mapping found for type "${componentType}" and ID "${componentId}", using default: ${templateName}`,
		);
	}

	// Get the actual template
	const template = templates.get(templateName);
	if (!template) {
		// Fallback to any available template (shouldn't happen in normal operation)
		const fallbackTemplate = Array.from(templates.values())[0];
		if (!fallbackTemplate) {
			throw new Error("No milestone templates available for project");
		}
		console.error(
			`❌ Template "${templateName}" not found, falling back to: ${fallbackTemplate.name}`,
		);
		return fallbackTemplate.id;
	}

	return template.id;
}

/**
 * Gets component type statistics for debugging template assignment
 */
export function analyzeComponentTypes(
	components: Array<{ type: string; componentId: string }>,
): Record<string, { count: number; template: string; examples: string[] }> {
	const stats: Record<
		string,
		{ count: number; template: string; examples: string[] }
	> = {};

	// Create a dummy template map for analysis
	const dummyTemplates = new Map([
		[
			"Full Milestone Set",
			{
				id: "full",
				name: "Full Milestone Set",
				description: "",
				milestones: "",
			},
		],
		[
			"Reduced Milestone Set",
			{
				id: "reduced",
				name: "Reduced Milestone Set",
				description: "",
				milestones: "",
			},
		],
		[
			"Field Weld",
			{
				id: "fieldweld",
				name: "Field Weld",
				description: "",
				milestones: "",
			},
		],
		[
			"Insulation",
			{
				id: "insulation",
				name: "Insulation",
				description: "",
				milestones: "",
			},
		],
		[
			"Paint",
			{ id: "paint", name: "Paint", description: "", milestones: "" },
		],
	]);

	for (const component of components) {
		const type = component.type || "UNKNOWN";
		const templateName = resolveTemplateForComponent(
			type,
			component.componentId,
			undefined,
			dummyTemplates,
		);
		const template =
			Array.from(dummyTemplates.values()).find(
				(t) => t.id === templateName,
			)?.name || "Unknown";

		if (!stats[type]) {
			stats[type] = {
				count: 0,
				template,
				examples: [],
			};
		}

		stats[type].count++;
		if (stats[type].examples.length < 3) {
			stats[type].examples.push(component.componentId);
		}
	}

	return stats;
}

/**
 * Validates that a template assignment makes sense
 */
export function validateTemplateAssignment(
	componentType: string,
	componentId: string,
	assignedTemplateName: string,
): { isValid: boolean; warning?: string } {
	const normalizedType = componentType?.toUpperCase() || "";
	const expectedTemplate = COMPONENT_TYPE_MAPPING[normalizedType];

	// Check pattern-based assignment if no exact mapping
	if (!expectedTemplate) {
		for (const { pattern, template } of COMPONENT_TYPE_PATTERNS) {
			if (
				pattern.test(componentType || "") ||
				pattern.test(componentId || "")
			) {
				if (template !== assignedTemplateName) {
					return {
						isValid: false,
						warning: `Component "${componentId}" (type: ${componentType}) should use "${template}" template, but assigned "${assignedTemplateName}"`,
					};
				}
				return { isValid: true };
			}
		}
	}

	if (expectedTemplate && expectedTemplate !== assignedTemplateName) {
		return {
			isValid: false,
			warning: `Component "${componentId}" (type: ${componentType}) should use "${expectedTemplate}" template, but assigned "${assignedTemplateName}"`,
		};
	}

	return { isValid: true };
}

// Export the mapping for reference
export { COMPONENT_TYPE_MAPPING, COMPONENT_TYPE_PATTERNS };
