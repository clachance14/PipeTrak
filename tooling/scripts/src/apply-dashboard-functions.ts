#!/usr/bin/env node

import { promises as fs } from "fs";
import path from "path";
import { Pool } from "pg";

// Parse .env file manually
async function loadEnv() {
	const envPath = path.join(__dirname, "../../../.env");
	const envContent = await fs.readFile(envPath, "utf8");
	const env: Record<string, string> = {};

	envContent.split("\n").forEach((line) => {
		if (line.trim() && !line.startsWith("#") && line.includes("=")) {
			const [key, ...valueParts] = line.split("=");
			if (key && valueParts.length > 0) {
				const value = valueParts
					.join("=")
					.replace(/^"/, "")
					.replace(/"$/, "");
				env[key] = value;
			}
		}
	});

	return env;
}

async function applyDashboardFunctions() {
	console.log("🚀 Applying dashboard RPC functions to Supabase...");

	try {
		const env = await loadEnv();

		// Use the DIRECT_URL for migrations (port 5432)
		const directUrl = env.DIRECT_URL;
		if (!directUrl) {
			throw new Error("DIRECT_URL not found in environment");
		}

		console.log("📦 Connecting to database...");

		const pool = new Pool({
			connectionString: directUrl,
			ssl: { rejectUnauthorized: false }, // For Supabase SSL in development
		});

		// Also set the environment variable to handle SSL issues
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

		// Read the migration SQL
		const migrationPath = path.join(
			__dirname,
			"../../../packages/database/supabase/migrations/20250811T1500_create_dashboard_functions.sql",
		);
		const migrationSQL = await fs.readFile(migrationPath, "utf8");

		console.log("📄 Executing migration SQL...");

		// Execute the migration
		const client = await pool.connect();
		try {
			await client.query(migrationSQL);
			console.log("✅ Dashboard functions created successfully!");

			// Test each function
			console.log("\n🧪 Testing dashboard functions...");

			const functions = [
				{ name: "get_dashboard_metrics", params: ["test-project-id"] },
				{ name: "get_area_system_matrix", params: ["test-project-id"] },
				{ name: "get_drawing_rollups", params: ["test-project-id"] },
				{
					name: "get_test_package_readiness",
					params: ["test-project-id"],
				},
				{
					name: "get_recent_activity",
					params: ["test-project-id", "10"],
				},
			];

			for (const func of functions) {
				try {
					const paramStr = func.params
						.map((p) => `'${p}'`)
						.join(", ");
					const result = await client.query(
						`SELECT ${func.name}(${paramStr}) as result`,
					);

					const data = result.rows[0]?.result;
					if (data && typeof data === "object") {
						if (data.error) {
							console.log(
								`⚠️  ${func.name}: ${data.error} (expected for test project)`,
							);
						} else {
							console.log(
								`✅ ${func.name}: Function working, returns valid data`,
							);
						}
					} else {
						console.log(
							`✅ ${func.name}: Function exists and executed`,
						);
					}
				} catch (err: any) {
					console.log(`❌ ${func.name}: ${err.message}`);
				}
			}
		} finally {
			client.release();
		}

		await pool.end();
		console.log("\n🎉 Migration completed successfully!");
	} catch (error: any) {
		console.error("❌ Error applying dashboard functions:", error.message);
		console.error("Full error:", error);
		process.exit(1);
	}
}

applyDashboardFunctions();
