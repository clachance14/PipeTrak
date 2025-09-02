#!/usr/bin/env tsx

/**
 * Example script demonstrating the standardized SQL execution approach
 *
 * Usage:
 * NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm tsx src/execute-sql-example.ts
 */

import { SQLExecutor } from "./lib/sql-executor";
import * as path from "path";

async function exampleUsage() {
	console.log("🎯 Database SQL Execution Examples\n");

	// Example 1: Execute a SQL file
	console.log("1️⃣ Example: Execute SQL file");
	try {
		// This would execute a real SQL file if it existed
		const examplePath = path.resolve(
			__dirname,
			"../../../packages/database/supabase/migrations/example.sql",
		);
		// await executeSQLFile(examplePath);
		console.log("   ✅ Would execute SQL file (skipped - no example.sql)");
		console.log(`   📁 Would look for file at: ${examplePath}`);
	} catch (error) {
		console.log("   ⚠️  Skipped - example.sql not found");
	}

	// Example 2: Use SQLExecutor class directly
	console.log("\n2️⃣ Example: Direct SQLExecutor usage");
	const executor = new SQLExecutor({
		showProgress: true,
		dryRun: false, // Set to true to see what would be executed
	});

	try {
		await executor.connect();

		// Test connection
		const isConnected = await executor.testConnection();
		console.log(`   🔌 Connection test: ${isConnected ? "PASS" : "FAIL"}`);

		// Execute a simple query
		const result = await executor.executeStatement(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('Component', 'Drawing', 'ComponentMilestone')
      ORDER BY table_name;
    `);

		console.log(`   📊 PipeTrak tables found: ${result.rows.length}`);
		result.rows.forEach((row) => {
			console.log(`      ✓ ${row.table_name}`);
		});

		// Get database info
		console.log("\n3️⃣ Example: Database information");
		const dbInfo = await executor.getDatabaseInfo();

		console.log(`   📈 Total tables: ${dbInfo.tables?.length || 0}`);
		console.log(`   ⚙️  Total functions: ${dbInfo.functions?.length || 0}`);

		if (dbInfo.version) {
			const version = dbInfo.version[0]?.version || "Unknown";
			console.log(
				`   🗄️  Database: ${version.split(" ")[0]} ${version.split(" ")[1]}`,
			);
		}
	} catch (error: any) {
		console.error(`   ❌ Error: ${error.message}`);
	} finally {
		await executor.disconnect();
	}

	// Example 3: Execute SQL content directly
	console.log("\n4️⃣ Example: Execute SQL content string");
	const sampleSQL = `
    -- This is a sample SQL that would be executed
    SELECT 
      COUNT(*) as component_count,
      COUNT(DISTINCT "drawingId") as drawing_count
    FROM "Component" 
    WHERE "projectId" IS NOT NULL;
  `;

	const executor2 = new SQLExecutor({ showProgress: true });
	try {
		await executor2.connect();

		const result = await executor2.executeStatement(sampleSQL);

		if (result.rows.length > 0) {
			const stats = result.rows[0];
			console.log(`   📊 Components: ${stats.component_count}`);
			console.log(`   📋 Drawings: ${stats.drawing_count}`);
		}
	} catch (error: any) {
		console.log(`   ⚠️  No data yet: ${error.message}`);
	} finally {
		await executor2.disconnect();
	}

	console.log("\n✅ Examples completed!");
	console.log("\n📖 Key patterns demonstrated:");
	console.log("   • Always use NODE_TLS_REJECT_UNAUTHORIZED=0");
	console.log("   • SQLExecutor handles connection management");
	console.log("   • Proper error handling and progress reporting");
	console.log('   • Quote table names: "Component" not component');
	console.log("   • Use DIRECT_URL automatically for schema operations");
}

// Run the examples
exampleUsage()
	.then(() => {
		console.log("\n🎉 All examples completed successfully");
		process.exit(0);
	})
	.catch((error) => {
		console.error("\n💥 Example failed:", error.message);
		process.exit(1);
	});
