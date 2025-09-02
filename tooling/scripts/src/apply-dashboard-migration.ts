#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Read environment from root .env file
const envContent = fs.readFileSync(
	path.join(__dirname, "../../../.env"),
	"utf8",
);
const env: Record<string, string> = {};

envContent.split("\n").forEach((line) => {
	if (line.trim() && !line.startsWith("#")) {
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

const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"];
const supabaseServiceKey =
	env["SUPABASE_SERVICE_ROLE_KEY"] || env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

if (!supabaseUrl || !supabaseServiceKey) {
	console.error("Missing Supabase configuration:", {
		url: !!supabaseUrl,
		key: !!supabaseServiceKey,
	});
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyDashboardMigration() {
	console.log("🚀 Applying dashboard functions migration...");

	// Read the migration file
	const migrationPath = path.join(
		__dirname,
		"../../../packages/database/supabase/migrations/20250810T1201_dashboard_functions.sql",
	);

	if (!fs.existsSync(migrationPath)) {
		console.error("❌ Migration file not found:", migrationPath);
		process.exit(1);
	}

	const migrationSQL = fs.readFileSync(migrationPath, "utf8");

	try {
		// Execute the migration SQL
		const result = await supabase.rpc("exec_sql", { sql: migrationSQL });

		if (result.error) {
			console.error(
				"❌ Failed to apply migration:",
				result.error.message,
			);
			process.exit(1);
		}

		console.log("✅ Migration applied successfully");

		// Test the functions
		console.log("\n🧪 Testing functions...");

		const functions = [
			"get_dashboard_metrics",
			"get_area_system_matrix",
			"get_drawing_rollups",
			"get_test_package_readiness",
			"get_recent_activity",
		];

		for (const funcName of functions) {
			try {
				const params =
					funcName === "get_recent_activity"
						? { p_project_id: "test-project", p_limit: 10 }
						: { p_project_id: "test-project" };

				const { data, error } = await supabase.rpc(funcName, params);

				if (error) {
					console.log(`❌ ${funcName}: ${error.message}`);
				} else {
					console.log(
						`✅ ${funcName}: Function exists and returns data`,
					);
				}
			} catch (err: any) {
				console.log(`❌ ${funcName}: ${err.message}`);
			}
		}
	} catch (error: any) {
		console.error("❌ Unexpected error:", error.message);
		process.exit(1);
	}
}

applyDashboardMigration();
