import { db as prisma } from "@repo/database";

async function checkMilestoneCreation() {
	try {
		console.log("🔍 Checking Milestone Creation Issues...\n");

		// 1. Check milestone templates
		const templates = await prisma.milestoneTemplate.findMany({
			select: {
				id: true,
				name: true,
				milestones: true,
				projectId: true,
				_count: {
					select: {
						components: true,
					},
				},
			},
		});

		console.log("📋 Milestone Templates:");
		console.log("─".repeat(60));
		templates.forEach((t) => {
			console.log(`\nTemplate: ${t.name}`);
			console.log(`  ID: ${t.id}`);
			console.log(
				`  Components using this template: ${t._count.components}`,
			);

			const milestones = Array.isArray(t.milestones)
				? t.milestones
				: typeof t.milestones === "object"
					? [t.milestones]
					: [];

			console.log(`  Milestone definitions: ${milestones.length}`);
			if (milestones.length > 0) {
				console.log("  Milestones:");
				milestones.forEach((m: any, i: number) => {
					console.log(
						`    ${i + 1}. ${m.name || "UNNAMED"} (order: ${m.order}, weight: ${m.weight})`,
					);
				});
			}
		});

		// 2. Check component milestone statistics
		const totalComponents = await prisma.component.count();
		const componentsWithMilestones = await prisma.component.count({
			where: {
				milestones: {
					some: {},
				},
			},
		});

		console.log("\n📊 Component Statistics:");
		console.log("─".repeat(60));
		console.log(`  Total components: ${totalComponents}`);
		console.log(
			`  Components with milestones: ${componentsWithMilestones}`,
		);
		console.log(
			`  Components WITHOUT milestones: ${totalComponents - componentsWithMilestones}`,
		);
		console.log(
			`  Percentage with milestones: ${((componentsWithMilestones / totalComponents) * 100).toFixed(1)}%`,
		);

		// 3. Check recent components
		const recentComponents = await prisma.component.findMany({
			take: 10,
			orderBy: {
				createdAt: "desc",
			},
			include: {
				milestones: {
					select: {
						milestoneName: true,
						milestoneOrder: true,
						weight: true,
					},
				},
			},
		});

		console.log("\n🆕 Recent Components (last 10):");
		console.log("─".repeat(60));
		recentComponents.forEach((c) => {
			console.log(`\n${c.displayId || c.componentId}`);
			console.log(`  Created: ${c.createdAt}`);
			console.log(`  Template ID: ${c.milestoneTemplateId}`);
			console.log(`  Milestones: ${c.milestones.length}`);
			if (c.milestones.length > 0) {
				c.milestones.forEach((m) => {
					console.log(
						`    - ${m.milestoneName} (order: ${m.milestoneOrder}, weight: ${m.weight})`,
					);
				});
			} else {
				console.log("    ⚠️  NO MILESTONES!");
			}
		});

		// 4. Check for components with template but no milestones
		const componentsWithTemplateNoMilestones =
			await prisma.component.findMany({
				where: {
					AND: [
						{ milestoneTemplateId: { not: null } },
						{ milestones: { none: {} } },
					],
				},
				take: 5,
				select: {
					id: true,
					componentId: true,
					displayId: true,
					milestoneTemplateId: true,
					createdAt: true,
				},
			});

		if (componentsWithTemplateNoMilestones.length > 0) {
			console.log("\n⚠️  Components with template but NO milestones:");
			console.log("─".repeat(60));
			componentsWithTemplateNoMilestones.forEach((c) => {
				console.log(
					`  ${c.displayId || c.componentId} (Template: ${c.milestoneTemplateId})`,
				);
			});
		}

		// 5. Check milestone table directly
		const totalMilestones = await prisma.componentMilestone.count();
		const distinctComponents = await prisma.componentMilestone.findMany({
			distinct: ["componentId"],
			select: { componentId: true },
		});

		console.log("\n📈 ComponentMilestone Table:");
		console.log("─".repeat(60));
		console.log(`  Total milestone records: ${totalMilestones}`);
		console.log(
			`  Distinct components with milestones: ${distinctComponents.length}`,
		);

		if (totalMilestones > 0) {
			const avgMilestonesPerComponent =
				totalMilestones / distinctComponents.length;
			console.log(
				`  Average milestones per component: ${avgMilestonesPerComponent.toFixed(1)}`,
			);
		}
	} catch (error: any) {
		console.error("❌ Error:", error.message);
		if (error.stack) {
			console.error("\nStack trace:", error.stack);
		}
	} finally {
		await prisma.$disconnect();
	}
}

checkMilestoneCreation();
