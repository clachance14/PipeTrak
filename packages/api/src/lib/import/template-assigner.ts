import { db as prisma } from "@repo/database";
import type { MilestoneTemplate, MilestoneDefinition } from "./types";

type ComponentType =
	| "PIPE"
	| "SPOOL"
	| "VALVE"
	| "FITTING"
	| "FLANGE"
	| "GASKET"
	| "SUPPORT"
	| "INSTRUMENT"
	| "FIELD_WELD"
	| "MISC";

export class MilestoneTemplateAssigner {
	private templates: {
		full?: MilestoneTemplate;
		reduced?: MilestoneTemplate;
		fieldWeld?: MilestoneTemplate;
	} = {};

	async initialize(projectId: string) {
		console.log(
			`Initializing milestone templates for project ${projectId}...`,
		);

		// Get or create the two standard templates
		this.templates.full = await this.ensureTemplate(projectId, {
			name: "Full Milestone Set",
			description:
				"For pipes and spools - comprehensive milestone tracking",
			milestones: [
				{ name: "Receive", weight: 5, order: 1 },
				{ name: "Erect", weight: 30, order: 2 },
				{ name: "Connect", weight: 30, order: 3 },
				{ name: "Support", weight: 15, order: 4 },
				{ name: "Punch", weight: 5, order: 5 },
				{ name: "Test", weight: 10, order: 6 },
				{ name: "Restore", weight: 5, order: 7 },
			],
		});

		this.templates.reduced = await this.ensureTemplate(projectId, {
			name: "Reduced Milestone Set",
			description: "For components - simplified milestone tracking",
			milestones: [
				{ name: "Receive", weight: 10, order: 1 },
				{ name: "Install", weight: 60, order: 2 },
				{ name: "Punch", weight: 10, order: 3 },
				{ name: "Test", weight: 15, order: 4 },
				{ name: "Restore", weight: 5, order: 5 },
			],
		});

		this.templates.fieldWeld = await this.ensureTemplate(projectId, {
			name: "Field Weld",
			description: "For field welds - weld-specific milestone tracking",
			milestones: [
				{ name: "Fit Up", weight: 10, order: 1 },
				{ name: "Weld Made", weight: 60, order: 2 },
				{ name: "Punch", weight: 10, order: 3 },
				{ name: "Test", weight: 15, order: 4 },
				{ name: "Restore", weight: 5, order: 5 },
			],
		});

		console.log("Templates initialized:", {
			full: this.templates.full.id,
			reduced: this.templates.reduced.id,
			fieldWeld: this.templates.fieldWeld.id,
		});
	}

	private async ensureTemplate(
		projectId: string,
		template: {
			name: string;
			description: string;
			milestones: MilestoneDefinition[];
		},
	): Promise<MilestoneTemplate> {
		// Check if template already exists for this project
		let existing = await prisma.milestoneTemplate.findFirst({
			where: {
				projectId,
				name: template.name,
			},
		});

		if (!existing) {
			console.log(`Creating template: ${template.name}`);

			// Validate milestone weights sum to 100
			const totalWeight = template.milestones.reduce(
				(sum, m) => sum + m.weight,
				0,
			);
			if (Math.abs(totalWeight - 100) > 0.01) {
				throw new Error(
					`Template "${template.name}" weights sum to ${totalWeight}%, not 100%`,
				);
			}

			existing = await prisma.milestoneTemplate.create({
				data: {
					projectId,
					name: template.name,
					description: template.description,
					milestones: template.milestones,
					isDefault: template.name === "Reduced Milestone Set",
				},
			});
		}

		return {
			id: existing.id,
			name: existing.name,
			milestones: Array.isArray(existing.milestones)
				? (existing.milestones as MilestoneDefinition[])
				: (JSON.parse(
						existing.milestones as string,
					) as MilestoneDefinition[]),
		};
	}

	getTemplateForType(componentType: ComponentType): string {
		if (
			!this.templates.full ||
			!this.templates.reduced ||
			!this.templates.fieldWeld
		) {
			throw new Error(
				"Templates not initialized. Call initialize() first.",
			);
		}

		// Field welds get their own specific template
		if (componentType === "FIELD_WELD") {
			console.log(`Assigning Field Weld template to ${componentType}`);
			return this.templates.fieldWeld.id;
		}

		// Pipes and Spools get full milestone set
		if (componentType === "PIPE" || componentType === "SPOOL") {
			console.log(`Assigning Full Milestone Set to ${componentType}`);
			return this.templates.full.id;
		}

		// Everything else gets reduced milestone set
		console.log(`Assigning Reduced Milestone Set to ${componentType}`);
		return this.templates.reduced.id;
	}

	// Get template assignment preview for UI
	getTemplateAssignments(componentTypes: ComponentType[]): {
		fullMilestone: number;
		reducedMilestone: number;
	} {
		const counts = {
			fullMilestone: 0,
			reducedMilestone: 0,
		};

		for (const type of componentTypes) {
			if (type === "PIPE" || type === "SPOOL") {
				counts.fullMilestone++;
			} else {
				counts.reducedMilestone++;
			}
		}

		return counts;
	}

	// Create milestones for imported components
	async createMilestonesForComponents(
		components: {
			id: string;
			milestoneTemplateId: string;
			workflowType: string;
		}[],
		txClient?: any, // Optional transaction client
	) {
		console.log(
			`Creating milestones for ${components.length} components...`,
		);

		// Use the transaction client if provided, otherwise use the default prisma client
		const db = txClient || prisma;

		// Group components by template
		const componentsByTemplate = new Map<string, typeof components>();

		for (const component of components) {
			const templateId = component.milestoneTemplateId;
			if (!componentsByTemplate.has(templateId)) {
				componentsByTemplate.set(templateId, []);
			}
			componentsByTemplate.get(templateId)!.push(component);
		}

		// Create milestones for each template group
		const allMilestonesToCreate = [];

		for (const [templateId, templateComponents] of componentsByTemplate) {
			// Get template definition
			const template = await db.milestoneTemplate.findUnique({
				where: { id: templateId },
			});

			if (!template) {
				console.error(`Template ${templateId} not found`);
				continue;
			}

			const milestones = Array.isArray(template.milestones)
				? (template.milestones as MilestoneDefinition[])
				: (JSON.parse(
						template.milestones as string,
					) as MilestoneDefinition[]);

			console.log(
				`Creating ${milestones.length} milestones for ${templateComponents.length} components using template ${template.name}`,
			);

			// Create milestones for all components using this template
			for (const component of templateComponents) {
				for (const milestone of milestones) {
					allMilestonesToCreate.push({
						componentId: component.id,
						milestoneName: milestone.name,
						milestoneOrder: milestone.order,
						weight: milestone.weight,
						isCompleted: false,
						percentageValue:
							component.workflowType === "MILESTONE_PERCENTAGE"
								? 0
								: null,
						quantityValue:
							component.workflowType === "MILESTONE_QUANTITY"
								? 0
								: null,
					});
				}
			}
		}

		if (allMilestonesToCreate.length > 0) {
			console.log(
				`Bulk creating ${allMilestonesToCreate.length} milestone records...`,
			);
			const result = await db.componentMilestone.createMany({
				data: allMilestonesToCreate,
			});
			console.log(`✅ Created ${result.count} milestones`);
		}
	}
}
