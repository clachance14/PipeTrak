import { db as prisma } from "@repo/database";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });


async function addUniqueConstraint() {
	try {
		console.log("Adding unique constraint for job numbers...\n");

		await prisma.$executeRawUnsafe(`
      ALTER TABLE "Project" 
      ADD CONSTRAINT unique_org_job_number 
      UNIQUE ("organizationId", "jobNumber")
    `);

		console.log("Unique constraint added successfully!");
	} catch (error: any) {
		if (
			error.code === "P2002" ||
			error.message?.includes("already exists")
		) {
			console.log("Constraint already exists, skipping...");
		} else {
			console.error("Error adding constraint:", error);
		}
	} finally {
		await prisma.$disconnect();
	}
}

addUniqueConstraint();
