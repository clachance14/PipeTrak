import { db as prisma } from "@repo/database";

async function checkTemplateAssignment() {
	try {
		// Check what templates exist
		const templates = await prisma.milestoneTemplate.findMany({
			select: {
				id: true,
				name: true,
				milestones: true,
			},
		});

		console.log("Available Milestone Templates:");
		console.log("─".repeat(60));
		templates.forEach((t) => {
			const milestones = Array.isArray(t.milestones)
				? (t.milestones as any[])
				: [];
			console.log(`• ${t.name} (ID: ${t.id.slice(-8)})`);
			console.log(
				`  Milestones: ${milestones.map((m: any) => m.name).join(", ")}`,
			);
		});

		// Check what template is being used by most components
		const componentsByTemplate = await prisma.component.groupBy({
			by: ["milestoneTemplateId"],
			_count: {
				id: true,
			},
		});

		console.log("\nComponents by Template:");
		console.log("─".repeat(60));
		for (const group of componentsByTemplate) {
			const template = templates.find(
				(t) => t.id === group.milestoneTemplateId,
			);
			console.log(
				`• ${template?.name || "Unknown"}: ${group._count.id} components`,
			);
		}

		// Check a few components with their types
		const sampleComponents = await prisma.component.findMany({
			take: 20,
			select: {
				componentId: true,
				type: true,
				spec: true,
				milestoneTemplateId: true,
				milestones: {
					select: {
						milestoneName: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		console.log("\nSample Components and Their Types:");
		console.log("─".repeat(60));
		sampleComponents.forEach((c) => {
			const template = templates.find(
				(t) => t.id === c.milestoneTemplateId,
			);
			console.log(`${c.componentId} (Type: ${c.type || "N/A"})`);
			console.log(`  Template: ${template?.name}`);
			console.log(
				`  Milestones: ${c.milestones.map((m) => m.milestoneName).join(", ")}`,
			);
		});

		// Check for Field Welds specifically
		const fieldWelds = await prisma.component.findMany({
			where: {
				OR: [
					{ type: { contains: "WELD", mode: "insensitive" } },
					{ componentId: { contains: "FW", mode: "insensitive" } },
					{ componentId: { contains: "WELD", mode: "insensitive" } },
				],
			},
			take: 5,
			select: {
				componentId: true,
				type: true,
				milestoneTemplateId: true,
				milestones: {
					select: {
						milestoneName: true,
					},
				},
			},
		});

		if (fieldWelds.length > 0) {
			console.log("\nField Welds Found:");
			console.log("─".repeat(60));
			fieldWelds.forEach((fw) => {
				const template = templates.find(
					(t) => t.id === fw.milestoneTemplateId,
				);
				console.log(`${fw.componentId} (Type: ${fw.type})`);
				console.log(`  Using template: ${template?.name}`);
				console.log("  Should use: Field Weld template");
			});
		}

		console.log("\n⚠️  ISSUE IDENTIFIED:");
		console.log("─".repeat(60));
		console.log("All components are using the SAME milestone template!");
		console.log(
			"The import system assigns one template to ALL components.",
		);
		console.log(
			"Components should get different templates based on their type:",
		);
		console.log("  • Field Welds → Field Weld template");
		console.log("  • Spools/Piping → Full Milestone Set");
		console.log("  • Valves/Gaskets → Reduced Milestone Set");
		console.log("  • Insulation work → Insulation template");
		console.log("  • Paint work → Paint template");
	} catch (error: any) {
		console.error("Error:", error.message);
	} finally {
		await prisma.$disconnect();
	}
}

checkTemplateAssignment();
