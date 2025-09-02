#!/usr/bin/env tsx
import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env.local") });

async function applyMigrations() {
	// Use DIRECT_URL for direct connection (not pooled)
	const connectionString = process.env.DIRECT_URL;

	if (!connectionString) {
		console.error("DIRECT_URL not found in environment variables");
		process.exit(1);
	}

	console.log("Connecting to database...");

	const url = new URL(connectionString);

	const client = new Client({
		host: url.hostname,
		port: Number.parseInt(url.port),
		database: url.pathname.substring(1),
		user: url.username,
		password: url.password,
		ssl: {
			rejectUnauthorized: false,
		},
	});

	try {
		await client.connect();
		console.log("Connected successfully");

		// Check current schema state
		const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project' 
      AND column_name IN ('name', 'jobName', 'jobNumber')
    `);

		const columns = result.rows.map((r) => r.column_name);
		console.log("Current columns:", columns);

		// Migration files
		const migrationDir = path.join(
			__dirname,
			"../../../packages/database/prisma/migrations",
		);
		const migrations = [
			"20250808000001_add_job_fields/migration.sql",
			"20250808000002_migrate_project_data/migration.sql",
			"20250808000003_add_constraints/migration.sql",
			"20250808000004_drop_name_column/migration.sql",
		];

		// Apply migrations based on current state
		if (!columns.includes("jobName") && !columns.includes("jobNumber")) {
			console.log("\nApplying migrations...");

			for (const migration of migrations) {
				const migrationPath = path.join(migrationDir, migration);

				if (!fs.existsSync(migrationPath)) {
					console.log(`Migration file not found: ${migration}`);
					continue;
				}

				console.log(`\nApplying ${migration}...`);
				const sql = fs.readFileSync(migrationPath, "utf-8");

				try {
					await client.query(sql);
					console.log(`✓ Applied ${migration}`);
				} catch (error: any) {
					if (
						error.message.includes("already exists") ||
						error.message.includes("does not exist")
					) {
						console.log(
							`⚠ Skipped ${migration}: ${error.message.split("\n")[0]}`,
						);
					} else {
						console.error(`✗ Failed ${migration}:`, error.message);
						throw error;
					}
				}
			}
		} else if (
			columns.includes("jobName") &&
			columns.includes("jobNumber") &&
			columns.includes("name")
		) {
			console.log("Partial migration detected. Completing migration...");

			// Apply only the remaining migrations
			const remainingMigrations = migrations.slice(2); // Skip first two

			for (const migration of remainingMigrations) {
				const migrationPath = path.join(migrationDir, migration);

				if (!fs.existsSync(migrationPath)) {
					continue;
				}

				console.log(`\nApplying ${migration}...`);
				const sql = fs.readFileSync(migrationPath, "utf-8");

				try {
					await client.query(sql);
					console.log(`✓ Applied ${migration}`);
				} catch (error: any) {
					if (
						error.message.includes("already exists") ||
						error.message.includes("does not exist")
					) {
						console.log(`⚠ Skipped ${migration}: Already applied`);
					} else {
						console.error(`✗ Failed ${migration}:`, error.message);
					}
				}
			}
		} else {
			console.log("✅ Migrations already applied!");
		}

		// Verify final state
		const finalResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project' 
      AND column_name IN ('name', 'jobName', 'jobNumber')
    `);

		const finalColumns = finalResult.rows.map((r) => r.column_name);
		console.log("\nFinal columns:", finalColumns);

		if (
			finalColumns.includes("jobName") &&
			finalColumns.includes("jobNumber") &&
			!finalColumns.includes("name")
		) {
			console.log("✅ Migration completed successfully!");
		} else {
			console.log(
				"⚠ Migration may be incomplete. Please verify manually.",
			);
		}
	} catch (error) {
		console.error("Error:", error);
		process.exit(1);
	} finally {
		await client.end();
		console.log("Database connection closed");
	}
}

// Run the script
applyMigrations();
