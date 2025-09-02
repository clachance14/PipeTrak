import { db as prisma } from "@repo/database";

async function fixMilestoneTemplates() {
	try {
		console.log("🔧 Fixing milestone template data format...\n");

		// Get all templates
		const templates = await prisma.milestoneTemplate.findMany({
			select: {
				id: true,
				name: true,
				milestones: true,
			},
		});

		let fixedCount = 0;
		let skippedCount = 0;

		for (const template of templates) {
			console.log(`Processing template: ${template.name}`);

			// Check if milestones is a string (needs fixing)
			if (typeof template.milestones === "string") {
				try {
					// Parse the JSON string
					const parsedMilestones = JSON.parse(template.milestones);

					console.log("  Converting from string to JSON object...");
					console.log(
						`  Found ${parsedMilestones.length} milestone definitions`,
					);

					// Update the template with parsed JSON
					await prisma.milestoneTemplate.update({
						where: { id: template.id },
						data: {
							milestones: parsedMilestones,
						},
					});

					console.log(`  ✅ Fixed template: ${template.name}`);
					fixedCount++;
				} catch (error) {
					console.error(
						`  ❌ Failed to parse JSON for template ${template.name}:`,
						error,
					);
				}
			} else {
				console.log("  ⏭️  Already correct format (JSON object)");
				skippedCount++;
			}

			console.log("");
		}

		console.log("📊 Summary:");
		console.log(`  Templates fixed: ${fixedCount}`);
		console.log(`  Templates skipped (already correct): ${skippedCount}`);
		console.log(`  Total templates: ${templates.length}`);

		if (fixedCount > 0) {
			console.log("\n🎉 Milestone templates have been fixed!");
			console.log("All templates now store milestones as JSON objects.");
		}
	} catch (error: any) {
		console.error("❌ Error fixing milestone templates:", error.message);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

fixMilestoneTemplates();
