#!/usr/bin/env tsx

/**
 * Database Script Template
 *
 * Copy this template for new database scripts.
 *
 * Usage:
 * 1. Copy this file: cp template-db-script.ts your-script-name.ts
 * 2. Update the script name and description
 * 3. Replace the example logic with your operations
 * 4. Execute: NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/your-script-name.ts
 */

import { db } from "@repo/database";

/**
 * Main script function
 * Replace with your actual function name and logic
 */
async function yourScriptName() {
	console.log("🚀 Starting your script...");

	try {
		// Example: Query existing data
		console.log("📊 Checking existing data...");
		// const existingRecords = await db.yourTable.count();
		// console.log(`   Found ${existingRecords} existing records`);

		// Example: Create new records
		console.log("📝 Creating new records...");
		// const newRecord = await db.yourTable.create({
		// 	data: {
		// 		// Your data here
		// 		field1: "value1",
		// 		field2: "value2",
		// 		// ...
		// 	},
		// });
		// console.log(`   ✅ Created record with ID: ${newRecord.id}`);

		// Example: Update existing records
		console.log("🔄 Updating existing records...");
		// const updateResult = await db.yourTable.updateMany({
		// 	where: {
		// 		// Your conditions here
		// 		field1: "some_condition",
		// 	},
		// 	data: {
		// 		// Your updates here
		// 		updatedAt: new Date(),
		// 	},
		// });
		// console.log(`   ✅ Updated ${updateResult.count} records`);

		// Example: Batch operations
		console.log("📦 Performing batch operations...");
		const batchData = [
			{ field1: "batch1", field2: "value1" },
			{ field1: "batch2", field2: "value2" },
			{ field1: "batch3", field2: "value3" },
		];

		// for (const item of batchData) {
		// 	await db.yourTable.upsert({
		// 		where: { field1: item.field1 },
		// 		create: item,
		// 		update: { field2: item.field2 },
		// 	});
		// 	console.log(`   ✓ Processed: ${item.field1}`);
		// }

		// Example: Complex query with relations
		console.log("🔍 Running complex queries...");
		// const complexResult = await db.yourTable.findMany({
		// 	where: {
		// 		// Your complex conditions
		// 		AND: [
		// 			{ field1: { not: null } },
		// 			{ field2: { contains: "search_term" } },
		// 		],
		// 	},
		// 	include: {
		// 		// Include relations
		// 		relatedTable: true,
		// 	},
		// 	orderBy: {
		// 		createdAt: "desc",
		// 	},
		// 	take: 10,
		// });
		// console.log(
		// 	`   📋 Found ${complexResult.length} records matching criteria`,
		// );

		// Example: Transaction
		console.log("💳 Performing transaction...");
		// await db.$transaction(async (tx) => {
		// 	// Multiple operations that must all succeed
		// 	const record1 = await tx.table1.create({
		// 		data: {
		// 			/* data */
		// 		},
		// 	});
		// 
		// 	await tx.table2.update({
		// 		where: { relatedId: record1.id },
		// 		data: {
		// 			/* data */
		// 		},
		// 	});
		// 
		// 	console.log("   ✅ Transaction completed successfully");
		// });

		// Final summary
		// const finalCount = await db.yourTable.count();
		console.log("\n📊 Final Summary:");
		// console.log(`   Total records: ${finalCount}`);
		console.log(`   Records processed: ${batchData.length}`);

		console.log("\n🎉 Script completed successfully!");
	} catch (error: any) {
		console.error("\n❌ Script failed:", error.message);

		// Log additional error details for debugging
		if (error.code) {
			console.error(`   Error code: ${error.code}`);
		}
		if (error.meta) {
			console.error("   Error meta:", error.meta);
		}

		// Exit with error code
		process.exit(1);
	} finally {
		// Always disconnect from database
		await db.$disconnect();
		console.log("🔌 Database connection closed");
	}
}

/**
 * Script execution with error handling
 */
yourScriptName()
	.then(() => {
		console.log("\n✨ Script execution completed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n💥 Unhandled error:", error.message);
		process.exit(1);
	});

/**
 * Template Notes:
 *
 * 1. Always use @repo/database import, not relative paths
 * 2. Include proper error handling and logging
 * 3. Always disconnect from database in finally block
 * 4. Use descriptive console.log messages with emojis for clarity
 * 5. Include progress indicators for long-running operations
 * 6. Handle both expected and unexpected errors
 * 7. Exit with appropriate exit codes (0 for success, 1 for error)
 *
 * Common Prisma Patterns:
 *
 * - findMany() - Get multiple records
 * - findUnique() - Get single record by unique field
 * - create() - Create new record
 * - update() - Update existing record
 * - upsert() - Create or update (useful for seeding)
 * - deleteMany() - Delete multiple records
 * - count() - Count records
 * - $transaction() - Atomic operations
 * - $executeRaw() - Raw SQL queries
 *
 * Execution Pattern:
 *
 * cd tooling/scripts
 * NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/your-script-name.ts
 */
