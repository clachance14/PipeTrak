import { PrismaClient } from "../../../packages/database/prisma/generated/client";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });

const prisma = new PrismaClient();

async function addClientField() {
	try {
		console.log("Adding client field to Project table...\n");

		// Add the client field using raw SQL
		await prisma.$executeRawUnsafe(`
      ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "client" VARCHAR(255)
    `);

		console.log("Client field added successfully!\n");

		// Verify the field exists
		const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Project' 
      AND column_name = 'client'
    `);

		console.log("Column verification:", result);
	} catch (error) {
		console.error("Error adding client field:", error);
	} finally {
		await prisma.$disconnect();
	}
}

addClientField();
