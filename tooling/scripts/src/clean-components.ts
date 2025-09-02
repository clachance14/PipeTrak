import { db as prisma } from "@repo/database";

async function cleanComponents() {
	console.log("🧹 Cleaning all component data...");

	try {
		// Delete in order due to foreign key constraints
		const milestones = await prisma.componentMilestone.deleteMany({});
		console.log(`  Deleted ${milestones.count} component milestones`);

		const components = await prisma.component.deleteMany({});
		console.log(`  Deleted ${components.count} components`);

		const drawings = await prisma.drawing.deleteMany({});
		console.log(`  Deleted ${drawings.count} drawings`);

		const templates = await prisma.milestoneTemplate.deleteMany({});
		console.log(`  Deleted ${templates.count} milestone templates`);

		const projects = await prisma.project.deleteMany({
			where: {
				jobName: "SDO Tank Job",
			},
		});
		console.log(`  Deleted ${projects.count} SDO Tank projects`);

		console.log("✅ Cleanup complete!");
	} catch (error) {
		console.error("❌ Error during cleanup:", error);
		throw error;
	}
}

cleanComponents()
	.then(() => process.exit(0))
	.catch(() => process.exit(1));
