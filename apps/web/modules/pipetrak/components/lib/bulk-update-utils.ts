import type { ComponentWithMilestones } from "../../types";

export interface ComponentGroup {
	type: string;
	templateId: string;
	templateName: string;
	components: ComponentWithMilestones[];
	availableMilestones: string[];
	commonWithOthers: string[];
}

export interface BulkUpdateSelections {
	[templateId: string]: Set<string>; // milestone names
}

export type BulkUpdateFailure = {
	componentId: string;
	milestoneName?: string;
	error: string;
};

export type BulkUpdateSuccess = {
	componentId: string;
	milestoneName: string;
	milestone?: any;
};

export interface BulkUpdateResult {
	successful: BulkUpdateSuccess[];
	failed: BulkUpdateFailure[];
	total: number;
}

/**
 * Groups components by their milestone template
 */
export function groupComponentsByTemplate(
	components: ComponentWithMilestones[],
): ComponentGroup[] {
	// Group by template ID
	const templateMap = new Map<string, ComponentWithMilestones[]>();

	components.forEach((component) => {
		const templateId = component.milestoneTemplateId || "unknown";
		if (!templateMap.has(templateId)) {
			templateMap.set(templateId, []);
		}
		templateMap.get(templateId)!.push(component);
	});

	// Convert to ComponentGroup array
	const groups = Array.from(templateMap.entries()).map(
		([templateId, groupComponents]) => {
			const firstComponent = groupComponents[0];

			// Extract unique milestone names from all components in group
			const milestoneNames = new Set<string>();
			groupComponents.forEach((comp) => {
				comp.milestones?.forEach((milestone) => {
					milestoneNames.add(milestone.milestoneName);
				});
			});

			return {
				type: firstComponent.type || "Unknown",
				templateId,
				templateName:
					firstComponent.milestoneTemplate?.name ||
					"Unknown Template",
				components: groupComponents,
				availableMilestones: Array.from(milestoneNames).sort(),
				commonWithOthers: [], // Will be populated below
			};
		},
	);

	// Find common milestones across all groups
	if (groups.length > 1) {
		const allMilestoneArrays = groups.map((g) => g.availableMilestones);
		const commonMilestones = findIntersection(allMilestoneArrays);

		// Update each group's commonWithOthers
		groups.forEach((group) => {
			group.commonWithOthers = commonMilestones;
		});
	} else if (groups.length === 1) {
		// Single group - all milestones are "common"
		groups[0].commonWithOthers = groups[0].availableMilestones;
	}

	// Sort groups by type name for consistent display
	return groups.sort((a, b) => a.type.localeCompare(b.type));
}

/**
 * Find intersection of multiple arrays (common elements)
 */
function findIntersection<T>(arrays: T[][]): T[] {
	if (arrays.length === 0) return [];
	if (arrays.length === 1) return arrays[0];

	return arrays.reduce((intersection, currentArray) =>
		intersection.filter((item) => currentArray.includes(item)),
	);
}

/**
 * Find common milestone names across all selected components
 */
export function findCommonMilestones(
	components: ComponentWithMilestones[],
): string[] {
	if (components.length === 0) return [];

	const milestoneArrays = components.map(
		(comp) => comp.milestones?.map((m) => m.milestoneName) || [],
	);

	return findIntersection(milestoneArrays);
}

/**
 * Generate bulk update payload from selections
 */
export function generateBulkUpdatePayload(
	groups: ComponentGroup[],
	selections: BulkUpdateSelections,
): Array<{ componentId: string; milestoneName: string; type: string }> {
	const updates: Array<{
		componentId: string;
		milestoneName: string;
		type: string;
	}> = [];

	groups.forEach((group) => {
		const selectedMilestones = selections[group.templateId];
		if (selectedMilestones && selectedMilestones.size > 0) {
			group.components.forEach((component) => {
				selectedMilestones.forEach((milestoneName) => {
					updates.push({
						componentId: component.id,
						milestoneName,
						type: group.type,
					});
				});
			});
		}
	});

	return updates;
}

/**
 * Validate that selected milestones exist in components
 */
export function validateBulkUpdate(
	groups: ComponentGroup[],
	selections: BulkUpdateSelections,
): {
	valid: boolean;
	warnings: string[];
	errors: string[];
	updateCount: number;
} {
	const validation = {
		valid: true,
		warnings: [] as string[],
		errors: [] as string[],
		updateCount: 0,
	};

	let hasSelections = false;

	groups.forEach((group) => {
		const selectedMilestones = selections[group.templateId];

		if (!selectedMilestones || selectedMilestones.size === 0) {
			validation.warnings.push(
				`No milestones selected for ${group.type} components (${group.components.length} components)`,
			);
			return;
		}

		hasSelections = true;

		// Check if selected milestones exist in the group
		selectedMilestones.forEach((milestoneName) => {
			if (!group.availableMilestones.includes(milestoneName)) {
				validation.errors.push(
					`Milestone "${milestoneName}" not found for ${group.type} components`,
				);
				validation.valid = false;
			} else {
				// Count valid updates
				validation.updateCount += group.components.length;
			}
		});
	});

	if (!hasSelections) {
		validation.errors.push(
			"No milestones selected for any component group",
		);
		validation.valid = false;
	}

	return validation;
}

/**
 * Generate human-readable summary of planned updates
 */
export function generateUpdateSummary(
	groups: ComponentGroup[],
	selections: BulkUpdateSelections,
): string {
	const summaryLines: string[] = [];

	groups.forEach((group) => {
		const selectedMilestones = selections[group.templateId];
		if (selectedMilestones && selectedMilestones.size > 0) {
			const milestoneNames = Array.from(selectedMilestones).join(", ");
			summaryLines.push(
				`${group.type} (${group.components.length} components): ${milestoneNames}`,
			);
		}
	});

	return summaryLines.join("\n");
}

/**
 * Helper to apply filters to components
 */
export function applyComponentFilters(
	components: ComponentWithMilestones[],
	filters: {
		area?: string;
		testPackage?: string;
		system?: string;
		type?: string;
		status?: string;
		search?: string;
	},
): ComponentWithMilestones[] {
	return components.filter((component) => {
		// Area filter
		if (
			filters.area &&
			filters.area !== "all" &&
			component.area !== filters.area
		) {
			return false;
		}

		// Test package filter
		if (
			filters.testPackage &&
			filters.testPackage !== "all" &&
			component.testPackage !== filters.testPackage
		) {
			return false;
		}

		// System filter
		if (
			filters.system &&
			filters.system !== "all" &&
			component.system !== filters.system
		) {
			return false;
		}

		// Type filter
		if (
			filters.type &&
			filters.type !== "all" &&
			component.type !== filters.type
		) {
			return false;
		}

		// Status filter
		if (
			filters.status &&
			filters.status !== "all" &&
			component.status !== filters.status
		) {
			return false;
		}

		// Search filter (searches component ID, description, type)
		if (filters.search && filters.search.trim()) {
			const searchTerm = filters.search.toLowerCase().trim();
			const searchableText = [
				component.componentId,
				component.description,
				component.type,
				component.spec,
				component.size,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();

			if (!searchableText.includes(searchTerm)) {
				return false;
			}
		}

		return true;
	});
}
