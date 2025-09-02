#!/usr/bin/env tsx
import { PrismaClient } from "@repo/database/client";
import { createId } from "@paralleldrive/cuid2";
import { createMilestoneTemplatesForProject } from "./create-milestone-templates";
import { resolveTemplateForComponent } from "./lib/template-resolver";

const prisma = new PrismaClient();

async function seedPipeTrak() {
	console.log("🌱 Seeding PipeTrak data...");

	try {
		// Get the first organization (or create one for testing)
		let organization = await prisma.organization.findFirst();

		if (!organization) {
			console.log("Creating test organization...");
			organization = await prisma.organization.create({
				data: {
					id: createId(),
					name: "Test Construction Company",
					slug: "test-construction",
					createdAt: new Date(),
					updatedAt: new Date(),
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
					name: "Test User",
					email: "test@pipetrak.com",
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

		// Create a test project
		console.log("Creating test project...");
		const project = await prisma.project.create({
			data: {
				id: createId(),
				organizationId: organization.id,
				jobName: "Refinery Unit 5 Expansion",
				jobNumber: "REF05EXP",
				description: "Major expansion project for processing unit 5",
				status: "ACTIVE",
				location: "Houston, TX",
				startDate: new Date("2024-01-01"),
				targetDate: new Date("2024-12-31"),
				createdBy: user.id,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});

		console.log(`Created project: ${project.jobName} (${project.id})`);

		// Create all milestone templates (Full, Reduced, Field Weld, Insulation, Paint)
		console.log("Creating milestone templates...");
		const templates = await createMilestoneTemplatesForProject(project.id);

		// Create drawings
		console.log("Creating drawings...");
		const drawings = await Promise.all([
			prisma.drawing.create({
				data: {
					id: createId(),
					projectId: project.id,
					number: "P-5001",
					description: "Unit 5 Piping ISO - Area A",
					revision: "A",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			}),
			prisma.drawing.create({
				data: {
					id: createId(),
					projectId: project.id,
					number: "P-5002",
					description: "Unit 5 Piping ISO - Area B",
					revision: "B",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			}),
			prisma.drawing.create({
				data: {
					id: createId(),
					projectId: project.id,
					number: "E-5001",
					description: "Equipment Layout - Area A",
					revision: "A",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			}),
		]);

		// Create components
		console.log("Creating components...");
		const areas = ["A", "B", "C"];
		const systems = ["CS-01", "CS-02", "SS-01", "SS-02", "PS-01"];
		const types = ["PIPE", "VALVE", "FLANGE", "ELBOW", "TEE"];
		const specs = ["CS-150", "CS-300", "SS-150", "SS-300"];
		const sizes = ['2"', '3"', '4"', '6"', '8"', '10"', '12"'];
		const materials = ["CS", "SS", "LTCS"];

		const components = [];
		let componentNumber = 1;

		for (const area of areas) {
			for (const system of systems) {
				for (let i = 0; i < 20; i++) {
					// 20 components per area/system
					const type =
						types[Math.floor(Math.random() * types.length)];
					const spec =
						specs[Math.floor(Math.random() * specs.length)];
					const size =
						sizes[Math.floor(Math.random() * sizes.length)];
					const material =
						materials[Math.floor(Math.random() * materials.length)];
					const drawing =
						drawings[Math.floor(Math.random() * drawings.length)];
					const componentId = `${area}-${system}-${String(componentNumber).padStart(4, "0")}`;
					const templateId = resolveTemplateForComponent(
						type,
						componentId,
						"MILESTONE_DISCRETE",
						templates,
					);

					// Random completion percentage
					const completionPercent = Math.floor(Math.random() * 101);
					let status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" =
						"NOT_STARTED";
					if (completionPercent === 100) status = "COMPLETED";
					else if (completionPercent > 0) status = "IN_PROGRESS";

					const component = await prisma.component.create({
						data: {
							id: createId(),
							projectId: project.id,
							componentId,
							type,
							spec,
							size,
							material,
							area,
							system,
							testPackage: `TP-${area}`,
							workflowType: "MILESTONE_DISCRETE",
							status,
							completionPercent,
							drawingId: drawing.id,
							milestoneTemplateId: templateId,
							createdAt: new Date(),
							updatedAt: new Date(),
						},
					});

					components.push(component);
					componentNumber++;
				}
			}
		}

		console.log(`Created ${components.length} components`);

		// Create milestones for components
		console.log("Creating component milestones...");
		let milestoneCount = 0;

		for (const component of components.slice(0, 100)) {
			// Only do first 100 to speed up
			const template = Array.from(templates.values()).find(
				(t) => t.id === component.milestoneTemplateId,
			);
			if (!template) continue;

			const milestoneDefs = JSON.parse(template.milestones as string);

			for (let i = 0; i < milestoneDefs.length; i++) {
				const milestone = milestoneDefs[i];
				const isCompleted = Math.random() > 0.5 && i < 3; // Random completion for first 3 milestones

				await prisma.componentMilestone.create({
					data: {
						id: createId(),
						componentId: component.id,
						milestoneOrder: i,
						milestoneName: milestone.name,
						isCompleted,
						completedAt: isCompleted ? new Date() : null,
						completedBy: isCompleted ? user.id : null,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				});
				milestoneCount++;
			}
		}

		console.log(`Created ${milestoneCount} component milestones`);

		// Update some components to show recent activity
		console.log("Creating recent activity...");
		const recentComponents = components.slice(0, 10);
		for (const component of recentComponents) {
			const milestone = await prisma.componentMilestone.findFirst({
				where: { componentId: component.id },
				orderBy: { milestoneOrder: "asc" },
			});

			if (milestone) {
				await prisma.componentMilestone.update({
					where: { id: milestone.id },
					data: {
						isCompleted: true,
						completedAt: new Date(
							Date.now() -
								Math.random() * 7 * 24 * 60 * 60 * 1000,
						), // Random within last 7 days
						completedBy: user.id,
					},
				});
			}
		}

		console.log("\n✅ Seeding completed successfully!");
		console.log("\n📋 Summary:");
		console.log(`- Organization: ${organization.name}`);
		console.log(`- Project: ${project.jobName} (ID: ${project.id})`);
		console.log(`- Drawings: ${drawings.length}`);
		console.log(`- Components: ${components.length}`);
		console.log(`- Milestones: ${milestoneCount}`);
		console.log("\n🚀 You can now access the project at:");
		console.log(`   http://localhost:3000/app/pipetrak/${project.id}`);
	} catch (error) {
		console.error("Error seeding data:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

// Run the seed function
seedPipeTrak().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
