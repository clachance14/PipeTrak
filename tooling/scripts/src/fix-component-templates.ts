#!/usr/bin/env tsx

import { db as prisma } from "@repo/database";
import { createMilestoneTemplatesForProject } from "./create-milestone-templates";
import {
	resolveTemplateForComponent,
	analyzeComponentTypes,
	validateTemplateAssignment,
} from "./lib/template-resolver";

interface ComponentWithMilestones {
	id: string;
	componentId: string;
	type: string;
	workflowType: string;
	milestoneTemplateId: string;
	milestoneTemplate: {
		name: string;
	};
	milestones: Array<{
		id: string;
		milestoneName: string;
		weight: number;
		isCompleted: boolean;
		completedAt: Date | null;
		completedBy: string | null;
		effectiveDate: Date;
	}>;
}

interface MigrationStats {
	totalComponents: number;
	componentsFixed: number;
	milestonesRecreated: number;
	completionDataPreserved: number;
	templateAssignments: Record<string, number>;
	warnings: string[];
}

/**
 * Maps old milestone names to new milestone names
 */
const MILESTONE_MAPPING: Record<string, Record<string, string>> = {
	"Reduced Milestone Set": {
		Received: "Receive",
		"Fit-up": "Install",
		Welded: "Install",
		Tested: "Test",
		Insulated: "Restore",
		Punch: "Punch", // Keep the same
		Restore: "Restore", // Keep the same
	},
	"Full Milestone Set": {
		Received: "Receive",
		"Fit-up": "Erect",
		Welded: "Connect",
		Tested: "Test",
		Insulated: "Restore",
		Punch: "Punch",
		Restore: "Restore",
	},
	"Field Weld": {
		Received: "Fit-up Ready",
		"Fit-up": "Fit-up Ready",
		Welded: "Weld",
		Tested: "Test",
		Insulated: "Restore",
		Punch: "Punch",
		Restore: "Restore",
	},
};

async function loadTemplatesForProject(
	projectId: string,
): Promise<Map<string, any>> {
	const templates = await prisma.milestoneTemplate.findMany({
		where: { projectId },
	});

	const templateMap = new Map();
	for (const template of templates) {
		templateMap.set(template.name, template);
	}

	return templateMap;
}

async function preserveCompletionData(
	oldMilestones: ComponentWithMilestones["milestones"],
	newMilestones: any[],
	templateName: string,
): Promise<any[]> {
	const mapping = MILESTONE_MAPPING[templateName] || {};
	const completionMap = new Map();

	// Build completion status map from old milestones
	for (const oldMilestone of oldMilestones) {
		if (oldMilestone.isCompleted) {
			completionMap.set(oldMilestone.milestoneName, {
				isCompleted: true,
				completedAt: oldMilestone.completedAt,
				completedBy: oldMilestone.completedBy,
				effectiveDate: oldMilestone.effectiveDate,
			});
		}
	}

	// Apply completion data to new milestones
	return newMilestones.map((milestone) => {
		const mappedName = mapping[milestone.name] || milestone.name;

		// Check for completion data under the new name
		let completionData = completionMap.get(mappedName);

		// If not found, check old milestone names that map to this new name
		if (!completionData) {
			for (const [oldName, newName] of Object.entries(mapping)) {
				if (newName === mappedName && completionMap.has(oldName)) {
					completionData = completionMap.get(oldName);
					break;
				}
			}
		}

		return {
			...milestone,
			isCompleted: completionData?.isCompleted || false,
			completedAt: completionData?.completedAt || null,
			completedBy: completionData?.completedBy || null,
			effectiveDate: completionData?.effectiveDate || new Date(),
		};
	});
}

