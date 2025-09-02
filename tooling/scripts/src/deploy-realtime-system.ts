#!/usr/bin/env tsx
/**
 * Deployment script for PipeTrak Realtime Subscriptions System
 * This script helps deploy and verify the realtime implementation
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
	console.error("❌ Missing required environment variables:");
	console.error("   SUPABASE_URL");
	console.error("   SUPABASE_SERVICE_ROLE_KEY");
	console.error("   SUPABASE_ANON_KEY");
	process.exit(1);
}

// Initialize Supabase clients
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function deployRealtimeMigration() {
	console.log("🚀 Deploying Realtime Migration...");

	try {
		// Read the migration file
		const migrationPath = path.join(
			__dirname,
			"../../../packages/database/supabase/migrations/20250812_enable_realtime.sql",
		);

		if (!fs.existsSync(migrationPath)) {
			console.error("❌ Migration file not found at:", migrationPath);
			return false;
		}

		const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

		// Execute migration
		const { error } = await supabaseAdmin.rpc("exec_sql", {
			sql: migrationSQL,
		});

		if (error) {
			console.error("❌ Migration failed:", error.message);
			return false;
		}

		console.log("✅ Migration deployed successfully");
		return true;
	} catch (error) {
		console.error("❌ Migration deployment error:", error);
		return false;
	}
}

async function runSystemTest() {
	console.log("🧪 Running Realtime System Test...");

	try {
		// Read the test file
		const testPath = path.join(
			__dirname,
			"../../../packages/database/supabase/tests/realtime-system-test.sql",
		);

		if (!fs.existsSync(testPath)) {
			console.error("❌ Test file not found at:", testPath);
			return false;
		}

		const testSQL = fs.readFileSync(testPath, "utf-8");

		// Execute test
		const { error } = await supabaseAdmin.rpc("exec_sql", {
			sql: testSQL,
		});

		if (error) {
			console.error("❌ System test failed:", error.message);
			return false;
		}

		console.log(
			"✅ System test completed - check database logs for results",
		);
		return true;
	} catch (error) {
		console.error("❌ System test error:", error);
		return false;
	}
}

async function testRealtimeConnection() {
	console.log("🔌 Testing Realtime Connection...");

	return new Promise<boolean>((resolve) => {
		const timeout = setTimeout(() => {
			console.error("❌ Realtime connection test timed out");
			resolve(false);
		}, 10000);

		const channel = supabaseClient
			.channel("realtime-test")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "Component",
				},
				(payload) => {
					console.log(
						"📡 Received realtime event:",
						payload.eventType,
					);
				},
			)
			.subscribe((status) => {
				clearTimeout(timeout);

				if (status === "SUBSCRIBED") {
					console.log("✅ Realtime connection successful");
					channel.unsubscribe();
					resolve(true);
				} else if (status === "CHANNEL_ERROR") {
					console.error("❌ Realtime connection failed");
					resolve(false);
				}
			});
	});
}

async function testAPIEndpoints() {
	console.log("🌐 Testing API Endpoints...");

	try {
		// Test health endpoint
		const healthResponse = await fetch(
			`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/pipetrak/realtime/health`,
		);

		if (healthResponse.ok) {
			const health = await healthResponse.json();
			console.log("✅ Health endpoint working:", health.status);
		} else {
			console.error("❌ Health endpoint failed:", healthResponse.status);
			return false;
		}

		return true;
	} catch (error) {
		console.error("❌ API endpoint test failed:", error);
		return false;
	}
}

async function checkSupabaseRealtimeStatus() {
	console.log("⚙️ Checking Supabase Realtime Status...");

	try {
		// Check if realtime is enabled by attempting to list publications
		const { data, error } = await supabaseAdmin.rpc("exec_sql", {
			sql: `
          SELECT 
            pubname,
            array_agg(schemaname || '.' || tablename) as tables
          FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime'
          GROUP BY pubname;
        `,
		});

		if (error) {
			console.error("❌ Could not check realtime status:", error.message);
			return false;
		}

		if (data && data.length > 0) {
			console.log("✅ Supabase Realtime is enabled");
			console.log("📋 Published tables:", data[0].tables);
			return true;
		}
		console.error("❌ Supabase Realtime publication not found");
		return false;
	} catch (error) {
		console.error("❌ Realtime status check failed:", error);
		return false;
	}
}

async function main() {
	console.log("🏗️ PipeTrak Realtime System Deployment");
	console.log("=====================================");
	console.log("");

	let allPassed = true;

	// Step 1: Check Supabase Realtime status
	if (!(await checkSupabaseRealtimeStatus())) {
		allPassed = false;
	}
	console.log("");

	// Step 2: Deploy migration
	if (!(await deployRealtimeMigration())) {
		allPassed = false;
	}
	console.log("");

	// Step 3: Run system test
	if (!(await runSystemTest())) {
		allPassed = false;
	}
	console.log("");

	// Step 4: Test realtime connection
	if (!(await testRealtimeConnection())) {
		allPassed = false;
	}
	console.log("");

	// Step 5: Test API endpoints
	if (!(await testAPIEndpoints())) {
		allPassed = false;
	}
	console.log("");

	// Summary
	console.log("📊 Deployment Summary");
	console.log("====================");
	if (allPassed) {
		console.log("🎉 All tests passed! Realtime system is ready to use.");
		console.log("");
		console.log("Next steps:");
		console.log("1. Import realtime hooks in your React components");
		console.log("2. Add presence indicators to your UI");
		console.log("3. Test collaborative features with multiple users");
		console.log("4. Monitor realtime performance in production");
	} else {
		console.log("⚠️ Some tests failed. Please review the errors above.");
		console.log("");
		console.log("Common issues:");
		console.log("- Supabase Realtime not enabled in project settings");
		console.log("- Missing environment variables");
		console.log("- Database migration not applied");
		console.log("- API server not running");
	}

	process.exit(allPassed ? 0 : 1);
}

// Handle errors
process.on("unhandledRejection", (error) => {
	console.error("❌ Unhandled error:", error);
	process.exit(1);
});

// Run deployment
if (require.main === module) {
	main().catch((error) => {
		console.error("❌ Deployment failed:", error);
		process.exit(1);
	});
}

export { deployRealtimeMigration, runSystemTest, testRealtimeConnection };
