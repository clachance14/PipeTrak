import { db as prisma } from "@repo/database";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });

async function checkProjects() {
	try {
		console.log("Checking projects in database...\n");

		const projectCount = await prisma.project.count();
		console.log(`Total projects: ${projectCount}`);

		if (projectCount > 0) {
			const projects = await prisma.project.findMany({
				select: {
					id: true,
					jobName: true,
					jobNumber: true,
					// client: true,  // Not yet in database
					location: true,
					organizationId: true,
					status: true,
				},
			});

			console.log("\nExisting projects:");
			projects.forEach((p) => {
				console.log(`- ${p.jobName} (${p.jobNumber})`);
				console.log("  Client: Not yet in DB");
				console.log(`  Location: ${p.location || "Not set"}`);
				console.log(`  Status: ${p.status}`);
				console.log("");
			});
		} else {
			console.log("\nNo projects found in database.");
		}
	} catch (error) {
		console.error("Error checking projects:", error);
	} finally {
		await prisma.$disconnect();
	}
}

checkProjects();