async function fixComponentTemplate(
	component: ComponentWithMilestones,
	templates: Map<string, any>,
	stats: MigrationStats,
): Promise<void> {
	// Determine the correct template for this component
	const correctTemplateId = resolveTemplateForComponent(
		component.type,
		component.componentId,
		component.workflowType,
		templates,
	);

	const correctTemplate = Array.from(templates.values()).find(
		(t) => t.id === correctTemplateId,
	);
	if (!correctTemplate) {
		stats.warnings.push(
			`No correct template found for component ${component.componentId}`,
		);
		return;
	}

	// Check if component is already using the correct template
	if (component.milestoneTemplateId === correctTemplateId) {
		console.log(
			`✅ Component ${component.componentId} already uses correct template: ${correctTemplate.name}`,
		);
		return;
	}

	console.log(
		`🔄 Fixing component ${component.componentId}: ${component.milestoneTemplate.name} → ${correctTemplate.name}`,
	);

	// Validate the assignment
	const validation = validateTemplateAssignment(
		component.type,
		component.componentId,
		correctTemplate.name,
	);
	if (!validation.isValid && validation.warning) {
		stats.warnings.push(validation.warning);
	}

	try {
		await prisma.$transaction(async (tx) => {
			// Update the component's template reference
			await tx.component.update({
				where: { id: component.id },
				data: { milestoneTemplateId: correctTemplateId },
			});

			// Parse new template milestones
			const newMilestones = JSON.parse(
				correctTemplate.milestones as string,
			);

			// Preserve completion data from old milestones
			const milestonesWithCompletion = await preserveCompletionData(
				component.milestones,
				newMilestones,
				correctTemplate.name,
			);

			// Delete old milestones
			await tx.componentMilestone.deleteMany({
				where: { componentId: component.id },
			});

			// Create new milestones with preserved completion data
			for (let i = 0; i < milestonesWithCompletion.length; i++) {
				const milestone = milestonesWithCompletion[i];

				await tx.componentMilestone.create({
					data: {
						componentId: component.id,
						milestoneOrder: i,
						milestoneName: milestone.name,
						weight: milestone.weight,
						isCompleted: milestone.isCompleted,
						completedAt: milestone.completedAt,
						completedBy: milestone.completedBy,
						effectiveDate: milestone.effectiveDate,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});

				if (milestone.isCompleted) {
					stats.completionDataPreserved++;
				}
			}

			stats.componentsFixed++;
			stats.milestonesRecreated += milestonesWithCompletion.length;
			stats.templateAssignments[correctTemplate.name] =
				(stats.templateAssignments[correctTemplate.name] || 0) + 1;

			console.log(
				`✅ Fixed ${component.componentId}: ${milestonesWithCompletion.length} milestones, ${milestonesWithCompletion.filter((m) => m.isCompleted).length} completed`,
			);
		});
	} catch (error) {
		console.error(
			`❌ Failed to fix component ${component.componentId}:`,
			error,
		);
		stats.warnings.push(
			`Failed to fix component ${component.componentId}: ${error}`,
		);
	}
}

async function analyzeProject(projectId: string): Promise<void> {
	console.log(`\n📊 Analyzing component types for project ${projectId}...`);

	const components = await prisma.component.findMany({
		where: { projectId },
		select: {
			type: true,
			componentId: true,
			milestoneTemplate: { select: { name: true } },
		},
	});

	if (components.length === 0) {
		console.log("No components found in project");
		return;
	}

	const analysis = analyzeComponentTypes(components);

	console.log("\nComponent Type Analysis:");
	console.log("========================");
	for (const [type, stats] of Object.entries(analysis)) {
		console.log(
			`${type}: ${stats.count} components → ${stats.template} template`,
		);
		console.log(`  Examples: ${stats.examples.join(", ")}`);
	}

	// Show current template distribution
	const templateDistribution: Record<string, number> = {};
	for (const component of components) {
		const templateName = component.milestoneTemplate.name;
		templateDistribution[templateName] =
			(templateDistribution[templateName] || 0) + 1;
	}

	console.log("\nCurrent Template Distribution:");
	for (const [template, count] of Object.entries(templateDistribution)) {
		console.log(`  ${template}: ${count} components`);
	}
}

async function fixProjectComponents(
	projectId: string,
	dryRun = false,
): Promise<MigrationStats> {
	console.log(
		`\n🔧 ${dryRun ? "ANALYZING" : "FIXING"} components for project ${projectId}...`,
	);

	const stats: MigrationStats = {
		totalComponents: 0,
		componentsFixed: 0,
		milestonesRecreated: 0,
		completionDataPreserved: 0,
		templateAssignments: {},
		warnings: [],
	};

	// Ensure all templates exist for this project
	console.log("Ensuring milestone templates exist...");
	const templates = await createMilestoneTemplatesForProject(projectId);

	// Load all components with their current milestones
	const components = await prisma.component.findMany({
		where: { projectId },
		include: {
			milestoneTemplate: {
				select: { name: true },
			},
			milestones: {
				select: {
					id: true,
					milestoneName: true,
					weight: true,
					isCompleted: true,
					completedAt: true,
					completedBy: true,
					effectiveDate: true,
				},
			},
		},
	});

	stats.totalComponents = components.length;

	if (components.length === 0) {
		console.log("No components found to fix");
		return stats;
	}

	console.log(`Found ${components.length} components to process`);

	// Process each component
	for (let i = 0; i < components.length; i++) {
		const component = components[i];
		console.log(
			`Processing ${i + 1}/${components.length}: ${component.componentId}`,
		);

		if (!dryRun) {
			await fixComponentTemplate(component, templates, stats);
		} else {
			// Dry run - just analyze what would be changed
			const correctTemplateId = resolveTemplateForComponent(
				component.type,
				component.componentId,
				component.workflowType,
				templates,
			);

			const correctTemplate = Array.from(templates.values()).find(
				(t) => t.id === correctTemplateId,
			);

			if (component.milestoneTemplateId !== correctTemplateId) {
				console.log(
					`WOULD FIX: ${component.componentId}: ${component.milestoneTemplate.name} → ${correctTemplate?.name}`,
				);
				stats.componentsFixed++;
				stats.templateAssignments[correctTemplate?.name || "Unknown"] =
					(stats.templateAssignments[
						correctTemplate?.name || "Unknown"
					] || 0) + 1;
			}
		}
	}

	return stats;
}

async function fixAllProjects(dryRun = false): Promise<void> {
	const projects = await prisma.project.findMany({
		select: {
			id: true,
			jobName: true,
			jobNumber: true,
		},
	});

	if (projects.length === 0) {
		console.log("No projects found");
		return;
	}

	console.log(`Found ${projects.length} projects to process`);

	const overallStats: MigrationStats = {
		totalComponents: 0,
		componentsFixed: 0,
		milestonesRecreated: 0,
		completionDataPreserved: 0,
		templateAssignments: {},
		warnings: [],
	};

	for (const project of projects) {
		console.log(
			`\n=== Processing ${project.jobName} (${project.jobNumber}) ===`,
		);

		// Analyze first
		await analyzeProject(project.id);

		// Then fix/dry-run
		const projectStats = await fixProjectComponents(project.id, dryRun);

		// Aggregate stats
		overallStats.totalComponents += projectStats.totalComponents;
		overallStats.componentsFixed += projectStats.componentsFixed;
		overallStats.milestonesRecreated += projectStats.milestonesRecreated;
		overallStats.completionDataPreserved +=
			projectStats.completionDataPreserved;
		overallStats.warnings.push(...projectStats.warnings);

		for (const [template, count] of Object.entries(
			projectStats.templateAssignments,
		)) {
			overallStats.templateAssignments[template] =
				(overallStats.templateAssignments[template] || 0) + count;
		}
	}

	// Print overall summary
	console.log(`\n${"=".repeat(60)}`);
	console.log(`${dryRun ? "DRY RUN" : "MIGRATION"} SUMMARY`);
	console.log(`${"=".repeat(60)}`);
	console.log(`Total components processed: ${overallStats.totalComponents}`);
	console.log(
		`Components ${dryRun ? "that would be" : ""} fixed: ${overallStats.componentsFixed}`,
	);

	if (!dryRun) {
		console.log(
			`Milestones recreated: ${overallStats.milestonesRecreated}`,
		);
		console.log(
			`Completion data preserved: ${overallStats.completionDataPreserved}`,
		);
	}

	console.log(`\nTemplate assignments ${dryRun ? "(projected)" : ""}:`);
	for (const [template, count] of Object.entries(
		overallStats.templateAssignments,
	)) {
		console.log(`  ${template}: ${count} components`);
	}

	if (overallStats.warnings.length > 0) {
		console.log(`\n⚠️  Warnings (${overallStats.warnings.length}):`);
		overallStats.warnings.forEach((warning, i) => {
			console.log(`  ${i + 1}. ${warning}`);
		});
	}

	console.log(
		`\n${dryRun ? "🔍 Analysis complete" : "🎉 Migration complete"}!`,
	);
}

// CLI interface
async function main() {
	const args = process.argv.slice(2);

	if (args.includes("--help") || args.includes("-h")) {
		console.log(`
Usage: tsx fix-component-templates.ts [options]

Options:
  --project-id ID    Fix components for specific project ID
  --all             Fix components for all projects (default)
  --dry-run         Show what would be changed without making changes
  --analyze         Show component type analysis only
  --help, -h        Show this help message

Examples:
  tsx fix-component-templates.ts --dry-run --all
  tsx fix-component-templates.ts --project-id clxyz123
  tsx fix-component-templates.ts --analyze --project-id clxyz123
    `);
		return;
	}

	const dryRun = args.includes("--dry-run");
	const analyzeOnly = args.includes("--analyze");
	const projectIdIndex = args.indexOf("--project-id");

	try {
		if (projectIdIndex !== -1 && args[projectIdIndex + 1]) {
			const projectId = args[projectIdIndex + 1];

			if (analyzeOnly) {
				await analyzeProject(projectId);
			} else {
				await analyzeProject(projectId);
				await fixProjectComponents(projectId, dryRun);
			}
		} else {
			if (analyzeOnly) {
				const projects = await prisma.project.findMany({
					select: { id: true, jobName: true },
				});
				for (const project of projects) {
					console.log(`\n=== ${project.jobName} ===`);
					await analyzeProject(project.id);
				}
			} else {
				await fixAllProjects(dryRun);
			}
		}
	} catch (error) {
		console.error("❌ Error fixing component templates:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

if (require.main === module) {
	main();
}
