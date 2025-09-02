import { db as prisma } from "@repo/database";

async function checkTemplateRawData() {
	try {
		const templates = await prisma.milestoneTemplate.findMany({
			select: {
				id: true,
				name: true,
				milestones: true,
			},
		});

		console.log("📋 Checking raw milestone template data:\n");

		for (const template of templates) {
			console.log(`Template: ${template.name}`);
			console.log(`  ID: ${template.id}`);
			console.log(
				`  Type of milestones field: ${typeof template.milestones}`,
			);
			console.log(
				`  Milestones value: ${JSON.stringify(template.milestones)}`,
			);

			// Try to parse if it's a string
			if (typeof template.milestones === "string") {
				try {
					const parsed = JSON.parse(template.milestones);
					console.log(
						`  Parsed milestones: ${JSON.stringify(parsed)}`,
					);
				} catch (e) {
					console.log("  Failed to parse as JSON");
				}
			}

			console.log("");
		}
	} catch (error: any) {
		console.error("Error:", error.message);
	} finally {
		await prisma.$disconnect();
	}
}

checkTemplateRawData();
