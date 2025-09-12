/**
 * ROC (Rules of Credit) Templates and Component Type Configuration
 * Based on project-documentation/roc-component-type-matrix.md
 */

import {
	ComponentType,
	WorkflowType,
} from "@repo/database/prisma/generated/client";

// Milestone weight distributions for different ROC templates
export const ROC_MILESTONE_WEIGHTS = {
	// Full milestone set (7 milestones)
	FULL: {
		receive: 5,
		erect: 30,
		fabricate: 0,
		connect: 30,
		install: 0,
		support: 15,
		punch: 5,
		test: 10,
		restore: 5,
		insulate: 0,
		metalOut: 0,
		primer: 0,
		finish: 0,
	},

	// Reduced milestone set (5 milestones) - Install/Connect combined at 60%
	REDUCED: {
		receive: 10,
		erect: 0,
		fabricate: 0,
		connect: 0,
		install: 60, // Combined install/connect
		support: 0,
		punch: 10,
		test: 15,
		restore: 5,
		insulate: 0,
		metalOut: 0,
		primer: 0,
		finish: 0,
	},

	// Threaded pipe custom set
	THREADED: {
		receive: 0,
		erect: 25,
		fabricate: 25,
		connect: 30,
		install: 0,
		support: 0,
		punch: 5,
		test: 10,
		restore: 5,
		insulate: 0,
		metalOut: 0,
		primer: 0,
		finish: 0,
	},

	// Two-step insulation
	INSULATION: {
		receive: 0,
		erect: 0,
		fabricate: 0,
		connect: 0,
		install: 0,
		support: 0,
		punch: 0,
		test: 0,
		restore: 0,
		insulate: 60,
		metalOut: 40,
		primer: 0,
		finish: 0,
	},

	// Two-step paint
	PAINT: {
		receive: 0,
		erect: 0,
		fabricate: 0,
		connect: 0,
		install: 0,
		support: 0,
		punch: 0,
		test: 0,
		restore: 0,
		insulate: 0,
		metalOut: 0,
		primer: 40,
		finish: 60,
	},
};

// Component type to ROC template mapping
export const COMPONENT_TYPE_ROC_TEMPLATE: Record<
	ComponentType,
	keyof typeof ROC_MILESTONE_WEIGHTS
> = {
	// Full milestone set (7 milestones)
	[ComponentType.SPOOL]: "FULL",
	[ComponentType.PIPING_FOOTAGE]: "FULL",

	// Reduced milestone set (5 milestones)
	[ComponentType.VALVE]: "REDUCED",
	[ComponentType.GASKET]: "REDUCED",
	[ComponentType.SUPPORT]: "REDUCED",
	[ComponentType.INSTRUMENT]: "REDUCED",
	[ComponentType.FIELD_WELD]: "REDUCED",
	[ComponentType.FITTING]: "REDUCED", // NEW: Fittings use reduced set
	[ComponentType.FLANGE]: "REDUCED", // NEW: Flanges use reduced set

	// Custom milestone sets
	[ComponentType.THREADED_PIPE]: "THREADED",
	[ComponentType.INSULATION]: "INSULATION",
	[ComponentType.PAINT]: "PAINT",

	// Fallback
	[ComponentType.OTHER]: "REDUCED",
};

