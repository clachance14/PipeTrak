#!/usr/bin/env tsx
import { db as prisma } from "@repo/database";
import { createId } from "@paralleldrive/cuid2";
import * as fs from "fs";
import * as path from "path";

interface SDOTankData {
	project: {
		name: string;
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
		workflowType: string;
		milestones: Array<{
			name: string;
			completed: boolean;
		}>;
	}>;
}

async function cleanupAndSeed() {
	console.log("🧹 Cleaning up old SDO Tank Job data...");

	try {
		// Find and delete all SDO Tank Job projects and their data
		const oldProjects = await prisma.project.findMany({
			where: {
				jobName: "SDO Tank Job",
			},
		});

		for (const project of oldProjects) {
			// Delete in order to avoid foreign key constraints
			const components = await prisma.component.findMany({
				where: { projectId: project.id },
				select: { id: true },
			});

			if (components.length > 0) {
				await prisma.componentMilestone.deleteMany({
					where: {
						componentId: {
							in: components.map((c) => c.id),
						},
					},
				});
				console.log(
					`  Deleted milestones for ${components.length} components`,
				);

				await prisma.component.deleteMany({
					where: { projectId: project.id },
				});
				console.log(`  Deleted ${components.length} components`);
			}

			const drawingCount = await prisma.drawing.count({
				where: { projectId: project.id },
			});

			await prisma.drawing.deleteMany({
				where: { projectId: project.id },
			});
			console.log(`  Deleted ${drawingCount} drawings`);

			await prisma.milestoneTemplate.deleteMany({
				where: { projectId: project.id },
			});

			await prisma.project.delete({
				where: { id: project.id },
			});

			console.log(`✅ Deleted project: ${project.name} (${project.id})`);
		}

		console.log("\n🌱 Starting fresh SDO Tank Job seed...");

		// Load the SDO Tank data
		const dataPath = path.join(__dirname, "sdo-tank-data.json");
		const rawData = fs.readFileSync(dataPath, "utf-8");
		const sdoData: SDOTankData = JSON.parse(rawData);

		// Get or create organization
		let organization = await prisma.organization.findFirst();

		if (!organization) {
			console.log("Creating organization...");
			organization = await prisma.organization.create({
				data: {
					id: createId(),
					name: "SDO Construction",
					slug: "sdo-construction",
					createdAt: new Date(),
				},
			});
		}

		// Get or create user
		let user = await prisma.user.findFirst();

		if (!user) {
			console.log("Creating user...");
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

			// Add user to organization if not already a member
			const existingMember = await prisma.member.findFirst({
				where: {
					userId: user.id,
					organizationId: organization.id,
				},
			});

			if (!existingMember) {
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
		}

		// Create the SDO Tank Job project
		console.log("Creating SDO Tank Job project...");
		const project = await prisma.project.create({
			data: {
				id: createId(),
				organizationId: organization.id,
				jobName: sdoData.project.name,
				jobNumber: "SDO-TANK",
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

		console.log(`✅ Created project: ${project.name} (${project.id})`);

		// Create milestone template
		console.log("Creating milestone template...");
		const pipingTemplate = await prisma.milestoneTemplate.create({
			data: {
				id: createId(),
				projectId: project.id,
				name: "Standard Piping",
				description: "Standard milestones for piping components",
				milestones: JSON.stringify([
					{ name: "Received", weight: 20 },
					{ name: "Fit-up", weight: 20 },
					{ name: "Welded", weight: 20 },
					{ name: "Tested", weight: 20 },
					{ name: "Insulated", weight: 20 },
				]),
				isDefault: true,
				createdAt: new Date(),
			},
		});

		// Create drawings
		console.log(`Creating ${sdoData.drawings.length} drawings...`);
		const drawingMap = new Map<string, string>();

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

		console.log(`✅ Created ${drawingMap.size} drawings`);

		// Create components with milestones
		console.log(
			`Creating ${sdoData.components.length} components with milestones...`,
		);
		let componentCount = 0;
		let milestoneCount = 0;

		for (const componentData of sdoData.components) {
			// Calculate completion status
			const completedMilestones = componentData.milestones.filter(
				(m) => m.completed,
			).length;
			const totalMilestones = componentData.milestones.length;
			const completionPercent = Math.round(
				(completedMilestones / totalMilestones) * 100,
			);

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
					`  ⚠️  Drawing ${componentData.drawingNumber} not found for component ${componentData.componentId}`,
				);
				continue;
			}

			// Create the component
			const component = await prisma.component.create({
				data: {
					id: createId(),
					projectId: project.id,
					componentId: componentData.componentId,
					type: componentData.type || "PIPE",
					spec: componentData.spec || "",
					size: componentData.size || "",
					material: componentData.material || "",
					area: componentData.area || "",
					system: componentData.system || "",
					testPackage: componentData.testPackage || "",
					workflowType: (componentData.workflowType ||
						"MILESTONE_DISCRETE") as any,
					status,
					completionPercent,
					drawingId,
					milestoneTemplateId: pipingTemplate.id,
					createdAt: new Date(),
				},
			});

			// Create milestones for this component
			for (let i = 0; i < componentData.milestones.length; i++) {
				const milestone = componentData.milestones[i];

				await prisma.componentMilestone.create({
					data: {
						id: createId(),
						componentId: component.id,
						milestoneOrder: i,
						milestoneName: milestone.name,
						isCompleted: milestone.completed,
						completedAt: milestone.completed
							? new Date(
									Date.now() -
										Math.random() *
											30 *
											24 *
											60 *
											60 *
											1000,
								)
							: null,
						completedBy: milestone.completed ? user.id : null,
						createdAt: new Date(),
					},
				});
				milestoneCount++;
			}

			componentCount++;

			// Log progress every 10 components
			if (componentCount % 10 === 0) {
				console.log(
					`  Progress: ${componentCount}/${sdoData.components.length} components created...`,
				);
			}
		}

		console.log("\n✅ SDO Tank Job seeding completed successfully!");
		console.log("\n📋 Summary:");
		console.log(`- Organization: ${organization.name}`);
		console.log(`- Project: ${project.jobName} (ID: ${project.id})`);
		console.log(`- Location: ${project.location}`);
		console.log(`- Drawings: ${drawingMap.size}`);
		console.log(`- Components: ${componentCount}`);
		console.log(`- Milestones: ${milestoneCount}`);

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
		console.error("❌ Error:", error);
		throw error;
	}
}

// Run the cleanup and seed
cleanupAndSeed().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
