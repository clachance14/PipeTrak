#!/usr/bin/env tsx
import { db as prisma, type ComponentTypeType } from "@repo/database";
import { createId } from "@paralleldrive/cuid2";
import * as fs from "fs";
import * as path from "path";
import { createMilestoneTemplatesForProject } from "./create-milestone-templates";
import { resolveTemplateForComponent } from "./lib/template-resolver";

interface SDOTankData {
	project: {
		name: string;
		jobNumber?: string; // Added for new schema
		description: string;
		location: string;
		startDate: string;
		targetDate: string;
	};
	drawings: Array<{
		number: string;
		description: string;
		revision: string;
	}>;
	components: Array<{
		componentId: string;
		type: string;
		spec: string;
		size: string;
		material: string;
		area: string;
		system: string;
		drawingNumber: string;
		testPackage: string;
		workflowType?: string; // Made optional with default
		milestones: Array<{
			name: string;
			completed?: boolean; // Handle both 'completed' and 'isCompleted'
			isCompleted?: boolean; // Support ChatGPT variation
			completedDate?: string;
			weight?: number; // Added for proper milestone weights
		}>;
	}>;
}

async function seedSDOTankJob() {
	console.log("🌱 Seeding SDO Tank Job data...");

	try {
		// Load the SDO Tank data
		const dataPath = path.join(__dirname, "sdo-tank-data.json");
		const rawData = fs.readFileSync(dataPath, "utf-8");
		const sdoData: SDOTankData = JSON.parse(rawData);

		// Get the first organization (or create one for testing)
		let organization = await prisma.organization.findFirst();

		if (!organization) {
			console.log("Creating test organization...");
			organization = await prisma.organization.create({
				data: {
					id: createId(),
					name: "SDO Construction",
					slug: "sdo-construction",
					createdAt: new Date(),
				},
			});
		}

		// Get first user or create test user
		let user = await prisma.user.findFirst();

		if (!user) {
			console.log("Creating test user...");
			user = await prisma.user.create({
				data: {
					id: createId(),
					name: "Project Manager",
					email: "pm@sdo-construction.com",
					emailVerified: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			// Add user to organization
			await prisma.member.create({
				data: {
					id: createId(),
					userId: user.id,
					organizationId: organization.id,
					role: "owner",
					createdAt: new Date(),
				},
			});
		}

		// Create the SDO Tank Job project
		console.log("Creating SDO Tank Job project...");

		// Check if project already exists
		const existingProject = await prisma.project.findFirst({
			where: {
				organizationId: organization.id,
				jobNumber: sdoData.project.jobNumber || "SDO-TANK",
			},
		});

		if (existingProject) {
			console.log(
				`Project already exists: ${existingProject.jobName} (${existingProject.id})`,
			);
			console.log("Cleaning up existing data...");

			// Delete existing components and related data
			await prisma.componentMilestone.deleteMany({
				where: {
					component: {
						projectId: existingProject.id,
					},
				},
			});
			await prisma.component.deleteMany({
				where: { projectId: existingProject.id },
			});
			await prisma.drawing.deleteMany({
				where: { projectId: existingProject.id },
			});
			await prisma.milestoneTemplate.deleteMany({
				where: { projectId: existingProject.id },
			});

			// Delete and recreate the project
			await prisma.project.delete({
				where: { id: existingProject.id },
			});
		}

		const project = await prisma.project.create({
			data: {
				id: createId(),
				organizationId: organization.id,
				jobName: sdoData.project.name,
				jobNumber: sdoData.project.jobNumber || "SDO-TANK", // Use from JSON or default
				description:
					sdoData.project.description || "Tank Job at Dow Seadrift",
				status: "ACTIVE",
				location: sdoData.project.location,
				startDate: sdoData.project.startDate
					? new Date(sdoData.project.startDate)
					: new Date("2024-11-01"),
				targetDate: sdoData.project.targetDate
					? new Date(sdoData.project.targetDate)
					: new Date("2025-03-31"),
				createdBy: user.id,
				createdAt: new Date(),
			},
		});

		console.log(`Created project: ${project.jobName} (${project.id})`);

		// Create all milestone templates (Full, Reduced, Field Weld, Insulation, Paint)
		console.log("Creating milestone templates...");
		const templates = await createMilestoneTemplatesForProject(project.id);

		// Create drawings
		console.log(`Creating ${sdoData.drawings.length} drawings...`);
		const drawingMap = new Map<string, string>(); // Map drawing number to ID

		for (const drawingData of sdoData.drawings) {
			const drawing = await prisma.drawing.create({
				data: {
					id: createId(),
					projectId: project.id,
					number: drawingData.number,
					title: drawingData.description || "",
					revision: drawingData.revision || "0",
					createdAt: new Date(),
				},
			});
			drawingMap.set(drawingData.number, drawing.id);
		}

		console.log(`Created ${drawingMap.size} drawings`);

		// Create components and their milestones
		console.log(`Creating ${sdoData.components.length} components...`);
		let componentCount = 0;

		// Track instance numbers per drawing+componentId
		const instanceTracker = new Map<
			string,
			{ current: number; total: number }
		>();

		// First pass: count instances per drawing
		for (const comp of sdoData.components) {
			const key = `${comp.drawingNumber}:${comp.componentId}`;
			const tracker = instanceTracker.get(key) || {
				current: 0,
				total: 0,
			};
			tracker.total++;
			instanceTracker.set(key, tracker);
		}

		for (const componentData of sdoData.components) {
			// Calculate completion status based on milestones (handle both field names)
			const completedMilestones = componentData.milestones.filter(
				(m) => m.completed || m.isCompleted,
			).length;
			const totalMilestones = componentData.milestones.length;
			const completionPercent =
				totalMilestones > 0
					? Math.round((completedMilestones / totalMilestones) * 100)
					: 0;

			let status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" =
				"NOT_STARTED";
			if (completionPercent === 100) {
				status = "COMPLETED";
			} else if (completionPercent > 0) {
				status = "IN_PROGRESS";
			}

			// Get the drawing ID
			const drawingId = drawingMap.get(componentData.drawingNumber);
			if (!drawingId) {
				console.warn(
					`Warning: Drawing ${componentData.drawingNumber} not found for component ${componentData.componentId}`,
				);
				continue;
			}

			// Get and increment instance number for this component on this drawing
			const instanceKey = `${componentData.drawingNumber}:${componentData.componentId}`;
			const tracker = instanceTracker.get(instanceKey);
			if (!tracker) {
				console.error(`No tracker found for instance key: ${instanceKey}`);
				continue;
			}
			tracker.current++;
			const instanceNumber = tracker.current;
			const totalInstances = tracker.total;

			// Generate display ID
			const displayId =
				totalInstances > 1
					? `${componentData.componentId} (${instanceNumber} of ${totalInstances})`
					: componentData.componentId;

			// Create the component
			const component = await prisma.component.create({
				data: {
					id: createId(),
					projectId: project.id,
					componentId: componentData.componentId,
					instanceNumber,
					totalInstancesOnDrawing: totalInstances,
					displayId,
					type: (componentData.type as ComponentTypeType) || "SPOOL",
					spec: componentData.spec || "",
					size: componentData.size || "",
					material: componentData.material || "",
					area: componentData.area || "",
					system: componentData.system || "",
					testPackage: componentData.testPackage || "",
					workflowType: (componentData.workflowType ||
						"MILESTONE_DISCRETE") as
						| "MILESTONE_DISCRETE"
						| "MILESTONE_PERCENTAGE"
						| "MILESTONE_QUANTITY",
					status,
					completionPercent,
					drawingId,
					milestoneTemplateId: resolveTemplateForComponent(
						componentData.type || "PIPE",
						componentData.componentId || "",
						componentData.workflowType,
						templates,
					),
					createdAt: new Date(),
				},
			});

			// Manually create all milestones with proper weight handling
			const milestoneCount = componentData.milestones.length;
			const defaultWeight =
				milestoneCount > 0 ? 100 / milestoneCount : 20;

			for (let i = 0; i < componentData.milestones.length; i++) {
				const milestone = componentData.milestones[i];

				// Handle both 'completed' and 'isCompleted' field names
				const isCompleted =
					milestone.completed ?? milestone.isCompleted ?? false;

				// Use weight from milestone or calculate equal distribution
				const weight = milestone.weight ?? defaultWeight;

				await prisma.componentMilestone.create({
					data: {
						id: createId(),
						componentId: component.id,
						milestoneOrder: i,
						milestoneName: milestone.name,
						weight: weight, // Add weight field
						isCompleted: isCompleted,
						completedAt: isCompleted
							? milestone.completedDate
								? new Date(milestone.completedDate)
								: new Date(
										Date.now() -
											Math.random() *
												30 *
												24 *
												60 *
												60 *
												1000,
									)
							: null,
						completedBy: isCompleted ? user.id : null,
						createdAt: new Date(),
					},
				});
			}

			componentCount++;

			// Log progress every 10 components
			if (componentCount % 10 === 0) {
				console.log(`  Created ${componentCount} components...`);
			}
		}

		console.log("\n✅ SDO Tank Job seeding completed successfully!");
		console.log("\n📋 Summary:");
		console.log(`- Organization: ${organization.name}`);
		console.log(`- Project: ${project.jobName} (ID: ${project.id})`);
		console.log(`- Location: ${project.location}`);
		console.log(`- Drawings: ${drawingMap.size}`);
		console.log(`- Components: ${componentCount}`);

		// Calculate overall progress
		const projectStats = await prisma.component.aggregate({
			where: { projectId: project.id },
			_avg: { completionPercent: true },
			_count: { id: true },
		});

		const statusCounts = await prisma.component.groupBy({
			by: ["status"],
			where: { projectId: project.id },
			_count: { id: true },
		});

		console.log("\n📊 Project Status:");
		console.log(
			`- Overall Progress: ${Math.round(projectStats._avg.completionPercent || 0)}%`,
		);

		for (const statusCount of statusCounts) {
			console.log(
				`- ${statusCount.status}: ${statusCount._count.id} components`,
			);
		}

		console.log("\n🚀 You can now access the project at:");
		console.log(`   http://localhost:3000/app/pipetrak/${project.id}`);
	} catch (error) {
		console.error("Error seeding data:", error);
		throw error;
	}
}

// Run the seed function
seedSDOTankJob().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