// Component type to workflow type mapping
export const COMPONENT_TYPE_WORKFLOW: Record<ComponentType, WorkflowType> = {
	// Discrete checkbox workflows
	[ComponentType.SPOOL]: WorkflowType.MILESTONE_DISCRETE,
	[ComponentType.VALVE]: WorkflowType.MILESTONE_DISCRETE,
	[ComponentType.GASKET]: WorkflowType.MILESTONE_DISCRETE,
	[ComponentType.SUPPORT]: WorkflowType.MILESTONE_DISCRETE,
	[ComponentType.INSTRUMENT]: WorkflowType.MILESTONE_DISCRETE,
	[ComponentType.FIELD_WELD]: WorkflowType.MILESTONE_DISCRETE,
	[ComponentType.FITTING]: WorkflowType.MILESTONE_DISCRETE, // NEW: Discrete tracking
	[ComponentType.FLANGE]: WorkflowType.MILESTONE_DISCRETE, // NEW: Discrete tracking
	[ComponentType.OTHER]: WorkflowType.MILESTONE_DISCRETE,

	// Quantity-based workflows
	[ComponentType.PIPING_FOOTAGE]: WorkflowType.MILESTONE_QUANTITY,
	[ComponentType.INSULATION]: WorkflowType.MILESTONE_QUANTITY,
	[ComponentType.PAINT]: WorkflowType.MILESTONE_QUANTITY,

	// Percentage-based workflows
	[ComponentType.THREADED_PIPE]: WorkflowType.MILESTONE_PERCENTAGE,
};

// Get ROC weights for a component type
export function getROCWeights(componentType: ComponentType) {
	const template = COMPONENT_TYPE_ROC_TEMPLATE[componentType];
	return ROC_MILESTONE_WEIGHTS[template];
}

// Get workflow type for a component type
export function getWorkflowType(componentType: ComponentType): WorkflowType {
	return COMPONENT_TYPE_WORKFLOW[componentType];
}

// Calculate progress based on completed milestones and ROC weights
export function calculateROCProgress(
	componentType: ComponentType,
	completedMilestones: string[],
): number {
	const weights = getROCWeights(componentType);
	let totalProgress = 0;

	for (const milestone of completedMilestones) {
		const weight = weights[milestone as keyof typeof weights];
		if (weight) {
			totalProgress += weight;
		}
	}

	return Math.min(totalProgress, 100); // Cap at 100%
}

// Component type descriptions for UI display
export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
	[ComponentType.SPOOL]: "Pipe Spool",
	[ComponentType.PIPING_FOOTAGE]: "Piping (by footage)",
	[ComponentType.THREADED_PIPE]: "Threaded Pipe",
	[ComponentType.FITTING]: "Fitting", // NEW
	[ComponentType.VALVE]: "Valve",
	[ComponentType.FLANGE]: "Flange", // NEW
	[ComponentType.GASKET]: "Gasket",
	[ComponentType.SUPPORT]: "Support",
	[ComponentType.FIELD_WELD]: "Field Weld",
	[ComponentType.INSTRUMENT]: "Instrument",
	[ComponentType.INSULATION]: "Insulation",
	[ComponentType.PAINT]: "Paint",
	[ComponentType.OTHER]: "Other",
};

// Component type categories for grouping in UI
export const COMPONENT_TYPE_CATEGORIES = {
	"Piping Components": [
		ComponentType.SPOOL,
		ComponentType.PIPING_FOOTAGE,
		ComponentType.THREADED_PIPE,
		ComponentType.FITTING,
	],
	"Mechanical Components": [
		ComponentType.VALVE,
		ComponentType.FLANGE,
		ComponentType.GASKET,
		ComponentType.SUPPORT,
	],
	"Field Work": [ComponentType.FIELD_WELD],
	Instrumentation: [ComponentType.INSTRUMENT],
	"Secondary Systems": [ComponentType.INSULATION, ComponentType.PAINT],
	Other: [ComponentType.OTHER],
};

// Fitting subtypes for more specific identification
export const FITTING_SUBTYPES = [
	"Elbow",
	"Tee",
	"Reducer",
	"Coupling",
	"Union",
	"Cap",
	"Plug",
	"Nipple",
	"Bushing",
	"Cross",
	"Wye",
	"Lateral",
];

// Flange subtypes for more specific identification
export const FLANGE_SUBTYPES = [
	"Weld Neck",
	"Slip-On",
	"Socket Weld",
	"Threaded",
	"Lap Joint",
	"Blind",
	"Spectacle Blind",
	"Orifice Flange",
	"Ring Type Joint (RTJ)",
	"Raised Face (RF)",
	"Flat Face (FF)",
];
