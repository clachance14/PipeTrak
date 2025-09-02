#!/usr/bin/env tsx
import * as path from "path";
import dotenv from "dotenv";

// Load environment variables BEFORE importing Prisma
dotenv.config({ path: path.join(__dirname, "../../../.env") });

// Now import Prisma after env vars are loaded
import { db } from "@repo/database";

const weldTypes = [
	{ code: "BW", description: "Butt Weld" },
	{ code: "SW", description: "Socket Weld" },
	{ code: "FW", description: "Fillet Weld" },
	{ code: "BR", description: "Branch Weld" },
	{ code: "SO", description: "Slip-On Flange Weld" },
	{ code: "TH", description: "Threaded Joint Seal Weld" },
	{ code: "LW", description: "Lap Weld" },
	{ code: "HW", description: "Hot Tap Weld" },
	{ code: "RW", description: "Repair Weld" },
];

async function seedWeldTypes() {
	console.log("🔧 Seeding WeldType table...");

	try {
		// Check if WeldType table exists and has the required structure
		console.log("📋 Checking WeldType table...");

		// Use upsert to avoid duplicates
		let created = 0;
		let updated = 0;

		for (const weldType of weldTypes) {
			const result = await db.weldType.upsert({
				where: { code: weldType.code },
				update: {
					description: weldType.description,
					active: true,
				},
				create: {
					code: weldType.code,
					description: weldType.description,
					active: true,
				},
			});

			// Check if it was created or updated (this is a simple heuristic)
			const isNew = result.createdAt === result.updatedAt;
			if (isNew) {
				created++;
				console.log(
					`   ✅ Created weld type: ${weldType.code} - ${weldType.description}`,
				);
			} else {
				updated++;
				console.log(
					`   🔄 Updated weld type: ${weldType.code} - ${weldType.description}`,
				);
			}
		}

		console.log("\n📊 Summary:");
		console.log(`   Created: ${created} weld types`);
		console.log(`   Updated: ${updated} weld types`);
		console.log(`   Total: ${weldTypes.length} weld types processed`);

		// Verify final state
		const totalWeldTypes = await db.weldType.count();
		console.log(
			`   Database now contains ${totalWeldTypes} total weld types`,
		);

		console.log("\n🎉 Successfully seeded weld types!");
	} catch (error: any) {
		console.error("❌ Error seeding weld types:", error.message);

		// Check if it's a table/model not found error
		if (
			error.code === "P2021" ||
			error.message.includes("does not exist")
		) {
			console.error(
				"\n💡 Tip: Make sure the WeldType model exists in your Prisma schema",
			);
			console.error("     and run: pnpm --filter database generate");
		}

		process.exit(1);
	} finally {
		await db.$disconnect();
		console.log("🔌 Database connection closed");
	}
}

// Run the seeding script
seedWeldTypes();
