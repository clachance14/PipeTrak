#!/usr/bin/env tsx

/**
 * Drop PipeTrak Tables Script
 *
 * This script drops the existing lowercase PipeTrak tables so Prisma can
 * create them with proper PascalCase naming convention.
 */

import { promises as fs } from "fs";
import path from "path";
import { Pool } from "pg";

async function dropPipeTrarkTables() {
	const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

	if (!connectionString) {
		throw new Error(
			"Missing DATABASE_URL or DIRECT_URL environment variable",
		);
	}

	const pool = new Pool({ connectionString });

	try {
		console.log("🗑️  Dropping existing PipeTrak tables...");

		// Read and execute the SQL script
		const sqlPath = path.join(__dirname, "drop-pipetrak-tables.sql");
		const sql = await fs.readFile(sqlPath, "utf8");

		const client = await pool.connect();

		try {
			const result = await client.query(sql);

			console.log("✅ Tables dropped successfully");

			// Check if any tables remain
			if (result.rows && result.rows.length > 0) {
				console.log("⚠️  Some tables still exist:");
				result.rows.forEach((row: any) => {
					console.log(`  - ${row.table_name}`);
				});
			} else {
				console.log("✅ All PipeTrak tables successfully removed");
			}
		} finally {
			client.release();
		}
	} catch (error) {
		console.error("❌ Error dropping tables:", error);
		throw error;
	} finally {
		await pool.end();
	}
}

// Run if called directly
if (require.main === module) {
	dropPipeTrarkTables()
		.then(() => {
			console.log("🎉 Table cleanup complete!");
			process.exit(0);
		})
		.catch((error) => {
			console.error("💥 Table cleanup failed:", error);
			process.exit(1);
		});
}

export { dropPipeTrarkTables };
