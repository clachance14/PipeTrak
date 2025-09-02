/**
 * Enum validation utilities for import processing
 */

export const COMPONENT_TYPES = [
	// Piping Components
	"SPOOL",
	"PIPING_FOOTAGE",
	"THREADED_PIPE",
	"FITTING",

	// Mechanical Components
	"VALVE",
	"FLANGE",
	"GASKET",
	"SUPPORT",

	// Field Work
	"FIELD_WELD",
] as const;

export const WORKFLOW_TYPES = [
	"MILESTONE_DISCRETE", // Checkbox milestones
	"MILESTONE_PERCENTAGE", // Percentage entry milestones
	"MILESTONE_QUANTITY", // Quantity entry milestones
] as const;

export type ComponentType = (typeof COMPONENT_TYPES)[number];
export type WorkflowType = (typeof WORKFLOW_TYPES)[number];

/**
 * Validates if a value is a valid ComponentType
 */
export function isValidComponentType(value: string): value is ComponentType {
	return COMPONENT_TYPES.includes(value as ComponentType);
}

/**
 * Validates if a value is a valid WorkflowType
 */
export function isValidWorkflowType(value: string): value is WorkflowType {
	return WORKFLOW_TYPES.includes(value as WorkflowType);
}

/**
 * Gets all valid ComponentType values with descriptions
 */
export function getComponentTypeOptions() {
	return [
		{
			value: "SPOOL",
			label: "Spool",
			description: "Piping spool assembly",
		},
		{
			value: "PIPING_FOOTAGE",
			label: "Piping Footage",
			description: "Linear piping sections",
		},
		{
			value: "THREADED_PIPE",
			label: "Threaded Pipe",
			description: "Threaded piping connections",
		},
		{
			value: "FITTING",
			label: "Fitting",
			description: "Pipe fittings (elbows, tees, reducers, etc.)",
		},
		{ value: "VALVE", label: "Valve", description: "All valve types" },
		{
			value: "FLANGE",
			label: "Flange",
			description: "Flanges (weld neck, slip-on, blind, etc.)",
		},
		{
			value: "GASKET",
			label: "Gasket",
			description: "Gaskets and sealing elements",
		},
		{
			value: "SUPPORT",
			label: "Support",
			description: "Pipe supports and hangers",
		},
		{
			value: "FIELD_WELD",
			label: "Field Weld",
			description: "Field welding work",
		},
	];
}

/**
 * Gets all valid WorkflowType values with descriptions
 */
export function getWorkflowTypeOptions() {
	return [
		{
			value: "MILESTONE_DISCRETE",
			label: "Discrete Milestones",
			description: "Checkbox-based milestones (complete/incomplete)",
		},
		{
			value: "MILESTONE_PERCENTAGE",
			label: "Percentage Milestones",
			description: "Percentage-based progress tracking",
		},
		{
			value: "MILESTONE_QUANTITY",
			label: "Quantity Milestones",
			description: "Quantity-based progress tracking",
		},
	];
}

/**
 * Attempts to normalize and validate ComponentType from user input
 */
export function normalizeComponentType(value: string): ComponentType | null {
	if (!value) return null;

	const normalized = value.toUpperCase().trim();

	// Direct match
	if (isValidComponentType(normalized)) {
		return normalized;
	}

	// Common aliases
	const aliases: Record<string, ComponentType> = {
		PIPE: "SPOOL",
		PIPING: "SPOOL",
		WELD: "FIELD_WELD",
		WELDING: "FIELD_WELD",
	};

	if (aliases[normalized]) {
		return aliases[normalized];
	}

	return null;
}

/**
 * Attempts to normalize and validate WorkflowType from user input
 */
export function normalizeWorkflowType(value: string): WorkflowType | null {
	if (!value) return null;

	const normalized = value.toUpperCase().trim();

	// Direct match
	if (isValidWorkflowType(normalized)) {
		return normalized;
	}

	// Common aliases
	const aliases: Record<string, WorkflowType> = {
		DISCRETE: "MILESTONE_DISCRETE",
		CHECKBOX: "MILESTONE_DISCRETE",
		PERCENTAGE: "MILESTONE_PERCENTAGE",
		PERCENT: "MILESTONE_PERCENTAGE",
		QUANTITY: "MILESTONE_QUANTITY",
		QTY: "MILESTONE_QUANTITY",
	};

	if (aliases[normalized]) {
		return aliases[normalized];
	}

	return null;
}

/**
 * Automatically determines WorkflowType based on ComponentType
 */
export function getWorkflowTypeForComponent(
	componentType: ComponentType,
): WorkflowType {
	// Business logic for determining workflow type
	switch (componentType) {
		// Discrete milestone tracking (checkbox-based)
		case "VALVE":
		case "GASKET":
		case "FITTING":
		case "FLANGE":
		case "SUPPORT":
			return "MILESTONE_DISCRETE";

		// Percentage-based tracking
		case "SPOOL":
		case "PIPING_FOOTAGE":
		case "THREADED_PIPE":
			return "MILESTONE_PERCENTAGE";

		// Quantity-based tracking
		case "FIELD_WELD":
			return "MILESTONE_QUANTITY";

		default:
			// Default to discrete for unknown types
			return "MILESTONE_DISCRETE";
	}
}
